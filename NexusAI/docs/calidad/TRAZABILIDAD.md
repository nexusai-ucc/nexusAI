# Matriz de trazabilidad: requisito → caso → test → defecto (TPC-04)

> Issue [#576](https://github.com/nexusai-ucc/nexusAI/issues/576) · Épica [#584](https://github.com/nexusai-ucc/nexusAI/issues/584) · Versión 1.2, 21/10/2026

La matriz responde dos preguntas:
- **hacia adelante:** ¿qué prueba verifica cada requisito?
- **hacia atrás:** ¿de qué requisito sale cada defecto encontrado?

Los requisitos son los del alcance del [plan de pruebas](PLAN_DE_PRUEBAS.md) §1:
- las historias de usuario de [`entrega-final/05_historias_usuario.md`](../../entrega-final/05_historias_usuario.md);
- los dos requisitos no funcionales transversales: visibilidad del material y privacidad.

Sirve también para encontrar **brechas**: requisitos o criterios de aceptación sin prueba. Se marcan como tales, sin inventar cobertura.

**Fuentes de cada columna:**
- **Casos:** los casos diseñados con técnicas de caja negra están en [CASOS_DE_PRUEBA.md](CASOS_DE_PRUEBA.md) (CP-CHAT, CP-DOC, CP-QUIZ). Para las demás HU se listan los tests que verifican sus criterios de aceptación.
- **Defectos:** los registrados en [REGISTRO_DEFECTOS.md](REGISTRO_DEFECTOS.md).
- **Rutas:** `api/` = `services/api/tests/`; `plugin/` = `plugin/local/nexusai/tests/`; `widget/` = `plugin/local/nexusai/react/src/`.

## 1. Matriz por requisito

| Requisito | Criterios | Casos de caja negra | Tests automatizados | Defectos | Estado |
|---|---|---|---|---|---|
| **HU-001** Chat básico del alumno | 1. widget con input · 2. la pregunta se envía · 3. la respuesta aparece diferenciada | CP-CHAT-01…26 (CE, VL) | `api/test_casos_chat.py` · `api/test_chat_stateless.py` · `api/test_rate_limit.py` · `plugin/external/chat_and_replace_test.php::test_chat_send_stores_the_conversation`, `test_chat_send_rejects_invalid_input` · `widget/ChatApp.test.jsx` · `widget/components/ChatInput.test.jsx` | [DEF-02](REGISTRO_DEFECTOS.md#def-02) (preguntas por voz rechazadas) · [DEF-09](REGISTRO_DEFECTOS.md#def-09) (colapso bajo carga) | ✅ Cubierto |
| **HU-002** Citas trazables a la fuente | 1. pills de fuentes · 2. fragmento y similitud al expandir · 3. "no encontré" sin material | — | `api/test_retriever.py::test_format_single_chunk_includes_filename_and_index`, `test_format_multiple_chunks_are_numbered_sequentially`, `test_retrieve_context_returns_empty_when_all_below_threshold` · `api/test_contract_responses.py` (forma de `sources`) · `widget/ChatApp.test.jsx` ("renderiza las fuentes citadas…", "muestra el estado no encontré…") | — | ✅ Cubierto (sin casos formales) |
| **HU-003** Streaming token por token | tokens a medida que llegan, error a mitad del stream | — | `api/test_providers.py::test_chat_stream_yields_deltas`, `test_chat_stream_falls_back_to_secondary_on_quota_error` · `api/test_chat_stateless.py::test_stateless_stream_puts_everything_in_done` · `widget/api/chat.test.js` ("procesa meta → tokens → done…", "dispara onError…") · `widget/ChatApp.test.jsx` (error a mitad del stream) | — | ✅ Cubierto |
| **HU-010** Subida de PDFs por el docente | 1. zona de drag-and-drop · 2. `pending` → `indexing` · 3. → `indexed` · 4. `error` con mensaje | CP-DOC-01, 03, 07…14 (TD R1, R6…R11; VL de tamaño) | `api/test_documents_router.py` · `api/test_pipeline.py::test_index_document_indexes_successfully`, `test_index_document_marks_error_on_extraction_failure` · `api/test_providers.py::test_embed_many_keeps_response_order_when_the_provider_omits_index` · `widget/documents/UploadZone.test.jsx` · `plugin/external/document_functions_test.php` | [DEF-07](REGISTRO_DEFECTOS.md#def-07) (indexación en lote con Gemini) | ✅ Cubierto |
| **HU-011** Detección de duplicados | 1. mismo SHA-256 → devuelve el existente sin reindexar | CP-DOC-02, 04, 05, 06 (TD R2…R5) | `api/test_documents_router.py` · `api/test_pipeline.py::test_index_document_skips_if_chunks_already_exist` | — | ✅ Cubierto. Observación de usabilidad en CP-DOC-06 |
| **HU-020** Búsqueda por similitud | resultados por similitud, sin pasar por el LLM | — | `api/test_search_router.py` (forma, deduplicación, umbral, cursos inválidos, 503) · `api/test_contract_responses.py` (`search.json`) · `plugin/external/search_query_test.php` · `widget/components/SearchPanel.test.jsx` | — | ✅ Cubierto |
| **HU-030** Generar quiz desde el material | quiz de N preguntas sobre el material del curso | CP-QUIZ-01…12, 20…23 (CE, VL) | `api/test_casos_quiz.py` · `api/test_quiz_router.py` · `plugin/external/quiz_functions_test.php` · `widget/components/QuizPanel.test.jsx` · `widget/api/quiz.test.js` | [DEF-01](REGISTRO_DEFECTOS.md#def-01) (racha y flashcards ignoraban la respuesta de Moodle) | ✅ Cubierto |
| **HU-031** Tema sin material disponible | 1. tema sin material → mensaje claro pidiendo otro tema | CP-QUIZ-13…19, 24 (TD Q1…Q7, VL del umbral) | `api/test_quiz_router.py` (sección TPC-04) | [DEF-08](REGISTRO_DEFECTOS.md#def-08) (mensaje siempre en español) | ✅ Cubierto. ⚠️ **El criterio está desactualizado** (§3) |
| **HU-040** Lista de sesiones previas | 1. lista por última actividad · 2. preview, tiempo relativo y cantidad · 3. retomar una sesión | — | `plugin/external/chat_history_functions_test.php::test_sessions_list_shows_the_conversations`, `test_session_messages_returns_the_conversation`, `test_session_messages_protects_other_conversations` · `widget/components/StudentHistory.test.jsx` ("lista las conversaciones y elegir una avisa al chat") | — | 🟡 Parcial: falta verificar el orden y el tiempo relativo (criterio 2) |
| **HU-050** Modo multicurso | 1. el botón cambia el modo · 2. la respuesta usa todos los cursos y cita la materia | — | `plugin/visible_material_test.php::test_several_courses_give_one_flat_list`, `test_add_to_body_uses_course_ids_when_present` · `api/test_search_router.py::test_search_returns_empty_when_no_valid_course_ids` | — | 🔴 **Brecha**: ningún test del backend verifica que el chat recupere material de varios cursos y cite la materia (criterio 2) |
| **HU-060** Gaps detectados para el docente | 1. preguntas agrupadas por similitud · 2. pregunta, veces, fecha y similitud · 3. filtro de 7/30/90/365 días | — | `api/test_gaps_router.py` (agrupado semántico, orden, promedio de similitud, paginado) · `api/test_gaps_recorder.py` · `plugin/external/chat_history_functions_test.php::test_gaps_list_groups_the_unanswered_questions`, `test_student_cannot_see_the_gaps` · `widget/documents/TeacherInsights.test.jsx` | — | 🟡 Parcial: los tests usan siempre `days=30`; falta verificar que cambiar la ventana cambie la lista (criterio 3) |
| **VIS** Visibilidad del material (VIS-01…06) | un alumno nunca recibe material que no ve en Moodle | CP-DOC-06 (no se reasigna la actividad) | `api/test_visibility.py` · `plugin/visible_material_test.php` · `plugin/course_isolation_test.php` · `plugin/visibility_helper_test.php` · `plugin/forum_access_guard_test.php` | — | ✅ Cubierto |
| **PRIV** Privacidad (Privacy API, GDPR) | export y borrado completos de un usuario | — | `plugin/privacy_provider_test.php` · `plugin/privacy_provider_tables_test.php` · `plugin/backend_tasks_test.php` · `api/test_privacy_router.py` | [DEF-03](REGISTRO_DEFECTOS.md#def-03) (el provider no exportaba ni borraba) · [DEF-04](REGISTRO_DEFECTOS.md#def-04) (posts de foro no purgados) | ✅ Cubierto |
| **INT** Contrato plugin ↔ backend (TPC-07) | firma HMAC y respuestas que el plugin entiende | — | `api/test_contract_hmac.py` · `api/test_contract_responses.py` · `plugin/external/contract_test.php` · `api/test_hmac.py` | — | ✅ Cubierto ([INTEGRACION_EXTERNA.md](INTEGRACION_EXTERNA.md)) |

## 2. Vista hacia atrás: de cada defecto a su requisito

| Defecto | Requisito | Lo detectó | Test de regresión |
|---|---|---|---|
| [DEF-01](REGISTRO_DEFECTOS.md#def-01) | HU-030 (práctica: racha y flashcards) | Tests unitarios del widget (TPC-05) | `widget/api/quiz.test.js` · `widget/api/ajaxUsage.test.js` |
| [DEF-02](REGISTRO_DEFECTOS.md#def-02) | HU-001 (pregunta por voz) | Uso real | `plugin/chat_voice_transcribe_test.php` · `api/test_voice_router.py` |
| [DEF-03](REGISTRO_DEFECTOS.md#def-03) | PRIV | Primera corrida de PHPUnit sobre el provider | `plugin/privacy_provider_test.php` |
| [DEF-04](REGISTRO_DEFECTOS.md#def-04) | PRIV | Auditoría para el Marketplace | `plugin/backend_tasks_test.php` |
| [DEF-05](REGISTRO_DEFECTOS.md#def-05) | — (proceso: pipeline de publicación) | Pipeline | la corrida del workflow |
| [DEF-06](REGISTRO_DEFECTOS.md#def-06) | — (proceso: aislamiento de tests) | Pipeline | `plugin/external/external_testcase.php::tearDown` |
| [DEF-07](REGISTRO_DEFECTOS.md#def-07) | HU-010 (indexación) | Prueba contra el proveedor real (TPC-07) | `api/test_providers.py::test_embed_many_keeps_response_order_when_the_provider_omits_index` |
| [DEF-08](REGISTRO_DEFECTOS.md#def-08) | HU-031 | **Tabla de decisión** de HU-031 (CP-QUIZ-19) | `api/test_quiz_router.py::test_cp_quiz_19_tema_sin_material_responde_en_el_idioma_de_la_interfaz` |
| [DEF-09](REGISTRO_DEFECTOS.md#def-09) | HU-001 y el objetivo de rendimiento del plan | **Prueba de stress** (TPC-09) | `api/test_db_pool_contention.py` · `api/test_chat_stateless.py::test_messages_releases_the_db_connection_before_calling_the_llm` |
| [DEF-10](REGISTRO_DEFECTOS.md#def-10) | — (dependencias de terceros) | Pipeline: auditorías `pip-audit` y `npm audit` | las mismas auditorías, en cada PR |

DEF-05, DEF-06 y DEF-10 no salen de un requisito del producto: son defectos del proceso (CI y tests) o de las dependencias. Se listan para que la vista hacia atrás esté completa.

## 3. Brechas y discrepancias

| Tipo | Requisito | Qué falta | Acción propuesta |
|---|---|---|---|
| 🔴 Brecha | HU-050, criterio 2 | Test del backend: chat con `course_ids` de varios cursos → el retrieval busca en todos y las fuentes llevan la materia (`course_names`) | Test de integración del retriever con dos cursos (backlog de TPC-05) |
| 🟡 Parcial | HU-040, criterio 2 | Orden por última actividad y tiempo relativo en la lista | Test de `StudentHistory` con fechas fijas |
| 🟡 Parcial | HU-060, criterio 3 | Que la ventana de días filtre | Test de `/gaps/list` con filas de distintas fechas y `days` 7 contra 365 |
| ⚠️ Discrepancia | HU-031, criterio 1 | El criterio dice "similaridad < 0.4 o menos de 3 matches"; el código usa similitud < 0,5 más verificación con el LLM ([CASOS_DE_PRUEBA.md](CASOS_DE_PRUEBA.md) §4.3) | Actualizar el criterio en `05_historias_usuario.md`. El cambio fue deliberado: 0,4 dejaba pasar coincidencias espurias entre idiomas |

**Resumen:** de 14 requisitos, 11 están cubiertos, 2 parcialmente y 1 tiene una brecha. Hay una discrepancia entre requisito y código, y los 10 defectos registrados quedan trazados.

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 19/10/2026 | Matriz de 14 requisitos, vista hacia atrás de DEF-01 a DEF-08, brechas y discrepancias |
| 1.1 | 19/10/2026 | DEF-09 (encontrado por la prueba de stress) |
| 1.2 | 21/10/2026 | DEF-10 (dependencias) |
