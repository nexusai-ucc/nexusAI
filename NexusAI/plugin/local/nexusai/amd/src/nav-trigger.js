// This file is part of the NexusAI plugin for Moodle.
//
// Widget trigger in the primary navbar (UX-02). It replaces the floating button
// (FAB) that used to live inside the React bundle: the icon is now rendered by
// Moodle itself (see classes/hook/navigation/primary_extend_listener.php),
// outside the React tree, so the panel is kept in sync through a CustomEvent on
// window instead of shared React state.

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
