/**
 * Entrypoint del bundle de vista docente.
 *
 * Lo invoca Moodle desde plugin/local/nexusai/documents.php:
 *
 *   $PAGE->requires->js_call_amd('local_nexusai/documents-manager-lazy', 'init', [params]);
 *
 * Monta el componente DocumentsManager en el div #local-nexusai-documents-app
 * que la página PHP ya rendereó.
 */

import React from "react";
import { createRoot } from "react-dom/client";

import DocumentsManager from "./DocumentsManager.jsx";
import "../styles.css";          // Reutilizamos los estilos del chat para FAB/colores
import "./documents.css";        // Estilos específicos de la vista docente

export const init = (params = {}) => {
    const container = document.getElementById("local-nexusai-documents-app");
    if (!container) {
        // eslint-disable-next-line no-console
        console.warn("[NexusAI/documents] container #local-nexusai-documents-app not found");
        return;
    }

    try {
        const root = createRoot(container);
        root.render(
            <DocumentsManager
                courseid={params.courseid}
                userid={params.userid}
                sesskey={params.sesskey}
                lang={params.lang || "es"}
            />
        );
        // eslint-disable-next-line no-console
        console.log("[NexusAI/documents] mounted", params);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[NexusAI/documents] failed to mount:", err);
    }
};

export default { init };
