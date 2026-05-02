# 01 — Moodle

Investigación sobre desarrollo de plugins para Moodle 4.x, APIs internas, seguridad y compatibilidad.

## Archivos

- [plugin-development.md](plugin-development.md) — Tipos de plugin, por qué elegimos `local`, estructura de archivos.
- [hooks-y-apis.md](hooks-y-apis.md) — `before_footer()`, variables globales, `$DB`, file storage, web services REST.
- [seguridad-capabilities.md](seguridad-capabilities.md) — `require_login()`, `has_capability()`, Privacy API, mejores prácticas.
- [compatibilidad-4.1-4.5.md](compatibilidad-4.1-4.5.md) — Diferencias entre versiones, detección de branch, CI multi-versión.

## Objetivo

Fundamentar la arquitectura del plugin NexusAI dentro del ecosistema Moodle y garantizar compatibilidad con las versiones LTS que usan universidades argentinas (mayormente 4.1 LTS y 4.5 LTS).
