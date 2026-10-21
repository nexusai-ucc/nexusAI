# Integración externa (TPC-07)

> Issue [#579](https://github.com/nexusai-ucc/nexusAI/issues/579) · Épica [#584](https://github.com/nexusai-ucc/nexusAI/issues/584) · Versión 1.3, 20/10/2026

NexusAI depende de dos sistemas externos que no controla:
- **Moodle**, que aloja el plugin y le da usuarios, cursos, permisos y archivos;
- **el proveedor de LLM** (Gemini en producción hoy), del que salen las respuestas del chat, los quizzes y los embeddings del RAG.

Entre los dos está nuestro backend, al que el plugin llama firmando cada pedido. Este documento fija:
- el **contrato** de cada integración;
- **cómo se prueba cada una**, de los dobles en CI al proveedor real;
- los resultados.

## 1. Mapa de integraciones

```
Navegador (widget React)
   │  core/ajax (sesión de Moodle)
   ▼
Moodle + plugin local_nexusai ──── PHPUnit con Moodle real (7 versiones/BD)
   │  HTTPS + HMAC (backend_client)
   ▼
Backend FastAPI ── Postgres/pgvector + Redis (servicios reales en CI)
   │  API compatible con OpenAI
   ▼
Proveedor LLM (Gemini; cadena de fallback configurable)
```

| Integración | Lado nuestro | Externo | Cómo se prueba |
|---|---|---|---|
| Widget ↔ Moodle | `react/src/api/*.js` | `core/ajax` de Moodle | Doble de `core/ajax` (TPC-05) más la guardia de DEF-01 |
| Plugin ↔ Moodle | `classes/external/*`, Privacy API, eventos | Moodle 4.5–5.3 | PHPUnit contra Moodle real, 7 combinaciones Moodle/PHP/BD |
| Plugin ↔ backend | `backend_client.php` ↔ `app/auth/hmac.py` | — (nuestro, en procesos distintos) | **Contratos compartidos** (§3) |
| Backend ↔ LLM | `app/providers/llm.py`, `embeddings.py` | Gemini / OpenAI / Groq | Dobles en CI (§4) y **proveedor real** (§5) |
| Backend desplegado | toda la cadena | VM de Oracle | **E2E post-deploy** (§6) |

## 2. Contratos

### 2.1 Plugin → backend

| Aspecto | Contrato |
|---|---|
| Transporte | HTTPS. El plugin verifica el certificado y no sigue redirects (`backend_client::curl_hardening`) |
| Autenticación | `Authorization: Bearer <NEXUSAI_API_KEY>` + `X-Timestamp` (epoch, s) + `X-Nonce` (único) + `X-Signature` = `hex(hmac_sha256(secret, timestamp + nonce + body))` |
| Anti-replay | Ventana de ±300 s sobre `X-Timestamp`, y el nonce se guarda en Redis durante esa ventana. Un nonce repetido da **401** |
| Request y response | JSON. Los modelos Pydantic del backend son la referencia (`ChatResponse`, `SearchResponse`, `QuizResponse`, `DocumentOut`…) |
| Errores | 401 (autenticación), 422 (validación), 429 (límite diario del alumno), 5xx. El plugin acepta cualquier 2xx y convierte el resto en `moodle_exception('errorbackend')` con el detalle |
| Timeouts | El plugin espera **120 s** (chat, quiz, subidas) y **300 s** el stream del chat, con 10 s para conectar. Sin conexión: `errorbackendunreachable` |

### 2.2 Backend → proveedor LLM

| Aspecto | Contrato |
|---|---|
| API | Compatible con OpenAI (`AsyncOpenAI`, con base URL por proveedor) |
| Chat | `chat.completions.create(model, messages, reasoning_effort)` → texto + uso de tokens. Hay una variante en stream |
| Embeddings | `embeddings.create(model, input, dimensions=768)` → vectores de 768 dimensiones, lo que espera la columna `vector(768)` de pgvector |
| Timeout del cliente | 120 s por llamada |
| Reintentos | 3 intentos con backoff de 1 s → 2 s ante 429, timeout, error de conexión y 5xx. 401 y 400 son definitivos |
| Fallback (chat) | Ante **429, 503, 404 o 400** se pasa al siguiente eslabón: modelos intermedios del mismo proveedor y después el secundario |

**Qué hace NexusAI ante cada falla del proveedor:**

| Falla | Reintentos | ¿Pasa al siguiente eslabón? | Lo fija el test |
|---|---|---|---|
| 429 cuota agotada | 3 | **Sí** | `test_providers.py::test_chat_completion_falls_back_to_secondary_on_quota_error` |
| 503 proveedor caído | 3 | **Sí** | `test_providers.py::test_chat_completion_falls_back_on_server_error_503` |
| 404 modelo retirado | 0 | **Sí** | `test_providers.py` (PERF-01) y **contra el proveedor real** (§5) |
| 400 parámetro rechazado | 0 | **Sí** | `test_providers.py` (PERF-01) |
| Timeout o error de conexión | 3 | **No** (decisión de diseño) | `test_providers_failure_modes.py` |
| 401 credencial inválida | 0 | **No** | `test_providers_failure_modes.py` |
| Embeddings con 429 o timeout | 3 | **No hay fallback de embeddings** | `test_providers_failure_modes.py` |

Las dos últimas filas con "No" son **riesgos aceptados**, no defectos:
- **Los timeouts no pasan al siguiente eslabón** porque el código asume que afectan a toda la cadena. Pero el primario y el secundario pueden ser proveedores distintos, así que un timeout de uno no implica una caída del otro. Queda registrado en [REGISTRO_DEFECTOS.md](REGISTRO_DEFECTOS.md) como observación.
- **Sin embeddings no se indexa material ni se responde con RAG.** Es un punto único de falla, ya listado en el plan de contingencia de [PLAN_DE_PRUEBAS.md](PLAN_DE_PRUEBAS.md) §3.

## 3. Contratos compartidos entre plugin y backend (contract testing)

Plugin y backend son dos procesos en dos lenguajes. Cada uno tenía sus tests, pero **nada garantizaba que coincidieran**: el backend podía renombrar un campo y el plugin seguía pasando sus tests con un JSON inventado. Desde TPC-07, [`NexusAI/contracts/`](../../contracts/README.md) es la **fuente única** que leen los dos lados:

| Contrato | Backend (productor) | Plugin (consumidor) |
|---|---|---|
| `hmac_vectors.json`: 4 vectores (body vacío, JSON, acentos y ñ, comillas) | `test_contract_hmac.py`: el `verify_hmac` real acepta cada firma y rechaza la misma firma con otro body | `tests/external/contract_test.php`: `backend_client::compute_signature` produce exactamente esa firma |
| `responses/chat_messages.json`, `search.json`, `quiz_generate.json`, `document.json` | `test_contract_responses.py`: cada una valida contra el **modelo Pydantic real** y no tiene campos que el modelo no declare | `contract_test.php`: `chat_send`, `search_query`, `quiz_generate` y `document_status` las procesan, y el resultado valida contra `execute_returns()` |

**Verificado:** con un campo renombrado en `search.json` (`chunk_index` → `chunk_idx`) y una firma alterada en `hmac_vectors.json`, los tests del backend fallan (`ValidationError` e `Invalid signature`). Si se revierte, vuelven a verde.

## 4. Dobles del proveedor en CI

Todo el CI corre sin red hacia el proveedor:
- `test_providers.py` (de antes) cubre la cadena de fallback con `AsyncMock` del cliente OpenAI: 429/503/404/400, modelos intermedios, stream y `reasoning_effort`.
- `test_providers_failure_modes.py` (TPC-07) agrega los modos que faltaban: timeout, error de conexión, 401, embeddings sin fallback y recuperación al segundo intento. El backoff (`asyncio.sleep`) se reemplaza para que los tests no esperen de verdad.

## 5. Proveedor real

`services/api/tests/integration/test_llm_real.py` (marcador `integration`) llama a **Gemini de verdad**, con una key free tier **solo para CI** (secret `GEMINI_API_KEY_CI`, en un proyecto de Google propio, separado del de producción). El modelo de chat es `gemini-3.8-flash`; se puede elegir otro al dispararlo a mano.

| Test | Qué demuestra |
|---|---|
| `test_real_chat_answers_within_the_sla` | El modelo configurado responde, informa tokens y tarda menos que el SLA de **8 s** de primera respuesta |
| `test_real_retired_model_falls_through_to_the_next_link` | Con un modelo inexistente primero en la cadena, el **404 real** de Google hace caer al siguiente eslabón y la respuesta queda marcada `fallback: true` |
| `test_real_embeddings_have_the_contract_dimensions_and_meaning` | Los vectores reales tienen 768 dimensiones, y dos frases sobre lo mismo quedan más cerca (coseno) que dos frases distintas |

**Cuándo corre:** el workflow `.github/workflows/integration-external.yml` se ejecuta todos los días a las 06:00 (ART) (**desde que está en `main`**: GitHub solo corre los `schedule` de la rama por defecto, así que mientras estuvo en `development` no corrió ninguna vez), a mano (`workflow_dispatch`, con el modelo elegible) y en cada push a `development` que toque `app/providers/`. No corre en PRs, porque los PRs de forks no tienen secrets y cada corrida gasta cuota. En el CI normal los tests se saltean solos.

**Resultados:**

| Fecha | Corrida | Modelo | Chat (s) | Fallback 404 (s) | Embeddings (s) | Resultado |
|---|---|---|---|---|---|---|
| 19/10/2026 | [39257255231](https://github.com/nexusai-ucc/nexusAI/actions/runs/39257255231) | `gemini-2.5-flash` | — | — | — | 🔴 3/3 fallan: el modelo da **404 para proyectos nuevos** y `embed_many` rompe con `index=None` (**DEF-07**) |
| 19/10/2026 | [39257509226 (intento 1)](https://github.com/nexusai-ucc/nexusAI/actions/runs/39257509226/attempts/1) | `gemini-3.8-flash` | **20,12** | 6,36 | 1,46 | 🟡 2/3: fallback y embeddings pasan; el chat **supera el SLA de 8 s** |
| 19/10/2026 | [39257509226 (intento 2)](https://github.com/nexusai-ucc/nexusAI/actions/runs/39257509226/attempts/2) | `gemini-3.8-flash` | 3,43 | 2,46 | 0,87 | 🟢 3/3 |
| 19/10/2026 | [39260816477](https://github.com/nexusai-ucc/nexusAI/actions/runs/39260816477) (push a `development`) | `gemini-3.8-flash` | **112,83** | — | — | 🔴 el chat superó el SLA por lejos; fallback y embeddings pasaron. Variabilidad del plan gratis |

**Lo que encontró la prueba real (y ningún doble podía encontrar):**
1. **El modelo de producción ya no se ofrece a proyectos nuevos.** Google responde `This model models/gemini-2.5-flash is no longer available to new users` a cualquier key de un proyecto creado ahora. Producción sigue andando porque su proyecto es anterior, pero **si se rota la key a un proyecto nuevo, el chat de producción da 404** (la cadena de fallback lo absorbe solo si hay eslabones configurados). Queda como observación de riesgo en [REGISTRO_DEFECTOS.md](REGISTRO_DEFECTOS.md): migrar producción a `gemini-3.8-flash` antes de rotar la key.
2. **DEF-07:** Gemini devuelve los embeddings con `index=None` y `embed_many` los ordenaba por ese campo, así que fallaba con `TypeError`. Los dobles siempre traían un `index` entero. Corregido en este PR, con test de regresión.
3. **La latencia del free tier tiene picos.** El mismo modelo respondió en 20,1 s y, en la corrida siguiente, en 3,4 s. El SLA de 8 s se cumple en el caso típico pero no en la cola: es un dato para el informe de stress (TPC-09) y una razón más para que producción no use el free tier.

## 6. E2E contra el backend desplegado

`NexusAI/scripts/e2e_deployed.py` prueba la cadena completa desde afuera, como lo hace el plugin. Usa solo la biblioteca estándar.

1. `GET /health` responde 200 con `status: ok`.
2. `POST /api/v1/chat/messages` **firmado con HMAC** devuelve una respuesta no vacía. Ejercita la autenticación, Postgres/pgvector y el LLM real.
3. Repetir el mismo request (mismo nonce) da **401**: el anti-replay real sobre Redis.

Las credenciales salen de variables de entorno, nunca de argumentos. Sale con un código distinto de 0 si un paso falla, así el pipeline de deploy (TPC-08) se pone en rojo.

**Estado al 16/10/2026:**

| Ambiente | `--health-only` | Flujo completo |
|---|---|---|
| Producción (`api.159.112.139.166.nip.io`) | ✅ HTTP 200, `gemini-2.5-flash`, 0,32 s | No se corre en producción (gasta tokens y escribe datos reales) |
| Staging (`api-staging.146.181.62.67.nip.io`) | ✅ HTTP 200, `env=staging`, `gpt-4o-mini`, 0,55 s (19/10) | Se corre en el smoke post-deploy (TPC-08), con las credenciales de staging como secrets |

**Falsa alarma del 16/10.** La primera corrida contra staging usó `api.146.181.62.67.nip.io` y falló con `TLSV1_ALERT_INTERNAL_ERROR`, así que se reportó staging como caído. No lo estaba: el dominio real es `api-staging.…`, y Caddy solo tiene certificado para ese nombre. El dominio equivocado venía de `docs/DEPLOY_ORACLE.md`, que el admin de deploy corrigió en #630.

Lección: el script detectó bien que *esa* URL no servía (sale con 1 y `FAIL`), pero el mensaje TLS se parece a un servicio caído. Por eso el smoke de TPC-08 toma la URL de una variable del pipeline y no de la documentación.

## 7. Riesgos de la integración

| Riesgo | Mitigación |
|---|---|
| Google retira un modelo sin aviso (pasó con `gemini-2.0-flash` y `2.5-flash-lite`, y `2.5-flash` ya no se ofrece a proyectos nuevos) | Fallback ante 404, probado contra el proveedor real todos los días. Migrar producción a `gemini-3.8-flash` |
| Picos de latencia del proveedor (20 s medidos en el free tier) | Medido a diario contra el SLA; se profundiza en TPC-09 |
| Se agota la cuota del free tier del CI | Corrida diaria con 3 llamadas chicas, `workflow_dispatch` para lo demás. Key separada de producción |
| Cambia el contrato entre plugin y backend sin que se note | `contracts/` leído por los dos CI |
| Staging no disponible, o la URL documentada no coincide con el certificado | El E2E post-deploy lo detecta; la URL vive en una variable del pipeline (TPC-08), no se copia de la documentación |
| Embeddings sin proveedor alternativo | Riesgo aceptado, documentado en el plan de contingencia |

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 16/10/2026 | Contratos, contract testing, dobles de fallas, proveedor real, E2E desplegado |
| 1.1 | 19/10/2026 | Primeras corridas contra Gemini real: DEF-07, modelo no disponible para proyectos nuevos, picos de latencia |
| 1.2 | 19/10/2026 | URL correcta de staging (`api-staging.…`): el error TLS del 16/10 era el dominio, no una caída |
| 1.3 | 20/10/2026 | Corrida de 112 s; la prueba diaria solo corre desde `main` |
