# Historias de usuario y criterios de aceptación

## Convenciones

Las historias de usuario siguen el formato estándar de Scrum:

> **Como** [rol], **quiero** [funcionalidad], **para** [beneficio].

Cada historia tiene asociados:

- Una **épica** padre (agrupación temática).
- Una **prioridad** (Alta / Media / Baja).
- Una **estimación en story points** (escala Fibonacci: 1, 2, 3, 5, 8).
- Un **responsable** asignado.
- Un **sprint** donde se completó.
- **Criterios de aceptación** en formato Dado/Cuando/Entonces.

## Resumen agregado del backlog

| Categoría | Cantidad de historias | Story points totales |
|---|---|---|
| Investigación | 14 | ~38 |
| Setup | 10 | ~22 |
| Backend Python | 14 | ~85 |
| Plugin Moodle | 8 | ~40 |
| Frontend React | 8 | ~26 |
| Gestión Scrum (sprint planning, reviews, retros, dailies) | 10 | ~10 |
| Features Sprint 4 (A-G) | 7 + sub-tareas | ~70 |
| **Total MVP** | **70+ historias** | **~290 SP** |

El backlog completo se incluye como anexo en el archivo `NexusAI - Backlog
Completo.xlsx` del pendrive de entrega. A continuación se documentan las
épicas principales con ejemplos representativos.

## Épica 1 — Asistente conversacional con RAG

Permitir al alumno hacer consultas en lenguaje natural sobre el material
del curso y recibir respuestas contextualizadas con citas trazables.

### HU-001 — Chat básico del alumno

> **Como** alumno, **quiero** abrir un widget de chat desde mi curso de
> Moodle y hacer una pregunta en lenguaje natural, **para** obtener
> respuestas inmediatas sobre el material de mi materia.

**Criterios de aceptación:**

1. **Dado** que estoy logueado en un curso de Moodle con material indexado, **cuando** abro el widget flotante (FAB), **entonces** veo el panel de chat con un input y mensaje de bienvenida.
2. **Dado** el panel de chat abierto, **cuando** escribo una pregunta y presiono Enter, **entonces** mi mensaje aparece en pantalla y se envía al backend.
3. **Dado** una pregunta enviada, **cuando** el backend responde, **entonces** la respuesta del asistente aparece en una burbuja diferenciada (no mi propia).

### HU-002 — Citas trazables a la fuente

> **Como** alumno, **quiero** ver de qué archivo y fragmento proviene
> cada respuesta del asistente, **para** poder verificar y profundizar en
> el material original.

**Criterios de aceptación:**

1. **Dado** una respuesta del asistente que usa material indexado, **cuando** veo el mensaje, **entonces** debajo aparece una sección "Fuentes:" con pills (chips) por cada archivo citado.
2. **Dado** las pills de fuentes, **cuando** hago click en una, **entonces** se expande inline mostrando el fragmento exacto del archivo y su porcentaje de similaridad con mi pregunta.
3. **Dado** que el sistema no encontró material relevante, **cuando** veo la respuesta, **entonces** la respuesta admite explícitamente que no puede responder con el material disponible.

### HU-003 — Streaming token-por-token

> **Como** alumno, **quiero** ver la respuesta del asistente aparecer
> palabra por palabra mientras el LLM la genera, **para** no esperar
> varios segundos en blanco antes de leer algo.

**Criterios de aceptación:**

1. **Dado** una pregunta enviada al backend, **cuando** el primer token está disponible, **entonces** aparece en pantalla en menos de 2 segundos.
2. **Dado** que la respuesta se está streameando, **cuando** veo el texto, **entonces** un caret azul parpadeante (▍) aparece al final indicando que sigue llegando contenido.
3. **Dado** que el stream termina, **cuando** la respuesta está completa, **entonces** el caret desaparece y aparecen las pills de fuentes.

## Épica 2 — Gestión de material por parte del docente

Permitir al docente subir, monitorear y eliminar el material que el
asistente usará para responder.

### HU-010 — Upload de PDFs por el docente

> **Como** docente, **quiero** poder subir archivos PDF al curso desde
> una página dedicada, **para** que el asistente pueda usarlos para
> responder a mis alumnos.

**Criterios de aceptación:**

1. **Dado** que tengo capability `local/nexusai:manage` en el curso, **cuando** ingreso a NexusAI · Materials, **entonces** veo una zona de drag-and-drop para subir archivos.
2. **Dado** que arrastro un PDF válido, **cuando** se sube, **entonces** aparece en la tabla con estado `pending` y luego `indexing`.
3. **Dado** que el archivo está siendo indexado, **cuando** la indexación termina exitosamente, **entonces** su estado pasa a `indexed` y queda disponible para consultas.
4. **Dado** que el archivo no se puede procesar (PDF escaneado sin OCR, corrupto, etc.), **cuando** termina el procesamiento, **entonces** su estado es `error` con mensaje explicativo en tooltip.

### HU-011 — Detección de duplicados

> **Como** docente, **quiero** que el sistema detecte si subo dos veces
> el mismo archivo, **para** no duplicar material indexado.

**Criterios de aceptación:**

1. **Dado** que un archivo ya está indexado en el curso, **cuando** subo el mismo contenido (mismo SHA-256), **entonces** el sistema reconoce el duplicado y devuelve el documento existente sin re-indexar.

## Épica 3 — Buscador semántico (Feature A)

Búsqueda pura del material sin pasar por el LLM, útil para encontrar
fragmentos rápidamente.

### HU-020 — Buscar fragmentos por similaridad

> **Como** alumno, **quiero** buscar fragmentos del material del curso
> con una query en lenguaje natural sin esperar al LLM, **para**
> encontrar rápido en qué archivo está un tema.

**Criterios de aceptación:**

1. **Dado** que abro la pestaña "Buscador" del widget, **cuando** escribo una consulta y presiono buscar, **entonces** recibo en menos de 1 segundo una lista de fragmentos ordenados por similaridad.
2. **Dado** los resultados, **cuando** miro cada uno, **entonces** veo el nombre del archivo, el texto del fragmento (~400 chars), y el porcentaje de similaridad coloreado (verde > 75%, naranja 50-75%, gris < 50%).
3. **Dado** que el curso no tiene material indexado, **cuando** busco algo, **entonces** veo el mensaje "No encontré fragmentos relacionados".

## Épica 4 — Quiz generator (Feature F)

Generación de preguntas de opción múltiple para autoevaluación.

### HU-030 — Generar quiz desde el material

> **Como** alumno, **quiero** generar un quiz de opción múltiple sobre
> el material del curso, **para** repasar antes de un parcial.

**Criterios de aceptación:**

1. **Dado** que abro la pestaña "Quiz", **cuando** elijo cantidad (3/5/7/10) y opcionalmente un tema, **entonces** click en "Generar quiz" inicia la generación.
2. **Dado** una pregunta generada, **cuando** la veo, **entonces** tiene exactamente 4 opciones (A/B/C/D) y un botón "Verificar".
3. **Dado** que selecciono una opción y presiono verificar, **cuando** la corrección aparece, **entonces** veo si acerté + explicación + archivo fuente.
4. **Dado** que termino todas las preguntas, **cuando** veo la pantalla final, **entonces** muestra el score (X/N), el porcentaje, e icono según rango (trofeo ≥80%, pulgar 50-80%, libro <50%).

### HU-031 — Tema sin material disponible

> **Como** alumno, **quiero** que el sistema me avise si pido un quiz
> sobre un tema que no está en el material, **para** no recibir un quiz
> aleatorio engañoso.

**Criterios de aceptación:**

1. **Dado** que escribo un tema en el campo "Tema", **cuando** ese tema no tiene chunks relevantes en el material (similaridad < 0.4 o menos de 3 matches), **entonces** veo un mensaje claro pidiendo otro tema o dejar el campo vacío.

## Épica 5 — Historial de conversaciones (Feature E)

Permitir al alumno retomar conversaciones previas.

### HU-040 — Lista de sesiones previas

> **Como** alumno, **quiero** ver mis conversaciones anteriores y
> retomar una específica, **para** continuar el estudio donde lo dejé.

**Criterios de aceptación:**

1. **Dado** que tengo sesiones de chat previas, **cuando** click en el botón 🕐 del header, **entonces** se abre un dropdown con la lista ordenada por última actividad.
2. **Dado** la lista, **cuando** miro cada item, **entonces** veo preview del primer mensaje, tiempo relativo (ej: "hace 2 horas"), y cantidad de mensajes.
3. **Dado** que selecciono una sesión, **cuando** click, **entonces** se cargan sus mensajes en el chat y puedo continuar la conversación enviando nuevas preguntas.

## Épica 6 — Multi-curso (Feature B)

Permitir consultas que crucen el material de varios cursos del alumno.

### HU-050 — Activar modo multi-curso

> **Como** alumno enrollado en varios cursos, **quiero** poder hacer
> consultas que crucen el material de todas mis materias, **para**
> encontrar conexiones entre temas relacionados.

**Criterios de aceptación:**

1. **Dado** que estoy en el chat, **cuando** click en el botón 📚 del header, **entonces** cambia a 🌐 y el status indica "Activo · todos tus cursos".
2. **Dado** el modo multi-curso activo, **cuando** hago una pregunta, **entonces** la respuesta usa material de todos mis cursos enrollados y las pills citan la materia de cada fragmento.

## Épica 7 — Detección de gaps del docente (Feature G)

Feedback loop pedagógico automático.

### HU-060 — Ver gaps detectados

> **Como** docente, **quiero** ver una lista de preguntas que mis
> alumnos hicieron y que el material no pudo responder bien, **para**
> identificar qué temas debo agregar al curso.

**Criterios de aceptación:**

1. **Dado** que tengo capability `local/nexusai:manage` en el curso, **cuando** ingreso a NexusAI · Materials → tab "Gaps detectados", **entonces** veo una lista de preguntas agrupadas por similitud.
2. **Dado** la lista, **cuando** miro cada item, **entonces** veo la pregunta, cuántas veces se preguntó, la fecha de la última vez, y la similaridad promedio del material.
3. **Dado** que filtro por ventana temporal, **cuando** cambio entre 7 días / 30 días / 90 días / 365 días, **entonces** la lista se actualiza.


