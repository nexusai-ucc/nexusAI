<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Event observer for local_nexusai — auto-sync on course module creation.
 *
 * Cuando un docente crea un módulo de tipo "resource" (Archivo) que contiene
 * un formato soportado (PDF, DOCX, PPTX, XLSX, CSV, MD, HTML o TXT), este
 * observer lo envía automáticamente al backend NexusAI para indexación RAG.
 *
 * Comportamiento de errores:
 *   - Si el plugin está deshabilitado → skip silencioso.
 *   - Si el módulo no es del tipo "resource" → skip silencioso.
 *   - Si el archivo no tiene un formato soportado → skip silencioso.
 *   - Si el backend falla → log error, NO interrumpe Moodle (excepción atrapada).
 *
 * Dependencias:
 *   - `local_nexusai\external\backend_client` — envía el archivo al backend.
 *   - Filestore de Moodle — lee los bytes del archivo subido.
 *   - `get_config('local_nexusai', 'enabled')` — switch maestro.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

defined('MOODLE_INTERNAL') || die();

class observer {

    /** MIME types soportados por el backend (sincronizado con extractor.py). */
    const SUPPORTED_MIME_TYPES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        'text/markdown',
        'text/html',
    ];

    /**
     * Callback para el evento course_module_created.
     *
     * Solo procesa módulos de tipo "resource" (Archivo de Moodle). Otros tipos
     * (forum, quiz, label, etc.) se ignoran silenciosamente.
     *
     * @param \core\event\course_module_created $event
     */
    public static function course_module_created(\core\event\course_module_created $event): void {
        // Switch maestro: si el plugin está deshabilitado, no hacer nada.
        if (!get_config('local_nexusai', 'enabled')) {
            return;
        }

        $data = $event->get_data();

        // Solo módulos del tipo "resource" tienen un archivo adjunto.
        if (($data['other']['modulename'] ?? '') !== 'resource') {
            return;
        }

        $cmid     = (int) $data['contextinstanceid'];
        $courseid = (int) $data['courseid'];
        $userid   = (int) $data['userid'];

        try {
            self::index_resource_module($cmid, $courseid, $userid);
        } catch (\Throwable $e) {
            // Nunca interrumpir Moodle por un error de indexación.
            debugging(
                '[NexusAI] Auto-indexing failed for cmid=' . $cmid . ': ' . $e->getMessage(),
                DEBUG_NORMAL
            );
            error_log('[NexusAI] auto-index error cmid=' . $cmid . ' — ' . $e->getMessage());
        }
    }

    /**
     * Lee el archivo adjunto del módulo resource y lo envía al backend.
     *
     * @param int $cmid     Course module ID.
     * @param int $courseid Course ID.
     * @param int $userid   ID del usuario que creó el módulo (el docente).
     *
     * @throws \moodle_exception Si el backend rechaza o hay error de red.
     * @throws \coding_exception  Si no se puede leer el archivo.
     */
    /**
     * Nombre de la user preference donde se acumulan los uploads pendientes de confirmación.
     * Valor: JSON object {cmid: {courseid, context_id, filename, mimetype}}.
     */
    const PENDING_PREF = 'local_nexusai_pending_uploads';

    // =========================================================
    // Foros — Épica 06
    // =========================================================

    /**
     * Indexa el embedding de un post de foro recién creado.
     *
     * Cubre tanto posts de respuesta como el primer post de una nueva discusión
     * (Moodle dispara post_created en ambos casos).
     *
     * @param \mod_forum\event\post_created $event
     */
    public static function forum_post_created(\mod_forum\event\post_created $event): void {
        if (!get_config('local_nexusai', 'enabled')) {
            return;
        }
        self::index_forum_post_from_event(
            (int) $event->objectid,
            (int) $event->courseid,
            (int) ($event->other['discussionid'] ?? 0)
        );
    }

    /**
     * Re-indexa el embedding de un post editado.
     *
     * El backend compara el content_hash y hace skip si el contenido no cambió.
     *
     * @param \mod_forum\event\post_updated $event
     */
    public static function forum_post_updated(\mod_forum\event\post_updated $event): void {
        if (!get_config('local_nexusai', 'enabled')) {
            return;
        }
        self::index_forum_post_from_event(
            (int) $event->objectid,
            (int) $event->courseid,
            (int) ($event->other['discussionid'] ?? 0)
        );
    }

    /**
     * Elimina el embedding de un post borrado.
     *
     * El post ya no está en la DB cuando este evento dispara, así que solo
     * necesitamos el post_id para llamar al backend.
     *
     * @param \mod_forum\event\post_deleted $event
     */
    public static function forum_post_deleted(\mod_forum\event\post_deleted $event): void {
        if (!get_config('local_nexusai', 'enabled')) {
            return;
        }

        $postid = (int) $event->objectid;

        try {
            $client = new \local_nexusai\external\backend_client();
            $client->delete_forum_post($postid);
        } catch (\Throwable $e) {
            debugging(
                '[NexusAI] forum_post_deleted failed for post=' . $postid . ': ' . $e->getMessage(),
                DEBUG_NORMAL
            );
            error_log('[NexusAI] forum_post_deleted error post=' . $postid . ' — ' . $e->getMessage());
        }
    }

    /**
     * Lee el contenido del post desde la DB y llama al backend para indexarlo.
     *
     * Lógica compartida entre forum_post_created y forum_post_updated.
     *
     * @param int $postid       ID de mdl_forum_posts.
     * @param int $courseid     ID del curso.
     * @param int $discussionid ID de mdl_forum_discussions.
     */
    private static function index_forum_post_from_event(int $postid, int $courseid, int $discussionid): void {
        global $DB;

        try {
            $post = $DB->get_record('forum_posts', ['id' => $postid]);
            if (!$post) {
                return;
            }

            // El mensaje se guarda como HTML — strip para texto limpio.
            $content = trim(strip_tags($post->message ?? ''));

            // Posts muy cortos (botones de "Gracias", etc.) no aportan al RAG.
            if (strlen($content) < 10) {
                return;
            }

            $client = new \local_nexusai\external\backend_client();
            $client->index_forum_post($postid, $discussionid, $courseid, $content);

        } catch (\Throwable $e) {
            debugging(
                '[NexusAI] forum post indexing failed for post=' . $postid . ': ' . $e->getMessage(),
                DEBUG_NORMAL
            );
            error_log('[NexusAI] forum post index error post=' . $postid . ' — ' . $e->getMessage());
        }
    }

    // =========================================================
    // Módulos de recurso (documentos)
    // =========================================================

    private static function index_resource_module(int $cmid, int $courseid, int $userid): void {
        global $CFG, $USER;

        require_once($CFG->dirroot . '/mod/resource/lib.php');

        $context = \context_module::instance($cmid);

        $fs    = get_file_storage();
        $files = $fs->get_area_files($context->id, 'mod_resource', 'content', false, 'itemid, filepath, filename', false);

        if (empty($files)) {
            return;
        }

        $file = reset($files);

        $mimetype = $file->get_mimetype();
        if (!in_array($mimetype, self::SUPPORTED_MIME_TYPES, true)) {
            return;
        }

        $filename = $file->get_filename();

        // En lugar de indexar automáticamente, guardamos la info en una user preference
        // para que el docente confirme en el próximo page load (modal de confirmación).
        $raw     = get_user_preferences(self::PENDING_PREF, '{}', $userid);
        $pending = json_decode($raw, true);
        if (!is_array($pending)) {
            $pending = [];
        }

        $pending[(string) $cmid] = [
            'courseid'   => $courseid,
            'context_id' => $context->id,
            'filename'   => $filename,
            'mimetype'   => $mimetype,
        ];

        set_user_preference(self::PENDING_PREF, json_encode($pending), $userid);

        debugging(
            '[NexusAI] Pending upload queued for "' . $filename . '" (cmid=' . $cmid . ', course=' . $courseid . ')',
            DEBUG_DEVELOPER
        );
    }
}
