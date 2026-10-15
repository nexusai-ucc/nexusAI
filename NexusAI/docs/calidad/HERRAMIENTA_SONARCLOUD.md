# Herramienta incorporada: SonarQube Cloud (TPC-02)

> Issue [#574](https://github.com/nexusai-ucc/nexusAI/issues/574) · Épica [#584](https://github.com/nexusai-ucc/nexusAI/issues/584) · PR [#601](https://github.com/nexusai-ucc/nexusAI/pull/601)
> Proyecto: [sonarcloud.io/project/overview?id=nexusai-ucc_nexusAI](https://sonarcloud.io/project/overview?id=nexusai-ucc_nexusAI)

El TP pide incorporar al pipeline una herramienta que el equipo no usaba, siguiendo un proceso de 5 pasos. Elegimos **SonarQube Cloud** (antes SonarCloud) para cubrir lo que faltaba en la línea base ([LINEA_BASE.md](LINEA_BASE.md)): duplicación, complejidad, code smells y, sobre todo, un **quality gate** que bloquee el merge.

## Paso 1 — Requisitos

| # | Requisito | Por qué | Tipo |
|---|---|---|---|
| R1 | Analizar Python, PHP y JavaScript/JSX en un solo lugar | NexusAI tiene tres componentes (backend FastAPI, plugin Moodle, widget React) | obligatorio |
| R2 | Importar la cobertura que ya generan pytest-cov, Vitest y PHPUnit | La cobertura del TP sale del pipeline, no de la herramienta | obligatorio |
| R3 | Quality gate sobre **código nuevo** con las 3 condiciones del TP (bugs críticos, duplicación > 5 %, cobertura < 80 %) | Es la meta fija para todos los niveles | obligatorio |
| R4 | Resultado visible en el PR (check de GitHub) y capaz de fallar el pipeline | Para que bloquee el merge | obligatorio |
| R5 | Gratis para el equipo | Proyecto académico, sin presupuesto | obligatorio |
| R6 | Corre desde GitHub Actions, sin servidor propio | No hay infraestructura para mantener otra herramienta | deseable |
| R7 | Métricas de mantenibilidad (complejidad, deuda técnica) para TPC-10 | El TP pide métricas interpretadas y una mejora antes/después | deseable |

## Paso 2 — Opciones del mercado

| Herramienta | Qué es | Lenguajes del proyecto | Cobertura importada | Gate en PR | Costo para repo público |
|---|---|---|---|---|---|
| **SonarQube Cloud** | Análisis estático SaaS de SonarSource | Python, PHP, JS/JSX, CSS | sí (coverage.py XML, lcov, clover) | sí, check de GitHub + `qualitygate.wait` | gratis (plan "SonarQube for OSS") |
| SonarQube Server Community | Mismo motor, autoalojado | los mismos | sí | sin análisis de ramas/PR en Community | gratis, pero hay que hospedarlo |
| Codacy | Agregador SaaS de linters | sí | sí | sí | gratis para open source |
| DeepSource | Análisis estático SaaS | Python y JS; PHP limitado | sí | sí | gratis para open source |
| Qlty (ex Code Climate Quality) | Mantenibilidad + cobertura | sí | sí | sí | plan gratis limitado |
| Codecov | Solo cobertura | — | sí | sí (cobertura del diff) | gratis para open source |
| diff-cover + jscpd en el CI | Scripts dentro del pipeline | los tres | sí | falla el job | gratis |

## Paso 3 — Prueba de concepto

**Alta (15/10/2026).**
- Se creó la organización `nexusai-ucc` en SonarQube Cloud con el plan **SonarQube for OSS**: gratis porque el repo es público, sin tarjeta y sin vencimiento.
- La GitHub App se instaló solo en el repo `nexusAI`.
- Se creó el proyecto `nexusai-ucc_nexusAI` y el token quedó como secret `SONAR_TOKEN`.

**Primer análisis, automático.** Sonar arrancó solo con "Automatic Analysis" sobre `main` (commit `432357cb`). Dio 60.384 líneas, rating D en fiabilidad y en seguridad, y 4,5 % de duplicación. Ese análisis mostró dos problemas:
- **No importa cobertura.** Analiza el código, pero no corre los tests.
- **El alcance era incorrecto.** Incluía presentaciones HTML, las copias de `pendrive/` y `entrega-final/`, los tests contados como código y los workflows de `.github/`. Por ejemplo, 42 de las 68 vulnerabilidades eran de la configuración del CI, sobre todo actions sin fijar por hash e instalaciones sin lockfile.

Con eso se apagó Automatic Analysis y se pasó a un análisis desde GitHub Actions, con el alcance definido en `sonar-project.properties`.

**Análisis desde el CI** ([run 38745439275](https://github.com/nexusai-ucc/nexusAI/actions/runs/38745439275)):
- Sonar detectó el PR #601 y lo analizó **contra `development`**. El plan gratis sí analiza PRs contra ramas que no son la principal, así que el plan B (diff-cover + jscpd) no hace falta.
- Se importaron los tres reportes: `coverage.xml` de pytest-cov, `lcov.info` de Vitest y el clover de PHPUnit.
- **Cobertura de líneas en Sonar: 56,5 %**, frente al 56,6 % de [LINEA_BASE.md](LINEA_BASE.md). La pequeña diferencia sale de los archivos declarativos que se excluyen de la cobertura. Cobertura de decisiones: 44,7 %.
- Duplicación dentro del alcance correcto: **2,5 %**.

**Problemas encontrados y cómo se resolvieron:**

| Problema | Solución |
|---|---|
| El clover de PHPUnit trae las rutas de la copia del plugin dentro de Moodle (`moodle/public/local/nexusai/…`) | `sed` en el job `plugin-coverage` que las reescribe a `NexusAI/plugin/local/nexusai/…` |
| Vitest escribe `SF:src/…`, relativo a `react/` | `sed` en el job `sonar` que antepone la ruta desde la raíz |
| El reporte xunit de pytest nombra los tests como `tests.test_x`, que no resuelve desde la raíz | se quitó: no aporta al gate |
| `amd/src/*-lazy.js` son bundles generados por webpack | excluidos, porque si no duplicarían todo el widget |

**El gate bloquea de verdad** (PR [#602](https://github.com/nexusai-ucc/nexusAI/pull/602), [run 38746618928](https://github.com/nexusai-ucc/nexusAI/actions/runs/38746618928), no se mergea). Se agregó `app/shared/gate_demo.py`, con 2 funciones idénticas y sin tests:

| Condición (código nuevo) | Umbral | Valor | Resultado |
|---|---|---|---|
| Cobertura | ≥ 80 % | 0,0 % | ❌ |
| Líneas duplicadas | ≤ 3 % | 72,3 % | ❌ |
| Rating de fiabilidad (bugs) | A | A | ✅ |
| Rating de seguridad | A | A | ✅ |
| Rating de mantenibilidad | A | A | ✅ |
| Security hotspots revisados | 100 % | 100 % | ✅ |

**Resultado: `ERROR`.** El job `SonarQube Cloud` falla y Sonar también marca el check "SonarCloud Code Analysis" en rojo en el PR.

### Gate usado: "Sonar way" contra las condiciones del TP

| Condición del TP | Sonar way | ¿Lo cubre? |
|---|---|---|
| Bloquear bugs críticos | Rating de fiabilidad A en código nuevo: bloquea **cualquier** bug, no solo los críticos | sí, y es más estricto |
| Duplicación > 5 % | Duplicación en código nuevo > **3 %** | sí, y es más estricto |
| Cobertura de código nuevo < 80 % | Cobertura en código nuevo < 80 % | sí, igual |

Sonar ignora las condiciones de cobertura y duplicación en cambios de **menos de 20 líneas nuevas**. Lo hace para evitar falsos rechazos: por ejemplo, 1 línea sin test en un PR de 2 líneas daría 50 % de cobertura.

## Paso 4 — Matriz de decisión

Puntaje de 1 (malo) a 5 (muy bueno), ponderado por la importancia de cada requisito.

| Criterio | Peso | SonarQube Cloud | Codacy | DeepSource | Codecov | diff-cover + jscpd |
|---|---|---|---|---|---|---|
| R1 · Tres lenguajes | 20 % | 5 | 4 | 3 | 1 | 4 |
| R2 · Cobertura importada | 15 % | 5 | 4 | 4 | 5 | 4 |
| R3 · Gate con las 3 condiciones del TP | 25 % | 5 | 4 | 3 | 2 | 3 |
| R4 · Resultado en el PR | 15 % | 5 | 5 | 5 | 5 | 3 |
| R5 + R6 · Gratis y sin servidor | 10 % | 5 | 5 | 5 | 5 | 5 |
| R7 · Métricas de mantenibilidad | 15 % | 5 | 4 | 4 | 1 | 1 |
| **Total ponderado** | 100 % | **5,00** | **4,25** | **3,80** | **2,85** | **3,25** |

La prueba de concepto confirmó los puntajes de SonarQube Cloud en R1–R4: tres lenguajes, cobertura importada, gate sobre código nuevo y resultado visible en el PR.

## Paso 5 — Despliegue incremental

| Etapa | Qué hace el job `sonar` | Corrida |
|---|---|---|
| 1. Solo reporte | Analiza y publica en SonarQube Cloud; `continue-on-error: true`, no bloquea | [run 38745439275](https://github.com/nexusai-ucc/nexusAI/actions/runs/38745439275) (commit `8a843cb`) |
| 2. Bloqueante | Si el gate falla, el job falla | verde: [run 38746575568](https://github.com/nexusai-ucc/nexusAI/actions/runs/38746575568) · rojo: [run 38746618928](https://github.com/nexusai-ucc/nexusAI/actions/runs/38746618928) |
| 3. Protección de rama | `development` exige el check para mergear | _pendiente_ |

## Mapa de herramientas del ecosistema

Las herramientas de calidad que corre NexusAI y dónde entra SonarQube Cloud.

| Actividad | Backend (Python) | Plugin (PHP / Moodle) | Widget (React) | Dónde corre |
|---|---|---|---|---|
| Pruebas unitarias y de integración | pytest + pytest-asyncio, contra Postgres/pgvector y Redis reales | PHPUnit (moodle-plugin-ci) | Vitest + Testing Library (jsdom) | backend-ci, moodle-ci, frontend-ci |
| Pruebas de aceptación / E2E | — | Behat (configurado, **0 escenarios**) | — | moodle-ci |
| Cobertura (sentencia y decisión) | pytest-cov (`--cov-branch`) | pcov (solo líneas) | v8 | los tres CI + quality-gate |
| Estilo y lint | ruff check / ruff format | phpcs (Moodle standard), phplint, ESLint en `amd/src`, Mustache lint | — | backend-ci, moodle-ci |
| Tipos y errores estáticos | mypy | phpmd, phpdoc | — | backend-ci, moodle-ci |
| Dependencias vulnerables | pip-audit | — | npm audit (high) | backend-ci, frontend-ci |
| Compatibilidad | — | matriz de 7 combinaciones Moodle 4.5–5.3 / PHP 8.1–8.4 / PostgreSQL y MySQL | build de webpack + tamaño del bundle | moodle-ci, frontend-ci |
| **Análisis estático integral, duplicación, deuda técnica y quality gate** | **SonarQube Cloud** | **SonarQube Cloud** | **SonarQube Cloud** | **quality-gate** (nuevo) |
| Gestión de trabajo y defectos | GitHub Issues + Project #5 (épicas, sprints, labels) | ← | ← | GitHub |

Antes de TPC-02 no había nada en la fila de SonarQube Cloud: cada componente tenía sus linters, pero nadie medía duplicación ni complejidad, y ningún check bloqueaba el merge por la calidad del código nuevo.
