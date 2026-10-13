/**
 * Entry point of the teacher view bundle.
 *
 * Moodle calls it from plugin/local/nexusai/documents.php:
 *
 *   $PAGE->requires->js_call_amd('local_nexusai/documents-manager-lazy', 'init', [params]);
 *
 * Mounts the DocumentsManager component in the #local-nexusai-documents-app div
 * the PHP page already rendered.
 */

import React from "react";
import { createRoot } from "react-dom/client";

import DocumentsManager from "./DocumentsManager.jsx";
import "../styles.css";          // We reuse the chat styles for FAB/colors
import "./documents.css";        // Styles specific to the teacher view

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
                courseFullname={params.fullname}
                initialTab={params.initialtab}
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
