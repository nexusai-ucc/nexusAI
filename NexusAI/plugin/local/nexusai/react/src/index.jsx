/**
 * Entrypoint del bundle React de NexusAI.
 *
 * Esta función `init` es lo que Moodle invoca desde lib.php:
 *
 *   $PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init', [params]);
 *
 * Moodle pasa el array de params como argumento. Acá lo recibimos como objeto
 * y lo pasamos al componente React de root.
 *
 * IMPORTANTE: este archivo NO debe importar React directamente arriba del archivo,
 * para que el bundle no se ejecute hasta que `init()` sea llamada. Eso permite
 * que la página de Moodle cargue rápido y el chat se monta on-demand.
 */

import './styles.css';

export const init = (params = {}) => {
    const container = document.getElementById('local-nexusai-container');
    if (!container) {
        // Defensivo: si por algún motivo el div no existe (ej. otro plugin
        // lo eliminó del DOM), no rompemos la página entera.
        // eslint-disable-next-line no-console
        console.warn('[NexusAI] container #local-nexusai-container not found, aborting mount');
        return;
    }

    // Lazy import de React solo cuando hace falta. Reduce el tiempo de parse
    // del bundle inicial y permite a Moodle priorizar su propio JS.
    Promise.all([
        import(/* webpackChunkName: "react" */ 'react'),
        import(/* webpackChunkName: "react-dom" */ 'react-dom/client'),
        import(/* webpackChunkName: "chatapp" */ './ChatApp.jsx'),
    ]).then(([React, ReactDOMClient, ChatAppModule]) => {
        const ChatApp = ChatAppModule.default;
        const root = ReactDOMClient.createRoot(container);
        root.render(
            React.createElement(ChatApp, {
                courseid: params.courseid,
                userid:   params.userid,
                sesskey:  params.sesskey,
                wwwroot:  params.wwwroot,
                lang:     params.lang || 'es',
            })
        );
    }).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[NexusAI] failed to mount widget:', err);
    });
};

// Default export para compatibilidad con AMD: algunos consumers usan `.default`.
export default { init };
