# Plan de pruebas — NexusAI

> **Versión 1.1** · 19/10/2026 · Issue [#575](https://github.com/nexusai-ucc/nexusAI/issues/575) (TPC-03), épica [#584](https://github.com/nexusai-ucc/nexusAI/issues/584).
> Este plan se versiona en el repo junto al código. Cada cambio entra por PR y se anota en el [historial](#historial-de-versiones).
>
> Relacionados: [`LINEA_BASE.md`](LINEA_BASE.md) (métricas iniciales), [`EPICA_TP_CALIDAD.md`](EPICA_TP_CALIDAD.md) (subtareas), [`services/api/TESTING.md`](../../services/api/TESTING.md) (criterios y guiones del MVP), [`entrega-final/21_testing.md`](../../entrega-final/21_testing.md) (estrategia de testing del MVP).

## 1. Alcance

**Sistema bajo prueba:** NexusAI, asistente académico con IA para Moodle. Tiene tres componentes:

| Componente | Tecnología | Ruta |
|---|---|---|
| Plugin Moodle `local_nexusai` | PHP 8.1–8.4, Moodle 4.5–5.3 | `plugin/local/nexusai/` |
| Widget embebido | React 18, compilado a AMD | `plugin/local/nexusai/react/` |
| Backend | FastAPI (Python 3.11), PostgreSQL + pgvector, Redis | `services/api/` |

**Integraciones externas** (detalle en TPC-07):

| Integración | Para qué | Riesgo principal |
|---|---|---|
| Proveedor LLM | OpenAI `gpt-4o-mini` como principal, Groq como fallback (desde 22/09/2026) | caída, cuota, costo |
| Embeddings | Gemini | sin fallback |
| Moodle | web services + hooks/observers del plugin | cambios entre versiones |
| Oracle Cloud | VMs de staging y prod | disponibilidad del free tier |

**Requisitos de referencia:** las historias de usuario de [`entrega-final/05_historias_usuario.md`](../../entrega-final/05_historias_usuario.md).

| HU | Historia | Prioridad de prueba |
|---|---|---|
| HU-001 | Chat básico del alumno | alta |
| HU-002 | Citas trazables a la fuente | alta |
| HU-003 | Streaming token por token | media |
| HU-010 | Subida de PDFs por el docente | alta |
| HU-011 | Detección de duplicados | media |
| HU-020 | Búsqueda por similaridad | media |
| HU-030 | Generar quiz desde el material | alta |
| HU-031 | Tema sin material disponible | alta (no inventar) |
| HU-040 | Lista de sesiones previas | baja |
| HU-050 | Modo multicurso | media |
| HU-060 | Gaps detectados para el docente | baja |

Además entran dos requisitos no funcionales transversales: **visibilidad del material** (VIS-01…06, un alumno nunca recibe material que no ve en Moodle) y **privacidad** (Privacy API de Moodle / GDPR).

La trazabilidad requisito → caso → defecto está en [`TRAZABILIDAD.md`](TRAZABILIDAD.md), y los casos de caja negra en [`CASOS_DE_PRUEBA.md`](CASOS_DE_PRUEBA.md) (TPC-04, [#576](https://github.com/nexusai-ucc/nexusAI/issues/576)).

**Fuera de alcance:** la calidad pedagógica de las respuestas del LLM más allá del golden set (`services/api/tests/golden_set.md`), la app móvil de Moodle y la infraestructura de la UCC (no hay servidor de la UCC).

## 2. Objetivos de calidad medibles

| Perspectiva | Objetivo | Métrica y umbral | Cómo se mide | Práctica de proceso que lo sostiene |
|---|---|---|---|---|
| Usuario (alumno) | El chat responde rápido | primera respuesta < 8 s con corpus ≤ 20 docs | stress/esfuerzo (TPC-09) | SLA documentado en `TESTING.md` §6; prueba de carga en el pipeline |
| Usuario (alumno) | No inventa | 100 % de respuestas con contexto citan la fuente; sin contexto → "no encontré" | golden set + tests de `chat` | revisión del golden set antes de cambiar prompts |
| Usuario (docente) | El material se indexa a tiempo | PDF de 10 páginas < 30 s; de 50 páginas < 120 s | medición en staging (TPC-09) | pipeline de documentos con tests (`test_pipeline.py`) |
| Usuario (todos) | No ve material ajeno | 0 fugas entre cursos o actividades ocultas | PHPUnit `visible_material_test`, `course_isolation_test`; pytest `test_visibility` | toda feature que lee material pasa `visible_cmids` (VIS-02) |
| Equipo | El código nuevo viene probado | cobertura de código nuevo ≥ 80 %; duplicación ≤ 5 % | quality gate (TPC-02) | el gate bloquea el merge a `development` |
| Equipo | La cobertura total sube | de 56,6 % (línea base) a la meta del nivel declarado | reporte de cobertura del pipeline | TPC-05; métrica antes/después en TPC-10 |
| Equipo | El pipeline es confiable | 0 jobs "verdes" que no ejecutan nada; tasa de fallos espurios < 5 % | historial de Actions | lección de los issues #309/#474 (workflows que nunca corrían) |
| Organización | El costo de IA es controlable | costo de tokens por alumno por día dentro del presupuesto configurado | `usage_ledger` (COST-01) + `token_budget` | límite diario por usuario (`RATE_LIMIT_PER_USER_DAILY`) |
| Organización | El servicio está disponible | staging responde `/health` en ≥ 99 % de los chequeos | `services/api/scripts/health_check_alert.py` (ADR-012) | alerta tras 3 fallas seguidas |
| Organización | Se cumple la normativa de datos | export/borrado GDPR completo de un usuario | PHPUnit `privacy_provider_test`, `privacy_provider_tables_test` | ADR-006 (estrategia de privacidad) |

## 3. Plan de contingencia ante la caída de una dependencia crítica

La dependencia más crítica es el **proveedor LLM**: sin él no hay chat, quiz ni resúmenes. Lo que ya hace el código (`services/api/app/providers/llm.py`, ADR-003 y ADR-004):

1. **Reintentos:** 3 intentos con backoff de 1 s → 2 s ante errores transitorios (rate limit, timeout, conexión, 5xx).
2. **Cadena de fallback** primario → modelos intermedios (`LLM_INTERMEDIATE_MODELS`) → proveedor secundario (`LLM_FALLBACK_*`). Pasa al siguiente eslabón ante **429** (cuota), **503** (caída), **404** (modelo retirado) y **400** (parámetro no soportado).
3. Cada respuesta registra qué eslabón contestó (`fallback=True` en `CompletionResult`), así que en el ledger de uso se puede contar cuántas veces se usó el fallback.

**Huecos reconocidos** (cada uno pasa a la matriz de riesgos):

| Hueco | Por qué importa | Respuesta planificada |
|---|---|---|
| Los timeouts y errores de conexión **no** disparan el fallback (decisión deliberada: "probablemente afecten a todos los eslabones") | si se cae solo la red hacia OpenAI, Groq nunca se intenta | test de integración que simule timeout solo en el primario (TPC-07) y revisar la decisión con datos |
| Los embeddings (Gemini) **no tienen fallback** | sin embeddings no se indexa material nuevo ni funciona la búsqueda semántica | degradación: el chat sigue con el material ya indexado; la subida queda en `status=error` con `error_message` y se puede reintentar |
| Caída de Postgres/Redis | el backend no puede atender | `/health` falla → alerta por cron (ADR-012); el widget muestra un error amigable (`components/errors.js`) |
| Caída de la VM de Oracle | staging o prod sin servicio | redeploy documentado en `docs/DEPLOY_ORACLE.md`; el smoke del pipeline lo detecta (TPC-08) |

**Procedimiento ante una caída del LLM en staging o prod:**
1. La alerta o el usuario lo detecta (salud del LLM, ADR-012 evento 3).
2. Se revisa en el ledger si el fallback está respondiendo.
3. Si el secundario también falla, se cambia `LLM_MODEL`/`LLM_BASE_URL` al proveedor que funcione y se reinicia el contenedor. No hace falta tocar código.
4. Se registra el incidente como defecto (TPC-06) con su test de regresión.

## 4. Niveles de prueba

| Nivel | Backend | Plugin PHP | Widget React | Herramienta | Estado (línea base) |
|---|---|---|---|---|---|
| Unidad | chunker, retriever, hmac, language, token_budget, moderation… | lógica de clases (`study_logic`, `visibility_helper`, `onboarding_state`) | componentes, `errors.js`, `gift.js` | pytest · PHPUnit · Vitest | backend 84 % · plugin 42 % · front 40 % |
| Integración | routers con Postgres + Redis reales en CI (`test_*_router.py`) | external functions + DB de Moodle (`document_list_test`, `course_guard_external_test`, `privacy_provider_test`) | `api/chat.test.js` con fetch mockeado | pytest · PHPUnit · Vitest | existe; con dobles para el LLM |
| Integración externa | proveedor LLM real | — | — | pytest `-m integration` | **falta** (TPC-07) |
| Sistema | API desplegada en staging | plugin instalado en Moodle de staging | widget dentro de Moodle | smoke en el pipeline + stress (k6/Locust) | **falta** (TPC-08, TPC-09) |
| Aceptación | — | escenarios de usuario | — | Behat · guiones manuales de `TESTING.md` §4–5 | **Behat: 0 escenarios** (el step corre vacío); manuales sí |

**Compatibilidad:** el CI del plugin corre sobre 7 combinaciones de Moodle/PHP/DB (4.5 y 5.0–5.3; PHP 8.1–8.4; PostgreSQL y MySQL).

## 5. Criterios de entrada y de salida

| Nivel | Entrada | Salida |
|---|---|---|
| Unidad | código compila; lint (ruff/phpcs/grunt) en 0 | todos los tests pasan; cobertura del código nuevo ≥ 80 % |
| Integración | unidad en verde; Postgres + Redis (o Moodle) levantados por el CI | todos los tests pasan en las 7 combinaciones de Moodle |
| PR → `development` | descripción con template; issue vinculada | CI en verde + quality gate en verde + 1 aprobación |
| Sistema (staging) | merge a `development` desplegado | smoke en verde; integración externa en verde |
| Release (`staging` → `main`) | sistema en verde; sin defectos críticos ni altos abiertos | stress dentro de umbrales; changelog actualizado |
| **Suspensión** | — | se frena el despliegue si el smoke falla o si aparece un defecto crítico; se reanuda con el fix + su test de regresión |

## 6. Riesgos (probabilidad × impacto)

Escalas de 1 (bajo) a 5 (alto). Ordenados por exposición = P × I.

| # | Riesgo | P | I | P×I | Mitigación | Prueba / subtarea |
|---|---|---|---|---|---|---|
| R1 | Caída o cuota agotada del proveedor LLM | 4 | 5 | **20** | cadena de fallback + reintentos | tests de `test_providers.py`; integración real (TPC-07) |
| R2 | Un alumno recibe material de una actividad oculta o de otro curso | 2 | 5 | **10** | `visible_cmids` calculado en el servidor (VIS-02) | `visible_material_test`, `course_isolation_test`, `test_visibility` |
| R3 | Regresión del widget sin detectar (cobertura del 40 %) | 4 | 3 | **12** | subir cobertura de los módulos en 0 % | TPC-05 |
| R4 | Timeout o red caída solo hacia el primario: el fallback no se activa | 3 | 4 | **12** | revisar `_FALLBACK_TRIGGERS` | test de timeout en TPC-07 |
| R5 | Costo de tokens fuera de presupuesto | 3 | 4 | **12** | `token_budget`, límite diario por usuario, ledger | `test_token_budget.py`, `test_usage_ledger.py`, `test_rate_limit.py` |
| R6 | Una versión nueva de Moodle rompe el plugin | 3 | 4 | **12** | matriz de CI de 4.5 a 5.3 | `moodle-ci.yml` |
| R7 | Respuesta de tiempo inaceptable bajo carga | 3 | 3 | **9** | SLA definido; caché | stress y esfuerzo sostenido (TPC-09) |
| R8 | Datos personales no exportados o no borrados (GDPR) | 2 | 4 | **8** | Privacy API (ADR-006) | `privacy_provider_test`, `test_privacy_router.py` |
| R9 | Pipeline que da "verde" sin ejecutar nada (ya pasó: #309, #474; hoy Behat) | 3 | 3 | **9** | revisar que cada job ejecute tests reales | escenarios Behat o sacar el step; TPC-06 |
| R10 | Fallo de sincronización con los repos derivados (pasa desde el 14/10) | 4 | 2 | **8** | alerta del workflow; rotar token | TPC-06 (defecto real) |
| R11 | Embeddings caídos: no se indexa material nuevo | 2 | 3 | **6** | estado `error` + reintento | `test_pipeline.py` |
| R12 | Contenido inapropiado en chat, quiz o foros | 2 | 3 | **6** | moderación (`moderation.py`) | `test_moderation.py`, `test_chat_moderation.py`, `test_quiz_moderation.py` |

## 7. Matriz ISO/IEC 25010

| Característica | Qué significa en NexusAI | Evidencia hoy | Hueco |
|---|---|---|---|
| **Adecuación funcional** | respuestas correctas y citadas, solo con el material del curso | pytest de chat/quiz/search/summarizer; `golden_set.md`; HU con criterios de aceptación | casos con técnicas de caja negra (TPC-04) |
| **Eficiencia de desempeño** | tiempos del chat y de indexación | SLAs en `TESTING.md` §6 | **la columna "Medición real" está vacía**: nunca se midió (TPC-09) |
| **Compatibilidad** | coexistir con Moodle 4.5–5.3, PostgreSQL y MySQL | matriz de 7 combinaciones en `moodle-ci.yml` | — |
| **Usabilidad / capacidad de interacción** | widget comprensible, en dos idiomas y accesible | `lang/es` + `lang/en`; 30 archivos del widget con atributos `aria-*`/`role`; tests de `errors.js` (mensajes amigables) | sin auditoría de accesibilidad automatizada |
| **Fiabilidad** | seguir funcionando si falla una dependencia | reintentos + fallback (`llm.py`); alertas (ADR-012); `test_health_check_alert.py` | R4 y R11 |
| **Seguridad** | autenticidad entre plugin y backend, aislamiento de datos | HMAC con ventana anti-replay (ADR-005, `test_hmac.py`); visibilidad (VIS); auditoría OWASP (`docs/security/owasp-audit-2026-08.md`); `pip-audit` y `npm audit` en CI; GitGuardian | — |
| **Mantenibilidad** | código analizable y modificable | ruff + mypy, phpcs/phpmd/phpdoc en 0 warnings; ADRs; monolito modular (ADR-001) | duplicación y complejidad sin medir → SonarCloud (TPC-02) |
| **Portabilidad / flexibilidad** | instalable en otro servidor | Docker Compose; `docker-compose.selfhost.yml`; `REVIEWER_TESTING.md`; deploy documentado en Oracle | — |

**Top 3 priorizado:**
1. **Seguridad.** Es un sistema académico con datos de alumnos dentro de la plataforma de la universidad, y una fuga entre cursos (R2) o un incumplimiento de privacidad (R8) es lo que más daño haría. Además, el Moodle Plugins Directory lo revisa explícitamente.
2. **Adecuación funcional.** El valor del producto es que la IA responda **solo** con el material del docente y lo cite (HU-001, HU-002, HU-031). Una respuesta inventada es peor que no responder.
3. **Fiabilidad.** Depende de un proveedor externo con cuotas (R1, el riesgo de mayor exposición), así que la tolerancia a fallos define si el sistema se puede usar en un parcial.

La eficiencia de desempeño queda cuarta: hay SLAs, pero un chat lento y correcto sigue siendo útil.

## 8. QA vs QC

| | QA (aseguramiento: previene, actúa sobre el proceso) | QC (control: detecta, actúa sobre el producto) |
|---|---|---|
| Prácticas en NexusAI | flujo git rama → `development` → `staging` → `main`; template de PR; code review entre pares; ADRs; Definition of Done por sprint (`TESTING.md` §3); quality gate; este plan de pruebas | pytest, PHPUnit, Vitest y Behat; análisis estático; auditoría OWASP; pip-audit/npm audit; pruebas manuales guionadas; golden set; smoke y stress |
| Quién | todo el equipo, en cada PR | el CI en cada push; el equipo antes de cada release |

**Hallazgo de QA:** los templates de issue y de PR y el `CODEOWNERS` (`NexusAI/.github/ISSUE_TEMPLATE/`, `NexusAI/.github/PULL_REQUEST_TEMPLATE.md`, `NexusAI/.github/CODEOWNERS`) están dentro de `NexusAI/` y no en la raíz real del repo. GitHub solo los lee desde la raíz (o desde `docs/` en el caso de CODEOWNERS), así que **no se están aplicando**: ni los templates ni la asignación automática de revisores. Además, `development` no tiene branch protection, así que la aprobación y el CI verde de los criterios de salida hoy son una convención, no algo que GitHub haga cumplir (es el mismo problema que tenían los workflows en #309). Se corrige en TPC-06, junto con el template de defecto.

## 9. Recursos y cronograma

- **Equipo:** Santiago Tricherri, Delfina Salinas y Marcos Bugliotti. Las subtareas son `resp:todos` y cada PR identifica a su autor.
- **Entornos:** CI de GitHub Actions; staging en Oracle Cloud (`api-staging`); local con Docker (`scripts/nexus.sh`).
- **Comando único:** `scripts/test-all.sh`.
- **Cronograma:** el de la épica, del 13/10 al 26/10/2026 (ver [`EPICA_TP_CALIDAD.md`](EPICA_TP_CALIDAD.md)).

## Historial de versiones

| Versión | Fecha | Cambio | Issue |
|---|---|---|---|
| 1.0 | 14/10/2026 | Versión inicial: alcance, objetivos, contingencia, niveles, criterios, riesgos, ISO 25010, QA/QC | #575 |
| 1.1 | 19/10/2026 | Links a la matriz de trazabilidad y a los casos de prueba | #576 |
