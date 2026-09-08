import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// `test.globals: false` en vitest.config.js significa que RTL no encuentra
// un `afterEach` global para autoregistrar su cleanup — se hace a mano acá,
// una sola vez, para que cada test arranque con un DOM limpio.
afterEach(() => {
    cleanup();
});
