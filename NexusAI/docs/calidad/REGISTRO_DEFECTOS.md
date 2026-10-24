# Registro de defectos (TPC-06)

> Issue [#578](https://github.com/nexusai-ucc/nexusAI/issues/578) · Épica [#584](https://github.com/nexusai-ucc/nexusAI/issues/584) · Versión 1.5, 21/10/2026

El registro de defectos de NexusAI vive en **GitHub Issues**, con el formulario **🐞 Defecto** (`.github/ISSUE_TEMPLATE/defecto.yml`) y las labels `bug`, `tipo:defecto` y `severidad:*`. Este documento es la vista consolidada para el TP: lista cada defecto con su origen, su fix, su test de regresión y las corridas de CI que lo muestran.

## Cómo se registra un defecto

### Severidad (impacto) y prioridad (urgencia)

| Severidad | Criterio | Label |
|---|---|---|
| Crítica | Sistema caído, pérdida o filtración de datos (por ejemplo, material de un curso visible en otro), sin workaround | `severidad:critica` |
| Alta | Funcionalidad central rota (chat, indexado, quiz) o datos incorrectos sin workaround razonable | `severidad:alta` |
| Media | Funcionalidad secundaria incorrecta o con workaround | `severidad:media` |
| Baja | Cosmético o de bajo impacto | `severidad:baja` |

La prioridad (`prio:alta|media|baja`) es independiente: dice cuándo se atiende, no cuánto daño hace.

### Ciclo de vida

```
Abierto ──► En curso ──► Test de regresión en ROJO ──► Fix ──► Test en VERDE ──► PR mergeado ──► Cerrado
```

**Regla:** ningún defecto se cierra sin un **test de regresión** que falle con el código anterior y pase con el fix. El test queda en la suite y corre en cada PR. El quality gate y la branch protection de `development` (TPC-02) impiden mergear si falla.

## Defectos registrados

| ID | Defecto | Requisito | Componente | Severidad | Detectado por | Estado | Fix | Test de regresión |
|---|---|---|---|---|---|---|---|---|
| [DEF-01](#def-01) | Racha, flashcards y webhook ignoran la respuesta de Moodle (`ajax.call` sin esperar) | HU-030 | Widget React | Media | Tests unitarios (TPC-05, 15/10) | Corregido | [#624](https://github.com/nexusai-ucc/nexusAI/pull/624) · issue [#623](https://github.com/nexusai-ucc/nexusAI/issues/623) | `react/src/api/quiz.test.js`, `react/src/api/services.test.js`, `react/src/api/ajaxUsage.test.js` |
| [DEF-02](#def-02) | VOICE-02: toda pregunta por voz se rechaza (MIME con codec) y el error no se muestra | HU-001 | Plugin + backend + widget | Alta | Uso real | Corregido | [#591](https://github.com/nexusai-ucc/nexusAI/pull/591) · issue [#590](https://github.com/nexusai-ucc/nexusAI/issues/590) | `tests/chat_voice_transcribe_test.php`, `services/api/tests/test_voice_router.py`, `react/src/api/voice.test.js`, `ChatInput.test.jsx` |
| [DEF-03](#def-03) | El Privacy provider no exportaba ni borraba nada: se ignoraba el contexto de curso (`add_from_sql`) | PRIV | Plugin (Privacy API) | Alta | Primera corrida de PHPUnit sobre el provider | Corregido | `d2d13fc` (13/09) | `tests/privacy_provider_test.php`, `privacy_provider_tables_test.php` |
| [DEF-04](#def-04) | MMR-301 ítem 4: al borrar un curso no se purgaban del backend los posts de foro indexados | PRIV | Plugin (privacidad) | Alta | Auditoría para Moodle Marketplace | Corregido | [#572](https://github.com/nexusai-ucc/nexusAI/pull/572) | `tests/backend_tasks_test.php` |
| [DEF-05](#def-05) | CI: "Sync derived repos" falla por `SYNC_REPOS_TOKEN` vencido; los repos derivados dejan de actualizarse | — (proceso) | CI / despliegue | Media | **Pipeline** | Corregido | token renovado (14/10) | la propia corrida del workflow |
| [DEF-06](#def-06) | Tests: un mock de `curl` sobrevivía entre tests y rompía `sync_forum_post_test` | — (proceso) | Tests del plugin | Baja | **Pipeline** (PR #603) | Corregido | `df38ed9` | `tests/external/external_testcase.php::tearDown` |
| [DEF-07](#def-07) | `embed_many` rompe con `TypeError` cuando el proveedor devuelve los embeddings sin `index` (Gemini) | HU-010 | Backend (proveedor de embeddings) | Media | **Prueba contra el proveedor real** (TPC-07, 19/10) | Corregido | [#628](https://github.com/nexusai-ucc/nexusAI/pull/628) | `tests/test_providers.py::test_embed_many_keeps_response_order_when_the_provider_omits_index`, `tests/integration/test_llm_real.py` |
| [DEF-08](#def-08) | El quiz con un tema sin material responde siempre en español cuando la similitud es baja (no sigue el idioma de la interfaz) | HU-031 | Backend (quiz) | Baja | **Tabla de decisión** de HU-031 (TPC-04, 19/10) | Corregido | [#632](https://github.com/nexusai-ucc/nexusAI/pull/632) | `tests/test_quiz_router.py::test_cp_quiz_19_tema_sin_material_responde_en_el_idioma_de_la_interfaz` |
| [DEF-09](#def-09) | Con ~40 alumnos simultáneos el chat colapsa (p95 de 60 s, 32 % de chats sin respuesta) y se pierden registros de consumo: el request retiene su conexión durante el LLM y el registro pide otra del mismo pool | HU-001 · objetivo de rendimiento | Backend (base de datos / registro de consumo) | Alta | **Prueba de stress** (TPC-09, 19/10) | Corregido | [#644](https://github.com/nexusai-ucc/nexusAI/pull/644) | `tests/test_db_pool_contention.py` (Postgres real) · `tests/test_chat_stateless.py::test_messages_releases_the_db_connection_before_calling_the_llm`, `test_stream_releases_the_db_connection_before_streaming` |
| [DEF-10](#def-10) | Dependencias con vulnerabilidades publicadas el 21/10: Pillow 12.3.0 (8 CVE, backend en producción) y vite 8.2.2 (`launch-editor`, solo desarrollo) | — (dependencias) | Backend + widget | Media | **Pipeline** (auditoría de dependencias) | Corregido | [#654](https://github.com/nexusai-ucc/nexusAI/pull/654) | `pip-audit` y `npm audit` en `backend-ci` / `frontend-ci` |

### DEF-01

**Descripción.**
- Cinco funciones del widget hacían `const [response] = await ajax.call([...])`.
- `ajax.call()` de Moodle devuelve un **array de promesas**, así que el `await` esperaba el array y `response` quedaba como promesa sin resolver.
- Funciones afectadas: `suggestDifficulty`, `getFlashcardsSummary`, `getStudyStreak` (`api/quiz.js`), `getForumWebhook` y `saveForumWebhook` (`api/forumDigest.js`).
- Efecto: dentro de Moodle devolvían siempre los valores por defecto (racha 0, flashcards 0/0, webhook `null`). Además, cuando el `return response` estaba dentro de un `try/catch` (`api/budget.js`), el rechazo del web service se escapaba del `catch`.

**Ciclo rojo/verde:**

| Paso | Commit | Corrida | Resultado |
|---|---|---|---|
| Test de regresión, sin fix | `6b512da` | Frontend CI [38823574292](https://github.com/nexusai-ucc/nexusAI/actions/runs/38823574292) · Quality Gate, job [Cobertura frontend](https://github.com/nexusai-ucc/nexusAI/actions/runs/38823574278/job/116725666999) | 🔴 3 tests fallan: los 2 de mapeo y la guardia estática |
| Fix | `605d796` | Frontend CI [38823744168](https://github.com/nexusai-ucc/nexusAI/actions/runs/38823744168) · Quality Gate [38823743846](https://github.com/nexusai-ucc/nexusAI/actions/runs/38823743846) · Moodle Plugin CI [38823744091](https://github.com/nexusai-ucc/nexusAI/actions/runs/38823744091) (bundles regenerados, 7 combinaciones) | 🟢 259 tests pasan |

**Análisis de causa raíz (5 porqués):**
1. *¿Por qué los paneles mostraban racha 0?* Porque `getStudyStreak` leía `response.currentstreak` de una promesa, no del objeto.
2. *¿Por qué era una promesa?* Porque se hizo `await` sobre el array que devuelve `ajax.call()` y no sobre su elemento.
3. *¿Por qué no lo detectó ningún test?* Porque los tests de componentes mockean el módulo de API entero (`vi.mock`). El camino real (`core/ajax`) no lo ejercitaba nadie hasta el doble de prueba de TPC-05.
4. *¿Por qué no lo vio nadie usándolo?* Porque no hay error visible: 0 y `null` son valores válidos que los paneles muestran sin quejarse.
5. *¿Por qué reapareció después de corregirlo en `calendar.js` y en `voice.js` (#591)?* Porque cada fix fue **local**: se corrigió el archivo donde se notó, pero el patrón no se buscó en el resto del código y no quedó ninguna barrera que impidiera repetirlo.

**Acción correctiva:** se corrigieron los **37** llamados del widget al mismo patrón (`const [p] = ajax.call(...); const r = await p;`), no solo los 5 que fallaban. Los otros funcionaban de casualidad, porque `async` resuelve la promesa al devolverla.

**Acción preventiva:** `react/src/api/ajaxUsage.test.js` recorre el código fuente y **falla si alguien vuelve a escribir el patrón**. Así, el defecto deja de depender de la memoria del equipo.

### DEF-02

VOICE-02. `MediaRecorder` informa el MIME con el codec (`audio/webm;codecs=opus`) y el plugin y el backend comparaban el string completo contra la lista permitida, así que se rechazaban todas las grabaciones. Además, `voice.js` tenía el mismo patrón de `ajax.call` que DEF-01 y se tragaba el error. Se corrigió en #591 (14/10), con tests en las tres capas. Es un **antecedente directo de DEF-01**: se corrigió el patrón en `voice.js` pero no en los otros módulos.

### DEF-03

`provider::get_contexts_for_userid()` llamaba a `contextlist::add_user_context($userid, $context)` con dos argumentos. El método de Moodle acepta solo uno y agrega el contexto **personal** del usuario, así que el contexto de curso se ignoraba sin ningún error. Consecuencia: las solicitudes de exportación o borrado de datos personales (Site administration → Privacy → Data requests) **no exportaban ni borraban nada**, para ningún usuario.

Se detectó al correr PHPUnit por primera vez sobre el provider, que hasta ese momento nunca había corrido. Se corrigió en `d2d13fc` agregando el contexto de curso con `add_from_sql()`. Lo cubren los tests del Privacy provider.

### DEF-04

MMR-301 (auditoría para publicar en el Moodle Marketplace), ítem 4. Al borrar un curso en Moodle, los posts de foro indexados en el backend no se encolaban para purgar. Corregido en #572 con un test en `backend_tasks_test.php`.

### DEF-05

Ver [Ejecución fallida que detectó un problema real](#ejecucion-fallida-que-detecto-un-problema-real).

### DEF-06

Al sumar los tests de TPC-05 (#603), una tanda **rompió un test que ya existía**: `sync_forum_post_test` esperaba que el backend no respondiera y recibió una respuesta mockeada. La causa:
- `\curl::mock_response()` guarda las respuestas en una lista **estática**, que `resetAfterTest()` no limpia;
- un test que encolaba una respuesta y fallaba antes de usarla la dejaba para el test siguiente, aunque fuera de otra clase.

El fix (`df38ed9`): `external_testcase::tearDown()` vacía la lista por Reflection.

| Paso | Corrida | Resultado |
|---|---|---|
| Tests con la fuga | Quality Gate [38795204969](https://github.com/nexusai-ucc/nexusAI/actions/runs/38795204969) (`fb098e8`) | 🔴 `sync_forum_post_test` y un test de subida fallan |
| Con `tearDown` | Moodle Plugin CI [38796605485](https://github.com/nexusai-ucc/nexusAI/actions/runs/38796605485) · Quality Gate [38796605471](https://github.com/nexusai-ucc/nexusAI/actions/runs/38796605471) (`f016105`) | 🟢 7 combinaciones de Moodle en verde |

### DEF-07

`EmbeddingProvider.embed_many()` reordenaba la respuesta con `sorted(response.data, key=lambda d: d.index)`. La API de Gemini compatible con OpenAI devuelve `index=None`, así que la comparación fallaba con `TypeError: '<' not supported between instances of 'int' and 'NoneType'`.

- **Impacto:** hoy bajo, porque la indexación de documentos usa `embed()` de a un texto. Pero `embed_many` es la vía recomendada en el propio código para indexar en lote, y cualquiera que la adoptara rompía la indexación con Gemini.
- **Por qué no lo vio ningún test:** los dobles (`test_embed_many_preserves_order`) siempre traían un `index` entero, que es lo que promete el SDK de OpenAI. Solo la llamada real mostró que Gemini no cumple esa parte del contrato.
- **Fix:** si algún elemento viene sin `index`, se respeta el orden de la respuesta (que es el del input); si todos lo traen, se sigue ordenando.

| Paso | Corrida | Resultado |
|---|---|---|
| Prueba real, sin fix | Integración externa [39257255231](https://github.com/nexusai-ucc/nexusAI/actions/runs/39257255231) | 🔴 `TypeError` en `embed_many` |
| Test de regresión, sin fix (local) | `pytest -k omits_index` | 🔴 `TypeError` |
| Fix | Integración externa [39257509226](https://github.com/nexusai-ucc/nexusAI/actions/runs/39257509226/attempts/2) · `pytest tests/test_providers.py` | 🟢 768 dimensiones y orden correcto |

### DEF-08

Con un tema pedido, `generate_quiz` rechaza el pedido en dos lugares:
- cuando la similitud máxima del material no llega al umbral;
- cuando el LLM dice que el tema no está en el material.

El segundo mensaje y el 404 de "curso sin material" siguen el idioma de la interfaz con `localized()`. El primero estaba escrito a mano en español, así que un alumno con Moodle en inglés recibía *"No encontré material sobre ese tema…"*. Además, no nombraba el tema, a diferencia del otro rechazo.

- **Cómo apareció:** al armar la tabla de decisión de HU-031 ([CASOS_DE_PRUEBA.md](CASOS_DE_PRUEBA.md) §4.3), las reglas Q1 y Q2 tienen la misma acción (422, "no hay material sobre el tema"). Comparar sus mensajes mostró que solo uno estaba localizado. Ningún test pasaba por Q1: la rama "quiz con tema" tenía 0 % de cobertura (§5 de ese documento).
- **Fix:** el mensaje de Q1 usa `localized(resolve_language(request, topic), …)` con el mismo texto que Q2.

| Paso | Corrida | Resultado |
|---|---|---|
| Test de regresión, sin fix (local) | `pytest -k cp_quiz_19` | 🔴 el detalle en inglés no contiene "couldn't find material" |
| Fix | `pytest tests/test_quiz_router.py` | 🟢 87 tests pasan |

### DEF-09

Lo encontró la **prueba de stress** de TPC-09 ([PRUEBAS_DE_CARGA.md](PRUEBAS_DE_CARGA.md)). Con el LLM simulado a 1,5 s, el chat respondía perfecto hasta 40 usuarios virtuales (VUs): 5,1 pedidos/s y p95 de 2,45 s. Al llegar a 40, **colapsó**:
- el throughput cayó a 0,7 pedidos/s;
- el p95 llegó a 30–60 s;
- solo el 68 % de los chats salió OK;
- los logs mostraron 522 `No se pudo registrar el consumo … QueuePool limit of size 5 overflow 10 reached`;
- al final quedaron las 15 conexiones de Postgres en *idle in transaction*.

**Aislamiento.** El mismo stress con el registro de consumo apagado llegó a 100 VUs con 99,96 % OK y 12,3 pedidos/s ([corrida 39296300477](https://github.com/nexusai-ucc/nexusAI/actions/runs/39296300477)). Eso confirma que el disparador era el registro.

**Causa: retener y esperar.**
1. Cada chat abre una transacción en el retrieval y la **retiene durante toda la llamada al LLM**: la conexión queda *idle in transaction* esos segundos.
2. La capa de proveedores registra el consumo **dentro de ese mismo request**: `await record_usage(...)` en `providers/llm.py` y en `providers/embeddings.py`.
3. `usage_ledger._persist` abría su sesión con el **mismo pool** (5 + 10 conexiones).

Con unos 15 chats en vuelo, todas las conexiones estaban retenidas y cada request esperaba una más, que nadie soltaba. Cada espera vencía a los 30 s (`pool_timeout`): el registro se perdía (*fail-open*) y el chat sumaba 30 s por cada llamada al proveedor.

**Por qué no lo vio nadie (5 porqués):**
1. *¿Por qué colapsó?* Porque los requests se quedaron sin conexiones.
2. *¿Por qué se quedaron sin conexiones?* Porque cada chat necesitaba **dos** al mismo tiempo: la propia, retenida durante el LLM, y la del registro.
3. *¿Por qué retenía la propia?* Porque el retrieval abre una transacción y nada la cerraba antes del LLM: el patrón por defecto de "una sesión por request".
4. *¿Por qué no apareció en los tests?* Porque todos los tests de la API usan dobles de la base. Con un pool real hacen falta ~15 chats simultáneos para llenarlo.
5. *¿Por qué no apareció en uso real?* Porque hasta ahora el uso fue de pocos alumnos a la vez. Con el LLM real, más lento, el quiebre llegaría **antes**, porque cada conexión queda retenida más tiempo.

**Fix ([#644](https://github.com/nexusai-ucc/nexusAI/pull/644)):**
- **Pool propio para el registro de consumo** (`get_ledger_session_factory` en `app/db/session.py`): 2 + 3 conexiones y un timeout de 5 s, configurables. El registro ya no compite con los requests.
- **El chat cierra la transacción antes de llamar al LLM**, en `/messages` y en el stream. No retiene la conexión mientras el modelo responde.
- Otros endpoints que llaman al LLM con una sesión abierta (quiz, resumen) ya no pueden interbloquearse, gracias al pool propio. Les queda retener la conexión durante el LLM, anotado como mejora.

| Paso | Corrida | Resultado |
|---|---|---|
| Stress que lo encontró | Pruebas de carga [39292517339](https://github.com/nexusai-ucc/nexusAI/actions/runs/39292517339) | 🔴 colapso a 40 VUs |
| Tests de regresión, sin fix | Backend CI [39325281433](https://github.com/nexusai-ucc/nexusAI/actions/runs/39325281433) (`b07770f`) | 🔴 con Postgres real y el pool de los requests agotado, `record_usage` espera hasta el `TimeoutError`; el chat no libera la conexión antes del LLM |
| Fix | Backend CI [39325531204](https://github.com/nexusai-ucc/nexusAI/actions/runs/39325531204) | 🟢 620 tests pasan; el registro termina en ~0,5 s con el pool agotado |
| Stress con el fix (registro prendido) | Pruebas de carga [39325730633](https://github.com/nexusai-ucc/nexusAI/actions/runs/39325730633) | 🟢 **sin quiebre hasta 100 VUs**: 6.196 chats, 99,98 % OK, p95 de 2,49 s plano en todos los escalones, ~20 pedidos/s, **0 registros perdidos** y 0 conexiones *idle in transaction* al final |

**Acción preventiva:** `test_db_pool_contention.py` es el primer test del backend contra **Postgres real** (lo provee backend-ci). Si alguien vuelve a abrir sesiones del registro con el pool de los requests, falla.

### DEF-10

El 21/10, el PR que lleva `development` a `staging` (#647) dio **rojo en las dos auditorías de dependencias**, sin que hubiera cambiado una sola línea de nuestro código. Se habían publicado vulnerabilidades nuevas en dos dependencias:

| Auditoría | Dependencia | Vulnerabilidades | Dónde se usa | Corrección |
|---|---|---|---|---|
| `pip-audit` (backend) | **Pillow 12.3.0** | 8 CVE (CVE-2026-112395 a 112899) | En producción: el OCR de `extractor.py::_ocr_image` y, por dentro, `pdfplumber` y `pdf2image` | **13.0.0** (requiere Python ≥ 3.11, que es lo que usa la imagen) |
| `npm audit` (widget) | **vite 8.2.2** (trae `launch-editor`) | 3 *high* (GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-587h-7wmj-h5pm) | Solo en desarrollo: es dependencia de vitest. No entra en el bundle del plugin | **8.3.5** (`npm audit fix`, sin `--force`) |

**Verificación:**
- con Pillow 13 pasan los 621 tests del backend (incluidos los de extracción e indexación) y el OCR abre imágenes;
- `pip-audit` queda limpio, con las 10 excepciones ya justificadas en #317;
- `npm audit` da 0 vulnerabilidades, y los 273 tests del widget pasan;
- el build no cambia ningún archivo de `amd/`.

**Por qué importa.** Es una ejecución fallida que detectó un problema real, de una clase distinta a DEF-05. Un pipeline que estaba en verde ayer puede ponerse rojo hoy sin que nadie toque el código, porque **las dependencias también cambian**: cada día se publican vulnerabilidades nuevas. Las auditorías corren en cada PR, así que lo detectaron antes de que la versión vulnerable llegara a staging.

| Paso | Corrida | Resultado |
|---|---|---|
| Auditorías en el PR #647 | Backend CI [39604642181](https://github.com/nexusai-ucc/nexusAI/actions/runs/39604642181) · Frontend CI [39604642306](https://github.com/nexusai-ucc/nexusAI/actions/runs/39604642306) | 🔴 Pillow (8 CVE) y vite/`launch-editor` (3 high) |
| Fix (PR #654) | Backend CI [39607129446](https://github.com/nexusai-ucc/nexusAI/actions/runs/39607129446) · Frontend CI [39607129306](https://github.com/nexusai-ucc/nexusAI/actions/runs/39607129306) | 🟢 Pillow 13.0.0 y vite 8.3.5; auditorías limpias |

## Ejecución fallida que detectó un problema real

**DEF-05. "Sync derived repos"** publica el plugin y el backend en sus repos derivados (`moodle-local_nexusai`, `nexusai-backend`) en cada push a `development`.

- **Falló 13 veces el 14/10**, desde [38489000776](https://github.com/nexusai-ucc/nexusAI/actions/runs/38489000776) (00:14) hasta [38604252769](https://github.com/nexusai-ucc/nexusAI/actions/runs/38604252769) (17:09), con este error:
  ```
  remote: Invalid username or token. Password authentication is not supported for Git operations.
  fatal: Authentication failed for 'https://github.com/nexusai-ucc/nexusai-backend.git/'
  ```
- **Problema real:** el token `SYNC_REPOS_TOKEN` había vencido. Sin el pipeline, los repos derivados (el del Marketplace y el que se despliega) habrían quedado desactualizados sin que nadie se enterara.
- **Corrección:** se renovó el secret. Desde [38640827145](https://github.com/nexusai-ucc/nexusAI/actions/runs/38640827145) (14/10, 21:30) el workflow vuelve a verde en cada push.
- **Lección:** los tokens con vencimiento son una dependencia que falla en silencio hasta que se usan. Queda como riesgo en el plan de pruebas: renovarlo antes de vencer, o pasar a una GitHub App con token de corta duración.

También DEF-10 (vulnerabilidades nuevas en dependencias, detectadas por las auditorías del pipeline) y DEF-06 son ejecuciones fallidas que detectaron un problema real (la fuga entre tests), y DEF-01 tiene su corrida en rojo.

## Observaciones de riesgo (no son defectos)

| Observación | Por qué no es un defecto | Seguimiento |
|---|---|---|
| `providers/llm.py`: los timeouts y errores de conexión **no** disparan el fallback al proveedor secundario | Es una decisión de diseño documentada en el código: se asume que afectan a todos los eslabones por igual Fijado por `test_providers_failure_modes.py` (TPC-07). Riesgo aceptado: el primario y el secundario pueden ser proveedores distintos, así que un timeout de uno no implica una caída del otro. Ver [INTEGRACION_EXTERNA.md](INTEGRACION_EXTERNA.md) §2.2 |
| Producción usa `gemini-2.5-flash`, que Google ya **no ofrece a proyectos nuevos** (404 `no longer available to new users`, visto en la [primera corrida real](https://github.com/nexusai-ucc/nexusAI/actions/runs/39257255231)) | Producción funciona: su proyecto es anterior al corte | Si se rota la key a un proyecto nuevo, el chat da 404. Migrar `LLM_MODEL` a `gemini-3.8-flash` antes de rotar (lo decide el admin de deploy) |
| Behat del plugin con 0 escenarios | No hay comportamiento incorrecto: falta cobertura de aceptación | TPC-04 / TPC-07 |

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 16/10/2026 | Formulario de defecto, severidades, ciclo de vida, DEF-01 a DEF-06, ejecución fallida real |
| 1.1 | 19/10/2026 | DEF-07 (detectado por la prueba contra el proveedor real) y riesgo del modelo de producción |
| 1.2 | 19/10/2026 | DEF-08 (detectado por una tabla de decisión) y columna de requisito, enlazada con [TRAZABILIDAD.md](TRAZABILIDAD.md) |
| 1.3 | 19/10/2026 | DEF-09 (detectado por la prueba de stress) |
| 1.4 | 21/10/2026 | DEF-10 (vulnerabilidades nuevas en dependencias, detectadas por el pipeline) |
| 1.5 | 21/10/2026 | Corridas verdes del fix de DEF-10 |
