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


// Números al azar con el generador criptográfico del navegador (SonarCloud
// javascript:S2245). Se usa para ids de la UI y para las demoras simuladas de
// los dobles de desarrollo: nada sensible, pero así no queda ningún
// Math.random. getRandomValues funciona también fuera de https (Moodle local).

/** Número uniforme en [0, 1). */
export function randomFloat() {
    const [value] = globalThis.crypto.getRandomValues(new Uint32Array(1));
    return value / 2 ** 32;
}

/** Id corto e irrepetible para elementos de la UI. */
export function randomId() {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(8));
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${Date.now()}-${hex}`;
}
