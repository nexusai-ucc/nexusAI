<!--
PR Template — NexusAI
Borrá esta línea y completá las secciones de abajo.
Eliminá las secciones que no apliquen.
-->

## Qué cambia

<!-- Una o dos frases describiendo qué hace este PR. -->

## Por qué

<!--
Contexto / motivación. Linkear al issue que resuelve.
Si toca una decisión de arquitectura, linkear al ADR correspondiente.
-->

Closes #

## Cómo probarlo

<!--
Pasos concretos para verificar que funciona.
Idealmente: comandos a copy-paste, URLs a visitar, datos de prueba.
-->

1.
2.
3.

## Tipo de cambio

<!-- Marcá lo que aplique con [x] -->

- [ ] `feat` — feature nueva
- [ ] `fix` — bug fix
- [ ] `docs` — solo cambios de documentación
- [ ] `refactor` — cambio de código sin cambio funcional
- [ ] `test` — agregado o modificación de tests
- [ ] `chore` — tooling, CI, deps, configuración
- [ ] `perf` — mejora de performance

## Área afectada

- [ ] `plugin` (PHP / Moodle)
- [ ] `react` (frontend embebido en plugin)
- [ ] `backend` (FastAPI / Python)
- [ ] `rag` (pipeline RAG)
- [ ] `ci` (workflows GitHub Actions)
- [ ] `docs` o `investigacion`

## Checklist

- [ ] El título del PR sigue [Conventional Commits](https://www.conventionalcommits.org/) (ej: `feat(react): agregar componente MessageList`)
- [ ] CI en verde (3 workflows: moodle, backend, frontend)
- [ ] Tests nuevos o actualizados (cuando aplica)
- [ ] Documentación actualizada (cuando aplica — `docs/architecture.md`, ADR, `investigacion/`)
- [ ] Sin `console.log` / `var_dump` / `print` de debug
- [ ] Sin secretos hardcodeados (API keys, passwords, tokens)
- [ ] Probé manualmente en Moodle Docker local
- [ ] Si toca el bundle React, lo regeneré (`npm run build`) y lo commiteé
- [ ] Si introduce una decisión de arquitectura nueva, agregué un ADR en `docs/adr/`

## Screenshots / GIFs

<!-- Si el cambio es visual (UI), agregá una captura o GIF. Borrá si no aplica. -->

## Notas para el reviewer

<!-- Cualquier cosa que el reviewer deba saber: trade-offs aceptados, deuda técnica creada conscientemente, etc. -->
