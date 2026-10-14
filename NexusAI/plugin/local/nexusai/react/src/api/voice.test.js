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

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { transcribeAudio } from "./voice.js";

// core/ajax.call() returns an ARRAY of promises, one per request — the
// fake reproduces that shape so the test fails if the client awaits the
// array instead of its element (the bug behind #314: text undefined and
// errors swallowed).
function stubMoodleAjax(callImpl) {
    const ajax = { call: vi.fn(callImpl) };
    window.M = { cfg: { wwwroot: "http://moodle.local", sesskey: "sk" } };
    window.require = (deps, resolve) => resolve(ajax);
    return ajax;
}

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    delete window.M;
    delete window.require;
});

describe("transcribeAudio (VOICE-01, #314)", () => {
    it("devuelve el texto de la respuesta del web service", async () => {
        const ajax = stubMoodleAjax(() => [Promise.resolve({ text: "¿Qué es un proceso?" })]);
        const blob = new Blob(["audio"], { type: "audio/webm;codecs=opus" });

        const text = await transcribeAudio(5, blob);

        expect(text).toBe("¿Qué es un proceso?");
        const [[requests]] = ajax.call.mock.calls;
        expect(requests[0].methodname).toBe("local_nexusai_chat_voice_transcribe");
        expect(requests[0].args.courseid).toBe(5);
        expect(requests[0].args.mimetype).toBe("audio/webm;codecs=opus");
        expect(requests[0].args.content_b64).toBe(btoa("audio"));
    });

    it("propaga el error del web service para que el composer lo muestre", async () => {
        stubMoodleAjax(() => [Promise.reject(new Error("erroraudiotype"))]);
        const blob = new Blob(["audio"], { type: "audio/webm" });

        await expect(transcribeAudio(5, blob)).rejects.toThrow("erroraudiotype");
    });
});
