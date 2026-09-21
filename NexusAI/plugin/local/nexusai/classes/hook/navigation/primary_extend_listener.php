<?php
// This file is part of the NexusAI plugin for Moodle.
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Listener for the `core\hook\navigation\primary_extend` hook (UX-02).
 *
 * Adds the widget trigger to Moodle's primary navigation row (next to
 * Home/Dashboard/My courses), replacing the floating action button (FAB)
 * that existed until now. The panel itself is still mounted by
 * before_footer_listener.php — this hook only adds the clickable icon.
 *
 * Note: the template that renders the primary navbar's nodes
 * (lib/templates/moremenu_children.mustache) only prints `{{{text}}}`
 * unescaped — it never uses the `pix_icon` that navigation_node::add()
 * accepts. That's why the icon is built as inline SVG passed as `$text`,
 * not as a pix_icon. There's also no way to load our own stylesheet from
 * this hook ($PAGE->requires->css() throws a coding_exception after
 * <head>) — the SVG carries its styles inline.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\hook\navigation;

use core\hook\navigation\primary_extend;
use local_nexusai\visibility_helper;

/**
 * Adds the widget trigger to Moodle's primary navigation (UX-02).
 */
class primary_extend_listener {
    /**
     * Callback executed by Moodle when building the primary navigation.
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
