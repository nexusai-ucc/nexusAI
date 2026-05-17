<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Event observer for local_nexusai — auto-sync on course module creation.
 *
 * Cuando un docente crea un módulo de tipo "resource" (Archivo) que contiene
 * un PDF, DOCX o TXT, este observer lo envía automáticamente al backend NexusAI
 * para indexación RAG.
 *
 * Comportamiento de errores:
 *   - Si el plugin está deshabilitado → skip silencioso.
 *   - Si el módulo no es del tipo "resource" → skip silencioso.
 *   - Si el archivo no es PDF/DOCX/TXT → skip silencioso.
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
        'text/plain',
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
    private static function index_resource_module(int $cmid, int $courseid, int $userid): void {
        global $CFG;

        require_once($CFG->dirroot . '/mod/resource/lib.php');

        // Obtener el context del módulo para buscar en el filestore.
        $context = \context_module::instance($cmid);

        // Los archivos de "resource" están en el filearea 'content'.
        $fs    = get_file_storage();
        $files = $fs->get_area_files($context->id, 'mod_resource', 'content', false, 'itemid, filepath, filename', false);

        if (empty($files)) {
            // Módulo resource sin archivo adjunto — skip.
            return;
        }

        // Tomar solo el primer archivo (resource solo admite 1 archivo principal).
        $file = reset($files);

        $mimetype = $file->get_mimetype();
        if (!in_array($mimetype, self::SUPPORTED_MIME_TYPES, true)) {
            // Tipo no soportado (imagen, video, ZIP...) — skip silencioso.
            return;
        }

        $filename  = $file->get_filename();
        $filebytes = $file->get_content();  // Raw bytes del archivo.

        if (empty($filebytes)) {
            debugging('[NexusAI] Empty file content for cmid=' . $cmid, DEBUG_NORMAL);
            return;
        }

        // Enviar al backend NexusAI para indexación.
        $client = new \local_nexusai\external\backend_client();
        $client->upload_document($courseid, $userid, $filename, $mimetype, $filebytes);

        debugging(
            '[NexusAI] Auto-indexed "' . $filename . '" (cmid=' . $cmid . ', course=' . $courseid . ')',
            DEBUG_DEVELOPER
        );
    }
}
