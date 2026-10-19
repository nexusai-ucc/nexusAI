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
 * Doble de prueba de `core/ajax` (TPC-05, #577).
 *
 * Los módulos `api/*.js` piden `core/ajax` con `window.require` y, si no hay
 * `window.M.cfg`, caen a datos mock. Esto instala un Moodle falso: cada
 * `ajax.call([{methodname, args}])` responde con lo que diga
 * `handlers[methodname]` (un valor o una función de los args) y queda anotado
 * en `ajaxCalls` para poder verificar qué web service se llamó y con qué.
 *
 * El objeto `fakeAjax` es siempre el mismo: documents/api.js cachea
 * `ajax.call` la primera vez, así que los handlers se leen en cada llamada.
 */

import { vi } from "vitest";

let handlers = {};

/** Llamadas recibidas, en orden: `{ methodname, args }`. */
export const ajaxCalls = [];

const fakeAjax = {
    call: vi.fn((requests) =>
        requests.map(({ methodname, args }) => {
            ajaxCalls.push({ methodname, args });
            if (!(methodname in handlers)) {
                return Promise.reject(new Error(`Sin handler para ${methodname}`));
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
 * Instala el Moodle falso.
 *
 * @param {Object<string, *>} map Respuesta (o función de los args) por methodname.
 * @returns {{call: Function}} El `core/ajax` falso.
 */
export function installMoodleAjax(map = {}) {
    handlers = map;
    ajaxCalls.length = 0;
    fakeAjax.call.mockClear();
    window.M = { cfg: { wwwroot: "http://moodle.test", sesskey: "sk" } };
    window.require = (deps, resolve) => resolve(fakeAjax);
    return fakeAjax;
}

/** Saca el Moodle falso: los módulos vuelven a sus datos mock. */
export function uninstallMoodleAjax() {
    delete window.M;
    delete window.require;
    handlers = {};
    ajaxCalls.length = 0;
}

/**
 * Corre una llamada en modo mock, que espera con setTimeout, sin esperar de verdad.
 *
 * @param {Function} fn Llamada que devuelve una promesa.
 * @returns {Promise<*>} Su resultado.
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
