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
 * Webpack config for the local_nexusai React bundle.
 *
 * What matters in this config:
 *
 *   1. libraryTarget: 'amd' →  the output is an AMD module Moodle can load
 *      via `$PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init')`.
 *
 *   2. Output to ../amd/src/, not minified  →  the bundles are AMD sources like
 *      any other module of the plugin, and Moodle's `grunt amd` builds them into
 *      amd/build/ (*.min.js + *.min.js.map). Same approach as Moodle core with
 *      lib/amd/src/chartjs-lazy.js: moodle-plugin-ci deletes amd/build/ and runs
 *      grunt to check the build, so everything in amd/build/ must come from
 *      amd/src/. thirdpartylibs.xml points at these files, which also keeps them
 *      out of ESLint.
 *
 *   3. externals: jquery, core/* →  these libs are ALREADY loaded by Moodle
 *      globally. Bundling them into our JS would duplicate code and break things
 *      (especially jQuery, which Moodle uses internally).
 *
 *   4. No source maps and no minification here: grunt does both.
 *
 * After `npm run build`, run grunt from the Moodle root to update amd/build/:
 *   npx grunt amd --root=public/local/nexusai   (Moodle 5.x; without public/ on 4.5)
 */

const path = require('path');

module.exports = (env, argv) => {
    const isProd = argv.mode === 'production';

    return {
        // Two separate AMD bundles: one for the floating chat (loaded on ALL
        // course pages), another one for the teacher view (only on /documents.php).
        // Each one is written as `<entry>.js` in amd/src/.
        entry: {
            'chatwidget-lazy':       './src/index.jsx',
            'documents-manager-lazy': './src/documents/index.jsx',
        },

        output: {
            // AMD sources of the plugin; grunt builds them into amd/build/.
            path: path.resolve(__dirname, '../amd/src'),
            // [name] comes from the entry key, that is how we get the 2 bundles
            // with their right names.
            filename: '[name].js',
            // 'amd' = AMDjs / RequireJS. Moodle loads it with `js_call_amd()`.
            libraryTarget: 'amd',
            // Clean ONLY the bundles this webpack builds, not all of amd/src/:
            // that directory also holds the plain AMD modules (nav-trigger.js,
            // upload-prompt.js, forum-*.js) — with a plain `clean: true`, every
            // `npm run build` would delete them (a real bug, found in UX-02 when
            // the bundles still went to amd/build/).
            clean: {
                keep: /^(?!chatwidget-lazy\.js|documents-manager-lazy\.js).*$/,
            },
            // publicPath for lazy chunks. Without it, Webpack loads them relative
            // to the URL of the last executed script — which in Moodle can be MathJax
            // or another CDN, breaking everything. We force any chunk to be looked
            // up in the path where Moodle serves the plugin's AMD modules.
            publicPath: '/local/nexusai/amd/build/',
        },

        optimization: {
            // Grunt minifies (and writes the source map) when it builds amd/build/.
            minimize: false,
            // Force ONE SINGLE bundle, without separate chunks. Simpler for Moodle/AMD.
            // If someone writes `import('foo')` by mistake, this bundles it inline
            // instead of generating a lazy chunk that would break at runtime.
            splitChunks: false,
            runtimeChunk: false,
        },

        // These dependencies are NOT bundled — Moodle provides them globally.
        externals: {
            'jquery':        'jquery',
            'core/ajax':     'core/ajax',
            'core/notification': 'core/notification',
            'core/str':      'core/str',
            'core/templates': 'core/templates',
        },

        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: 'babel-loader',
                },
                {
                    test: /\.css$/,
                    // Injects the CSS as a <style> when the bundle loads.
                    // Avoids fighting Moodle's stylesheet system.
                    use: ['style-loader', 'css-loader'],
                },
            ],
        },

        resolve: {
            extensions: ['.js', '.jsx'],
        },

        // No source maps here: grunt writes amd/build/*.min.js.map from amd/src/.
        devtool: false,

        // Performance hints: Moodle does not tolerate huge bundles on every page load.
        // Limit raised to 600KB in ASIST-04 (#360): the chat adds Temml (~200KB)
        // to render LaTeX formulas as MathML. The team accepted the cost
        // (see the evaluation in the PR of #360). If it is exceeded again, that is
        // when code splitting / lazy loading is due — do not keep raising the number.
        // The limit applies to the minified file grunt writes in amd/build/, so it
        // is checked there (frontend CI); webpack's output here is not minified.
        performance: {
            hints: false,
        },

        // Suppresses webpack's banner in production.
        stats: isProd ? 'minimal' : 'normal',
    };
};
