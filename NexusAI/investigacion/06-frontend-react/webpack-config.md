# Configuración de Webpack para bundle AMD

> **Resumen:** `webpack.config.js` completo para compilar React como módulo AMD compatible con Moodle. Los externals son la pieza clave para reutilizar `core/ajax`, `core/str` y otros módulos nativos de Moodle.

---

## Contexto

Este documento acompaña a [integracion-moodle-amd.md](integracion-moodle-amd.md). Acá está la config puntual de Webpack y la estructura de archivos de la parte React.

## Estructura de archivos

```
local/nexusai/
├── react/
│   ├── src/
│   │   ├── index.jsx              # Entry point con export init()
│   │   ├── ChatApp.jsx
│   │   ├── components/
│   │   │   ├── MessageList.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   └── FloatingButton.jsx
│   │   ├── hooks/
│   │   │   └── useChat.js
│   │   ├── api/
│   │   │   └── moodle.js          # Wrapper de core/ajax
│   │   └── styles/
│   │       └── chat.module.css    # CSS Modules
│   └── package.json
├── amd/
│   └── build/
│       └── chatwidget-lazy.min.js  # ← Output de Webpack
├── webpack.config.js
├── babel.config.json
└── .eslintrc.json
```

## `webpack.config.js`

```javascript
const path = require('path');

module.exports = (env, argv) => {
    const isProd = argv.mode === 'production';

    return {
        entry: './react/src/index.jsx',

        output: {
            filename: 'chatwidget-lazy.min.js',
            path: path.resolve(__dirname, 'amd/build'),
            library: { type: 'amd' },  // Genera módulo AMD compatible con RequireJS
            clean: true,
        },

        // Reutiliza módulos que ya tiene Moodle — no los duplica en el bundle
        externals: {
            'core/ajax':         'core/ajax',
            'core/str':          'core/str',
            'core/notification': 'core/notification',
            'core/templates':    'core/templates',
            'jquery':            'jquery',
        },

        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: 'babel-loader',
                },
                {
                    test: /\.module\.css$/,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                modules: {
                                    localIdentName: isProd
                                        ? 'nexusai-[hash:base64:5]'
                                        : 'nexusai-[local]-[hash:base64:5]',
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.css$/,
                    exclude: /\.module\.css$/,
                    use: ['style-loader', 'css-loader'],
                },
            ],
        },

        resolve: {
            extensions: ['.js', '.jsx'],
        },

        optimization: {
            // Un solo archivo — Moodle maneja AMD, no queremos code splitting
            splitChunks: false,
            runtimeChunk: false,
            minimize: isProd,
        },

        devtool: isProd ? false : 'source-map',

        performance: {
            hints: isProd ? 'warning' : false,
            maxEntrypointSize: 512 * 1024,  // 512 KB tope
            maxAssetSize: 512 * 1024,
        },
    };
};
```

## `babel.config.json`

```json
{
    "presets": [
        ["@babel/preset-env", { "targets": "> 0.5%, not dead, not ie 11" }],
        ["@babel/preset-react", { "runtime": "automatic" }]
    ]
}
```

## `package.json`

```json
{
    "name": "local_nexusai-react",
    "version": "0.1.0",
    "private": true,
    "scripts": {
        "build": "webpack --mode production",
        "dev":   "webpack --mode development --watch",
        "lint":  "eslint react/src",
        "test":  "jest"
    },
    "dependencies": {
        "react":     "^18.2.0",
        "react-dom": "^18.2.0"
    },
    "devDependencies": {
        "@babel/core":             "^7.24.0",
        "@babel/preset-env":       "^7.24.0",
        "@babel/preset-react":     "^7.24.0",
        "babel-loader":            "^9.1.0",
        "css-loader":              "^6.10.0",
        "style-loader":            "^3.3.0",
        "webpack":                 "^5.90.0",
        "webpack-cli":             "^5.1.0",
        "eslint":                  "^8.57.0",
        "eslint-plugin-react":     "^7.34.0",
        "jest":                    "^29.7.0"
    }
}
```

## Por qué estos externals

| External | Por qué |
|---|---|
| `core/ajax` | Para llamar External Functions con sesskey + CSRF. |
| `core/str` | Strings i18n de Moodle (reutilizamos los ya traducidos). |
| `core/notification` | Para mostrar errores con el mismo UX que el resto de Moodle. |
| `core/templates` | Si queremos renderizar templates Mustache de Moodle. |
| `jquery` | Muchos módulos core de Moodle lo esperan — no lo bundleamos. |

Sin los externals, el bundle incluiría copias duplicadas de estos módulos → bundle gigante + conflictos con las copias de Moodle.

## Tamaño del bundle — target

| Componente | Size |
|---|---|
| React 18 (prod) | ~45 KB gzip |
| React-DOM 18 (prod) | ~130 KB gzip |
| Código propio (chat UI, state, API) | ~20-40 KB gzip |
| **Total** | **~200-220 KB gzip** |

Dentro del hint de Webpack de 512 KB. Es aceptable para un asset cargado una vez por sesión del alumno.

## Problemas frecuentes y solución

| Síntoma | Causa probable | Solución |
|---|---|---|
| "Module `local_nexusai/chatwidget-lazy` not found" | Bundle no regenerado después de cambios | `npm run build` y purgar cachés Moodle |
| "Cannot find module 'core/ajax'" dentro del bundle | Externals mal configurados en Webpack | Verificar `externals` en `webpack.config.js` |
| React renderiza dos veces | `createRoot` + `ReactDOM.render` mezclados | Usar solo `createRoot` (React 18) |
| CSS pisa estilos de Moodle | Selectores genéricos | CSS Modules + prefijo `local-nexusai-` |
| Widget aparece dos veces | `before_footer` se ejecutó dos veces (bug en Moodle 4.x si se llama desde config del sitio) | Verificar con `getElementById` y no montar si ya existe |

## Comandos del día a día

```bash
# Dev con watch
cd local/nexusai
npm run dev

# Build para commit
npm run build
git add amd/build/chatwidget-lazy.min.js  # ← el bundle se commitea

# Lint
npm run lint
```

**Nota:** en Moodle se commitea el bundle generado, no solo el source. Es parte del plugin distribuible.

## Decisiones tomadas para NexusAI

- **Webpack 5** con `library.type: 'amd'`.
- **Externals estrictos** para `core/*` y `jquery`.
- **CSS Modules** para aislar estilos.
- **Sin code splitting** — un archivo único.
- **Bundle commiteado** al repo (convención Moodle).
- **Babel con `runtime: 'automatic'`** — no hace falta `import React`.

## Abierto / pendiente

- [ ] Setear Jest + React Testing Library para tests de componentes.
- [ ] Evaluar source maps en producción (sobrecoste de tamaño vs debug real).
- [ ] Decidir si usamos TypeScript (agrega complejidad, pero reduce bugs en el contrato con el backend).

## Referencias

- [Webpack docs — Output library](https://webpack.js.org/configuration/output/#outputlibrary)
- [Webpack docs — Externals](https://webpack.js.org/configuration/externals/)
- [Moodle — Javascript Modules AMD](https://moodledev.io/docs/guides/javascript/modules)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
