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
 * Random numbers from the browser's cryptographic generator (SonarCloud
 * javascript:S2245). Used for UI ids and for the simulated delays of the
 * development doubles: nothing sensitive, but no Math.random is left.
 * getRandomValues also works outside https (a local Moodle).
 */

/** Uniform number in [0, 1). */
export function randomFloat() {
    const [value] = globalThis.crypto.getRandomValues(new Uint32Array(1));
    return value / 2 ** 32;
}

/** Short unique id for UI elements. */
export function randomId() {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(8));
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${Date.now()}-${hex}`;
}
