<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Listener para el hook `core\hook\output\before_footer_html_generation`.
 *
 * Este es el reemplazo del callback viejo `local_nexusai_before_footer()`.
 * En Moodle 4.4+, el sistema de hooks invoca este método antes de cerrar
 * el </body>, permitiendo inyectar HTML/JS al footer de cualquier página.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\hook\output;

defined('MOODLE_INTERNAL') || die();

use core\hook\output\before_footer_html_generation;

class before_footer_listener {

    /**
     * Callback ejecutado por Moodle antes de generar el footer HTML.
     *
     * Reglas (idénticas al callback viejo en lib.php):
     *   - Solo usuarios logueados (no guests).
     *   - Solo dentro de un curso real ($COURSE->id > 1, porque 1 es el sitio).
     *   - Solo si el usuario tiene la capability `local/nexusai:use` en el curso.
     *
     * Si pasa, inyecta el div contenedor y le pide a Moodle que cargue el bundle
     * AMD `local_nexusai/chatwidget-lazy`, pasándole el contexto del curso/usuario.
     *
     * @param before_footer_html_generation $hook El hook con métodos add_html() etc.
     */
    public static function callback(before_footer_html_generation $hook): void {
        global $PAGE, $USER, $COURSE;

        // 1. Filtros de seguridad y contexto.
        if (!isloggedin() || isguestuser()) {
            return;
        }
        if (empty($COURSE->id) || $COURSE->id <= 1) {
            return;
        }

        $context = \context_course::instance($COURSE->id);
        if (!has_capability('local/nexusai:use', $context)) {
            return;
        }

        $isteacher = has_capability('local/nexusai:manage', $context);

        // 2. Cargar el bundle React vía AMD/RequireJS.
        $PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init', [
            [
                'courseid'   => (int) $COURSE->id,
                'userid'     => (int) $USER->id,
                'sesskey'    => sesskey(),
                'wwwroot'    => (string) (new \moodle_url('/'))->out(false),
                'lang'       => current_language(),
                'isteacher'  => (int) $isteacher,
            ],
        ]);

        // Para docentes: cargar el módulo que muestra el prompt de confirmación
        // cuando suben un archivo a una sección del curso.
        if ($isteacher) {
            $PAGE->requires->js_call_amd('local_nexusai/upload-prompt', 'init', [
                ['courseid' => (int) $COURSE->id],
            ]);
        }

        // F-08: detector de posts similares en formularios de foro.
        // Se carga en cualquier página de foro (mod-forum-*): en Moodle 5.x el
        // formulario de nueva discusión puede mostrarse inline en mod-forum-view,
        // no solo en mod-forum-post. El JS se auto-limita si no hay input[name="subject"].
        if (strpos($PAGE->pagetype, 'mod-forum') === 0) {
            $PAGE->requires->js_call_amd('local_nexusai/forum-duplicate-checker', 'init', [
                [
                    'courseid' => (int) $COURSE->id,
                    'wwwroot'  => (string) (new \moodle_url('/'))->out(false),
                ],
            ]);
        }

        // F-10: resumen de hilo con IA.
        // Solo en mod-forum-discuss (discuss.php?d=X) — páginas de discusión abierta.
        if ($PAGE->pagetype === 'mod-forum-discuss') {
            $discussionid = (int) optional_param('d', 0, PARAM_INT);
            if ($discussionid > 0) {
                $PAGE->requires->js_call_amd('local_nexusai/forum-thread-summarizer', 'init', [
                    [
                        'discussionid' => $discussionid,
                        'courseid'     => (int) $COURSE->id,
                    ],
                ]);
            }
        }

        // 3. Inyectar el contenedor donde React monta el componente.
        //    En el sistema nuevo se usa $hook->add_html() en lugar de retornar string.
        $hook->add_html('<div id="local-nexusai-container" data-plugin="nexusai"></div>');
    }
}
