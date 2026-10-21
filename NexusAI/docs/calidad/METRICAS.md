# Métricas interpretadas y mejora medida (TPC-10)

> Issue [#582](https://github.com/nexusai-ucc/nexusAI/issues/582) · Épica [#584](https://github.com/nexusai-ucc/nexusAI/issues/584) · Versión 1.2, 21/10/2026

Este documento reúne las métricas de NexusAI al cierre del TP, las compara con el punto de partida e interpreta qué dicen. **Ningún número está escrito a mano**: cada uno sale de una corrida del pipeline, de la API de SonarCloud o de la API de GitHub, y la columna "Fuente" dice de cuál.

**Las dos fotos que se comparan:**

| | Antes | Después |
|---|---|---|
| Commit de `development` | `ded8b7b` (15/10/2026) | `40a97be` (20/10/2026) |
| Análisis de SonarCloud | [Quality Gate 38752218525](https://github.com/nexusai-ucc/nexusAI/actions/runs/38752218525) | [Quality Gate 39438622391](https://github.com/nexusai-ucc/nexusAI/actions/runs/39438622391) |
| Cobertura del pipeline | [LINEA_BASE.md](LINEA_BASE.md), CI de `3ec36fc` (14/10) | [PRINCIPIOS_TESTING.md](PRINCIPIOS_TESTING.md), [corrida 38819389914](https://github.com/nexusai-ucc/nexusAI/actions/runs/38819389914) (`ad7bba2`, 16/10) |

El historial completo está en la [actividad del proyecto en SonarCloud](https://sonarcloud.io/project/activity?id=nexusai-ucc_nexusAI&branch=development).

## 1. Métricas de producto

| Métrica | Antes | Después | Cambio | Fuente |
|---|---|---|---|---|
| Líneas de código (ncloc) | 35.990 | 36.093 | +0,3 % | Sonar |
| **Cobertura total del pipeline** (líneas ponderadas de los 3 componentes) | **56,6 %** | **83,6 %** | **+27,0 pp** | pipeline |
| Cobertura según Sonar (líneas + decisiones combinadas) | 51,9 % | 78,4 % | +26,5 pp | Sonar |
| Cobertura de líneas (Sonar) | 53,6 % | 80,3 % | +26,7 pp | Sonar |
| Cobertura de decisiones (Sonar) | 44,7 % | 70,4 % | +25,7 pp | Sonar |
| **Bugs** | **26** | **0** | −26 | Sonar |
| Confiabilidad | **D** | **A** | ↑ 3 niveles | Sonar |
| **Vulnerabilidades** | **14** | **0** | −14 | Sonar |
| Seguridad | **D** | **A** | ↑ 3 niveles | Sonar |
| Code smells | 831 | 797 | −34 | Sonar |
| Deuda técnica | 4.676 min | 4.600 min | −76 min | Sonar |
| Ratio de deuda / Mantenibilidad | 0,4 % / A | 0,4 % / A | = | Sonar |
| Duplicación | 2,5 % | 2,4 % | −0,1 pp | Sonar |
| Complejidad ciclomática | 4.882 | 4.893 | +11 | Sonar |
| Complejidad cognitiva | 3.612 | 3.619 | +7 | Sonar |
| Complejidad ciclomática cada 1.000 líneas | 135,6 | 135,6 | = | Sonar (cálculo) |

De las 14 vulnerabilidades, 13 se corrigieron en el código. La restante, `store_util::question_hash()` con `sha1` (`php:S4790`), se **revisó y se aceptó** en SonarCloud con su justificación: agrupa preguntas repetidas, no tiene ningún uso de seguridad, y cambiar el algoritmo rompería el agrupamiento de los hashes ya guardados en cada Moodle.

**Interpretación:**
- **Cobertura.** Es el cambio más grande y fue un objetivo explícito: el nivel 3 exige 80 % sobre el código existente. Sonar da unos puntos menos que el pipeline porque mezcla líneas y decisiones, y las decisiones son más difíciles de cubrir. Los dos miden lo mismo con distinta fórmula, y se movieron en paralelo (+27 pp contra +26,5 pp).
- **Bugs y vulnerabilidades.** No se habían movido entre el 15/10 y el 19/10, aunque en esos días se mergearon muchos PRs. El quality gate **solo mira el código nuevo**, así que no obliga a corregir lo heredado. Bajaron recién cuando se los atacó a propósito (§2.2). Es una limitación del gate que hay que conocer: mantiene la calidad, pero no la sube sola.
- **Code smells y deuda.** Bajaron un poco (−34 smells) como efecto lateral de los fixes. La mantenibilidad ya era A (ratio de deuda 0,4 %): no era el problema del proyecto.
- **Duplicación.** Está muy por debajo del 5 % del TP y del 3 % del gate en código nuevo. No hubo que trabajarla.
- **Complejidad.** Creció lo mismo que el código: por cada 1.000 líneas es idéntica antes y después. Los fixes no la empeoraron, pero tampoco se refactorizó.

## 2. Mejoras medidas antes/después

### 2.1 Cobertura: de 56,6 % a 83,6 % (TPC-01 → TPC-05)

| Componente | Antes | Después | Cómo |
|---|---|---|---|
| Backend (FastAPI) | 84,1 % sentencias | 84,2 % | ya estaba alto; se sumaron los casos de TPC-04 |
| Plugin Moodle (PHP) | 41,8 % líneas | **85,5 %** | tests de las *external functions* con `\curl::mock_response()` |
| Widget (React) | 40,0 % líneas | **78,9 %** | doble de prueba de `core/ajax` y tests de componentes |
| **Total ponderado** | **56,6 %** | **83,6 %** (10.812 / 12.931) | [corrida 38819389914](https://github.com/nexusai-ucc/nexusAI/actions/runs/38819389914) |

Efecto secundario medible: subir la cobertura del widget destapó **DEF-01**, un defecto real que ningún test cubría ([REGISTRO_DEFECTOS.md](REGISTRO_DEFECTOS.md)).

### 2.2 Confiabilidad de D a A: los hallazgos de SonarCloud (TPC-10, [#646](https://github.com/nexusai-ucc/nexusAI/pull/646))

Se corrigieron en el código **26 bugs y 13 de las 14 vulnerabilidades**, sin silenciar ninguno. Tres eran **bugs reales**:
- la indexación de documentos se lanzaba sin retener la tarea, así que Python podía cortarla a la mitad;
- había errores de red sin manejar en la barra de presupuesto y en el resumen de foro;
- un `assert` quedaba dentro de un `try` que lo ignoraba.

Cada cambio de comportamiento lleva su test. El PR pasó el gate con **83,1 % de cobertura del código nuevo y 0 issues nuevos**.

### 2.3 Capacidad bajo carga: de colapso a 40 usuarios a sin quiebre con 100 (TPC-09, [#644](https://github.com/nexusai-ucc/nexusAI/pull/644))

| | Antes de DEF-09 | Después |
|---|---|---|
| Chats OK en el stress | 68 % | 99,95 % |
| Pedidos/s con 100 usuarios | colapso (0,7) | 19,4 |
| p95 con 100 usuarios | 60 s | 2,55 s |
| Registros de consumo perdidos | 522 | 0 |

Detalle en [PRUEBAS_DE_CARGA.md](PRUEBAS_DE_CARGA.md) §2.2.

## 3. Métrica de proceso

### 3.1 Lead time de los PRs (de abierto a mergeado)

Fuente: `gh pr list --state merged --base development` (189 PRs desde el 24/07/2026).

| Período | PRs | Mediana | p90 | Media |
|---|---|---|---|---|
| Antes del TP (24/07 – 12/10) | 132 | 0,2 h | 39,9 h | 15,5 h |
| Durante el TP (13/10 – 20/10) | 57 | 0,5 h | 10,5 h | **3,3 h** |

**Interpretación.** La mediana casi no cambió y es muy baja en los dos períodos: la mayoría de los PRs se mergea enseguida. Lo que cambió es la **cola**. Antes, 1 de cada 10 PRs esperaba más de 40 h, y eso empujaba la media a 15,5 h. Durante el TP el p90 bajó a 10,5 h y la media a 3,3 h. Lo explican los PRs chicos y de un solo tema y que cada uno llegara con el CI y el gate ya en verde. El costo de esta métrica es que **no mide calidad de la revisión**: un lead time de minutos también puede indicar que se mergea sin mirar. Para el informe es un dato de flujo, no de calidad.

### 3.2 Tasa de fallos del pipeline en `development`

Fuente: `gh run list --branch development --event push`. En `development`, por push, solo corren la sincronización de repos derivados, el Quality Gate y la integración externa; el resto del CI corre en los PRs.

| Período | Corridas | Fallidas | Tasa | Detalle de las fallas |
|---|---|---|---|---|
| 13/09 – 12/10 | 41 | 4 | 9,8 % | Sync derived repos |
| 13/10 – 20/10 | 76 | 14 | 18,4 % | 13 de Sync derived repos · 1 de Integración externa |

**Interpretación.** La tasa subió, y las 14 fallas son **problemas reales, no ruido**:
- **13 fallas de "Sync derived repos"** el 14/10, por un token vencido ([DEF-05](REGISTRO_DEFECTOS.md#def-05)). Fue la "ejecución fallida que detectó un problema real" del TP: sin el pipeline, los repos derivados se habrían quedado desactualizados sin aviso.
- **1 falla de "Integración externa"** ([corrida 39260816477](https://github.com/nexusai-ucc/nexusAI/actions/runs/39260816477)): Gemini tardó **112,8 s** en contestar una sola pregunta (el SLA es de 8 s). Es la misma variabilidad del plan gratis que ya se había visto ([INTEGRACION_EXTERNA.md](INTEGRACION_EXTERNA.md) §5). El test hizo su trabajo: el proveedor gratuito no es confiable en latencia.
- El **Quality Gate no falló ninguna vez** en `development` (18 de 18): todo lo que llegó ya había pasado el gate en su PR.

Que la tasa suba no es una mala señal en sí: en el período del TP el pipeline encontró más problemas porque prueba más cosas. Para que la métrica sirva hay que leerla con el detalle de las causas, no sola.

**Hallazgo de proceso.** La corrida diaria de la integración externa (`schedule` en `integration-external.yml`) **no se ejecutó nunca**: GitHub solo corre los `schedule` desde la rama por defecto (`main`), y el workflow todavía está en `development`. Va a empezar a correr cuando el código llegue a `main` en la próxima versión. Hasta entonces, la integración real se prueba con cada push que toca los proveedores y a mano.

## 4. Métrica de proyecto: avance de la épica y velocidad

Fuente: issues #573–#583 (story points y fechas del plan en cada issue; cierre según GitHub).

| | Valor |
|---|---|
| Story points de la épica | 35 (11 subtareas) |
| Hechos al 20/10 | **30 SP (86 %)**: 9 de 11 subtareas |
| Velocidad real | 30 SP en 8 días (13/10 → 20/10) = **3,75 SP/día** |
| Velocidad planificada | 35 SP en 14 días (13/10 → 26/10) = 2,5 SP/día |
| Subtareas cerradas antes de su fecha planificada | 7 de 9; las otras 2, en fecha |

| Subtarea | SP | Fin planificado | Cerrada | Diferencia |
|---|---|---|---|---|
| TPC-01 Línea base | 2 | 14/10 | 14/10 | 0 |
| TPC-02 SonarCloud | 3 | 16/10 | 15/10 | −1 día |
| TPC-03 Plan de pruebas | 3 | 17/10 | 14/10 | −3 días |
| TPC-04 Casos y trazabilidad | 3 | 19/10 | 19/10 | 0 |
| TPC-05 Unitarias y cobertura | 5 | 20/10 | 15/10 | −5 días |
| TPC-06 Registro de defectos | 2 | 20/10 | 16/10 | −4 días |
| TPC-07 Integración externa | 3 | 20/10 | 19/10 | −1 día |
| TPC-08 CD + smoke | 3 | 21/10 | 19/10 | −2 días |
| TPC-09 Stress | 3 | 22/10 | 20/10 | −2 días |
| TPC-10 Métricas | 2 | 23/10 | — | en curso |
| TPC-11 Informe y demo | 3 | 26/10 | — | pendiente |

**Interpretación.** El proyecto va adelantado: al ritmo real, los 5 SP restantes entran en unos 2 días, con margen hasta el 26/10. Hay que leer este número con cuidado: los story points los estimamos nosotros mismos al armar la épica, así que la "velocidad" mide lo bien que estimamos tanto como lo rápido que trabajamos. Las subtareas que se cerraron mucho antes (TPC-03, 05 y 06) estaban sobreestimadas. Las que llegaron justas (TPC-04, 09) tuvieron trabajo no previsto: las tablas de decisión y DEF-09.

## 5. Efectividad de las pruebas: defectos por técnica

Fuente: [REGISTRO_DEFECTOS.md](REGISTRO_DEFECTOS.md). DEF-10 se sumó el 21/10.

| Técnica o fuente | Defectos | Cuáles |
|---|---|---|
| Tests unitarios / de componentes | 1 | DEF-01 |
| PHPUnit (primera corrida) | 1 | DEF-03 |
| Pipeline (ejecuciones fallidas y auditorías de dependencias) | 3 | DEF-05, DEF-06, DEF-10 |
| Prueba contra el proveedor real | 1 | DEF-07 |
| Caja negra (tabla de decisión) | 1 | DEF-08 |
| Prueba de stress | 1 | DEF-09 |
| Fuera de las pruebas (uso real, auditoría) | 2 | DEF-02, DEF-04 |
| **Total** | **10** | 8 por pruebas o el pipeline, 2 por otras vías |

**Interpretación.** Ninguna técnica sola habría encontrado todo. Cada nivel encontró lo suyo:
- la integración real encontró lo que los dobles no podían mostrar;
- la caja negra encontró una rama que nunca se había ejecutado;
- el stress encontró lo que solo aparece con concurrencia.

Es el principio de "las pruebas exhaustivas son imposibles", llevado a la práctica: lo que funciona es **combinar** técnicas ([PRINCIPIOS_TESTING.md](PRINCIPIOS_TESTING.md)).

## 6. Lo que no se mejoró, y por qué

| Qué | Estado | Por qué |
|---|---|---|
| 797 code smells | Sin trabajar | Mantenibilidad A y ratio de deuda de 0,4 %. Con el tiempo del TP, priorizamos bugs y vulnerabilidades, que afectan el comportamiento |
| Complejidad | Igual por cada 1.000 líneas | No se refactorizó. Las funciones más complejas (los routers de chat y quiz) tienen ahora tests de caja negra y 100 % de decisión en lo que se tocó (TPC-04), lo que hace segura una refactorización futura |
| Regla `php:S6600` | Desactivada para el PHP del plugin | Contradice el estándar de Moodle, que exige `require_once(...)` con paréntesis: se comprobó que sin paréntesis falla el phpcs del CI en las 7 combinaciones ([HERRAMIENTA_SONARCLOUD.md](HERRAMIENTA_SONARCLOUD.md)) |

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 20/10/2026 | Métricas de producto antes/después, tres mejoras medidas, lead time, tasa de fallos, avance de la épica y defectos por técnica |
| 1.1 | 20/10/2026 | Seguridad D → A: el `sha1` se revisó y se aceptó en SonarCloud (0 vulnerabilidades) |
| 1.2 | 21/10/2026 | DEF-10 en la tabla de defectos por técnica |
