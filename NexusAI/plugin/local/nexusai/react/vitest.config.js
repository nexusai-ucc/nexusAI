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
