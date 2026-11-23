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
 * "My API key" (BYOK): the user's own AI provider key.
 *
 * The key is tested by the backend and saved encrypted by Moodle; it never
 * comes back to the browser — only a hint like "sk-ant…4f2a". Outside Moodle
 * (demo mode) a small in-memory mock lets the screen be tried.
 */

async function getMoodleAjax() {
    if (typeof window === "undefined" || !window.M?.cfg) return null;
    try {
        return await new Promise((resolve, reject) => {
            // eslint-disable-next-line no-undef
            window.require(["core/ajax"], resolve, reject);
        });
    } catch {
        return null;
    }
}

async function call(methodname, args) {
    const ajax = await getMoodleAjax();
    if (!ajax) return mockCall(methodname, args);
    const [responsePromise] = ajax.call([{ methodname, args }]);
    return responsePromise;
}

/**
 * Providers for demo mode only (outside Moodle). Inside Moodle the screen uses
 * the list the server returns (local\user_llm::PROVIDERS).
 */
export const PROVIDERS = [
    { id: "openai", label: "OpenAI" },
    { id: "anthropic", label: "Anthropic" },
    { id: "gemini", label: "Google Gemini" },
    { id: "groq", label: "Groq" },
    { id: "openrouter", label: "OpenRouter" },
    { id: "mistral", label: "Mistral" },
    { id: "deepseek", label: "DeepSeek" },
];

/**
 * Same rules as the server (local\user_llm::validate), only to tell the user
 * what is wrong before sending; the server validates again.
 */
export const MODEL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,119}$/;
export const KEY_MIN = 8;
export const KEY_MAX = 512;
/** Printable ASCII without spaces, KEY_MIN to KEY_MAX characters. */
export const KEY_PATTERN = new RegExp(String.raw`^[\x21-\x7E]{${KEY_MIN},${KEY_MAX}}$`);

/**
 * @param {number} courseId
 * @returns {Promise<Object>} State: siteenabled, courseallowed, configured,
 *   active, provider, providerlabel, model, keyhint, timetested,
 *   monthrequests, monthtokens, providers.
 */
export function getUserLlm(courseId) {
    return call("local_nexusai_user_llm_get", { courseid: courseId });
}

/**
 * Tests the key and saves it only if the provider answered.
 *
 * @returns {Promise<{ok:boolean, reason:string, message:string, state:Object}>}
 */
export function saveUserLlm({ courseId, provider, model, apiKey }) {
    return call("local_nexusai_user_llm_save", {
        courseid: courseId,
        provider,
        model,
        apikey: apiKey,
    });
}

/** Tests the saved key again. Same result shape as saveUserLlm. */
export function testUserLlm(courseId) {
    return call("local_nexusai_user_llm_test", { courseid: courseId });
}

/** Removes the saved key. Resolves with the new state. */
export function deleteUserLlm(courseId) {
    return call("local_nexusai_user_llm_delete", { courseid: courseId });
}

// ---- Demo mode (outside Moodle) --------------------------------------------

let mockState = null;

function mockBaseState() {
    return {
        siteenabled: true,
        courseallowed: true,
        configured: false,
        active: false,
        provider: "",
        providerlabel: "",
        model: "",
        keyhint: "",
        timetested: 0,
        monthrequests: 0,
        monthtokens: 0,
        providers: PROVIDERS,
    };
}

async function mockCall(methodname, args) {
    await new Promise((r) => setTimeout(r, 300));
    if (!mockState) mockState = mockBaseState();
    switch (methodname) {
        case "local_nexusai_user_llm_save": {
            const label = PROVIDERS.find((p) => p.id === args.provider)?.label || args.provider;
            const key = args.apikey;
            mockState = {
                ...mockState,
                configured: true,
                active: true,
                provider: args.provider,
                providerlabel: label,
                model: args.model,
                keyhint: key.length >= 16 ? `${key.slice(0, 6)}…${key.slice(-4)}` : `…${key.slice(-2)}`,
                timetested: Math.floor(Date.now() / 1000),
            };
            return { ok: true, reason: "", message: "", state: mockState };
        }
        case "local_nexusai_user_llm_test":
            return { ok: mockState.configured, reason: "", message: "", state: mockState };
        case "local_nexusai_user_llm_delete":
            mockState = mockBaseState();
            return mockState;
        default:
            return mockState;
    }
}
