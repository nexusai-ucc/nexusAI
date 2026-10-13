/**
 * Webpack config for the local_nexusai React bundle.
 *
 * What matters in this config:
 *
 *   1. libraryTarget: 'amd' →  the output is an AMD module Moodle can load
 *      via `$PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init')`.
 *
 *   2. Output to ../amd/build/  →  Moodle ONLY loads JS from amd/build/ (the files
 *      in amd/src/ are the "unminified" source, but since Webpack already minifies
 *      we write straight to build/).
 *
 *   3. externals: jquery, core/* →  these libs are ALREADY loaded by Moodle
 *      globally. Bundling them into our JS would duplicate code and break things
 *      (especially jQuery, which Moodle uses internally).
 *
 *   4. No source maps in production so the bundle is smaller. In `npm run dev`
 *      Webpack generates them automatically.
 */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    const isProd = argv.mode === 'production';

    return {
        // Two separate AMD bundles: one for the floating chat (loaded on ALL
        // course pages), another one for the teacher view (only on /documents.php).
        // Each one is compiled as `<entry>.min.js` in amd/build/.
        entry: {
            'chatwidget-lazy':       './src/index.jsx',
            'documents-manager-lazy': './src/documents/index.jsx',
        },

        output: {
            // Goes straight to the directory Moodle serves.
            path: path.resolve(__dirname, '../amd/build'),
            // [name] comes from the entry key, that is how we get the 2 bundles
            // with their right names.
            filename: '[name].min.js',
            // 'amd' = AMDjs / RequireJS. Moodle loads it with `js_call_amd()`.
            libraryTarget: 'amd',
            // Clean ONLY the bundles this webpack builds, not all of amd/build/:
            // that directory also holds plain AMD modules compiled separately
            // with `grunt amd` (nav-trigger.js, upload-prompt.js, forum-*.js) — with
            // a plain `clean: true`, every `npm run build` deleted them silently
            // (a real bug, found in UX-02: the navbar icon stopped working after
            // any rebuild of the React bundle).
            clean: {
                keep: /^(?!chatwidget-lazy\.min\.js|documents-manager-lazy\.min\.js).*$/,
            },
            // publicPath for lazy chunks. Without it, Webpack loads them relative
            // to the URL of the last executed script — which in Moodle can be MathJax
            // or another CDN, breaking everything. We force any chunk to be looked
            // up in the path where Moodle serves the plugin's AMD modules.
            publicPath: '/local/nexusai/amd/build/',
        },

        optimization: {
            minimize: isProd,
            minimizer: [
                new TerserPlugin({
                    extractComments: false,
                    terserOptions: {
                        format: { comments: false },
                    },
                }),
            ],
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

        // Source maps only in dev, they make the bundle 4x bigger.
        devtool: isProd ? false : 'eval-source-map',

        // Performance hints: Moodle does not tolerate huge bundles on every page load.
        // Limit raised to 600KB in ASIST-04 (#360): the chat adds Temml (~200KB)
        // to render LaTeX formulas as MathML. The team accepted the cost
        // (see the evaluation in the PR of #360). If it is exceeded again, that is
        // when code splitting / lazy loading is due — do not keep raising the number.
        performance: {
            maxAssetSize: 600 * 1024,
            maxEntrypointSize: 600 * 1024,
            hints: isProd ? 'warning' : false,
        },

        // Suppresses webpack's banner in production.
        stats: isProd ? 'minimal' : 'normal',
    };
};
