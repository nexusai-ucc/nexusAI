<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Listener para el hook `core\hook\navigation\primary_extend` (UX-02).
 *
 * Agrega el disparador del widget a la fila de navegación primaria de Moodle
 * (junto a Home/Dashboard/My courses), reemplazando el botón flotante (FAB)
 * que existía hasta ahora. El panel en sí sigue montado por
 * before_footer_listener.php — este hook solo agrega el ícono clickeable.
 *
 * Nota: la plantilla que renderiza los nodos de la navbar primaria
 * (lib/templates/moremenu_children.mustache) solo imprime `{{{text}}}` sin
 * escapar — nunca usa el `pix_icon` que acepta navigation_node::add(). Por
 * eso el ícono se arma como SVG inline pasado como `$text`, no como pix_icon.
 * Tampoco hay forma de cargar una hoja de estilos propia desde este hook
 * ($PAGE->requires->css() tira coding_exception después de <head>) — el SVG
 * lleva sus estilos inline.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\hook\navigation;

defined('MOODLE_INTERNAL') || die();

use core\hook\navigation\primary_extend;
use local_nexusai\visibility_helper;

class primary_extend_listener {

    /**
     * Callback ejecutado por Moodle al armar la navegación primaria.
     *
     * @param primary_extend $hook
     */
    public static function callback(primary_extend $hook): void {
        global $PAGE;

        $context = visibility_helper::resolve();
        if ($context === null) {
            return;
        }

        $label = get_string('chatwidget_navtrigger', 'local_nexusai');

        $iconhtml = '<span style="display:inline-flex;align-items:center;justify-content:center;line-height:0;">'
            . '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            . 'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
            . '<path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>'
            . '</svg>'
            . '<span class="sr-only">' . s($label) . '</span>'
            . '</span>';

        $node = $hook->get_primaryview()->add(
            $iconhtml,
            new \moodle_url('#'),
            \navigation_node::TYPE_CUSTOM,
            null,
            'local_nexusai_trigger',
            null
        );
        $node->title($label);

        $PAGE->requires->js_call_amd('local_nexusai/nav-trigger', 'init');
    }
}
