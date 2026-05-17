# `plugin/` — Plugin Moodle (PHP + React bundled)

Este directorio contiene el plugin tipo `local` que se instala dentro de Moodle. La estructura `local/nexusai/` replica exactamente cómo se monta dentro de un Moodle real (`<moodle>/local/nexusai/`).

**Versión actual:** `0.3.0` — Sprint 2 cierre (RAG completo + chat end-to-end con citas de fuentes).

## Estructura

```
plugin/
└── local/nexusai/
    ├── version.php              # Metadatos del plugin (obligatorio)
    ├── lib.php                  # Callbacks: before_footer(), etc.
    ├── settings.php             # Settings administrativos
    ├── styles.css               # Estilos del widget
    ├── documents.php            # Página de gestión docente (Sprint 2)
    ├── thirdpartylibs.xml       # Declaración de React, Webpack, etc.
    ├── db/
    │   ├── access.php           # Capabilities
    │   ├── services.php         # External functions (AJAX endpoints)
    │   ├── install.xml          # Esquema de tablas
    │   └── upgrade.php          # Migraciones entre versiones
    ├── classes/
    │   ├── external/            # Implementación de external functions
    │   │   ├── backend_client.php
    │   │   ├── chat_send.php
    │   │   ├── documents_upload.php
    │   │   ├── documents_list.php
    │   │   ├── documents_delete.php
    │   │   └── documents_status.php
    │   └── privacy/             # Privacy API (GDPR / Ley 25.326)
    ├── lang/
    │   ├── en/local_nexusai.php
    │   └── es/local_nexusai.php
    ├── amd/
    │   ├── src/                 # Source AMD (entry point del bundle React)
    │   └── build/               # Bundle compilado por Webpack (commiteado)
    │       ├── chatwidget-lazy.min.js
    │       └── documents-manager-lazy.min.js
    └── react/
        ├── src/                 # Source de React
        │   ├── ChatApp.jsx
        │   ├── components/      # MessageBubble, ChatInput, TypingIndicator
        │   ├── api/             # cliente core/ajax
        │   ├── documents/       # vista docente (UploadZone, DocumentsTable, ...)
        │   └── styles.css
        ├── package.json
        ├── webpack.config.js
        └── babel.config.json
```

## Features (Sprint 1 + Sprint 2)

### Alumno
- Widget de chat flotante en cualquier página de curso.
- Optimistic UI — el mensaje del alumno aparece de inmediato.
- Manejo de errores con Retry / Dismiss.
- **Markdown rendering** en respuestas del LLM (listas, negritas, código, tablas).
- **Pills de fuentes citadas** — cuando el LLM cita "según apunte-X.pdf", aparece como badge al pie.
- Historial de la sesión, botón "Nueva conversación".
- Auto-scroll al recibir respuesta.
- UI bilingüe es/en.

### Docente
- Página dedicada (`documents.php`) con permiso `local/nexusai:manage`.
- Drag & drop para subir PDFs (hasta 20 MB).
- Tabla con estado de indexación: pending → indexing → indexed | error.
- **Polling cada 3s** mientras hay documentos no terminados (sin refrescar).
- Eliminación con cascada de chunks.

### Sistema
- HMAC en 3 capas PHP↔Python.
- 3 capabilities: `use`, `manage`, `viewanalytics`.
- 5 External Functions (chat + 4 de documents).
- Privacy API implementada (GDPR / Ley 25.326).
- Compatible Moodle 4.1 LTS – 4.5.

## Cómo desarrollar acá

Ver [`investigacion/10-setup-entorno/docker-moodle.md`](../investigacion/10-setup-entorno/docker-moodle.md) para levantar Moodle en local y montar este plugin como `local/nexusai/`.

Para correr el stack completo (Moodle + backend + Postgres + Redis):

```bash
./scripts/dev.sh full
```

Para iterar el frontend en watch:

```bash
cd plugin/local/nexusai/react
npm install
npm run dev      # webpack --watch (dev mode, con source maps)
npm run build    # producción minified (commitear los .min.js)
```

## Convenciones

- **PHP:** Moodle Coding Style estricto. Validar con `local_codechecker`.
- **JS:** ESLint con `eslint:recommended` + `react/recommended`.
- **Bundle commiteado:** `amd/build/*.min.js` se commitea al repo (convención Moodle).
- **Producción:** **siempre `npm run build`** antes de commitear. El bundle de `dev` tiene source maps y pesa 4x más.
- **Compatibilidad:** Moodle 4.1 LTS – 4.5 LTS.

Detalle completo en [`investigacion/01-moodle/`](../investigacion/01-moodle/) y [`investigacion/06-frontend-react/`](../investigacion/06-frontend-react/).
