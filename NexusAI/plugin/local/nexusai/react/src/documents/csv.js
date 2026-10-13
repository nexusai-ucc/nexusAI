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
