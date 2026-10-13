# React widget — local_nexusai

React source of the chat widget and of the teacher view (document manager).
Webpack compiles it to two AMD bundles that Moodle loads with `js_call_amd()`:

- `../amd/build/chatwidget-lazy.min.js` — the chat widget (`src/index.jsx`).
- `../amd/build/documents-manager-lazy.min.js` — the teacher view (`src/documents/index.jsx`).

Both bundles are committed, so the plugin works without Node. This directory is
what you need to rebuild them.

## Setup

```bash
npm install
```

Installs React 18, Webpack 5, Babel and the plugins (`package-lock.json` pins the
exact versions). Takes ~2-3 minutes the first time.

## Build

**Production** (minified, no source maps):

```bash
npm run build
```

**Development** (with source maps + watch mode, rebuilds on every change):

```bash
npm run dev
```

## Structure

```
src/
├── index.jsx          # Chat widget entry point. Exports `init(params)`, which Moodle calls.
├── ChatApp.jsx        # Root component of the chat widget.
├── OnboardingApp.jsx  # Course setup tutorial shown on the create-course screen.
├── api/               # Calls to the plugin's web services (core/ajax) and the streaming endpoint.
├── components/        # Chat widget panels and shared components.
├── documents/         # Teacher view: entry point, panels and its own CSS.
├── onboarding/        # Course setup steps and state hook.
└── styles.css         # Styles with the .nexusai-* prefix (no clashes with Moodle).
```

## How Moodle loads the bundle

```
PHP (classes/hook/output/before_footer_listener.php)      Browser
────────────────────────────────────────────────────      ───────
$PAGE->requires->js_call_amd(
   'local_nexusai/chatwidget-lazy',
   'init',
   [params]
)
   ↓
RequireJS requests:
GET /local/nexusai/amd/build/chatwidget-lazy.min.js
   ↓
                                define([], function() {
                                    return { init: function(params) {...} }
                                })
   ↓
init(params) runs
   ↓
React mounts on #local-nexusai-container
```

The teacher view works the same way from `documents.php`, with
`local_nexusai/documents-manager-lazy` and `#local-nexusai-documents-app`.

## Externals (NOT bundled)

Webpack is configured NOT to include these libraries in the bundle, because Moodle
already provides them as global AMD modules:

- `jquery`
- `core/ajax`
- `core/notification`
- `core/str`
- `core/templates`

To use them from React, import them like any other dependency:

```jsx
import { call as fetchMany } from 'core/ajax';

const [result] = await fetchMany([{
    methodname: 'local_nexusai_chat_send',
    args: { courseid, question },
}]);
```

Webpack marks them as externals → the bundle stays smaller → Moodle resolves the
dependency at runtime.

## Testing

The test suite (Vitest + React Testing Library, `jsdom` as the DOM environment)
lives next to each component as `*.test.js(x)` in the plugin repository. It is
not part of the release ZIP, since it is not needed to build the bundles.

```bash
npm test            # runs the whole suite once (the same CI runs)
npm run test:watch  # watch mode for development
```

**Node 22+ note:** Node added an experimental global `localStorage`/`sessionStorage`
that overrides `jsdom`'s and breaks any test that uses `localStorage`. The
`package.json` scripts already turn it off (`scripts/run-vitest.js` passes
`--no-experimental-webstorage` when the running Node knows that flag); if you run
Vitest directly (`npx vitest ...`) without `npm test`, add that flag by hand.

## Performance budget

Webpack warns when a bundle goes over **600KB** (`performance` in
`webpack.config.js`). The chat bundle is above it today because of Temml (LaTeX
formulas, ASIST-04): the next step there is code splitting / lazy loading, not
raising the limit again.

## Recommended workflow

1. `npm run dev` in a terminal (watch mode).
2. Edit `src/*.jsx`.
3. Webpack rebuilds automatically into `../amd/build/`.
4. In Moodle: `Site administration → Development → Purge all caches`.
5. `Ctrl+Shift+R` in the browser to force reloading the JS.
