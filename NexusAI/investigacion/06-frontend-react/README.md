# 06 — Frontend React

Integración de React dentro de Moodle. Es el punto más delicado del frontend porque Moodle usa AMD/RequireJS, que no es compatible con el sistema de módulos de React.

## Archivos

- [integracion-moodle-amd.md](integracion-moodle-amd.md) — Compilar React como módulo AMD, `init()`, llamadas AJAX a Moodle.
- [webpack-config.md](webpack-config.md) — `webpack.config.js`, externals, sufijo `-lazy`, CSS Modules.

## Objetivo

Dejar resuelto el "cómo embeber React en Moodle sin romper CSP ni colisionar estilos con Boost" antes de que Delfi arranque el Sprint 1.
