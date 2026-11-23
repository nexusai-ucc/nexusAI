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
 * Test double of `core/ajax` (TPC-05, #577).
 *
 * The `api/*.js` modules ask for `core/ajax` with `window.require` and, when
 * there is no `window.M.cfg`, fall back to mock data. This installs a fake
 * Moodle: each `ajax.call([{methodname, args}])` answers with what
 * `handlers[methodname]` says (a value or a function of the args) and is
 * recorded in `ajaxCalls`, so a test can check which web service was called
 * and with what.
 *
 * The `fakeAjax` object is always the same: documents/api.js caches
 * `ajax.call` the first time, so the handlers are read on every call.
 */

import { vi } from "vitest";

let handlers = {};

/** Calls received, in order: `{ methodname, args }`. */
export const ajaxCalls = [];

const fakeAjax = {
    call: vi.fn((requests) =>
        requests.map(({ methodname, args }) => {
            ajaxCalls.push({ methodname, args });
            if (!(methodname in handlers)) {
                return Promise.reject(new Error(`No handler for ${methodname}`));
            }
            const handler = handlers[methodname];
            try {
                return Promise.resolve(typeof handler === "function" ? handler(args) : handler);
            } catch (err) {
                return Promise.reject(err);
            }
        })
    ),
};

/**
 * Installs the fake Moodle.
 *
 * @param {Object<string, *>} map Answer (or function of the args) per methodname.
 * @returns {{call: Function}} The fake `core/ajax`.
 */
export function installMoodleAjax(map = {}) {
    handlers = map;
    ajaxCalls.length = 0;
    fakeAjax.call.mockClear();
    window.M = { cfg: { wwwroot: "http://moodle.test", sesskey: "sk" } };
    window.require = (deps, resolve) => resolve(fakeAjax);
    return fakeAjax;
}

/** Removes the fake Moodle: the modules go back to their mock data. */
export function uninstallMoodleAjax() {
    delete window.M;
    delete window.require;
    handlers = {};
    ajaxCalls.length = 0;
}

/**
 * Runs a call in mock mode, which waits with setTimeout, without really waiting.
 *
 * @param {Function} fn Call that returns a promise.
 * @returns {Promise<*>} Its result.
 */
export async function withFakeTimers(fn) {
    vi.useFakeTimers();
    try {
        const pending = fn();
        await vi.runAllTimersAsync();
        return await pending;
    } finally {
        vi.useRealTimers();
    }
}
