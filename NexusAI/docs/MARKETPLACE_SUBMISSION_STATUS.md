# Estado de la publicación en Moodle Marketplace

> Última actualización: 2026-09-18. Para compartir con el equipo — resume qué se validó, qué se hizo y qué falta antes de subir `nexusai.zip`.

## Contexto

Se validó el repo del plugin (`moodle-local_nexusai`) contra las [Plugin
Submission Guidelines](https://moodle.org/plugins/) oficiales de Moodle
Marketplace. De 10 puntos revisados, 6 ya cumplían y se encontraron 4 gaps
reales. Este documento cubre el trabajo hecho sobre esos 4 gaps.

## Qué se hizo (PR #495, mergeada a `development`)

| # | Gap | Estado | Detalle |
|---|---|---|---|
| 1 | Descripciones del formulario en inglés | ✅ Listo para pegar | Texto corto y completo traducidos, quedan en el borrador de la publicación (no en el repo — van directo al formulario). |
| 2 | Comentarios de código en inglés | ✅ Hecho | 79 archivos PHP traducidos (mecánico, sin cambio de comportamiento). Verificado con `php -l` en todo el plugin. |
| 3 | CI solo probaba PostgreSQL | ✅ Hecho | Matriz de CI ahora corre Moodle 4.1/4.5 × PostgreSQL/MySQL — 4/4 combinaciones en verde. |
| 4 | Sin forma de que un reviewer testee contra el backend | ✅ Documentado, ⚠️ falta 1 dato | Ver sección "Reviewer testing" abajo. |

### Extra, no pedido por la guía pero encontrado en el camino

- **UI hardcodeada en español**: `admin.php`, `calendar_feed.php` y
  `document_download.php` tenían texto de error/UI directo en español en
  vez de vía `get_string()`. Se agregaron las claves a `lang/en/` y
  `lang/es/` y se corrigió.
- **README traducido + 2 links rotos arreglados**: el README (posible
  "Documentation URL" de la publicación) estaba 100% en español y tenía 2
  links relativos que solo funcionan dentro del monorepo, rotos en el repo
  público real.
- **`CHANGES.md` nuevo**: arranca en la versión actual (0.18.0, la de esta
  publicación), no reconstruye el historial completo del monorepo (mezcla
  cosas de backend/CI sin interés para un usuario del plugin).
- **Issue tracker**: ya estaba activo en `moodle-local_nexusai` (0 issues
  abiertas) — no hacía falta crear nada, solo referenciarlo.

## Reviewer testing (gap #4)

`docs/REVIEWER_TESTING.md` (nuevo) da dos caminos, pensado para pegar en el
campo de notas al reviewer del formulario:

- **Opción A — backend real de producción**: URL + API key + shared secret
  reales. Falta un solo dato: **las credenciales las tiene que pasar
  Santi** (solo él tiene acceso SSH a la VM de producción).
- **Opción B — self-host con imagen prearmada**: se agregó un workflow de
  CI (`docker-publish.yml`) que publica a
  `ghcr.io/nexusai-ucc/nexusai-backend` en cada push a `main`. Con eso +
  `docker-compose.selfhost.yml`, cualquiera levanta el backend con 2
  archivos, sin clonar ningún repo ni compilar nada.

  Vive en el repo separado **`nexusai-backend`**, no en el monorepo — mismo
  criterio que el ZIP del plugin: no tiene sentido que publicar una imagen
  para uso externo dependa del ciclo interno
  `development → staging → main` del monorepo (ese ciclo mueve las VMs
  reales de staging/prod, no es para esto). Publicar ahora depende solo de
  `nexusai-backend`, que tiene su propio ciclo igual de simple que
  `moodle-local_nexusai`.

## Pipeline de sync — estado actual

- ✅ Mergeado a `development` del monorepo (PR #495, 4 commits + fix de phpcs).
- ✅ Sincronizado a `development` de `moodle-local_nexusai` (automático).
- ✅ **PR #6 mergeada** — `main` de `moodle-local_nexusai` ya tiene todo,
  aprobada por Delfi y verificada con un clone fresco.
- 🟡 **Workflow de publish agregado a `nexusai-backend`** (vía overlay del
  monorepo) — falta que se sincronice a su `development` y se promueva a
  `main` (mismo paso que se hizo para el plugin). Recién ahí se puede
  correr (push a `main` o `workflow_dispatch`).
- ⚠️ **Paquete de GHCR nace privado** — una vez publicada la imagen,
  alguien con admin del org (Santi) tiene que entrar a la config del
  paquete y marcarlo público, si no el `docker pull` de un reviewer
  externo da 403.

## Decisión tomada: `lang/es/` se queda en el repo, no en el ZIP

La guía de Marketplace es explícita: "Only English strings should be
included in the plugin" (las traducciones se suben después vía AMOS).
`lang/es/` queda intacto en `moodle-local_nexusai` para uso local en
español, y `package-plugin-from-repo.sh` lo excluye solo al armar el ZIP.

## Madurez: beta

`version.php` pasó de `MATURITY_ALPHA` a `MATURITY_BETA` (release
`0.18.0`), como ya anticipaba `investigacion/01-moodle/publicacion-marketplace.md`.

## Cómo se arma el ZIP (nuevo)

`./scripts/package-plugin-from-repo.sh [rama]` — clona
`moodle-local_nexusai` (default: `main`) y empaqueta directo desde ahí, en
vez de usar el working tree local del monorepo. Es más fiel: garantiza que
el ZIP sea exactamente lo que cualquiera ve en el repo público (que es
justamente por lo que se separó el repo del monorepo). No necesita
Node/npm — el bundle de React ya viene commiteado en ese repo.

`./scripts/package-plugin.sh` (el anterior, arma desde el working tree
local) sigue existiendo para probar cambios locales antes de pushear.

## Falta antes de subir el ZIP

1. ~~Mergear el PR #6~~ — hecho.
2. Mergear la PR #496 (review de Delfi/Santi) — lleva el fix de `$_GET`, el
   bump a beta y el workflow de publish.
3. Promover `development → main` en `moodle-local_nexusai` (lleva el fix y
   el bump a beta) y en `nexusai-backend` (activa el workflow de publish).
4. Publicar la imagen de Docker + marcarla pública en GHCR (Santi).
5. Decidir producción vs staging para las credenciales del reviewer (ver
   nota de privacidad en `reviewer-simulation/HALLAZGOS.md`), y completar
   los placeholders de `docs/REVIEWER_TESTING.md`.
6. Rebuild del ZIP: `./scripts/package-plugin-from-repo.sh` desde la raíz
   del monorepo.
7. Completar el formulario de Marketplace
   (https://marketplace.moodle.com/plugins/submit/step1?type=free): pegar
   las descripciones en inglés, el link al issue tracker
   (https://github.com/nexusai-ucc/moodle-local_nexusai/issues), y las
   notas para el reviewer de `docs/REVIEWER_TESTING.md`.

## ¿Roadmap público para el plugin?

Es un nice-to-have, no un requisito de Marketplace — no lo pide la guía en
ningún punto. Vale la pena si van a seguir agregando features después de
aprobado (da contexto a instituciones que evalúan adoptarlo y a
colaboradores externos), pero no bloquea la publicación. Se puede sumar
más adelante como una sección corta en el README o un `ROADMAP.md`, sin
apuro para esta entrega.
