/**
 * Exportador genérico a CSV (DOC-D07, issue #355).
 *
 * Igual criterio que gift.js: la conversión y la descarga se hacen enteramente
 * en el browser — sin round-trip al backend, ya que los paneles que exportan
 * (Gaps, FAQ) tienen los datos cargados en pantalla.
 */

// Escapa un valor para una celda CSV: si contiene coma, comilla doble o salto
// de línea, se envuelve entre comillas dobles duplicando las internas (RFC 4180).
function escapeCsvCell(value) {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

/**
 * Arma un string CSV a partir de encabezados y filas.
 *
 * @param {string[]} headers
 * @param {Array<Array<string|number>>} rows
 * @returns {string}
 */
export function toCsv(headers, rows) {
    const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(","));
    // BOM inicial para que Excel detecte UTF-8 (acentos/ñ) sin configuración manual.
    return "﻿" + lines.join("\r\n") + "\r\n";
}

/**
 * Dispara la descarga de un archivo .csv en el browser (sin request al server).
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
