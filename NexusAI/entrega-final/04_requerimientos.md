# Análisis de requerimientos

## Convenciones

Cada requerimiento tiene:

- Un **ID único** (RF-NN para funcionales, RNF-NN para no funcionales).
- Una **prioridad** (Alta / Media / Baja) en el contexto del MVP.
- Un **sprint asignado** donde se implementó.

## Requerimientos funcionales

### Asistente conversacional RAG

| ID | Requerimiento | Prioridad | Sprint |
|---|---|---|---|
| RF-01 | Como alumno, debo poder hacer una consulta en lenguaje natural sobre el material del curso desde un widget flotante en el campus virtual. | Alta | 1 |
| RF-02 | El asistente debe responder usando exclusivamente el material indexado del curso, citando explícitamente los archivos fuente. | Alta | 2 |
| RF-03 | Si la pregunta no se puede responder con el material disponible, el sistema debe admitirlo explícitamente sin inventar respuestas. | Alta | 2 |
| RF-04 | El alumno debe poder ver el fragmento exacto del material que el sistema usó para responder, con su porcentaje de similaridad. | Alta | 4 |
| RF-05 | La respuesta del LLM debe aparecer token-por-token (streaming) para reducir la latencia perceived. | Media | 4 |
| RF-06 | El alumno debe poder retomar conversaciones anteriores desde un historial accesible. | Media | 4 |
| RF-07 | El alumno debe poder activar opcionalmente el modo multi-curso, donde el asistente consulta material de todos sus cursos enrollados. | Media | 4 |

### Buscador semántico

| ID | Requerimiento | Prioridad | Sprint |
|---|---|---|---|
| RF-08 | El alumno debe poder buscar fragmentos del material del curso por similaridad semántica, sin pasar por el LLM. | Media | 4 |
| RF-09 | Cada resultado del buscador debe mostrar el archivo, el fragmento de texto, y el porcentaje de similaridad. | Media | 4 |

### Quiz generator

| ID | Requerimiento | Prioridad | Sprint |
|---|---|---|---|
| RF-10 | El alumno debe poder generar un quiz de práctica de opción múltiple desde el material del curso. | Media | 4 |
| RF-11 | El alumno debe poder elegir un tema específico o dejar el campo vacío para variedad de temas. | Media | 4 |
| RF-12 | Si el tema solicitado no está en el material, el sistema debe avisar al alumno (no generar quiz aleatorio engañoso). | Media | 4 |
| RF-13 | Cada pregunta debe tener exactamente 4 opciones, una correcta y tres distractores plausibles. | Media | 4 |
| RF-14 | El alumno debe recibir feedback inmediato después de cada respuesta con explicación y archivo fuente. | Media | 4 |

### Gestión de material (rol docente)

| ID | Requerimiento | Prioridad | Sprint |
|---|---|---|---|
| RF-15 | Como docente, debo poder subir archivos PDF al curso para que sean indexados por el asistente. | Alta | 2 |
| RF-16 | El sistema debe extraer texto, chunking y embeddings de cada archivo de manera asíncrona. | Alta | 2 |
| RF-17 | El docente debe ver el estado de cada documento (pending / indexing / indexed / error). | Alta | 2 |
| RF-18 | El docente debe poder borrar un documento. El borrado debe propagarse en cascada a los chunks vectorizados. | Alta | 2 |
| RF-19 | El sistema debe detectar uploads duplicados por hash SHA-256 y evitar re-indexar el mismo archivo. | Media | 4 |

### Feedback loop al docente (detección de gaps)

| ID | Requerimiento | Prioridad | Sprint |
|---|---|---|---|
| RF-20 | El sistema debe registrar automáticamente las preguntas que el material no pudo responder. | Media | 4 |
| RF-21 | El docente debe poder ver un reporte agregado de gaps de su curso, ordenado por frecuencia. | Media | 4 |
| RF-22 | El reporte de gaps debe filtrarse por ventana temporal (7 días / 30 días / 90 días / 365 días). | Baja | 4 |

## Requerimientos no funcionales

### Seguridad

| ID | Requerimiento | Justificación |
|---|---|---|
| RNF-01 | La API key del LLM no debe llegar nunca al navegador del alumno. | Patrón Hybrid PHP Proxy (ADR-001), HMAC server-to-server (ADR-005). |
| RNF-02 | Toda comunicación entre el plugin Moodle y el backend debe firmarse con HMAC SHA-256 con 3 capas (Bearer + firma + nonce Redis). | ADR-005. |
| RNF-03 | El backend debe rechazar requests con firma inválida, timestamp expirado (>5 min) o nonce reusado (replay). | Anti-replay. |
| RNF-04 | El plugin debe validar capability `local/nexusai:use` antes de enviar requests al backend. | Aislamiento por curso. |
| RNF-05 | El backend debe validar ownership de las sesiones de chat (un usuario no puede leer sesiones ajenas). | Privacy. |

### Performance

| ID | Requerimiento | Valor objetivo |
|---|---|---|
| RNF-06 | Latencia al primer token de respuesta del LLM (streaming) | < 2 s |
| RNF-07 | Latencia de respuesta completa del chat (sin streaming) | < 8 s |
| RNF-08 | Latencia del buscador semántico (retrieval puro) | < 1 s |
| RNF-09 | Tiempo de indexación de un PDF de 50 páginas | < 60 s |

### Compatibilidad

| ID | Requerimiento |
|---|---|
| RNF-10 | El plugin debe instalarse en Moodle 4.1 LTS hasta 4.5 sin requerir composer install ni dependencias externas. |
| RNF-11 | El widget de chat debe funcionar en los navegadores principales (Chrome, Firefox, Safari, Edge) en versiones actuales. |
| RNF-12 | El backend debe correr sobre Python 3.11+ con PostgreSQL 16+ y pgvector 0.3.5+. |

### Privacidad y soberanía de datos

| ID | Requerimiento |
|---|---|
| RNF-13 | Los datos académicos (mensajes, documentos, embeddings) deben vivir en una base de datos controlada por la institución que hospeda el backend. |
| RNF-14 | El plugin debe declarar correctamente su Privacy API según la versión de Moodle (`null_provider` en MVP, `metadata\provider` planificado). |
| RNF-15 | Multi-provider LLM: la institución debe poder cambiar el proveedor del LLM sin modificar código (variable de entorno). |

### Mantenibilidad

| ID | Requerimiento |
|---|---|
| RNF-16 | Cobertura de tests automatizados del backend Python ≥ 70%. |
| RNF-17 | CI/CD en GitHub Actions para backend, frontend y plugin PHP. |
| RNF-18 | Decisiones arquitectónicas documentadas como ADRs en `docs/adr/`. |
| RNF-19 | Cada feature documentada con: ADR (si aplica), comentarios en código, issue en GitHub con criterios de aceptación. |

### Distribución

| ID | Requerimiento |
|---|---|
| RNF-20 | El plugin debe distribuirse como ZIP descargable instalable vía Site administration → Plugins → Install plugins. |
| RNF-21 | Cada release debe estar etiquetada en GitHub con changelog y la versión `version.php` actualizada. |


