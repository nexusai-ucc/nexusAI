# Pruebas de stress y de esfuerzo sostenido (TPC-09)

> Issue [#581](https://github.com/nexusai-ucc/nexusAI/issues/581) · Épica [#584](https://github.com/nexusai-ucc/nexusAI/issues/584) · Versión 1.1, 19/10/2026

Responden dos preguntas sobre el backend de NexusAI:
- **¿Aguanta el uso real de un curso durante un rato largo, sin degradarse?** (esfuerzo sostenido)
- **¿Hasta dónde llega antes de romperse, y qué se rompe primero?** (stress)

Corren desde el pipeline, con umbrales que lo ponen en rojo si no se cumplen.

| Pieza | Archivo |
|---|---|
| Escenarios k6, con firma HMAC igual que el plugin | [`scripts/load/nexus_load.js`](../../scripts/load/nexus_load.js) |
| Proveedor LLM simulado (chat, moderación, embeddings) | [`scripts/load/mock_llm.py`](../../scripts/load/mock_llm.py) |
| Backend efímero (override de compose + ambiente) | [`scripts/load/docker-compose.load.yml`](../../scripts/load/docker-compose.load.yml), [`load.env`](../../scripts/load/load.env) |
| Un comando | [`scripts/load/run_load.sh`](../../scripts/load/run_load.sh) `<escenario>` |
| Análisis por ventana y punto de quiebre | [`scripts/load/analyze_k6.py`](../../scripts/load/analyze_k6.py) |
| Workflow | [`.github/workflows/load-test.yml`](../../../.github/workflows/load-test.yml) (manual) |

## 1. Plan

### 1.1 Ambiente: por qué no se estresa staging

La carga pura corre en un **backend efímero dentro del runner de GitHub**, no en la VM de staging:

| | Backend efímero (carga pura) | Staging (corrida chica) |
|---|---|---|
| Imagen de la API | la misma de producción (`services/api/Dockerfile`, `entrypoint.sh` con migraciones y un proceso uvicorn) | la desplegada |
| Postgres + pgvector, Redis | reales (los del `docker-compose.yml`) | reales |
| LLM y embeddings | **simulados** (`mock_llm.py`) | **reales** (`gpt-4o-mini`) |
| Qué mide | la capacidad de **NexusAI** | la latencia real de punta a punta |
| Costo | 0 | centavos (unos 30 chats) |

Hay tres razones:
1. Con el LLM real, el stress mide al proveedor (su cuota, su latencia, sus 429) y no a NexusAI, y gasta plata.
2. Staging es una VM de 1 GB que el smoke de TPC-08 necesita sana.
3. El backend efímero es reproducible: cada corrida arranca de una base vacía.

**Simulación del LLM.** El simulado responde como un modelo flash: **1,5 s ± 0,5 s** el chat, 0,3 s la moderación y 0,15 s los embeddings. Así no se mide un backend que contesta en milisegundos, lo que sería irreal. Los embeddings son *feature hashing* de las palabras, deterministas: una pregunta sobre "pilas" queda cerca del fragmento que habla de pilas, así que **el retrieval encuentra contexto como con un modelo real**. La métrica `chat_con_contexto` lo verifica en cada corrida.

**Qué hace cada pregunta, igual que en producción:**
1. HMAC;
2. límite por minuto en Redis;
3. presupuesto de tokens;
4. moderación (una llamada al LLM, porque producción no tiene `MODERATION_API_KEY`);
5. embedding de la pregunta;
6. búsqueda en pgvector filtrada por `visible_cmids`;
7. prompt con contexto;
8. LLM;
9. respuesta con métricas.

Es el modo stateless de DATA-04 (`history: []`), el que usa el plugin hoy.

**Material.** En el `setup()`, k6 sube por la API un apunte de la unidad "Estructuras de datos" (actividad 101), espera a que quede indexado y desde ahí todas las preguntas lo pueden ver.

### 1.2 Escenarios y umbrales

Los umbrales salen de los SLA de [`services/api/TESTING.md`](../../services/api/TESTING.md) §6. Si un umbral no se cumple, k6 sale con código 99 y el workflow queda en rojo.

| Escenario | Objetivo | Carga | Umbrales |
|---|---|---|---|
| `smoke` | el script y el ambiente andan | 1 VU, 30 s | 100 % de chats OK · p95 < 8 s |
| `sostenido` | **esfuerzo sostenido**: la latencia no crece con el tiempo, sin fugas ni errores acumulados | 10 VUs constantes, **10 min** (10 alumnos preguntando a la vez sin parar, más que un curso típico) | chats OK > 99 % · **p95 del chat < 8 s** (SLA) · p95 de `/health` < 500 ms · 0 respuestas 5xx |
| `stress` | **punto de quiebre** | rampa por escalones de 10, 20, 40, 60, 80 y 100 VUs (2 min cada uno) | no aborta: el análisis por ventana marca dónde el p95 pasa el SLA o los errores pasan el 1 % |
| `rate_limit` | el límite por alumno **protege bajo carga** | 1 alumno, 30 preguntas simultáneas | exactamente **10 respuestas 429** (el límite es 20 por minuto) · 0 respuestas 5xx |
| `dedup` | SLA de la re-subida del mismo archivo (CONT-04) | 20 re-subidas | **p95 < 1 s** (SLA) · todas devuelven el documento existente |
| `real` (staging) | latencia real con el proveedor de verdad | 2 VUs, 2 min | chats OK > 95 % · p95 < 8 s |

**Guarda contra el falso verde.** Cada escenario de chat exige `chats_enviados > 0`. Un umbral sobre una métrica sin muestras pasa "en verde" sin haber probado nada, y se comprobó al escribir el script: con el `setup()` roto, el resumen mostraba los umbrales en ✅. Es la misma lección de los workflows que nunca corrían (#309, #474) del [plan de pruebas](PLAN_DE_PRUEBAS.md) §2.

**Otros supuestos:**
- Cada VU es un alumno distinto, con su propio `user_id`, y "piensa" entre 3 y 5 s entre preguntas.
- El límite **por minuto** queda real (20). El **diario** y el presupuesto de tokens se abren solo en este ambiente: una corrida de 10 minutos hace más preguntas por alumno que un día real, y lo que se mide es la capacidad, no la cuota.

### 1.3 Cómo se corre

```bash
# Local (Docker + k6)
./NexusAI/scripts/load/run_load.sh sostenido     # o smoke | stress | rate_limit | dedup | todos
MOCK_LLM_LATENCY_MS=3000 ./NexusAI/scripts/load/run_load.sh stress   # con un LLM más lento
```

En GitHub: *Actions* → *Pruebas de carga (k6)* → *Run workflow*, eligiendo escenario, latencia y `target`. El reporte queda en el resumen de la corrida y en el artifact `load-report-<escenario>`, que incluye:
- el JSON y el Markdown de k6;
- la salida cruda;
- el análisis por ventana;
- los logs de la API y del LLM simulado.

## 2. Resultados

### 2.1 Corrida oficial, sobre el código final

[Corrida 39330079364](https://github.com/nexusai-ucc/nexusAI/actions/runs/39330079364) (19/10/2026): el escenario `todos` contra el backend efímero (LLM simulado a 1,5 s) y, en paralelo, el escenario `real` contra staging. **Todos los umbrales en verde.**

| Escenario | Carga | Chats | OK | p50 | p95 | p99 | Umbrales |
|---|---|---|---|---|---|---|---|
| `smoke` | 1 VU, 30 s | 5 | 100 % | 1,95 s | 2,45 s | 2,46 s | ✅ |
| `rate_limit` | 30 preguntas simultáneas de un alumno | — | 20 respondidas, **10 cortadas con 429**, 0 con 5xx | — | — | — | ✅ |
| `dedup` | 20 re-subidas del mismo archivo | — | 100 % devuelven el documento existente | 0,00 s | **0,03 s** | 0,14 s | ✅ (SLA < 1 s) |
| `sostenido` | 10 VUs durante 10 min | 1.008 | 100 % | 2,01 s | **2,45 s** | 2,55 s | ✅ (SLA < 8 s) |
| `stress` | rampa hasta 100 VUs | 6.215 | 99,95 % | 2,04 s | **2,52 s** | 2,67 s | sin quiebre |
| `real` (staging, `gpt-4o-mini`) | 2 VUs, 2 min | 35 | 100 % | 2,99 s | **4,39 s** | 5,53 s | ✅ (SLA < 8 s) |

En todos los escenarios con material, el 100 % de los chats recuperó contexto (RAG real). Los 3 chats no-OK del stress (0,05 %) fueron errores de conexión del lado de k6 (`status 0`, código 1000): el backend no registró ningún error y no hubo ni un 5xx.

**Esfuerzo sostenido.** El p95 por minuto se mantuvo entre 2,41 y 2,53 s durante los 10 minutos, sin tendencia a subir. No hubo errores acumulados y al terminar no quedó ninguna conexión retenida (`postgres-conexiones.txt` del artifact).

### 2.2 Stress por escalón: antes y después de DEF-09

El stress encontró un defecto real, [DEF-09](REGISTRO_DEFECTOS.md#def-09). Por cada escalón, el promedio de pedidos/s y el peor p95 y la peor tasa de error de sus ventanas de 30 s:

| VUs | Antes del fix ([39292517339](https://github.com/nexusai-ucc/nexusAI/actions/runs/39292517339)) | Sin registro de consumo, aislamiento ([39296300477](https://github.com/nexusai-ucc/nexusAI/actions/runs/39296300477)) | **Con el fix** ([39330079364](https://github.com/nexusai-ucc/nexusAI/actions/runs/39330079364)) |
|---|---|---|---|
| 10 | 1,8/s · p95 2,44 s · 0 % | 1,9/s · 2,46 s · 0 % | **1,9/s · 2,53 s · 0 %** |
| 20 | 3,9/s · 2,48 s · 0 % | 3,9/s · 2,50 s · 0 % | **4,0/s · 2,46 s · 0 %** |
| 40 | 🔴 2,3/s · **60 s** · 88 % | 7,7/s · 2,46 s · 0,6 % | **7,8/s · 2,55 s · 0,5 %** |
| 60 | 🔴 1,0/s · 60 s · 100 % | 11,4/s · 2,82 s · 0 % | **11,8/s · 2,54 s · 0 %** |
| 80 | 🔴 1,6/s · 60 s · 78 % | 12,0/s · 4,70 s · 0 % | **15,6/s · 2,55 s · 0,2 %** |
| 100 | 🔴 2,0/s · 60 s · 100 % | 12,0/s · 6,74 s · 0 % | **19,4/s · 2,55 s · 0,2 %** |
| **Total** | 68 % OK · 522 registros de consumo perdidos | 99,96 % OK | **99,95 % OK · 0 registros perdidos** |

Las tres columnas cuentan la historia del defecto:
- **antes**, colapso a los 40 VUs;
- **sin el registro**, ya no colapsa, pero el throughput se clava en ~12 pedidos/s y la latencia sube. Es el techo de retener una conexión durante el LLM: 15 conexiones / ~1,2 s de LLM;
- **con el fix** (pool propio para el registro + liberar la conexión antes del LLM), el throughput crece de forma lineal con los usuarios y **el p95 queda plano en ~2,5 s de 10 a 100 VUs**.

## 3. Interpretación

**Capacidad.** Con el LLM a 1,5 s, el backend atiende **100 alumnos simultáneos** (~19 pedidos/s, unas 1.150 preguntas por minuto) con el mismo p95 que atiende a 10. No encontramos el punto de quiebre: lo que limita ahora es la latencia del proveedor, no NexusAI. Más allá de 100 VUs el cuello de botella esperable es el **único proceso uvicorn** (`entrypoint.sh`), que hace todo el trabajo de CPU del proceso (HMAC, armado del prompt, serialización), y no la base.

**Con el LLM real.** En staging, con `gpt-4o-mini`, el p95 fue de **4,39 s**: más alto que con el simulado, pero dentro del SLA de 8 s. Con el fix de DEF-09 la latencia del LLM ya no ocupa conexiones de la base, así que un modelo más lento sube el tiempo de respuesta pero no le quita capacidad a NexusAI. Antes del fix, con un LLM real de ~3 s, el colapso habría llegado con **menos** de la mitad de los usuarios que con el simulado.

**El smoke de 11,6 s (TPC-08)** fue la primera pregunta después de un deploy, un arranque en frío: conexiones, caché de precios del registro y primer handshake TLS con el proveedor. Con 35 preguntas seguidas el máximo fue 5,62 s. Queda dentro del SLA de arranque en frío (< 15 s).

**La VM de staging** (1 GB, 1 OCPU) no es el runner (4 vCPU, 16 GB). Por eso los números de capacidad del §2.2 son del **software**, no de la VM: en staging, la CPU y la memoria van a limitar antes. La corrida `real` con 2 VUs confirma que la cadena desplegada responde dentro del SLA; medir el techo de la VM pediría estresarla, con las contras del §1.1.

**Recomendaciones:**
1. **Configurar `MODERATION_API_KEY`** en producción. Hoy la moderación pasa por el LLM: cada pregunta cuesta dos llamadas al proveedor, una de ellas solo para moderar. Con la API de moderación esa llamada es gratis y mucho más rápida.
2. **Si el uso crece**, levantar uvicorn con 2 workers en la VM de producción, dentro de lo que permita la RAM, antes de cambiar de máquina.
3. **Extender el patrón de DEF-09** (liberar la conexión antes del LLM) al quiz y al resumen de documentos, que también llaman al LLM con la sesión abierta.
4. Correr `sostenido` y `stress` **antes de cada release a `main`**, como pide el criterio de salida del [plan de pruebas](PLAN_DE_PRUEBAS.md) §5.

**Desvío respecto del plan de la épica.** [EPICA_TP_CALIDAD.md](EPICA_TP_CALIDAD.md) decía que "las pruebas de carga van contra staging". La carga pura se hizo en el backend efímero del runner, por las razones del §1.1: medir NexusAI y no al proveedor, no romper el staging que usa el smoke y no gastar plata. Contra staging corre la corrida chica con el LLM real, que es lo que la épica pedía para el proveedor real. El desvío está justificado acá y se informa en el informe final (TPC-11).

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 19/10/2026 | Plan, escenarios, umbrales y herramientas |
| 1.1 | 19/10/2026 | Resultados de la corrida oficial y la real contra staging; stress antes y después de DEF-09; interpretación y recomendaciones |
