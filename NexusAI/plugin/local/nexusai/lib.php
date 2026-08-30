<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Library functions for local_nexusai.
 *
 * Hook system:
 *   - Moodle 4.4+ → usa db/hooks.php + classes/hook/output/before_footer_listener.php
 *   - Moodle 4.1-4.3 → usa la función `local_nexusai_before_footer()` de este archivo
 *
 * En Moodle 4.4+, la función vieja todavía se invoca por backward compat pero su
 * valor de retorno se ignora (solo emite un warning de deprecación). Por eso acá
 * detectamos la versión de Moodle y skipeamos en 4.4+ para no duplicar lógica
 * ni generar warnings inútiles.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Hook ejecutado por Moodle 4.1-4.3 antes de cerrar el </body>.
 *
 * En Moodle 4.4+ el hook handling se hace en classes/hook/output/before_footer_listener.php,
 * así que esta función retorna vacío para evitar duplicación.
 *
 * @return string HTML que Moodle inserta antes del footer (Moodle ≤ 4.3).
 */
function local_nexusai_before_footer(): string {
    global $CFG, $PAGE, $USER, $COURSE;

    // En Moodle 4.4+ el sistema de hooks nuevo se encarga.
    // Build 2024042200 = 4.4 LTS / 4.5. Más arriba de 2024 → usar nuevo sistema.
    if ((int)$CFG->version >= 2024041600) {
        return '';
    }

    // ---- Lógica para Moodle 4.1-4.3 (legacy hook system) ----

    if (!isloggedin() || isguestuser()) {
        return '';
    }
    if (empty($COURSE->id) || $COURSE->id <= 1) {
        return '';
    }

    $context = context_course::instance($COURSE->id);
    if (!has_capability('local/nexusai:use', $context)) {
        return '';
    }

    $PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init', [
        [
            'courseid'   => (int) $COURSE->id,
            'userid'     => (int) $USER->id,
            'sesskey'    => sesskey(),
            'wwwroot'    => (string) (new moodle_url('/'))->out(false),
            'lang'       => current_language(),
            'isteacher'  => (int) has_capability('local/nexusai:manage', $context),
        ],
    ]);

    return '<div id="local-nexusai-container" data-plugin="nexusai"></div>';
}

/**
 * Hook ejecutado por Moodle cuando arma el navbar de un curso.
 *
 * Agregamos un link "📚 NexusAI" que lleva a la página de gestión de documentos,
 * SOLO visible para usuarios con capability local/nexusai:manage (docentes y admins).
 * Los alumnos no ven este link — interactúan con el chat flotante únicamente.
 *
 * Este hook funciona en TODAS las versiones soportadas (Moodle 4.1 LTS hasta
 * 4.5) — no fue migrado a Hook API nuevo.
 *
 * @param navigation_node $navigation Nodo del curso al que sumamos el item.
 * @param stdClass        $course     Objeto del curso actual.
 * @param context_course  $context    Contexto del curso.
 */
/**
 * Permite a Moodle servir archivos del area 'documents' del plugin.
 *
 * URL: /pluginfile.php/{contextid}/local_nexusai/documents/{courseid}/{filename}
 * Acceso: requiere local/nexusai:use (alumnos y docentes del curso).
 */
function local_nexusai_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, $options = []) {
    if ($filearea !== 'documents') {
        return false;
    }

    require_login($course);
    if (!has_capability('local/nexusai:use', $context)) {
        return false;
    }

    $itemid  = (int) array_shift($args);
    $filename = array_shift($args);
    if (empty($filename)) {
        return false;
    }

    $fs   = get_file_storage();
    $file = $fs->get_file($context->id, 'local_nexusai', 'documents', $itemid, '/', $filename);
    if (!$file || $file->is_directory()) {
        return false;
    }

    send_stored_file($file, 86400, 0, $forcedownload, $options);
}

/**
 * Hook ejecutado por Moodle cuando arma el navbar de un curso.
 *
 * Agregamos un link "📚 NexusAI" que lleva a la página de gestión de documentos,
 * SOLO visible para usuarios con capability local/nexusai:manage (docentes y admins).
 * Los alumnos no ven este link — interactúan con el chat flotante únicamente.
 *
 * Este hook funciona en TODAS las versiones soportadas (Moodle 4.1 LTS hasta
 * 4.5) — no fue migrado a Hook API nuevo.
 *
 * @param navigation_node $navigation Nodo del curso al que sumamos el item.
 * @param stdClass        $course     Objeto del curso actual.
 * @param context_course  $context    Contexto del curso.
 */
/**
 * Nombre de la user preference donde vive el token del feed de calendario (CAL-07).
 */
define('LOCAL_NEXUSAI_CALFEED_PREF', 'local_nexusai_calfeedtoken');

/**
 * Devuelve el token del feed de calendario del alumno, creándolo si no existe.
 *
 * El token es per-alumno (no per-curso): una sola suscripción cubre todos sus
 * cursos, y revocarlo corta todas. Se guarda como user preference — sin tabla.
 *
 * @param int $userid
 * @return string Token de 44 caracteres.
 */
function local_nexusai_calfeed_get_or_create_token(int $userid): string {
    $token = get_user_preferences(LOCAL_NEXUSAI_CALFEED_PREF, null, $userid);
    if (empty($token) || strlen($token) < 32) {
        $token = local_nexusai_calfeed_rotate_token($userid);
    }
    return $token;
}

/**
 * Genera un token nuevo para el alumno y descarta el anterior (revocación).
 *
 * @param int $userid
 * @return string El token nuevo.
 */
function local_nexusai_calfeed_rotate_token(int $userid): string {
    $token = random_string(44);
    set_user_preference(LOCAL_NEXUSAI_CALFEED_PREF, $token, $userid);
    return $token;
}

/**
 * URL absoluta del feed .ics de un curso para un alumno.
 *
 * @param int $userid
 * @param int $courseid
 * @return string
 */
function local_nexusai_calfeed_url(int $userid, int $courseid): string {
    $token = local_nexusai_calfeed_get_or_create_token($userid);
    return (new moodle_url('/local/nexusai/calendar_feed.php', [
        'token'  => $token,
        'course' => $courseid,
    ]))->out(false);
}

/**
 * Hook ejecutado por Moodle cuando arma el navbar de un curso.
 *
 * Agregamos un link "📚 NexusAI" que lleva a la página de gestión de documentos,
 * SOLO visible para usuarios con capability local/nexusai:manage (docentes y admins).
 *
 * @param navigation_node $navigation Nodo del curso al que sumamos el item.
 * @param stdClass        $course     Objeto del curso actual.
 * @param context_course  $context    Contexto del curso.
 */
function local_nexusai_extend_navigation_course($navigation, $course, $context): void {
    if (!has_capability('local/nexusai:manage', $context)) {
        return;
    }

    $url = new moodle_url('/local/nexusai/documents.php', ['courseid' => $course->id]);
    $node = navigation_node::create(
        get_string('documents_page_title', 'local_nexusai'),
        $url,
        navigation_node::TYPE_SETTING,
        null,
        'local_nexusai_documents',
        new pix_icon('i/files', '')
    );

    $navigation->add_node($node);
}

