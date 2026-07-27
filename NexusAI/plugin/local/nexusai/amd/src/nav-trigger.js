// This file is part of the NexusAI plugin for Moodle.
//
// Disparador del widget en la navbar primaria (UX-02). Reemplaza el botón
// flotante (FAB) que vivía dentro del bundle de React: el ícono ahora lo
// renderiza Moodle directamente (ver classes/hook/navigation/
// primary_extend_listener.php), fuera del árbol de React, así que la
// sincronización con el panel se hace vía un CustomEvent en window en vez
// de estado de React compartido.

define([], function() {

    var SELECTOR = 'li[data-key="local_nexusai_trigger"] a.nav-link';

    /**
     * Handler de click del ícono de la navbar: cancela la navegación (el
     * nodo apunta a "#") y avisa al panel de React vía CustomEvent.
     *
     * @param {Event} e
     */
    function toggle(e) {
        e.preventDefault();
        window.__nexusaiPanelOpenState = !window.__nexusaiPanelOpenState;
        window.dispatchEvent(new CustomEvent('nexusai:toggle-panel'));
    }

    return {
        /**
         * Punto de entrada cargado por primary_extend_listener.php.
         * Se auto-limita si el nodo no está en el DOM (no debería pasar,
         * pero evita un error si el hook no llegó a agregarlo).
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
