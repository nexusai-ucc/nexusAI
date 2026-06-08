/**
 * Entrypoint del bundle React de NexusAI.
 *
 * Esta función `init` es lo que Moodle invoca desde db/hooks.php (o lib.php
 * en versiones < 4.4):
 *
 *   $PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init', [params]);
 *
 * IMPORTANTE — sobre code-splitting:
 * Originalmente este archivo usaba dynamic imports (`import('react')`) para code
 * splitting, pero Moodle no tolera bien los chunks lazy de Webpack porque la URL
 * base de Moodle's RequireJS no coincide con la que Webpack intenta usar para
 * resolver los chunks (terminan apuntando a otros CDNs como MathJax y fallan).
 *
 * Solución: imports estáticos. Bundle único de ~150KB. Es lo que recomienda
 * la guía oficial de Moodle para plugins con React. Si en el futuro necesitamos
 * code splitting, hay que setear __webpack_public_path__ dinámicamente.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatApp from './ChatApp.jsx';
import './styles.css';

export const init = (params = {}) => {
    const container = document.getElementById('local-nexusai-container');
    if (!container) {
        return;
    }

    try {
        const root = createRoot(container);
        root.render(
            <ChatApp
                courseid={params.courseid}
                userid={params.userid}
                sesskey={params.sesskey}
                wwwroot={params.wwwroot}
                lang={params.lang || 'es'}
                isteacher={params.isteacher || 0}
            />
        );
    } catch {
        // Mount failure is silent — widget simply won't appear
    }
};

// Default export para compatibilidad con AMD (algunos consumers usan `.default`).
export default { init };
