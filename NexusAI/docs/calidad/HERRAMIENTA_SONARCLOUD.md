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

_Pendiente: se completa con la corrida de este PR (links, números por componente y problemas encontrados)._

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

_Puntajes provisorios: se revisan con el resultado de la prueba de concepto._

## Paso 5 — Despliegue incremental

| Etapa | Qué hace el job `sonar` | Corrida |
|---|---|---|
| 1. Solo reporte | Analiza y publica en SonarQube Cloud; `continue-on-error: true`, no bloquea | _pendiente_ |
| 2. Bloqueante | Si el gate falla, el job falla | _pendiente_ |
| 3. Protección de rama | `development` exige el check para mergear | _pendiente_ |

## Mapa de herramientas del ecosistema

_Pendiente._
