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
import { KEY_MAX, KEY_PATTERN, MODEL_PATTERN } from "./userLlm";

// Same rules as local\user_llm::validate(): the screen tells the user before sending.
describe("userLlm patterns", () => {
    it("accepts provider keys: printable ASCII without spaces", () => {
        expect(KEY_PATTERN.test("sk-ant-api03-AbC_123-xyz")).toBe(true);
        expect(KEY_PATTERN.test("gsk_0123456789abcdef")).toBe(true);
    });

    it("rejects short, long, spaced and non-ASCII keys", () => {
        expect(KEY_PATTERN.test("short")).toBe(false);
        expect(KEY_PATTERN.test("x".repeat(KEY_MAX + 1))).toBe(false);
        expect(KEY_PATTERN.test("sk with spaces 1234")).toBe(false);
        expect(KEY_PATTERN.test("sk-clave-con-eñe-0123")).toBe(false);
    });

    it("accepts model names as providers write them", () => {
        expect(MODEL_PATTERN.test("gpt-x-mini")).toBe(true);
        expect(MODEL_PATTERN.test("org/model:free")).toBe(true);
        expect(MODEL_PATTERN.test("with space")).toBe(false);
    });
});
