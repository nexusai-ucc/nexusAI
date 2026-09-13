#!/usr/bin/env node
"use strict";

/**
 * Wrapper de `vitest` que agrega `--no-experimental-webstorage` a
 * NODE_OPTIONS solo si el binario de Node que está corriendo reconoce esa
 * flag, en vez de asumir una versión fija de Node.
 *
 * Por qué hace falta: el código de producción (SearchPanel.jsx, ChatApp.jsx)
 * usa el `localStorage`/`sessionStorage` global del navegador. Bajo jsdom,
 * Vitest copia esas claves del `window` de jsdom al scope global del
 * proceso — pero solo cuando Node TODAVÍA no las tiene definidas
 * (`getWindowKeys` en vitest/dist/chunks: `if (k in global) return
 * keysArray.includes(k)`, y "localStorage"/"sessionStorage" no están en esa
 * lista fija de claves). Desde Node 22, Node define sus propios globals
 * `localStorage`/`sessionStorage` por default (detrás de este flag
 * experimental) — existen, pero sin `--localstorage-file` son un stub que
 * siempre devuelve `undefined`. Como "ya existen", Vitest asume que están
 * cubiertas y nunca los pisa con el Storage real de jsdom: el resultado es
 * `localStorage` (`undefined`).clear() reventando en cualquier test.
 *
 * Desactivar el flag experimental de Node antes de que arranque el proceso
 * hace que esas claves no existan de entrada, así Vitest sí las copia de
 * jsdom. La flag no existe en Node < 22 — pasarla ahí rompe el arranque con
 * "not allowed in NODE_OPTIONS" (el bug que tenía este script cuando estaba
 * hardcodeado en package.json y CI corría Node 20). Por eso el feature-detect
 * acá con `process.allowedNodeEnvironmentFlags` en vez de hardcodear la flag.
 */

const { spawnSync } = require("node:child_process");

const FLAG = "--no-experimental-webstorage";
const supportsFlag = process.allowedNodeEnvironmentFlags.has(FLAG);

const nodeOptions = [process.env.NODE_OPTIONS, supportsFlag ? FLAG : null]
    .filter(Boolean)
    .join(" ")
    .trim();

const vitestEntry = require.resolve("vitest/vitest.mjs");
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, [vitestEntry, ...args], {
    stdio: "inherit",
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
});

if (result.error) {
    console.error(result.error);
    process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
