# Estimaciones

## Metodología

El equipo estimó cada historia del backlog usando **planning poker** con
escala Fibonacci (1, 2, 3, 5, 8 story points). La escala se interpreta de
la siguiente manera:

| SP | Interpretación |
|---|---|
| 1 | Trivial. Menos de 1 hora-persona. Ejemplo: cambiar un texto, agregar una validación simple. |
| 2 | Pequeño. 1-3 horas-persona. Ejemplo: agregar un endpoint trivial sin lógica nueva. |
| 3 | Medio. 3-8 horas-persona. Ejemplo: implementar un componente React con estado y API. |
| 5 | Grande. 1-2 días-persona. Ejemplo: implementar una External Function PHP nueva con HMAC. |
| 8 | Muy grande. 2-4 días-persona. Implica refactor o investigación previa. Ejemplo: pipeline RAG completo. |

Cualquier historia que se estimara con más de 8 SP se dividía en
sub-historias para mantener visibilidad y predictibilidad.

## Story points por épica

| Épica | SP totales | % del MVP |
|---|---|---|
| Investigación inicial | 38 | 13% |
| Setup del entorno | 22 | 8% |
| Backend Python (FastAPI + RAG) | 85 | 29% |
| Plugin Moodle (PHP) | 40 | 14% |
| Frontend React (bundle AMD) | 26 | 9% |
| Features Sprint 4 (A-G) | 70 | 24% |
| Gestión Scrum (sprint planning, reviews, retros, dailies) | 10 | 3% |
| **Total MVP** | **291** | **100%** |

## Story points por sprint

| Sprint | SP planificados | SP completados | Velocity |
|---|---|---|---|
| Sprint 0 — Setup e Investigación | 60 | 60 | 100% |
| Sprint 1 — Core chat | 50 | 45 | 90% |
| Sprint 2 — RAG y carga de material | 60 | 55 | 92% |
| Sprint 3 — Calidad y métricas | 25 | 25 | 100% |
| Sprint 4 — MVP completo | 70 | 70 | 100% |
| **Total MVP** | **265** | **255** | **96%** |

## Conversión SP → horas-persona

La conversión teórica usada para estimación de costos (capítulo 9) y para
asegurar viabilidad del cronograma:

$$ \text{SP} \times 4\,\text{horas/persona} = \text{tiempo estimado} $$

Esta conversión es aproximada — un SP medio (3) representa
aproximadamente media jornada de trabajo de una persona del equipo. La
métrica se calibró en el Sprint 1 cuando se midió el tiempo real
dedicado vs los SP completados.

Aplicando la conversión al total de 255 SP completados:

$$ 255 \times 4 = 1020\,\text{horas-persona} $$

Distribuidos entre 2 personas → **~510 horas por integrante** a lo largo
de las ~10 semanas de desarrollo activo del MVP. Equivale a ~50
horas-persona-semana, lo que es razonable para un proyecto académico de
tiempo parcial (el equipo combina el proyecto con otras materias y, en
algunos casos, con trabajo profesional part-time).

## Estimaciones por integrante

Distribución aproximada de SP por persona del equipo durante el desarrollo
del MVP:

| Integrante | SP completados | Áreas principales |
|---|---|---|
| Santiago Tricherri | ~140 | PM, backend FastAPI, integración LLM, deploy, HMAC, multi-provider |
| Delfina Salinas | ~115 | SM, frontend React, prompt engineering, retrieval, gaps detection, documentación |

La distribución no es estrictamente paritaria por rol: cada integrante
tomó más peso en su área de especialización (Santiago en backend / infra,
Delfina en frontend / UX / RAG / prompt engineering), pero ambos
colaboraron en pair programming en componentes críticos (HMAC, pipeline
RAG, features de Sprint 4).

## Carry-over y deuda técnica

Al cierre del MVP quedaron **10 story points sin completar** que se
relegaron como deuda técnica:

| Item | SP | Motivo del carry-over |
|---|---|---|
| Tests automatizados del frontend (Vitest + RTL) | 5 | Tiempo limitado, validación manual cubre el MVP |
| Tests Behat del plugin PHP | 3 | Configurar Behat en CI requiere setup adicional |
| Refactor de naming en componentes React legacy | 2 | Cosmético, no afecta funcionalidad |

Estos ítems están priorizados para post-MVP en el primer ciclo de
estabilización (junio-julio 2026).

## Comparación con estimación inicial

La estimación inicial (presentada en el Anteproyecto de abril 2026)
proyectaba **240 SP para el MVP**. La realidad fue **265 SP planificados
+ 25 SP de re-estimación durante el proyecto** (Features A-G del Sprint 4
no estaban completamente desglosadas al inicio).

| Métrica | Estimación inicial | Real |
|---|---|---|
| SP del MVP | 240 | 291 (255 completados + 36 re-estimados) |
| Sprints planificados | 4 | 5 (con Sprint 0 de investigación más largo) |
| Duración total | 8 semanas | 10 semanas |
| Equipo | 3 personas | 2 personas (50% menos staff que lo planificado) |

La reducción del equipo de 3 a 2 personas a mitad del proyecto fue el
mayor desvío del plan original. Se mitigó priorizando aún más el alcance
y aceptando la deuda técnica documentada arriba. El MVP fue entregado a
tiempo el 1 de junio de 2026, en línea con el cronograma original.


