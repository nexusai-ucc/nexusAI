# Brief para el Canva

> v0.3, 10/11/2026. Turnos cortos: la parte técnica alterna entre Delfina y Marcos y nadie habla más de 3 minutos seguidos.
>
> v0.2, 05/11/2026. Para que Delfina arme la presentación. Son 27 diapositivas más el respaldo y suman 30 minutos; la parte técnica ocupa 10 (16–26). El texto completo está en [GUION_PRESENTACION.md](GUION_PRESENTACION.md).

## Criterios

- **Poco texto:** un título que afirma algo, no un tema (por ejemplo, "El 80,7 % encuentra la información dispersa" en vez de "Encuesta"), y como mucho 3 renglones.
- **Legible desde el fondo:** letra de 28 pt o más y contraste alto. En el informe, el widget ya pasó la auditoría WCAG.
- **Sin diapositiva de índice ni de "gracias".**
- **Una figura por diapositiva cuando se pueda**, reutilizando `informe-ipi/img/` y los diagramas de `docs/diagrams/`. Los Mermaid se exportan a imagen.
- **Exportar a PDF y a PPTX** y llevar las dos copias en un pendrive, para no depender de Canva online ni del wifi. Los videos de respaldo van como archivos aparte, no embebidos desde internet.
- **Numerar las diapositivas**, así el tribunal puede pedir "volvé a la 14".

## Diapositivas

**Parte técnica (16–26), con más detalle:** cada diapositiva lleva un diagrama y **números reales del código**, no viñetas genéricas. El parámetro va escrito en la diapositiva (por ejemplo, "512 tokens · 64 de solapamiento"), así el tribunal ve que no es una explicación de manual. Para la parte técnica conviene un estilo de diagrama propio y consistente: mismas formas y mismos colores para "navegador", "Moodle/plugin", "backend", "base" y "proveedor de IA" en todas las diapositivas.

| # | Min | Quién | Título (afirmación) | Visual | Fuente del dato |
|---|---|---|---|---|---|
| 1 | 0:00 | Santiago | La misma pregunta, dos respuestas | Dos columnas: chat general / NexusAI con su fuente | Captura del ensayo |
| 2 | 1:30 | Santiago | Y si el material no lo cubre, el profesor se entera | Captura del panel de vacíos | `img/docente-gaps.png` |
| 3 | 2:30 | Santiago | NexusAI · Delfina, Santiago, Marcos · UCC 2026 | Portada sobria | — |
| 4 | 3:00 | Marcos | 166 estudiantes y 17 docentes nos contaron cómo estudian | Íconos con los dos números | Informe, Relevamiento |
| 5 | 4:00 | Marcos | El 80,7 % encuentra la información dispersa | Una barra grande, con campus, WhatsApp y Drive alrededor | Informe, Encuesta a estudiantes |
| 6 | 5:00 | Marcos | Los docentes quieren IA, pero revisando antes | 88,2 % delegaría · 47,1 % con revisión previa | Informe, Encuesta a docentes |
| 7 | 6:00 | Santiago | Una IA que responde con tu material y le avisa al docente lo que falta | La idea clave sola, en grande | — |
| 8 | 7:00 | Santiago | Cuatro aportes | Los 4 aportes y **el QR grande** con "Saquen el celular" | — |
| 9 | 8:00 | Demo | (Pantalla de Moodle) | QR en una esquina + "No escriban datos personales" | — |
| 10 | 16:00 | Delfina | Su pregunta nunca tocó nuestro servidor directamente | 3 capas: celular → plugin `local` (PHP) → FastAPI + PostgreSQL/pgvector. Marcadas: proxy, `require_sesskey`, sin CORS | `docs/diagrams/architecture.md` |
| 11 | 17:30 | Marcos | Dos capas en cada pedido | Header Bearer + `X-Signature = HMAC-SHA256(timestamp + nonce + body)` · ventana 300 s · nonce en Redis → replay = 401 | ADR-005, `auth/hmac.py` |
| 12 | 18:15 | Marcos | Límites que cuidan el costo | 20/min · 50/día · presupuesto de tokens con `INCRBY` atómico · moderación previa | `token_budget.py`, `rate_limit.py`, `moderation.py` |
| 13 | 18:45 | Marcos | Los datos del alumno viven en Moodle | Antes y después: backend con estado / tablas `local_nexusai_*` + Privacy API | ADR-014 |
| 14 | 19:00 | Delfina | De PDF a vectores en un minuto | Pipeline: pdfplumber → 512 tokens / 64 de solapamiento (`cl100k_base`) → embedding de 768 dimensiones → HNSW (`m=16`, `ef_construction=64`). Estados `pending → indexing → indexed` | `docs/diagrams/rag-flow.md`, `chunker.py`, migración 002 |
| 15 | 20:00 | Delfina | Una sola base para datos y vectores | PostgreSQL + pgvector vs. una base vectorial aparte: lo que se ahorra | ADR-002 |
| 16 | 20:30 | Delfina | Top 5, similitud ≥ 0,3 y tres filtros | La consulta: `<=>` coseno + `WHERE curso AND status='indexed' AND cmid IN visibles` → prompt con citas → SSE `meta / token / done` | `retriever.py`, `chat/router.py`, `docs/diagrams/sequence-chat.md` |
| 17 | 21:30 | Delfina | RAG y no reentrenar | Comparación en 3 filas: costo por materia, material nuevo, citas | Guion |
| 18 | 22:00 | Marcos | Cuando el proveedor falla | Cadena: 3 reintentos → modelos intermedios → proveedor secundario, ante 429/503/404/400. DEF-07 como ejemplo | `providers/llm.py`, `INTEGRACION_EXTERNA.md` |
| 19 | 23:00 | Delfina | Cómo sabe que no sabe | Dos señales (similitud < 0,4 · el modelo lo dice) → agrupamiento por embeddings con umbral 0,75 → panel docente | `gaps/recorder.py`, `gaps/router.py` |
| 20 | 24:00 | Marcos | Con 15 chats el pool se agotaba | Diagrama del interbloqueo (chat retiene la conexión + registro pide otra) y gráfico del p95 por escalón, antes y después | `REGISTRO_DEFECTOS.md` DEF-09, `PRUEBAS_DE_CARGA.md` §2 |
| 21 | 25:00 | Marcos | Ningún cambio entra sin pasar el gate | Pipeline: pytest/ruff/mypy · Vitest · PHPUnit/phpcs en matriz de Moodle 4.5/5.0 · SonarCloud · contratos compartidos · CD con smoke | `PLAN_DE_PRUEBAS.md`, `CD_STAGING.md` |
| 22 | 25:30 | Marcos | De 56,6 % a 83,6 % y de 40 problemas a 0 | Antes y después: cobertura, bugs, vulnerabilidades | `METRICAS.md` |
| 23 | 26:00 | Santiago | Scrum, 260+ PRs y un pivote real | Línea de tiempo: MVP 1/6 → post-MVP → Oracle → Marketplace (16 puntos corregidos) | Informe, Gestión del proyecto |
| 24 | 27:00 | Santiago | Lo que cumplimos y lo que no | Objetivos con estado: cumplido / parcial / no cumplido | Informe, Objetivos + piloto |
| 25 | 28:00 | Santiago | US$ 5,81 por alumno por año, y sus límites | Desglose de costos + 3 límites | Informe, Impacto económico y Conclusión |
| 26 | 29:00 | Delfina | La alumna del principio | Vuelve la captura de la diapositiva 1, ahora con la fuente resaltada | — |
| 27 | 29:30 | Delfina | Aportes | Los 4 aportes de la diapositiva 8, cerrando la charla | — |

## Respaldo, después de la 27

| # | Para la pregunta | Visual | Fuente |
|---|---|---|---|
| R1 | ¿Cómo es el modelo de datos? | Diagrama entidad-relación | `docs/diagrams/er-tablas.md` |
| R2 | ¿Dónde corre? | Despliegue en Oracle: staging y producción | `docs/diagrams/deployment.md` |
| R3 | ¿Cuántos alumnos aguanta? | Tabla de escenarios de carga, con la aclaración del LLM simulado | `PRUEBAS_DE_CARGA.md` |
| R4 | ¿Qué hacen si se cae el proveedor? | Cadena de fallback + historial de la prueba contra Gemini | `INTEGRACION_EXTERNA.md` |
| R5 | ¿Y la privacidad? | Qué sale y qué no sale de la institución | Informe, Privacidad |
| R6 | ¿Por qué no un producto existente? | Matriz comparativa | Informe, Opciones similares en el mercado |
| R7 | Los 10 defectos | Tabla DEF-01 a DEF-10 con la técnica que encontró cada uno | `REGISTRO_DEFECTOS.md` |
| R8 | El resto de las funciones | Grilla con capturas: calendario, foros, flashcards, exámenes | `img/` |
| R9 | ¿Qué sigue? | Roadmap: CURSO-01, COST-02 a 04, INFRA-04 | Issues del Sprint G y del backlog |

## Para revisar antes de cerrar el Canva

- [ ] Los números de las diapositivas 20, 22 y 23 recontados con datos de febrero, y los parámetros técnicos de la 10 a la 21 reverificados contra el código congelado.
- [ ] La diapositiva 24 completa con el resultado del piloto.
- [ ] Ensayo cronometrado de la parte técnica: si se pasa de 10 minutos, la 15 (una sola base) y la 17 (RAG y no reentrenar) van al respaldo.
