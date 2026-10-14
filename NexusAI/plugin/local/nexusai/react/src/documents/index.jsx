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
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

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
