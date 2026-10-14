// This file is part of Moodle - https://moodle.org/
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
 * Widget trigger in the primary navbar (UX-02). It replaces the floating button
 * (FAB) that used to live inside the React bundle: the icon is now rendered by
 * Moodle itself (see classes/hook/navigation/primary_extend_listener.php),
 * outside the React tree, so the panel is kept in sync through a CustomEvent on
 * window instead of shared React state.
 *
 * @module     local_nexusai/nav-trigger
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {

    var SELECTOR = 'li[data-key="local_nexusai_trigger"] a.nav-link';

    /**
     * Click handler of the navbar icon: cancels the navigation (the node points
     * to "#") and tells the React panel through a CustomEvent.
     *
     * @param {Event} e The click event.
     */
    function toggle(e) {
        e.preventDefault();
        window.__nexusaiPanelOpenState = !window.__nexusaiPanelOpenState;
        window.dispatchEvent(new CustomEvent('nexusai:toggle-panel'));
    }

    return {
        /**
         * Entry point loaded by primary_extend_listener.php.
         * It does nothing if the node is not in the DOM (it should not happen,
         * but it avoids an error if the hook did not add it).
         */
        init: function() {
            var trigger = document.querySelector(SELECTOR);
            if (!trigger) {
                return;
            }
            trigger.addEventListener('click', toggle);
        },
    };
});
