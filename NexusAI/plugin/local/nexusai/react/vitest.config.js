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

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Config independiente de webpack.config.js / .babelrc (esos son
// específicos del build de producción para Moodle, orientados a AMD +
// externals). `babelrc: false, configFile: false` evita que Vite intente
// reusar el .babelrc del proyecto (tiene `modules: false`, pensado para
// que Webpack haga tree-shaking — rompería la resolución de ESM de Vitest).
export default defineConfig({
    plugins: [react({ jsxRuntime: "automatic", babel: { babelrc: false, configFile: false } })],
    esbuild: {
        jsx: "automatic",
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./vitest.setup.js"],
        globals: false,
    },
});
