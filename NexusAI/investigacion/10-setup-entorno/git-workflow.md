# Git workflow y convenciones

> **Resumen:** Usamos **trunk-based development con feature branches cortas**. Commits Conventional Commits, PRs obligatorios con 1 review, squash merge a `main`. Sprints de 2 semanas, tags de release por sprint.

---

## Contexto

El equipo es chico (3 personas). Queremos un workflow simple pero profesional, con trazabilidad para la defensa y buenas prácticas que se puedan defender ante el jurado de Admin de Proyectos.

## Estructura del repo

```
nexusAI/
├── plugin/                    # Plugin PHP + React (se copia como local/nexusai/ en Moodle)
│   ├── local/
│   │   └── nexusai/
├── backend/                   # FastAPI
├── investigacion/             # ← este directorio
├── docs/                      # Docs de usuario final (post-MVP)
├── .github/
│   ├── workflows/
│   │   ├── moodle-ci.yml
│   │   ├── backend-ci.yml
│   │   └── frontend-ci.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── README.md
└── LICENSE
```

## Branches

| Branch | Propósito |
|---|---|
| `main` | Siempre deployable. Tags de release. |
| `feature/<issue-id>-<descripcion>` | Desarrollo de una issue del GitHub Project. |
| `fix/<issue-id>-<descripcion>` | Bug fixes. |
| `docs/<descripcion>` | Cambios solo de documentación. |
| `chore/<descripcion>` | Tooling, CI, deps. |

Ejemplo: `feature/42-chat-widget-ui`.

## Conventional Commits

Todos los commits siguen [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <descripción corta>

[cuerpo opcional con más detalle]

[footer con referencias a issues]
```

### Types permitidos

- `feat` — feature nueva
- `fix` — bug fix
- `docs` — documentación
- `refactor` — cambio de código sin cambio funcional
- `test` — tests
- `chore` — tooling, CI, deps
- `perf` — mejora de performance

### Scopes típicos

- `plugin` — cambios en el plugin PHP
- `react` — cambios en React
- `backend` — cambios en FastAPI
- `rag` — cambios en el pipeline RAG
- `ci` — pipelines
- `investigacion` — docs de investigación

### Ejemplos

```
feat(react): agregar componente MessageList con scroll infinito

fix(backend): HMAC rechaza correctamente timestamps fuera de ventana

Closes #87

docs(investigacion): destilar guía técnica del PDF a markdown

refactor(rag): extraer build_prompt a módulo separado
```

## Pull Requests

### Reglas

1. Todo cambio a `main` pasa por PR. **Sin push directo.**
2. 1 review mínimo antes de merge (otro miembro del equipo).
3. CI en verde obligatorio.
4. Squash merge (historia limpia en `main`).
5. Borrar branch después del merge.

### Template de PR

`.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Qué cambia

Breve descripción del cambio.

## Por qué

Link al issue y/o contexto.

## Cómo probarlo

Pasos concretos para verificar.

## Checklist

- [ ] Tests nuevos / actualizados
- [ ] Docs actualizadas (si aplica)
- [ ] Sin warnings de lint
- [ ] Probé manualmente en Moodle Docker

Closes #<issue>
```

## Release flow

- Al final de cada sprint, tag `v0.<sprint>.0` en `main`.
- Ejemplo: fin de Sprint 1 → `v0.1.0`. MVP → `v1.0.0`.
- Changelog generado a partir de commits conventional (herramienta: `git-cliff` o similar).

## GitHub Issues y Projects

- **125 issues** organizadas en el [GitHub Project](https://github.com/users/delfisalinasmich/projects/5).
- **11 milestones** mapeados a sprints.
- Columnas: `Backlog → Ready → In Progress → Review → Done`.
- Labels: por épica (`epic-01` a `epic-07`), por tipo (`feat`, `fix`, `docs`), por prioridad (`p0`, `p1`, `p2`).

## Code review — qué mirar

| Área | Checklist |
|---|---|
| **PHP (plugin)** | Coding style Moodle, `has_capability`, Privacy API, no `$_GET/$_POST` directos, no `die()`. |
| **Python (backend)** | Ruff limpio, type hints, HMAC verify, manejo de errores, tests. |
| **React (frontend)** | No `console.log` en prod, hooks en orden correcto, CSS Modules, a11y básica. |
| **Todos** | Commits conventional, mensaje de PR claro, CI verde. |

## Estrategia de merge

**Squash and merge** hacia `main`:

- Cada PR = 1 commit en `main`.
- El mensaje del squash es el título del PR (conventional commit).
- Historia de `main` queda ultra limpia para auditoría del jurado.

El detalle se conserva en la historia del PR y en la branch antes de borrarla.

## CI — qué corre en cada PR

| Workflow | Trigger | Qué corre |
|---|---|---|
| `moodle-ci.yml` | Cambios en `plugin/` | phpcs, phpunit, behat contra Moodle 4.1 y 4.5 |
| `backend-ci.yml` | Cambios en `backend/` | ruff, mypy, pytest |
| `frontend-ci.yml` | Cambios en `plugin/local/nexusai/react/` | eslint, jest, webpack build |

## Mensajes tabú

Commits que rechazamos en review (y con husky cuando esté):

- `"fix"`, `"update"`, `"wip"` sin contexto
- Mensajes sin scope en commits de features
- PRs con >10 archivos que mezclan scopes (mejor separar)

## Decisiones tomadas para NexusAI

- **Trunk-based** con feature branches cortas (no GitFlow completo).
- **Conventional Commits** estricto.
- **1 review obligatorio** (no 2 — equipo de 3 personas).
- **Squash merge**.
- **Bundle del plugin commiteado** (`amd/build/*.min.js`).
- **Tags por sprint + MVP**.

## Abierto / pendiente

- [ ] Setear protección de branch en `main` (Settings → Branches).
- [ ] Husky + commitlint + lint-staged para validar conventional commits local.
- [ ] Changelog automatizado con git-cliff en post-MVP.
- [ ] Template de issue además del template de PR.

## Referencias

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Trunk-based development](https://trunkbaseddevelopment.com/)
- [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow)
- [git-cliff — changelog generator](https://git-cliff.org/)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
