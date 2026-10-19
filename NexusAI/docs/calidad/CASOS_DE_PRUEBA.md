# Casos de prueba dinámicos (TPC-04)

> Issue [#576](https://github.com/nexusai-ucc/nexusAI/issues/576) · Épica [#584](https://github.com/nexusai-ucc/nexusAI/issues/584) · Versión 1.0, 19/10/2026

Este documento tiene los casos de prueba de **caja negra** de tres funcionalidades núcleo de NexusAI y la cobertura de **caja blanca** que alcanzan. Cada caso indica:
- la técnica con la que se diseñó;
- el requisito que verifica;
- el test automatizado que lo implementa.

La vista completa requisito → caso → defecto está en [TRAZABILIDAD.md](TRAZABILIDAD.md).

**Funcionalidades elegidas.** Son de prioridad alta en el [plan de pruebas](PLAN_DE_PRUEBAS.md) §1 y tienen reglas de entrada explícitas en el código:

| Funcionalidad | Requisitos | Dónde están las reglas |
|---|---|---|
| Chat | HU-001 | `ChatRequest` (`app/chat/schemas.py`), `check_rate_limit` (`app/shared/rate_limit.py`) |
| Subida de documentos | HU-010, HU-011 | `upload_document` y `_decode_and_validate_file` (`app/documents/router.py`) |
| Generación de quiz | HU-030, HU-031 | `QuizRequest` y `generate_quiz` (`app/quiz/router.py`) |

**Técnicas usadas:**

| Sigla | Técnica | Para qué |
|---|---|---|
| **CE** | Partición en clases de equivalencia | Un representante por cada grupo de entradas que el sistema debería tratar igual, válido o inválido |
| **VL** | Análisis de valores límite | Los errores se concentran en los bordes: se prueban n−1, n y n+1 de cada restricción |
| **TD** | Tabla de decisión | Lógica con varias condiciones combinadas: una regla por combinación relevante, cada una con su acción esperada |

## 1. Plantillas

### 1.1 Caso de prueba

| Campo | Contenido |
|---|---|
| **ID** | `CP-<FUNCIÓN>-NN` (CHAT, DOC, QUIZ) |
| **Requisito** | HU o requisito no funcional que verifica |
| **Técnica** | CE, VL o TD (con la clase, el límite o la regla) |
| **Precondición** | Estado necesario antes de ejecutar (material indexado, documento existente…) |
| **Entrada** | Valor concreto que se manda |
| **Resultado esperado** | Respuesta o efecto observable (código HTTP, campo, llamada que no ocurre) |
| **Test automatizado** | `archivo::función` (con el id del parametrize si corresponde) |
| **Estado** | ✅ pasa · 🐞 encontró un defecto (con su ID) |

En las tablas de abajo las columnas se agrupan para que sean legibles. La precondición se escribe solo cuando no es "ninguna".

### 1.2 Defecto

La plantilla de defecto es el formulario de issue [`.github/ISSUE_TEMPLATE/defecto.yml`](../../../.github/ISSUE_TEMPLATE/defecto.yml), definido en TPC-06. Los defectos se registran en [REGISTRO_DEFECTOS.md](REGISTRO_DEFECTOS.md).

## 2. Chat (HU-001)

Tests: [`test_casos_chat.py`](../../services/api/tests/test_casos_chat.py), salvo donde se indica otro archivo. Las restricciones se prueban contra el modelo real `ChatRequest`, que es lo que FastAPI aplica antes del router: un rechazo del modelo es un **422** para el plugin.

### 2.1 Clases de equivalencia

| Variable | Clases válidas | Clases inválidas |
|---|---|---|
| `question` | CE-1: texto de 1 a 2000 caracteres | CE-2: vacío · CE-3: más de 2000 |
| `course_id`, `user_id` | CE-4: entero > 0 | CE-5: 0 o negativo |
| `history` | CE-6: ausente (la conversación la guarda el backend) · CE-7: lista de 0 a 10 turnos (la guarda Moodle, DATA-04) | CE-8: más de 10 turnos |
| `history[].role` | CE-9: `user` · CE-10: `assistant` | CE-11: cualquier otro (`system`) |
| `history[].content` | CE-12: de 1 a 20000 caracteres | CE-13: vacío · CE-14: más de 20000 |
| `token_limit_hourly` | CE-15: de 1 a 10.000.000 | CE-16: 0 · CE-17: más de 10.000.000 |
| Pedidos del día | CE-18: hasta el límite diario | CE-19: por encima del límite |
| Redis | CE-20: disponible | CE-21: caído (el límite no se puede contar) |

### 2.2 Casos

| ID | Técnica | Entrada | Resultado esperado | Test | Estado |
|---|---|---|---|---|---|
| CP-CHAT-01 | VL (n−1), CE-2 | `question=""` | Rechazo en `question` | `test_limite_invalido_se_rechaza[CP-CHAT-01…]` | ✅ |
| CP-CHAT-02 | VL (mín.), CE-1 | `question` de 1 carácter | Se acepta | `test_limite_valido_se_acepta[CP-CHAT-02…]` | ✅ |
| CP-CHAT-03 | VL (máx.), CE-1 | `question` de 2000 | Se acepta | `test_limite_valido_se_acepta[CP-CHAT-03…]` | ✅ |
| CP-CHAT-04 | VL (n+1), CE-3 | `question` de 2001 | Rechazo en `question` | `test_limite_invalido_se_rechaza[CP-CHAT-04…]` | ✅ |
| CP-CHAT-05 | VL, CE-5 | `course_id=0` | Rechazo en `course_id` | `test_limite_invalido_se_rechaza[CP-CHAT-05…]` | ✅ |
| CP-CHAT-06 | VL, CE-4 | `course_id=1` | Se acepta | `test_limite_valido_se_acepta[CP-CHAT-06…]` | ✅ |
| CP-CHAT-07 | VL, CE-5 | `user_id=0` | Rechazo en `user_id` | `test_limite_invalido_se_rechaza[CP-CHAT-07…]` | ✅ |
| CP-CHAT-08 | VL, CE-4 | `user_id=1` | Se acepta | `test_limite_valido_se_acepta[CP-CHAT-08…]` | ✅ |
| CP-CHAT-09 | CE-6 | sin `history` | `stateless=False`: guarda el backend | `test_cp_chat_09_sin_history_es_conversacion_en_el_backend` | ✅ |
| CP-CHAT-10 | CE-7 (borde 0) | `history=[]` | `stateless=True`: una lista vacía **no** equivale a no mandarla | `test_cp_chat_10_history_vacia_es_conversacion_en_moodle` | ✅ |
| CP-CHAT-11 | VL (máx.), CE-7 | 10 turnos | Se acepta | `test_limite_valido_se_acepta[CP-CHAT-11…]` | ✅ |
| CP-CHAT-12 | VL (n+1), CE-8 | 11 turnos | Rechazo en `history`; por HTTP, 422 | `test_limite_invalido_se_rechaza[CP-CHAT-12…]` · [`test_chat_stateless.py::test_history_is_limited_to_ten_messages`](../../services/api/tests/test_chat_stateless.py) | ✅ |
| CP-CHAT-13 | VL (mín.), CE-12 | turno de 1 carácter | Se acepta | `test_limite_valido_se_acepta[CP-CHAT-13…]` | ✅ |
| CP-CHAT-14 | VL (máx.), CE-12 | turno de 20000 | Se acepta | `test_limite_valido_se_acepta[CP-CHAT-14…]` | ✅ |
| CP-CHAT-15 | VL (n−1), CE-13 | turno vacío | Rechazo en `history` | `test_limite_invalido_se_rechaza[CP-CHAT-15…]` | ✅ |
| CP-CHAT-16 | VL (n+1), CE-14 | turno de 20001 | Rechazo en `history` | `test_limite_invalido_se_rechaza[CP-CHAT-16…]` | ✅ |
| CP-CHAT-17 | VL (mín.), CE-15 | límite horario 1 | Se acepta | `test_limite_valido_se_acepta[CP-CHAT-17…]` | ✅ |
| CP-CHAT-18 | VL (máx.), CE-15 | límite horario 10.000.000 | Se acepta | `test_limite_valido_se_acepta[CP-CHAT-18…]` | ✅ |
| CP-CHAT-19 | VL (n−1), CE-16 | límite horario 0 | Rechazo | `test_limite_invalido_se_rechaza[CP-CHAT-19…]` | ✅ |
| CP-CHAT-20 | VL (n+1), CE-17 | límite horario 10.000.001 | Rechazo | `test_limite_invalido_se_rechaza[CP-CHAT-20…]` | ✅ |
| CP-CHAT-21 | CE-9 | turno `user` | Se acepta | `test_rol_del_historial[CP-CHAT-21…]` | ✅ |
| CP-CHAT-22 | CE-10 | turno `assistant` | Se acepta | `test_rol_del_historial[CP-CHAT-22…]` | ✅ |
| CP-CHAT-23 | CE-11 | turno `system` | Rechazo: el cliente no puede inyectar instrucciones de sistema | `test_rol_del_historial[CP-CHAT-23…]` | ✅ |
| CP-CHAT-24 | VL (n), CE-18 | pedido número *límite* del día | Pasa | [`test_rate_limit.py::test_permite_hasta_el_limite_diario`](../../services/api/tests/test_rate_limit.py) | ✅ |
| CP-CHAT-25 | VL (n+1), CE-19 | pedido *límite + 1* | **429** | [`test_rate_limit.py::test_bloquea_al_superar_el_limite_diario`](../../services/api/tests/test_rate_limit.py) | ✅ |
| CP-CHAT-26 | CE-21 | Redis no responde | Pasa (*fail-open*: el límite es una protección, no un control de seguridad) | [`test_rate_limit.py::test_falla_abierto_cuando_redis_no_responde`](../../services/api/tests/test_rate_limit.py) | ✅ |

## 3. Subida de documentos (HU-010, HU-011)

Tests: la sección "Casos de prueba TPC-04" de [`test_documents_router.py`](../../services/api/tests/test_documents_router.py), más los tests de ese archivo que ya existían y cubrían una regla. Esos se enlazan, no se duplican.

### 3.1 Tabla de decisión

`POST /api/v1/documents` evalúa las condiciones en este orden. Un `—` significa que la condición no llega a evaluarse, porque una anterior ya decidió.

| Condición / Acción | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 | R11 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C1 · MIME soportado | N | S | S | S | S | S | S | S | S | S | S |
| C2 · Ya hay uno `indexed` con el mismo curso, nombre y hash (HU-011) | — | S | S | S | S | N | N | N | N | N | N |
| C3 · Actividad (`cmid`) del existente → de la nueva | — | sin → sin | sin → con | igual | distinta | — | — | — | — | — | — |
| C4 · Hay un documento activo con el mismo nombre | — | — | — | — | S | S | N | N | N | N | N |
| C5 · Base64 válido y no vacío | — | — | — | — | — | — | N | S | S | S | S |
| C6 · Tamaño ≤ 20 MB | — | — | — | — | — | — | — | N | S | S | S |
| C7 · Primeros bytes coherentes con el MIME | — | — | — | — | — | — | — | — | N | sin firma | S |
| **Acción** | **415** | **200** reutiliza | **200** reutiliza y adopta la actividad | **200** sin cambios | **409** | **409** | **400** | **413** | **400** | **202** | **202** |

### 3.2 Casos

| ID | Técnica | Precondición · Entrada | Resultado esperado | Test | Estado |
|---|---|---|---|---|---|
| CP-DOC-01 | TD R1, CE | `mime_type=image/png` | 415 | `test_upload_rejects_unsupported_mime_type` | ✅ |
| CP-DOC-02 | TD R2 | el mismo PDF ya indexado, sin actividad en los dos | 200 con el documento existente, sin crear otro | `test_upload_existing_hash_returns_200` | ✅ |
| CP-DOC-03 | TD R11 | PDF nuevo válido | 202, `status=pending` | `test_upload_new_document_returns_202` | ✅ |
| CP-DOC-04 | TD R3 | existente sin actividad · nuevo con `cmid=7` | 200, el existente adopta `cmid=7`, sin crear otro | `test_cp_doc_04_duplicado_sin_actividad_adopta_la_nueva` | ✅ |
| CP-DOC-05 | TD R4 | existente con `cmid=7` · nuevo con `cmid=7` | 200, sin escribir en la base | `test_cp_doc_05_duplicado_de_la_misma_actividad_se_reutiliza` | ✅ |
| CP-DOC-06 | TD R5 | existente con `cmid=7` · nuevo con `cmid=9` | 409; el existente **conserva** `cmid=7` (VIS-01) | `test_cp_doc_06_mismo_archivo_en_otra_actividad_es_colision` | ✅ (ver observación) |
| CP-DOC-07 | TD R6 | otro documento activo con el mismo nombre y otro contenido | 409 con el nombre en el mensaje | `test_cp_doc_07_mismo_nombre_con_otro_contenido_es_colision` | ✅ |
| CP-DOC-08 | TD R7, CE | `content_b64` que no es base64 | 400 | `test_upload_rejects_invalid_base64` | ✅ |
| CP-DOC-09 | TD R9, CE | se declara PDF, el contenido empieza con `MZ` | 400, sin crear el documento | `test_cp_doc_09_contenido_que_no_coincide_con_el_mime` | ✅ |
| CP-DOC-10 | TD R10, CE | `text/markdown` con texto cualquiera | 202: los formatos de texto no tienen firma | `test_cp_doc_10_mime_sin_firma_no_verifica_magic_bytes` | ✅ |
| CP-DOC-11 | VL (n−1), TD R11 | archivo de 20 MB − 1 byte | Se acepta | `test_limite_de_tamano[CP-DOC-11…]` | ✅ |
| CP-DOC-12 | VL (n), TD R11 | archivo de **20 MB exactos** | Se acepta: el límite es inclusivo | `test_limite_de_tamano[CP-DOC-12…]` | ✅ |
| CP-DOC-13 | VL (n+1), TD R8 | archivo de 20 MB + 1 byte | 413 | `test_limite_de_tamano[CP-DOC-13…]` | ✅ |
| CP-DOC-14 | TD R7 (caja blanca) | archivo vacío, llamando a `_decode_and_validate_file` | 400 `File is empty` | `test_cp_doc_14_archivo_vacio_a_nivel_unitario` | ✅ |

**Observación sobre CP-DOC-06.** Si un docente quiere usar el mismo PDF en dos actividades, la segunda subida da 409 y el mensaje le pide borrar el archivo existente. No es un defecto: es la consecuencia de VIS-01, porque cambiarle la actividad al documento cambiaría quién lo ve. Pero el mensaje no explica por qué. Queda como mejora de usabilidad para el backlog.

## 4. Generación de quiz (HU-030, HU-031)

Tests: [`test_casos_quiz.py`](../../services/api/tests/test_casos_quiz.py) para las restricciones de `QuizRequest`, y la sección "Casos de prueba TPC-04" de [`test_quiz_router.py`](../../services/api/tests/test_quiz_router.py) para la tabla de decisión, que necesita el endpoint completo.

### 4.1 Clases de equivalencia

| Variable | Clases válidas | Clases inválidas |
|---|---|---|
| `num_questions` | CE-1: de 1 a 10 | CE-2: 0 o menos · CE-3: más de 10 |
| `topic` | CE-4: ausente o en blanco (todo el material) · CE-5: texto de hasta 200 caracteres | CE-6: más de 200 |
| `question_type` | CE-7: cada uno de `multiple_choice`, `true_false`, `open`, `mix`, `flashcard`, `fill_blank` | CE-8: otro valor · CE-9: un valor válido con otras mayúsculas |
| `difficulty` | CE-10: `easy`, `medium`, `hard` | CE-11: vacío · CE-12: con otras mayúsculas |
| `persist_flashcards` | CE-13: `true` (guarda el backend) · CE-14: `false` (guarda Moodle, DATA-04) | — |

### 4.2 Casos de clases y límites

| ID | Técnica | Entrada | Resultado esperado | Test | Estado |
|---|---|---|---|---|---|
| CP-QUIZ-01 | VL (n−1), CE-2 | `num_questions=0` | Rechazo | `test_valores_limite[CP-QUIZ-01…]` | ✅ |
| CP-QUIZ-02 | VL (mín.), CE-1 | `num_questions=1` | Se acepta | `test_valores_limite[CP-QUIZ-02…]` | ✅ |
| CP-QUIZ-03 | VL (máx.), CE-1 | `num_questions=10` | Se acepta | `test_valores_limite[CP-QUIZ-03…]` | ✅ |
| CP-QUIZ-04 | VL (n+1), CE-3 | `num_questions=11` | Rechazo | `test_valores_limite[CP-QUIZ-04…]` | ✅ |
| CP-QUIZ-05 | VL (máx.), CE-5 | `topic` de 200 | Se acepta | `test_valores_limite[CP-QUIZ-05…]` | ✅ |
| CP-QUIZ-06 | VL (n+1), CE-6 | `topic` de 201 | Rechazo | `test_valores_limite[CP-QUIZ-06…]` | ✅ |
| CP-QUIZ-07 | CE-4, CE-10 | sin parámetros opcionales | 5 preguntas, `multiple_choice`, `medium`, sin tema | `test_cp_quiz_07_valores_por_defecto` | ✅ |
| CP-QUIZ-08 | CE-7 | cada uno de los 6 tipos | Se acepta | `test_tipos_de_pregunta_validos[CP-QUIZ-08 …]` | ✅ |
| CP-QUIZ-09 | CE-8 | `question_type=essay` | Rechazo | `test_clases_invalidas[CP-QUIZ-09…]` | ✅ |
| CP-QUIZ-10 | CE-9 | `Multiple_Choice` | Rechazo: la comparación es exacta | `test_clases_invalidas[CP-QUIZ-10…]` | ✅ |
| CP-QUIZ-11 | CE-11 | `difficulty=""` | Rechazo | `test_clases_invalidas[CP-QUIZ-11…]` | ✅ |
| CP-QUIZ-12 | CE-12 | `difficulty=HARD` | Rechazo; por HTTP, 422 | `test_clases_invalidas[CP-QUIZ-12…]` · `test_quiz_router.py::test_generate_rejects_invalid_difficulty_at_http_level` | ✅ |
| CP-QUIZ-20 | CE-13 | flashcards con `persist_flashcards=true` | 200 con `content_hash`; el backend las guarda | `test_quiz_router.py::test_flashcards_se_guardan_solo_si_lo_pide_el_plugin[CP-QUIZ-20…]` | ✅ |
| CP-QUIZ-21 | CE-14 | flashcards con `persist_flashcards=false` | 200 con `content_hash`; **no** se guardan | `test_quiz_router.py::test_flashcards_se_guardan_solo_si_lo_pide_el_plugin[CP-QUIZ-21…]` | ✅ |
| CP-QUIZ-22 | CE-7 (no flashcard) | quiz de opción múltiple | 200; 4 opciones mezcladas y `correct_index` apuntando a la correcta; sin `content_hash` ni guardado | `test_quiz_router.py::test_cp_quiz_22_quiz_de_opcion_multiple_no_se_persiste` | ✅ |

### 4.3 Tabla de decisión: quiz con tema (HU-031)

Con tema, `generate_quiz` decide en dos pasos:
1. compara la similitud máxima del retrieval contra `QUIZ_TOPIC_MIN_SIMILARITY` (0,5);
2. pregunta al LLM si el tema está realmente en los fragmentos (YES/NO).

| Condición / Acción | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 |
|---|---|---|---|---|---|---|---|
| C1 · Hay tema (no vacío después de quitar espacios) | S | S | S | S | S | N | N |
| C2 · El retrieval del tema funciona | S | S | S | S | N | — | — |
| C3 · Similitud máxima ≥ 0,5 | N | S | S | S | — | — | — |
| C4 · Respuesta del LLM de relevancia | — | NO | YES | falla | — | — | — |
| C5 · El curso tiene material visible | — | — | — | — | — | S | N |
| **Acción** | **422** sin llamar al LLM | **422** con el tema en el mensaje | **200** | **200** (*fail-open*) | **503** | **200** | **404** |

| ID | Técnica | Entrada | Resultado esperado | Test | Estado |
|---|---|---|---|---|---|
| CP-QUIZ-13 | TD Q1, VL (n−0,01) | similitud 0,49 | 422 y 0 llamadas al LLM | `test_quiz_con_tema_umbral_de_similitud[CP-QUIZ-13…]` | ✅ |
| CP-QUIZ-14 | TD Q3, VL (n) | similitud **0,50 exacta**, LLM YES | 200: el umbral es inclusivo; 2 llamadas (relevancia y generación) | `test_quiz_con_tema_umbral_de_similitud[CP-QUIZ-14…]` | ✅ |
| CP-QUIZ-15 | TD Q2 | similitud 0,8, LLM NO | 422 con el tema en el mensaje; no se genera nada | `test_cp_quiz_15_q2_el_llm_dice_que_el_tema_no_esta` | ✅ |
| CP-QUIZ-16 | TD Q4 | similitud 0,8, el LLM de relevancia falla | 200: se genera igual | `test_cp_quiz_16_q4_si_el_chequeo_de_relevancia_falla_se_genera_igual` | ✅ |
| CP-QUIZ-17 | TD Q5 | el retrieval lanza una excepción | 503, sin llamar al LLM | `test_cp_quiz_17_q5_si_el_retrieval_falla_responde_503` | ✅ |
| CP-QUIZ-18 | TD Q6, CE-4 | `topic="   "` | 200 como "sin tema": no busca el tema ni consulta la relevancia | `test_cp_quiz_18_tema_en_blanco_equivale_a_sin_tema` | ✅ |
| CP-QUIZ-19 | TD Q1, en inglés | similitud 0,3 con `Accept-Language: en-US` | 422 con el mensaje en inglés | `test_cp_quiz_19_tema_sin_material_responde_en_el_idioma_de_la_interfaz` | 🐞 **DEF-08** (corregido) |
| CP-QUIZ-23 | TD Q6 | sin tema, con material | 200 | `test_quiz_router.py::test_generate_flashcards_returns_200_with_expected_shape` | ✅ |
| CP-QUIZ-24 | TD Q7 | sin tema, sin material | 404, en el idioma de la interfaz | `test_quiz_router.py::test_generate_quiz_404_message_follows_the_interface_language` | ✅ |

**Discrepancia entre requisito e implementación (HU-031).** El criterio de aceptación dice: *"similaridad < 0.4 o menos de 3 matches"*. El código usa otra regla: similitud máxima < **0,5** más una **verificación con el LLM**, sin contar matches. Los casos se diseñaron sobre lo que hace el sistema, porque el cambio fue deliberado: el comentario de `QUIZ_TOPIC_MIN_SIMILARITY` explica que 0,4 dejaba pasar coincidencias espurias entre idiomas. Pero el requisito quedó desactualizado. Acción: actualizar el criterio de HU-031 en `entrega-final/05_historias_usuario.md`. Queda registrado en la matriz de trazabilidad.

## 5. Cobertura de caja blanca

Se midió con `pytest --cov-branch` sobre la suite completa del backend, **antes** (`development` @ `e5cd5ac`) y **después** de los casos de este documento:
- **cobertura de sentencia:** líneas ejecutadas;
- **cobertura de decisión:** ramas de cada `if`, `for` o `while` tomadas en los dos sentidos.

**Por función bajo prueba**, que es la unidad que los casos recorren:

| Función | Sentencia antes | Sentencia después | Decisión antes | Decisión después |
|---|---|---|---|---|
| `documents.router.upload_document` | 23/27 (85,2 %) | **27/27 (100 %)** | 7/10 (70,0 %) | **10/10 (100 %)** |
| `documents.router._decode_and_validate_file` | 12/15 (80,0 %) | **15/15 (100 %)** | 5/8 (62,5 %) | **8/8 (100 %)** |
| `quiz.router.generate_quiz` | 16/36 (44,4 %) | **35/35 (100 %)** | 8/14 (57,1 %) | **14/14 (100 %)** |
| `shared.rate_limit.check_rate_limit` | 17/17 (100 %) | 17/17 (100 %) | 2/2 (100 %) | 2/2 (100 %) |

**Por módulo:**

| Módulo | Sentencia antes | Sentencia después | Decisión antes | Decisión después |
|---|---|---|---|---|
| `app/chat/schemas.py` | 100 % | 100 % | sin decisiones | sin decisiones |
| `app/documents/router.py` | 84,2 % | 86,7 % | 68,8 % | 81,2 % |
| `app/quiz/router.py` | 88,9 % | 91,6 % | 80,0 % | 83,8 % |
| `app/shared/rate_limit.py` | 100 % | 100 % | 100 % | 100 % |

`generate_quiz` pasa de 36 a 35 sentencias porque el fix de DEF-08 reescribió el mensaje como una llamada a `localized()`.

**Qué muestra la caja blanca que la caja negra sola no mostraba:**
1. **`ChatRequest` tenía 100 % de sentencias antes de cualquier caso de límite.** Las restricciones de Pydantic (`min_length`, `max_length`, `gt`) son declarativas: se "ejecutan" al importar el módulo, así que la cobertura de código no dice nada sobre si los límites están probados. Para estas reglas, **la cobertura de sentencia es ciega y solo el análisis de valores límite las verifica**.
2. **Toda la rama "quiz con tema" de HU-031 estaba sin ejecutar** (44 % de sentencias en `generate_quiz`): el umbral, la consulta de relevancia y su *fail-open*. La tabla de decisión la recorre entera, y al recorrerla apareció **DEF-08**.
3. **Ningún test generaba por `/generate` un quiz que no fuera de flashcards.** La rama falsa de `if payload.question_type == "flashcard" and questions` estaba sin tomar; la cubre CP-QUIZ-22.
4. **Una rama no se puede alcanzar desde la API.** "Archivo vacío" (`if not file_bytes`) es imposible por HTTP: `content_b64` exige al menos un carácter, y ningún base64 válido no vacío decodifica a 0 bytes. Es código defensivo para otros llamadores. Se cubre a nivel unitario (CP-DOC-14) y se deja: protege `replace_document` si algún día cambia su validación.

**Lo que queda sin cubrir en los módulos** está fuera de estas tres funcionalidades: otros endpoints del router de quiz (exámenes, plan de estudio, evaluación de respuestas abiertas) y de documentos (preview, descarga). Se sigue en la cobertura general del pipeline ([PRINCIPIOS_TESTING.md](PRINCIPIOS_TESTING.md)).

## 6. Cómo se reproducen

```bash
cd NexusAI/services/api
# Solo los casos de este documento
pytest tests/test_casos_chat.py tests/test_casos_quiz.py \
       tests/test_documents_router.py tests/test_quiz_router.py tests/test_rate_limit.py -v
# Cobertura de sentencia y de decisión
pytest --cov=app.chat.schemas --cov=app.documents.router --cov=app.quiz.router \
       --cov=app.shared.rate_limit --cov-branch --cov-report=term-missing
```

El id de cada parametrize lleva el ID del caso, así que la salida de `pytest -v` se lee contra estas tablas: por ejemplo, `test_limite_de_tamano[CP-DOC-12 20 MB exactos] PASSED`.

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 19/10/2026 | Casos de chat, subida y quiz (CE, VL y dos tablas de decisión), cobertura antes y después, DEF-08 |
