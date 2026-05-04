<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Library functions for local_nexusai.
 *
 * Moodle invoca automáticamente las funciones que empiezan con el nombre del plugin
 * cuando ocurren ciertos eventos (hooks). Acá usamos `before_footer` para inyectar
 * el contenedor del chat y cargar el bundle React.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Hook ejecutado por Moodle justo antes de cerrar el </body> en cada página.
 *
 * Acá decidimos si mostrar o no el chat de NexusAI. Reglas (Sprint 1, mínimas):
 *   - Solo usuarios logueados (no guests, no anónimos)
 *   - Solo dentro de un curso real ($COURSE->id > 1, porque 1 es el sitio)
 *   - Solo si el usuario tiene la capability `local/nexusai:use` en ese curso
 *
 * Si pasa todos los filtros, inyecta el div contenedor y le pide a Moodle que cargue
 * el módulo AMD `local_nexusai/chatwidget-lazy`, pasándole el contexto del curso
 * y del usuario para que React sepa contra qué materia consultar.
 *
 * @return string HTML que Moodle inserta antes del footer.
 */
function local_nexusai_before_footer(): string {
    global $PAGE, $USER, $COURSE;

    // 1. Filtros de seguridad y contexto.
    if (!isloggedin() || isguestuser()) {
        return '';
    }
    if (empty($COURSE->id) || $COURSE->id <= 1) {
        // Estamos fuera de un curso (frontpage, dashboard, settings, etc.). No mostrar.
        return '';
    }

    $context = context_course::instance($COURSE->id);
    if (!has_capability('local/nexusai:use', $context)) {
        return '';
    }

    // 2. Pedir a Moodle que cargue el bundle React vía AMD/RequireJS.
    //    El bundle compilado vive en amd/build/chatwidget-lazy.min.js
    //    y exporta una función init(params).
    $PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init', [
        [
            'courseid'  => (int) $COURSE->id,
            'userid'    => (int) $USER->id,
            'sesskey'   => sesskey(),
            'wwwroot'   => (string) (new moodle_url('/'))->out(false),
            'lang'      => current_language(),
        ],
    ]);

    // 3. Inyectar el contenedor donde React va a montar el componente.
    //    El ID tiene que coincidir con el que busca react/src/index.jsx.
    return '<div id="local-nexusai-container" data-plugin="nexusai"></div>';
}
