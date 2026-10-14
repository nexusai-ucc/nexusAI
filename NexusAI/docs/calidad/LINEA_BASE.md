# Línea base de calidad (TPC-01)

> Medido el 14/10/2026 sobre el commit `3ec36fc` (rama `feature/573-tpc-01-medicion-base`, que parte de `development` @ `8ed496f`), PR [#587](https://github.com/nexusai-ucc/nexusAI/pull/587). Issue [#573](https://github.com/nexusai-ucc/nexusAI/issues/573), épica [#584](https://github.com/nexusai-ucc/nexusAI/issues/584).
>
> Todos los números salen del pipeline:
> - Backend: [run 38566523073](https://github.com/nexusai-ucc/nexusAI/actions/runs/38566523073), artifact `backend-coverage`
> - Frontend: [run 38566523194](https://github.com/nexusai-ucc/nexusAI/actions/runs/38566523194), artifact `frontend-coverage`
> - Plugin: [run 38566523153](https://github.com/nexusai-ucc/nexusAI/actions/runs/38566523153), job "Moodle MOODLE_503_STABLE / PHP 8.3 / pgsql"

## Cobertura

| Componente | Herramienta | Sentencias / líneas | Decisiones (branches) | Funciones / métodos |
|---|---|---|---|---|
| Backend (`services/api`) | pytest-cov (coverage.py 7.16) | **84,1 %** (3796/4512 líneas) | **72,8 %** (626/860) | — |
| Frontend (`react/src`) | Vitest + v8 | **40,0 %** (1257/3139 sentencias) · 41,9 % de líneas (1143/2728) | **34,9 %** (946/2710) | 37,9 % (384/1013) |
| Plugin PHP (`local_nexusai`) | PHPUnit + pcov | **41,8 %** (2372/5672 líneas) | no medido (*) | 35,3 % de métodos (145/411) · 8,7 % de clases (8/92) |
| **Total ponderado por líneas** | | **56,6 %** (7311/12912) | | |

(*) pcov solo mide líneas. Para tener la cobertura de decisión del plugin hace falta Xdebug (`--coverage-xdebug`, más lento) en la misma combinación de la matriz. Queda como mejora para TPC-02/TPC-05.

**Peores módulos del frontend** (para priorizar TPC-05):
- En 0 %: `documents/DocumentsManager.jsx`, `UploadZone.jsx`, `GapsPanel.jsx`, `HelpPanel.jsx`, `FaqDashboardPanel.jsx`, `StudentQuestionsPanel.jsx`, `csv.js`; `OnboardingApp.jsx`, `index.jsx`; `api/courseSections.js`, `api/history.js`, `api/voice.js`.
- Casi en 0: `components/ReviewPanel.jsx` (1 %), `components/QuizPanel.jsx` (6 %), `documents/api.js` (6 %).

## Pruebas

| Suite | Tests | Resultado | Notas |
|---|---|---|---|
| pytest (backend) | 534 | 529 pasan · 5 saltados · 0 fallan | contra Postgres + Redis reales en CI; corre en 23,8 s |
| Vitest (frontend) | 150 en 19 archivos | 150 pasan | |
| PHPUnit (plugin) | 181 · 658 aserciones | todas pasan | 67 deprecations de PHPUnit + 5 notices |
| Behat (plugin) | **0 escenarios** | — | no existe ningún `.feature`, y además el step tiene `continue-on-error: true` |

## Análisis estático

| Herramienta | Componente | Estado |
|---|---|---|
| ruff check + ruff format | backend | 0 hallazgos, y el CI falla si aparece alguno |
| mypy | backend | 0 errores (`--ignore-missing-imports`) |
| pip-audit / npm audit (high) | backend / frontend | sin vulnerabilidades altas ni críticas |
| phpcs (Moodle standard, `--max-warnings 0`), phpmd, phpdoc, grunt (`--max-lint-warnings 0`) | plugin | 0 warnings |
| Duplicación, complejidad, code smells | todos | **no se mide**: lo agrega TPC-02 (SonarCloud) |

## Pipeline

| Workflow | Duración de esta corrida | Jobs |
|---|---|---|
| Backend CI | 2 min 18 s | pip-audit, Ruff + mypy, PyTest, Docker build |
| Frontend CI | 42 s | Dependency scan + Vitest + build |
| Moodle Plugin CI | 5 min 25 s | 7 combinaciones Moodle/PHP/DB, en paralelo |

**Fallo real observado**: "Sync derived repos" falla en cada push a `development` desde el 14/10 a las 00:12 (`fatal: Authentication failed for .../moodle-local_nexusai.git`). Es candidato para la "ejecución fallida que detectó un problema real" (TPC-06).

## Comando único

`NexusAI/scripts/test-all.sh` corre las suites con cobertura: `backend`, `frontend` y `plugin` (esta última solo si `MOODLE_DOCKER_DIR` está seteada). Sale con ≠ 0 si alguna falla. Probado localmente: el backend pasa 527 tests (7 saltados sin Postgres), el frontend pasa 150 y, si una suite falla, el script sale con 1.

## Nivel a declarar — **decisión pendiente del equipo**

| Meta de cobertura sobre código existente | Total actual | Líneas a cubrir para llegar |
|---|---|---|
| Nivel 2: 60 % | 56,6 % | **+436 líneas** (7747/12912) |
| Nivel 3: 80 % | 56,6 % | **+3019 líneas** (10330/12912) |

- El backend ya supera el 80 %. Lo que baja el total son el frontend (40 %) y el plugin (42 %).
- **Opción A, declarar nivel 3.** Es lo que corresponde al estado real de la tesis (prototipo avanzado, roadmap al 96 %). La meta del 80 % no llega en 12 días y se reporta como **meta no cumplida** con su análisis, algo que el informe pide explícitamente. Igual hay que cumplir el resto del nivel 3: smoke y E2E de la integración externa en cada deploy.
- **Opción B, declarar nivel 2.** La meta del 60 % se alcanza con unas 436 líneas (por ejemplo, tests de `DocumentsManager`, `UploadZone` y `api.js` del frontend). El riesgo es que no refleja el estado real del proyecto.
- Conviene consultar al profe si se declara por etapa de la tesis o si se puede elegir el nivel.

Decisión: _pendiente_ (completar con fecha y quién decidió).
