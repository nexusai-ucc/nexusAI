# Registro de defectos (TPC-06)

> Issue [#578](https://github.com/nexusai-ucc/nexusAI/issues/578) · Épica [#584](https://github.com/nexusai-ucc/nexusAI/issues/584) · Versión 1.0, 16/10/2026

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

| ID | Defecto | Componente | Severidad | Detectado por | Estado | Fix | Test de regresión |
|---|---|---|---|---|---|---|---|
| [DEF-01](#def-01) | Racha, flashcards y webhook ignoran la respuesta de Moodle (`ajax.call` sin esperar) | Widget React | Media | Tests unitarios (TPC-05, 15/10) | Corregido | [#624](https://github.com/nexusai-ucc/nexusAI/pull/624) · issue [#623](https://github.com/nexusai-ucc/nexusAI/issues/623) | `react/src/api/quiz.test.js`, `react/src/api/services.test.js`, `react/src/api/ajaxUsage.test.js` |
| [DEF-02](#def-02) | VOICE-02: toda pregunta por voz se rechaza (MIME con codec) y el error no se muestra | Plugin + backend + widget | Alta | Uso real | Corregido | [#591](https://github.com/nexusai-ucc/nexusAI/pull/591) · issue [#590](https://github.com/nexusai-ucc/nexusAI/issues/590) | `tests/chat_voice_transcribe_test.php`, `services/api/tests/test_voice_router.py`, `react/src/api/voice.test.js`, `ChatInput.test.jsx` |
| [DEF-03](#def-03) | El Privacy provider no exportaba ni borraba nada: se ignoraba el contexto de curso (`add_from_sql`) | Plugin (Privacy API) | Alta | Primera corrida de PHPUnit sobre el provider | Corregido | `d2d13fc` (13/09) | `tests/privacy_provider_test.php`, `privacy_provider_tables_test.php` |
| [DEF-04](#def-04) | MMR-301 ítem 4: al borrar un curso no se purgaban del backend los posts de foro indexados | Plugin (privacidad) | Alta | Auditoría para Moodle Marketplace | Corregido | [#572](https://github.com/nexusai-ucc/nexusAI/pull/572) | `tests/backend_tasks_test.php` |
| [DEF-05](#def-05) | CI: "Sync derived repos" falla por `SYNC_REPOS_TOKEN` vencido; los repos derivados dejan de actualizarse | CI / despliegue | Media | **Pipeline** | Corregido | token renovado (14/10) | la propia corrida del workflow |
| [DEF-06](#def-06) | Tests: un mock de `curl` sobrevivía entre tests y rompía `sync_forum_post_test` | Tests del plugin | Baja | **Pipeline** (PR #603) | Corregido | `df38ed9` | `tests/external/external_testcase.php::tearDown` |

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

También DEF-06 es una ejecución fallida que detectó un problema real (la fuga entre tests), y DEF-01 tiene su corrida en rojo.

## Observaciones de riesgo (no son defectos)

| Observación | Por qué no es un defecto | Seguimiento |
|---|---|---|
| `providers/llm.py`: los timeouts y errores de conexión **no** disparan el fallback al proveedor secundario | Es una decisión de diseño documentada en el código: se asume que afectan a todos los eslabones por igual | Reevaluar en TPC-07. El primario (OpenAI) y el secundario (Groq) son proveedores distintos, así que un timeout de uno no implica una caída del otro |
| Behat del plugin con 0 escenarios | No hay comportamiento incorrecto: falta cobertura de aceptación | TPC-04 / TPC-07 |

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 16/10/2026 | Formulario de defecto, severidades, ciclo de vida, DEF-01 a DEF-06, ejecución fallida real |
