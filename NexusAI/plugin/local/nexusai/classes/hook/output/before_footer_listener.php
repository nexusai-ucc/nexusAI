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
use local_nexusai\visibility_helper;

class before_footer_listener {

    /**
     * Callback ejecutado por Moodle antes de generar el footer HTML.
     *
     * La regla de visibilidad (logueado, no invitado, capability en curso
     * real) vive en visibility_helper::resolve() — compartida con el ícono
     * de la navbar primaria (primary_extend_listener.php, UX-02) para que
     * nunca haya un ícono clickeable sin panel detrás. Fuera de un curso
     * real, courseid llega en 0 y el panel entra a un estado vacío.
     *
     * Si corresponde mostrar el widget, inyecta el div contenedor y le pide
     * a Moodle que cargue el bundle AMD `local_nexusai/chatwidget-lazy`.
     *
     * @param before_footer_html_generation $hook El hook con métodos add_html() etc.
     */
    public static function callback(before_footer_html_generation $hook): void {
        global $PAGE, $USER;

        $context = visibility_helper::resolve();
        if ($context === null) {
            return;
        }

        $courseid  = $context['courseid'];
        $isteacher = $context['isteacher'];

        // ONB-03: en la pantalla de crear un curso el widget muestra el
        // tutorial de armado en vez del cartel de "no hay curso".
        $onboarding = visibility_helper::onboarding_hint();

        // 2. Cargar el bundle React vía AMD/RequireJS.
        $PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init', [
            [
                'courseid'   => $courseid,
                'userid'     => (int) $USER->id,
                'sesskey'    => sesskey(),
                'wwwroot'    => (string) (new \moodle_url('/'))->out(false),
                'lang'       => current_language(),
                'isteacher'  => (int) $isteacher,
                'onboarding' => $onboarding,
            ],
        ]);

        // Para docentes: cargar el módulo que muestra el prompt de confirmación
        // cuando suben un archivo a una sección del curso.
        if ($isteacher && $courseid > 0) {
            $PAGE->requires->js_call_amd('local_nexusai/upload-prompt', 'init', [
                ['courseid' => $courseid],
            ]);
        }

        // F-08: detector de posts similares en formularios de foro.
        // Se carga en cualquier página de foro (mod-forum-*): en Moodle 5.x el
        // formulario de nueva discusión puede mostrarse inline en mod-forum-view,
        // no solo en mod-forum-post. El JS se auto-limita si no hay input[name="subject"].
        // $courseid > 0 preserva el comportamiento pre-UX-02 (un foro de sitio en
        // el frontpage, courseid=1, nunca disparaba esto).
        if ($courseid > 0 && strpos($PAGE->pagetype, 'mod-forum') === 0) {
            $PAGE->requires->js_call_amd('local_nexusai/forum-duplicate-checker', 'init', [
                [
                    'courseid' => $courseid,
                    'wwwroot'  => (string) (new \moodle_url('/'))->out(false),
                ],
            ]);
        }

        // F-10/F-11: resumen de hilo + sugerencia de respuesta con IA.
        // Solo en mod-forum-discuss (discuss.php?d=X) — páginas de discusión abierta.
        if ($courseid > 0 && $PAGE->pagetype === 'mod-forum-discuss') {
            $discussionid = (int) optional_param('d', 0, PARAM_INT);
            if ($discussionid > 0) {
                $amdparams = [
                    'discussionid' => $discussionid,
                    'courseid'     => $courseid,
                ];
                $PAGE->requires->js_call_amd('local_nexusai/forum-thread-summarizer', 'init', [$amdparams]);
                $PAGE->requires->js_call_amd('local_nexusai/forum-reply-suggester',   'init', [$amdparams]);
            }
        }

        // 3. Inyectar el contenedor donde React monta el componente.
        //    En el sistema nuevo se usa $hook->add_html() en lugar de retornar string.
        $hook->add_html('<div id="local-nexusai-container" data-plugin="nexusai"></div>');
    }
}
