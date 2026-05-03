# `plugin/` — Plugin Moodle (PHP + React bundled)

Este directorio contiene el plugin tipo `local` que se instala dentro de Moodle. La estructura `local/nexusai/` replica exactamente cómo se monta dentro de un Moodle real (`<moodle>/local/nexusai/`).

## Estructura

```
plugin/
└── local/nexusai/
    ├── version.php              # Metadatos del plugin (obligatorio)
    ├── lib.php                  # Callbacks: before_footer(), etc.
    ├── settings.php             # Settings administrativos
    ├── styles.css               # Estilos del widget
    ├── thirdpartylibs.xml       # Declaración de React, Webpack, etc.
    ├── db/
    │   ├── access.php           # Capabilities
    │   ├── services.php         # External functions (AJAX endpoints)
    │   ├── install.xml          # Esquema de tablas
    │   └── upgrade.php          # Migraciones entre versiones
    ├── classes/
    │   ├── external/            # Implementación de external functions
    │   └── privacy/             # Privacy API (GDPR / Ley 25.326)
    ├── lang/
    │   ├── en/local_nexusai.php
    │   └── es/local_nexusai.php
    ├── amd/
    │   ├── src/                 # Source AMD (entry point del bundle React)
    │   └── build/               # Bundle compilado por Webpack (commiteado)
    └── react/
        ├── src/                 # Source de React
        ├── package.json
        ├── webpack.config.js
        └── babel.config.json
```

## Cómo desarrollar acá

Ver [`investigacion/10-setup-entorno/docker-moodle.md`](../investigacion/10-setup-entorno/docker-moodle.md) para levantar Moodle en local y montar este plugin como `local/nexusai/`.

## Convenciones

- **PHP:** Moodle Coding Style estricto. Validar con `local_codechecker`.
- **JS:** ESLint con `eslint:recommended` + `react/recommended`.
- **Bundle commiteado:** `amd/build/chatwidget-lazy.min.js` se commitea al repo (convención Moodle).
- **Compatibilidad:** Moodle 4.1 LTS – 4.5 LTS.

Detalle completo en [`investigacion/01-moodle/`](../investigacion/01-moodle/) y [`investigacion/06-frontend-react/`](../investigacion/06-frontend-react/).
