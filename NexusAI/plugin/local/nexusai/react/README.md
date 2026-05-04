# React widget — local_nexusai

Source de React del widget del chat. Webpack lo compila a un bundle AMD único en
`../amd/build/chatwidget-lazy.min.js` que Moodle carga vía `js_call_amd()`.

## Setup

```bash
npm install
```

Instala React 18, Webpack 5, Babel y plugins. Tarda ~2-3 minutos la primera vez.

## Build

**Producción** (minificado, sin source maps):

```bash
npm run build
```

**Desarrollo** (con source maps + watch mode, rebuilda en cada cambio):

```bash
npm run dev
```

## Estructura

```
src/
├── index.jsx          # Entrypoint. Exporta `init(params)` que Moodle invoca.
├── ChatApp.jsx        # Componente raíz del widget.
└── styles.css         # Estilos con prefijo .nexusai-* (no chocan con Moodle)
```

## Cómo Moodle carga este bundle

```
PHP (lib.php)                    Browser
─────────────                    ───────
before_footer()
   ↓
$PAGE->requires->js_call_amd(
   'local_nexusai/chatwidget-lazy',
   'init',
   [params]
)
   ↓
RequireJS pide:
GET /local/nexusai/amd/build/chatwidget-lazy.min.js
   ↓
                                define([], function() {
                                    return { init: function(params) {...} }
                                })
   ↓
init(params) se ejecuta
   ↓
React monta en #local-nexusai-container
```

## Externals (NO se bundlean)

Webpack está configurado para NO incluir estas libs en el bundle, porque Moodle ya
las provee como módulos AMD globales:

- `jquery`
- `core/ajax`
- `core/notification`
- `core/str`
- `core/templates`

Si necesitás usarlas desde React, importalas como cualquier dep:

```jsx
import { call as fetchMany } from 'core/ajax';

const [result] = await fetchMany([{
    methodname: 'local_nexusai_send_message',
    args: { courseid, message },
}]);
```

Webpack las marca como externals → el bundle queda más chico → Moodle resuelve la
dependencia en runtime.

## Testing

TODO Sprint 3: agregar Jest + React Testing Library.

## Performance budget

Webpack avisa con warning si el bundle supera **500KB**. Si pasa eso, hace falta
code-splitting (lazy chunks por feature). Hoy estimamos ~150KB con React + el chat
básico.

## Workflow recomendado

1. `npm run dev` en una terminal (watch mode).
2. Editar `src/*.jsx`.
3. Webpack rebuilda automáticamente en `../amd/build/`.
4. En Moodle: `Site administration → Development → Purge all caches`.
5. `Ctrl+Shift+R` en el navegador para forzar reload del JS.
