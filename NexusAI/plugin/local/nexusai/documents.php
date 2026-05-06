<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Página de gestión de documentos NexusAI por curso.
 *
 * Acceso: solo usuarios con capability local/nexusai:manage en el contexto del curso.
 *
 * URL: /local/nexusai/documents.php?courseid=X
 *
 * Esta página renderiza un shell PHP mínimo (header, breadcrumbs, container)
 * y carga el bundle React `documents-manager-lazy` que maneja toda la UX:
 * drag-and-drop, tabla con polling, re-indexar/eliminar.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');

global $PAGE, $OUTPUT, $USER, $COURSE, $DB;

// ----- 1. Resolver curso -----
$courseid = required_param('courseid', PARAM_INT);
$course = $DB->get_record('course', ['id' => $courseid], '*', MUST_EXIST);

// ----- 2. Login + capability -----
require_login($course);
$context = context_course::instance($course->id);
require_capability('local/nexusai:manage', $context);

// ----- 3. Setup página -----
$pageurl = new moodle_url('/local/nexusai/documents.php', ['courseid' => $courseid]);
$PAGE->set_url($pageurl);
$PAGE->set_context($context);
$PAGE->set_course($course);
$PAGE->set_pagelayout('incourse');
$PAGE->set_title(
    format_string($course->shortname) . ': ' . get_string('documents_page_title', 'local_nexusai')
);
$PAGE->set_heading(format_string($course->fullname));

// Breadcrumb: Curso → NexusAI
$PAGE->navbar->add(
    get_string('documents_page_title', 'local_nexusai'),
    $pageurl
);

// ----- 4. Cargar bundle React de documents -----
$PAGE->requires->js_call_amd('local_nexusai/documents-manager-lazy', 'init', [
    [
        'courseid'  => (int) $course->id,
        'userid'    => (int) $USER->id,
        'sesskey'   => sesskey(),
        'wwwroot'   => (string) (new moodle_url('/'))->out(false),
        'lang'      => current_language(),
    ],
]);

// ----- 5. Render -----
echo $OUTPUT->header();

echo $OUTPUT->heading(get_string('documents_page_title', 'local_nexusai'));

// Container donde React monta la app.
echo '<div id="local-nexusai-documents-app" data-plugin="nexusai"></div>';

// Fallback noscript para usuarios sin JS habilitado.
echo '<noscript><div class="alert alert-warning">' .
    get_string('documents_page_noscript', 'local_nexusai') .
    '</div></noscript>';

echo $OUTPUT->footer();
