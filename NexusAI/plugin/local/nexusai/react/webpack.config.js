/**
 * Webpack config para el bundle React de local_nexusai.
 *
 * Lo crítico de esta config:
 *
 *   1. libraryTarget: 'amd' →  el output es un módulo AMD que Moodle puede cargar
 *      vía `$PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init')`.
 *
 *   2. Output a ../amd/build/  →  Moodle SOLO carga JS desde amd/build/ (los archivos
 *      en amd/src/ son la fuente "no minificada", pero como Webpack ya minifica nosotros
 *      escribimos directo a build/).
 *
 *   3. externals: jquery, core/* →  estas libs YA están cargadas por Moodle a nivel
 *      global. Si las bundleamos en nuestro JS, duplicamos código y rompemos cosas
 *      (especialmente jQuery, que Moodle usa internamente).
 *
 *   4. Sin source maps en producción para que el bundle sea más chico. En `npm run dev`
 *      Webpack los genera automáticamente.
 */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    const isProd = argv.mode === 'production';

    return {
        entry: './src/index.jsx',

        output: {
            // Va directo al directorio que Moodle sirve.
            path: path.resolve(__dirname, '../amd/build'),
            filename: 'chatwidget-lazy.min.js',
            // 'amd' = AMDjs / RequireJS. Moodle lo carga con `js_call_amd()`.
            libraryTarget: 'amd',
            // Limpiar el directorio antes de cada build, así no quedan archivos viejos.
            clean: true,
            // publicPath para chunks lazy. Sin esto, Webpack los carga relativo
            // a la URL del último script ejecutado — que en Moodle puede ser MathJax
            // u otro CDN, rompiendo todo. Forzamos que cualquier chunk se busque
            // en el path donde Moodle sirve los AMD modules del plugin.
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
            // Forzar UN SOLO bundle, sin chunks separados. Más simple para Moodle/AMD.
            // Si alguien escribe `import('foo')` por error, esto lo bundlea inline
            // en lugar de generar un chunk lazy que rompería en runtime.
            splitChunks: false,
            runtimeChunk: false,
        },

        // Estas dependencias NO se bundlean — Moodle las provee globalmente.
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
                    // Inyecta el CSS como <style> al cargar el bundle.
                    // Evita pelearnos con el sistema de stylesheets de Moodle.
                    use: ['style-loader', 'css-loader'],
                },
            ],
        },

        resolve: {
            extensions: ['.js', '.jsx'],
        },

        // Source maps solo en dev, hacen el bundle 4x más grande.
        devtool: isProd ? false : 'eval-source-map',

        // Performance hints: Moodle no tolera bundles gigantes en cada page load.
        // Si superamos 500KB hay que pensar en code-splitting / lazy loading.
        performance: {
            maxAssetSize: 500 * 1024,
            maxEntrypointSize: 500 * 1024,
            hints: isProd ? 'warning' : false,
        },

        // Suprime el banner de webpack en producción.
        stats: isProd ? 'minimal' : 'normal',
    };
};
