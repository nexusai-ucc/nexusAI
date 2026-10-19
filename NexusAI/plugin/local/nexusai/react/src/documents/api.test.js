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

import { describe, it, expect, afterAll } from "vitest";
import * as api from "./api.js";
import { installMoodleAjax, uninstallMoodleAjax, ajaxCalls, withFakeTimers } from "../test-utils/moodleAjax.js";

// TPC-05 (#577): cliente de documentos, gaps y analíticas del docente.
// Ojo con el orden: api.js cachea core/ajax la primera vez que lo encuentra,
// así que los casos sin Moodle (mock) van antes que los que lo instalan.

const pdf = (name = "u1.pdf", content = "%PDF-1.4 x") => new File([content], name, { type: "application/pdf" });

afterAll(() => {
    uninstallMoodleAjax();
});

describe("documentos fuera de Moodle (mock)", () => {
    it("lista los documentos del curso de ejemplo, paginados si se pide", async () => {
        // Act.
        const all = await withFakeTimers(() => api.listDocuments(2));
        const page = await withFakeTimers(() => api.listDocuments(2, 1, 1));

        // Assert.
        expect(all.total).toBeGreaterThan(1);
        expect(page.items).toHaveLength(1);
        expect(page.items[0].id).toBe(all.items[1].id);
    });

    it("estado y vista previa salen del documento de ejemplo", async () => {
        // Act.
        const status = await withFakeTimers(() => api.getDocumentStatus(2, "mock-1"));
        const preview = await withFakeTimers(() => api.getDocumentPreview(2, "mock-1"));
        const missing = await withFakeTimers(() => api.getDocumentPreview(2, "no-existe"));

        // Assert.
        expect(status.id).toBe("mock-1");
        expect(preview.truncated).toBe(true);
        expect(preview.preview.length).toBe(600);
        expect(missing.preview).toBeNull();
    });

    it("subir, reemplazar, reindexar y borrar actualizan la lista de ejemplo", async () => {
        // Act.
        const uploaded = await withFakeTimers(() => api.uploadDocument(2, pdf("nuevo.pdf"), 1, false));
        const replaced = await withFakeTimers(() => api.replaceDocument(2, uploaded.id, pdf("nuevo-v2.pdf")));
        const reindexed = await withFakeTimers(() => api.reindexDocument(2, uploaded.id));
        const deleted = await withFakeTimers(() => api.deleteDocument(2, uploaded.id));
        const unknown = await withFakeTimers(() => api.replaceDocument(2, "otro", pdf("x.pdf")));

        // Assert.
        expect(uploaded.visible).toBe(false);
        expect(replaced.filename).toBe("nuevo-v2.pdf");
        expect(reindexed.id).toBe(uploaded.id);
        expect(deleted).toEqual({ success: true });
        expect(unknown).toEqual({ id: "otro", filename: "x.pdf", mime_type: "application/pdf", status: "pending" });
    });

    it("gaps, FAQ y analíticas devuelven los datos de ejemplo con el curso pedido", async () => {
        // Act.
        const gaps = await withFakeTimers(() => api.listGaps(7, 14));
        const archived = await withFakeTimers(() => api.archiveGap(7, ["a", "b"], true));
        const faq = await withFakeTimers(() => api.getFaqTopics(7));
        const dashboard = await withFakeTimers(() => api.getAnalyticsDashboard(7, 60));

        // Assert.
        expect(gaps).toMatchObject({ course_id: 7, days: 14 });
        expect(archived).toEqual({ course_id: 7, archived: true, affected: 2 });
        expect(faq.course_id).toBe(7);
        expect(dashboard).toMatchObject({ course_id: 7, period_days: 60 });
    });
});

describe("validaciones de archivo (antes de llamar a nadie)", () => {
    // Clases de equivalencia del archivo: sin archivo, sin unidad, formato no
    // admitido, más de 20 MB (valor límite) y vacío.
    it.each([
        ["sin archivo", () => api.uploadDocument(2, null, 1), /No file/],
        ["sin unidad", () => api.uploadDocument(2, pdf(), undefined), /Choose a unit/],
        ["formato no admitido", () => api.uploadDocument(2, new File(["x"], "a.exe", { type: "application/x-msdownload" }), 1), /Unsupported/],
        ["más de 20 MB", () => api.uploadDocument(2, Object.defineProperty(pdf(), "size", { value: 20 * 1024 * 1024 + 1 }), 1), /too large/],
        ["archivo vacío", () => api.uploadDocument(2, pdf("v.pdf", ""), 1), /empty/],
        ["reemplazo sin archivo", () => api.replaceDocument(2, "d", null), /No file/],
        ["reemplazo con formato no admitido", () => api.replaceDocument(2, "d", new File(["x"], "a.zip", { type: "application/zip" })), /Unsupported/],
        ["reemplazo vacío", () => api.replaceDocument(2, "d", pdf("v.pdf", "")), /empty/],
    ])("rechaza %s", async (_name, call, message) => {
        // Act and assert.
        await expect(call()).rejects.toThrow(message);
    });

    it("formatBytes usa B, KB o MB según el tamaño (valores límite 1024)", () => {
        // Act and assert.
        expect(api.formatBytes(1023)).toBe("1023 B");
        expect(api.formatBytes(1024)).toBe("1.0 KB");
        expect(api.formatBytes(1024 * 1024)).toBe("1.0 MB");
    });
});

describe("documentos dentro de Moodle", () => {
    it.each([
        [() => api.listDocuments(3, 10, 20), "local_nexusai_document_list", { courseid: 3, limit: 10, offset: 20 }],
        [() => api.getDocumentStatus(3, "d1"), "local_nexusai_document_status", { courseid: 3, documentid: "d1" }],
        [() => api.getDocumentPreview(3, "d1"), "local_nexusai_document_preview", { courseid: 3, documentid: "d1" }],
        [() => api.deleteDocument(3, "d1"), "local_nexusai_document_delete", { courseid: 3, documentid: "d1" }],
        [() => api.reindexDocument(3, "d1"), "local_nexusai_document_reindex", { courseid: 3, documentid: "d1" }],
        [() => api.listGaps(3), "local_nexusai_gaps_list", { courseid: 3, days: 30, limit: 30, includearchived: false, offset: 0 }],
        [() => api.archiveGap(3, ["g"], false), "local_nexusai_gaps_archive", { courseid: 3, questionids: ["g"], archived: false }],
        [() => api.getFaqTopics(3, 7), "local_nexusai_analytics_faq_topics", { courseid: 3, days: 7 }],
        [() => api.getAnalyticsDashboard(3), "local_nexusai_analytics_dashboard", { courseid: 3, days: 30 }],
    ])("%#: llama al web service correcto", async (call, methodname, args) => {
        // Arrange.
        installMoodleAjax({ [methodname]: { ok: true } });

        // Act.
        const result = await call();

        // Assert.
        expect(ajaxCalls).toEqual([{ methodname, args }]);
        expect(result).toEqual({ ok: true });
    });

    it("sube el archivo en base64 y deduce el tipo por la extensión si el navegador no lo manda", async () => {
        // Arrange.
        installMoodleAjax({ local_nexusai_document_upload: { id: "d9" } });
        const csv = new File(["a,b\n1,2"], "notas.csv", { type: "" });

        // Act.
        const result = await api.uploadDocument(3, csv, 0);

        // Assert.
        expect(result).toEqual({ id: "d9" });
        expect(ajaxCalls[0].args).toMatchObject({ courseid: 3, filename: "notas.csv", mimetype: "text/csv", section: 0, visible: true });
        expect(atob(ajaxCalls[0].args.content_b64)).toBe("a,b\n1,2");
    });

    it("reemplaza el archivo de un documento", async () => {
        // Arrange.
        installMoodleAjax({ local_nexusai_document_replace: { id: "d1", status: "pending" } });

        // Act.
        const result = await api.replaceDocument(3, "d1", pdf("u1-v2.pdf"));

        // Assert.
        expect(result.status).toBe("pending");
        expect(ajaxCalls[0].args).toMatchObject({ courseid: 3, documentid: "d1", filename: "u1-v2.pdf", mimetype: "application/pdf" });
    });
});
