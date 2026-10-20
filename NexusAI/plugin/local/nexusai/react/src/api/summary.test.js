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


import { describe, it, expect } from "vitest";
import { getPreExamSummary, summarizeDocument } from "./summary";
import { withFakeTimers } from "../test-utils/moodleAjax.js";

// Fuera de Moodle (desarrollo del widget suelto) la API devuelve datos de
// ejemplo después de una demora simulada. Formato AAA.

describe("summary API sin Moodle", () => {
    it("summarizeDocument devuelve un resumen de ejemplo", async () => {
        // Act.
        const result = await withFakeTimers(() => summarizeDocument({ documentId: "d1", courseId: 4 }));

        // Assert.
        expect(result.summary).toBeTruthy();
    });

    it("getPreExamSummary devuelve un resumen de ejemplo", async () => {
        // Act.
        const result = await withFakeTimers(() => getPreExamSummary(4));

        // Assert.
        expect(result.summary).toBeTruthy();
    });

    it("summarizeDocument exige el documento", async () => {
        // Act / Assert.
        await expect(summarizeDocument({ courseId: 4 })).rejects.toThrow("document_id es requerido");
    });
});
