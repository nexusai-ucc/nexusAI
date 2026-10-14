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
 * Generic CSV exporter (DOC-D07, issue #355).
 *
 * Same approach as gift.js: the conversion and the download happen entirely
 * in the browser — no round-trip to the backend, since the panels that export
 * (Gaps, FAQ) already have the data loaded on screen.
 */

// Escapes a value for a CSV cell: if it contains a comma, double quote or line
// break, it is wrapped in double quotes, doubling the inner ones (RFC 4180).
function escapeCsvCell(value) {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

/**
 * Builds a CSV string from headers and rows.
 *
 * @param {string[]} headers
 * @param {Array<Array<string|number>>} rows
 * @returns {string}
 */
export function toCsv(headers, rows) {
    const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(","));
    // Leading BOM so Excel detects UTF-8 (accents/ñ) without manual configuration.
    return "﻿" + lines.join("\r\n") + "\r\n";
}

/**
 * Fires the download of a .csv file in the browser (no request to the server).
 *
 * @param {string[]} headers
 * @param {Array<Array<string|number>>} rows
 * @param {string} [filename]
 */
export function downloadCsvFile(headers, rows, filename = "export-nexusai.csv") {
    const content = toCsv(headers, rows);
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
