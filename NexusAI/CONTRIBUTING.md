# Contribuir a NexusAI

Por ahora el desarrollo está restringido al equipo del Proyecto Integrador. Este documento describe las convenciones que seguimos para mantener el repo prolijo y trazable, especialmente pensando en la defensa ante el jurado.

---

## Antes de empezar

1. Leé el [`README.md`](README.md) para entender el contexto.
2. Leé [`docs/architecture.md`](docs/architecture.md) para entender el "qué" y el "por qué".
3. Leé los ADRs en [`docs/adr/`](docs/adr/) para conocer las decisiones de arquitectura.
4. Si dudás de algo de la investigación previa, está en [`investigacion/`](investigacion/).

---

## Workflow de trabajo

Usamos **trunk-based development con feature branches cortas**. El detalle completo está en [`investigacion/10-setup-entorno/git-workflow.md`](investigacion/10-setup-entorno/git-workflow.md). Resumen:

### 1. Crear branch

Siempre desde `main` actualizado:

```bash
git checkout main
git pull origin main
git checkout -b feature/42-chat-widget-ui
```

**Nomenclatura de branches:**

| Tipo | Formato | Ejemplo |
|---|---|---|
| Feature | `feature/<issue-id>-<descripcion>` | `feature/42-chat-widget-ui` |
| Bug fix | `fix/<issue-id>-<descripcion>` | `fix/89-hmac-timestamp-edge-case` |
| Docs | `docs/<descripcion>` | `docs/actualizar-architecture` |
| Chore | `chore/<descripcion>` | `chore/upgrade-fastapi` |

### 2. Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <descripción corta>

[cuerpo opcional con más detalle]

[footer con referencias a issues]
```

**Types permitidos:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`.

**Scopes típicos:** `plugin`, `react`, `backend`, `rag`, `ci`, `investigacion`, `docs`.

**Ejemplos:**

```
feat(react): agregar componente MessageList con scroll infinito

fix(backend): HMAC rechaza correctamente timestamps fuera de ventana

Closes #87

docs(adr): agregar ADR-002 sobre elección de ChromaDB

refactor(rag): extraer build_prompt a módulo separado
```

### 3. Pull Request

1. Push de tu branch: `git push origin feature/42-chat-widget-ui`.
2. Abrir PR desde GitHub. Usar el [template de PR](.github/PULL_REQUEST_TEMPLATE.md) que se autocompleta.
3. Pedir review a otra persona del equipo.
4. Esperar CI verde.
5. Atender feedback.
6. **Squash merge a `main`** (opción del UI de GitHub).
7. Borrar la branch.

### Reglas firmes

- **Sin push directo a `main`.** Siempre PR.
- **Sin merge sin review.** Mínimo 1 review aprobada.
- **Sin merge con CI rojo.**
- **Squash merge** (no merge commit ni rebase merge).
- **Borrar branches viejas** después del merge.

---

## Estilo de código

### PHP (plugin Moodle)

Seguimos el [Moodle Coding Style](https://moodledev.io/general/development/policies/codingstyle):

- Indentación: **4 espacios**, nunca tabs.
- Variables en minúsculas (`$courseid`, no `$courseId`).
- Comillas simples para strings sin variables.
- Llaves siempre requeridas (incluso en `if` de una línea).
- Validar con `local_codechecker`.

**Reglas obligatorias específicas:**

- Nunca `$_GET` / `$_POST` directos. Usar `required_param($name, PARAM_INT)` u `optional_param()`.
- Nunca `die()` o `exit()`. Lanzar `moodle_exception`.
- Siempre `require_login()` y `require_capability()` al inicio de funciones que requieran auth.

### Python (backend)

- Formateado con [**Ruff**](https://docs.astral.sh/ruff/) (línea de 100 chars).
- Type hints obligatorios en funciones públicas.
- Docstrings en módulos y clases (Google style).
- Tests con PyTest.

```bash
ruff check services/api/
ruff format services/api/
mypy services/api/
pytest services/api/
```

### JavaScript / React (frontend)

- ESLint con `eslint:recommended` + `react/recommended`.
- React 18 (`createRoot`, no `ReactDOM.render`).
- CSS Modules (no estilos globales — colisionan con Boost de Moodle).
- Tests con Jest + React Testing Library.

```bash
cd plugin/local/nexusai
npm run lint
npm run test
```

---

## CI

Todo PR dispara 3 workflows en `.github/workflows/`:

- **`moodle-ci.yml`** — phpcs + phpunit + behat contra Moodle 4.1 y 4.5.
- **`backend-ci.yml`** — ruff + mypy + pytest.
- **`frontend-ci.yml`** — eslint + jest + webpack build.

Si el CI rompe, **arreglar antes de pedir review**.

---

## Documentación

- Los **cambios técnicos** que tomen una decisión nueva deben actualizar el doc correspondiente en [`investigacion/`](investigacion/) (sección "Decisiones tomadas para NexusAI").
- Los **cambios de arquitectura significativos** deben tener un nuevo ADR en [`docs/adr/`](docs/adr/).
- El **README** se actualiza cuando cambia algo que un nuevo dev tiene que saber al entrar al repo.

---

## Issues

- Toda issue va al [GitHub Project del proyecto](https://github.com/users/delfisalinasmich/projects/5).
- Labels: por épica (`epic-01` a `epic-07`), por tipo (`feat`, `fix`, `docs`), por prioridad (`p0`, `p1`, `p2`).
- Asignación obligatoria: cada issue en sprint activo tiene dueño.

---

## Code review — qué mirar

| Área | Checklist |
|---|---|
| **PHP** | Coding style Moodle, `has_capability`, Privacy API, sin `$_GET/$_POST` directos, sin `die()`. |
| **Python** | Ruff limpio, type hints, HMAC verify, manejo de errores, tests. |
| **React** | Sin `console.log` en prod, hooks en orden correcto, CSS Modules, a11y básica. |
| **Todos** | Commits conventional, mensaje de PR claro, CI verde, sin secretos hardcodeados. |

---

## Ayuda

Si te trabás:

- Mensaje en el grupo del equipo.
- Referencia rápida en [`investigacion/`](investigacion/).
- Si el problema es de Moodle puro: [Moodle Developer Resources](https://moodledev.io/).

---

*Última actualización: 2026-05-02 — equipo NexusAI*
