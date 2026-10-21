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

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// DEF-01 (#623), acción preventiva. `ajax.call()` de Moodle devuelve un ARRAY
// de promesas: `const [response] = await ajax.call(...)` espera el array y deja
// `response` como promesa sin resolver. El error se corrigió en calendar.js,
// después en voice.js (#591) y apareció otra vez en quiz.js y forumDigest.js.
// Esta guardia recorre el código y falla si alguien vuelve a escribirlo.
// Forma correcta: `const [promise] = ajax.call([...]); const response = await promise;`.

const SRC = join(__dirname, "..");
const PATTERN = /\[\s*\w+\s*\]\s*=\s*await\s+(?:ajax\.call|fetchMany)\s*\(/g;

function sourceFiles(dir) {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return sourceFiles(path);
        return /\.(js|jsx)$/.test(name) && !/\.test\.(js|jsx)$/.test(name) ? [path] : [];
    });
}

describe("uso de core/ajax", () => {
    it("ningún módulo espera el array de ajax.call() en lugar de su promesa", () => {
        // Arrange.
        const files = sourceFiles(SRC);

        // Act.
        const offenders = files.flatMap((file) => {
            const code = readFileSync(file, "utf8");
            return [...code.matchAll(PATTERN)].map((m) => {
                const line = code.slice(0, m.index).split("\n").length;
                return `${relative(SRC, file)}:${line}`;
            });
        });

        // Assert.
        expect(files.length).toBeGreaterThan(10);
        expect(offenders).toEqual([]);
    });

    it("la guardia detecta el patrón y deja pasar la forma correcta", () => {
        // Act and assert.
        expect("const [response] = await ajax.call([{}]);".match(PATTERN)).not.toBeNull();
        expect("const [r] = await fetchMany([{}]);".match(PATTERN)).not.toBeNull();
        expect("const [promise] = ajax.call([{}]);\nconst response = await promise;".match(PATTERN)).toBeNull();
    });
});
