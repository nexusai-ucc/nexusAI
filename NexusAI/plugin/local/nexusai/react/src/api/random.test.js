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


import { describe, expect, it } from "vitest";
import { randomFloat, randomId } from "./random";

describe("random", () => {
    it("randomFloat devuelve valores en [0, 1)", () => {
        // Act.
        const values = Array.from({ length: 200 }, () => randomFloat());

        // Assert.
        expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
        expect(new Set(values).size).toBeGreaterThan(190);
    });

    it("randomId no se repite", () => {
        // Act.
        const ids = Array.from({ length: 100 }, () => randomId());

        // Assert.
        expect(new Set(ids).size).toBe(100);
        expect(ids[0]).toMatch(/^\d+-[0-9a-f]{16}$/);
    });
});
