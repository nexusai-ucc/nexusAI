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
            'courseid' => (int) $COURSE->id,
            'userid'   => (int) $USER->id,
            'sesskey'  => sesskey(),
            'wwwroot'  => (string) (new moodle_url('/'))->out(false),
            'lang'     => current_language(),
        ],
    ]);

    return '<div id="local-nexusai-container" data-plugin="nexusai"></div>';
}
