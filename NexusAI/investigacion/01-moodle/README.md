# 01 — Moodle

Investigación sobre desarrollo de plugins para Moodle 4.x, APIs internas, seguridad y compatibilidad.

## Archivos

- [plugin-development.md](plugin-development.md) — Tipos de plugin, por qué elegimos `local`, estructura de archivos.
- [hooks-y-apis.md](hooks-y-apis.md) — `before_footer()`, variables globales, `$DB`, file storage, web services REST.
- [seguridad-capabilities.md](seguridad-capabilities.md) — `require_login()`, `has_capability()`, Privacy API, mejores prácticas.
- [compatibilidad-4.1-4.5.md](compatibilidad-4.1-4.5.md) — Diferencias entre versiones, detección de branch, CI multi-versión.
- [arquitectura-plugin-detallada.md](arquitectura-plugin-detallada.md) — XMLDB, capacidades RBAC, Mustache, clase PHP proxy completa, cron de sincronización de materiales.
- [nexusai-api-specs.md](nexusai-api-specs.md) — API de la plataforma Nexus AI (invoke, sessions, MCP tools, data ingestion).
- [webservices-teoria.md](webservices-teoria.md) — Arquitectura 3 capas, patrón 3 métodos, REST/SOAP, modelo de tokens, integraciones ERP/CRM, subsistema IA 4.5+.

## Objetivo

Fundamentar la arquitectura del plugin NexusAI dentro del ecosistema Moodle y garantizar compatibilidad con las versiones LTS que usan universidades argentinas (mayormente 4.1 LTS y 4.5 LTS).

---

*Última actualización: 2026-05-02 — Marcos Bugliotti*
