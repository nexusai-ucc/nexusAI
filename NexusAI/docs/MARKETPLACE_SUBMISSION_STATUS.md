# Estado de la publicación en Moodle Marketplace

> Última actualización: 2026-09-17. Para compartir con el equipo — resume qué se validó, qué se hizo y qué falta antes de subir `nexusai.zip`.

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
- **`CHANGES.md` nuevo**: arranca en la versión actual (0.17.10, la de esta
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
  CI (`docker-publish.yml`) que publica el backend a
  `ghcr.io/nexusai-ucc/nexusai-backend` en cada push a `main`. Con eso +
  `docker-compose.selfhost.yml`, cualquiera levanta el backend con 2
  archivos, sin clonar el monorepo ni compilar nada.

## Pipeline de sync — estado actual

- ✅ Mergeado a `development` del monorepo (PR #495, 4 commits).
- ✅ Sincronizado a `development` de `moodle-local_nexusai` (automático).
- ⚠️ **`main` de `moodle-local_nexusai` todavía NO está promovido** — sigue
  mostrando el código viejo (solo el fix de MySQL, todavía en español). Esa
  rama es un snapshot manual a propósito (no se auto-sincroniza) y es lo
  que un reviewer va a ver como código fuente. Falta correr:
  ```
  gh api repos/nexusai-ucc/moodle-local_nexusai/git/refs/heads/main \
    -X PATCH -f sha=990b6db06660a5576fabe1e8dd0da913c0a9e44f -F force=true
  ```
  (ya verificado que es seguro — `main` no tiene contenido único que se
  vaya a perder).
- ⚠️ **Imagen de Docker todavía no publicada** — `docker-publish.yml` se
  dispara con push a `main` del monorepo (que sigue el ciclo
  `development → staging → main`), o se puede correr a mano ahora mismo
  desde la pestaña Actions de GitHub (tiene `workflow_dispatch`).
- ⚠️ **Paquete de GHCR nace privado** — después del primer run, alguien con
  admin del org (Santi) tiene que entrar a la config del paquete y
  marcarlo público, si no el `docker pull` de un reviewer externo da 403.

## Falta antes de subir el ZIP

1. Santi pasa las credenciales reales de producción → completar los
   placeholders de `docs/REVIEWER_TESTING.md`.
2. Promover `main` de `moodle-local_nexusai` (comando arriba).
3. Publicar la imagen de Docker + marcarla pública en GHCR.
4. **Decisión pendiente**: ¿sacamos `lang/es/` del ZIP inicial? La guía de
   Marketplace dice que la publicación inicial debe incluir solo strings en
   inglés, y que las traducciones se suben después vía AMOS (el sistema de
   traducción propio de Moodle). Hoy el plugin ya trae `lang/es/` completo
   — no es un error, pero técnicamente no debería ir en el ZIP inicial.
5. Rebuild del ZIP: `./scripts/package-plugin.sh --clean` desde la raíz del
   monorepo (necesita Node/npm para el bundle de React).
6. Completar el formulario de Marketplace: pegar las descripciones en
   inglés, el link al issue tracker
   (https://github.com/nexusai-ucc/moodle-local_nexusai/issues), y las
   notas para el reviewer de `docs/REVIEWER_TESTING.md`.

## ¿Roadmap público para el plugin?

Es un nice-to-have, no un requisito de Marketplace — no lo pide la guía en
ningún punto. Vale la pena si van a seguir agregando features después de
aprobado (da contexto a instituciones que evalúan adoptarlo y a
colaboradores externos), pero no bloquea la publicación. Se puede sumar
más adelante como una sección corta en el README o un `ROADMAP.md`, sin
apuro para esta entrega.
