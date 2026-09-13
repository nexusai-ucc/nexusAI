# Publicación en el Moodle Plugins Directory

> **Resumen (3 líneas):** Por qué `local_nexusai` no puede registrarse en el directorio de Moodle tal como está distribuido hoy (monorepo), qué exige el proceso de submission, y el checklist de estado real a partir de PUB-01 (issue #309).

---

## Contexto

Estar listado en el Moodle Plugins Directory (Moodle Marketplace) no es solo visibilidad: muchas áreas de IT universitarias exigen que un plugin de terceros haya pasado por esa revisión antes de autorizar su instalación (ver `investigacion/09-relevamiento/requisitos-ucc.md`). Es el argumento institucional más común contra instalar algo "no oficial", y publicarlo se lo saca de encima.

PUB-01 (issue #309) resolvió la mayor parte de los requisitos de contenido. Este documento junta el resto: por qué falta separar el repo, cómo hacerlo sin perder historial, y el resto del checklist de envío.

## Contenido técnico

### Por qué el monorepo bloquea el envío

El formulario "Register a new plugin" de moodle.org no tiene campo de subcarpeta: recibe una URL de repositorio y asume que **la raíz del repositorio es la raíz del plugin**. La documentación oficial lo confirma explícitamente ("the root of the repository is the root of the plugin folder") sin mencionar monorepos — no está soportado.

Hoy `version.php` vive en:

```
nexusAI/NexusAI/plugin/local/nexusai/version.php
```

— cuatro carpetas bajo la raíz real del repo git, rodeado de `services/` (backend Python), `investigacion/`, `docs/`, `entrega-final/`, `pendrive/`, que no tienen nada que ver con el plugin. Cuando el validador de Moodle clona el repo y busca `version.php` en el nivel superior, no lo encuentra — rechazo automático, ni siquiera llega a un revisor humano.

Alternativas evaluadas para evitar mover código, y por qué ninguna sirve:

| Idea | Por qué no |
|---|---|
| Pasar la URL del monorepo tal cual | El validador busca en la raíz, no lo encuentra. |
| Campo "subcarpeta" en el formulario | No existe — confirmado en la documentación oficial. |
| Git submodule apuntando a la carpeta del plugin | El submodule igual necesita que el plugin ya sea su propio repo — no resuelve nada. |
| Copiar la carpeta a mano (`cp -r`) a un repo nuevo | Funciona, pero borra el historial de commits del plugin. |
| **`git subtree split`** a un repo nuevo | ✅ Extrae solo los commits que tocaron `plugin/local/nexusai/`, con su historial intacto. |

De paso resuelve otro requisito: el nombre de repo esperado por convención es `moodle-{tipo}_{nombre}` (`moodle-local_nexusai`), y un repo llamado `nexusAI` tampoco lo cumple aunque tuviera `version.php` en la raíz.

### El split, paso a paso

```bash
# 1. Split desde development (ahí está PUB-01: LICENSE, CI real, README)
git fetch origin development
git subtree split --prefix=NexusAI/plugin/local/nexusai --branch plugin-only origin/development

# Checkpoint: version.php, lib.php, classes/, db/, lang/ tienen que aparecer
# directo en la raíz, sin NexusAI/plugin/local/nexusai/ adelante.
git ls-tree plugin-only --name-only

# 2. Push a un repo NUEVO Y VACÍO creado antes en GitHub (nexusai-ucc/moodle-local_nexusai)
git push https://github.com/nexusai-ucc/moodle-local_nexusai.git plugin-only:main
git tag v0.17.9 plugin-only
git push https://github.com/nexusai-ucc/moodle-local_nexusai.git v0.17.9

# Checkpoint: clonar el repo nuevo APARTE (no el local) y confirmar
# que version.php está en la raíz desde afuera.
```

### Ajustar `moodle-ci.yml` en el repo nuevo

El workflow actual asume que el checkout deja el plugin en `NexusAI/plugin/local/nexusai/` (porque hoy vive ahí). En el repo separado esa carpeta no existe — es la raíz. Tres cambios puntuales:

```diff
   paths:
-      - 'NexusAI/plugin/local/nexusai/**'
-      - '!NexusAI/plugin/local/nexusai/react/**'
-      - '!NexusAI/plugin/local/nexusai/amd/build/**'
+      - '**'
+      - '!react/**'
+      - '!amd/build/**'
```

```diff
-          if [ ! -f NexusAI/plugin/local/nexusai/version.php ]; then
+          if [ ! -f version.php ]; then
```

```diff
-        run: moodle-plugin-ci install --plugin ./plugin/NexusAI/plugin/local/nexusai --db-host=127.0.0.1
+        run: moodle-plugin-ci install --plugin ./plugin --db-host=127.0.0.1
```

Ninguno de los demás pasos (`phplint`, `phpcs`, `phpdoc`, `validate`, `savepoints`, `mustache`, `phpunit`, `behat`) tiene paths hardcodeados — quedan igual.

### Checklist de envío — estado real al 10-sep-2026

| Requisito | Estado | Detalle |
|---|---|---|
| `version.php` completo | ✅ | component, version, release, requires, supported |
| Cabecera GPL v3+ / `@copyright` | ✅ | Solo 2 de 85 archivos PHP tienen el bloque completo — no bloquea, follow-up aparte |
| Strings `lang/en/` + `lang/es/` | ✅ | |
| Instala desde ZIP sin `composer`/`npm` | ✅ | Bundle AMD ya compilado; `react/` es solo fuente de dev |
| CI real (moodle-plugin-ci) | ✅ | Corría desde la carpeta equivocada y nunca se ejecutó — PUB-01 lo movió a la raíz real, corridas verdes confirmadas |
| `LICENSE` (dual: raíz MIT, plugin GPL v3) | ✅ | PUB-01 |
| Repo público con Issues habilitado | ✅ | `github.com/nexusai-ucc/nexusAI` |
| `thirdpartylibs.xml` (React/react-dom) | ✅ | PUB-01 |
| README del plugin como landing legible | ✅ | PUB-01 reescribió el que tenía un path hardcodeado de v0.2.1 |
| **Repo con el plugin en la raíz** | ❌ | Bloqueo real — ver split arriba |
| Capturas de pantalla | ❌ | No delegable — necesita Moodle vivo + browser |
| Ícono (256×256 PNG) | ❌ | No hay ninguno en el repo hoy |
| `MATURITY_ALPHA` → `MATURITY_BETA` | ⚠ ajustar | Con CI real, tests y uso en curso, alpha queda chico |
| Cuenta en moodle.org | ❌ | Paso manual |

### El formulario — "Register a new plugin"

| Campo | Valor |
|---|---|
| Plugin type | `Local plugin` |
| Frankenstyle component | `local_nexusai` |
| Repository URL | `https://github.com/nexusai-ucc/moodle-local_nexusai` |
| Bug tracker URL | `https://github.com/nexusai-ucc/nexusAI/issues` |
| Short/long description | En inglés (obligatorio; español se suma después vía AMOS) |
| License | GPL v3 or later |
| Screenshots / icon | Los de las fases anteriores |

### Qué pasa después de enviar

Cola de revisión manual pública (`moodle.org/plugins/queue.php`), un guardian de Moodle HQ chequea el registro, testea la funcionalidad y revisa el código. La documentación oficial solo compromete "algunas semanas" para la primera devolución. Que vuelva como **"Needs more work"** en la primera ronda es casi universal — no es una señal de rechazo, es el flujo estándar (`Upload initial version → Waiting for approval → Decide on approval → Needs more work → Upload fixed version → ...` hasta `Approved`). Aprobado, las strings de `lang/en/` se auto-registran en AMOS para traducción comunitaria. Cada versión nueva se publica a mano desde el directorio — no se sincroniza sola con los tags de GitHub.

## Decisiones tomadas para NexusAI

- El split se hace con `git subtree split`, no copia manual — conserva el historial de commits del plugin.
- El repo separado (`moodle-local_nexusai`) es la fuente que se registra en moodle.org; el monorepo (`nexusAI`) sigue siendo donde se desarrolla, y cada release relevante se re-splitea hacia el repo del Marketplace.
- Bump a `MATURITY_BETA` antes de enviar — `ALPHA` no representa el estado real del plugin (CI real, tests, HMAC auditado por ADR).

## Abierto / pendiente

- [ ] Ejecutar el subtree split y crear `nexusai-ucc/moodle-local_nexusai`.
- [ ] Ajustar `moodle-ci.yml` en el repo nuevo y confirmar corrida verde.
- [ ] Ícono 256×256 PNG (`pix/icon.png`).
- [ ] Capturas: chat con fuente citada, dashboard de Analytics, settings de admin.
- [ ] Bump `MATURITY_ALPHA` → `MATURITY_BETA` en `version.php`.
- [ ] Crear cuenta en moodle.org y completar el formulario.
- [ ] Pasada completa de cabecera de licencia en los 83 archivos PHP restantes (no bloqueante, follow-up de PUB-01).

## Referencias

- [Moodle Plugin validation](https://docs.moodle.org/dev/Plugin_validation)
- [Moodle Developer Resources — Plugin contribution](https://moodledev.io/general/community/plugincontribution)
- [Checklist de contribución](https://moodledev.io/general/community/plugincontribution/checklist)
- [Cola de revisión pública](https://moodle.org/plugins/queue.php)
- Repo NexusAI: commit PUB-01/VOICE-01 (#309, #314, mergeado 8-sep-2026); `.github/workflows/moodle-ci.yml`
- `investigacion/09-relevamiento/requisitos-ucc.md` — por qué "oficial" le importa a la aprobación de IT

---

*Última actualización: 2026-09-10 — Marcos Bugliotti*
