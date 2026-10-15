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

## Nivel declarado: **3 (prototipo avanzado)**

Al principio la idea era elegir entre el nivel 2 y el 3. El 15/10/2026 la cátedra aclaró por mail que **el nivel no se elige: lo define la etapa en que está la tesis**.

| Nivel | Etapa de la tesis |
|---|---|
| 1, inicial | Problema, requisitos y arquitectura definidos. Poco código funcionando; la integración con el sistema externo está en proceso. |
| 2, prototipo parcial | Algunas funcionalidades centrales implementadas y al menos una integración externa operativa (MVP). |
| 3, prototipo avanzado | La mayoría de las funcionalidades implementadas, el flujo principal funciona con las integraciones externas y el sistema se puede desplegar. |

NexusAI está en el **nivel 3**:
- el roadmap está casi completo;
- el flujo principal (chat con RAG sobre el material del curso) funciona contra Moodle y el proveedor de LLM;
- el sistema se despliega en Oracle (producción) y en Fly.

Para este nivel, las metas que dependen de la línea base son:

| Meta del nivel 3 | Hoy | Brecha | Subtarea |
|---|---|---|---|
| 80 % de cobertura sobre el código existente | 56,6 % | +3019 líneas (10330/12912) | TPC-05 |
| Smoke test automático después de cada despliegue | no existe | — | TPC-08 |
| Flujo E2E de la integración externa en cada despliegue | no existe | — | TPC-07, TPC-08 |

El backend ya supera el 80 %; la brecha está en el frontend (40 %) y en el plugin (42 %). Si para el 26/10 no se llega al 80 %, se reporta como **meta no cumplida, con su análisis**, como pide el informe.
