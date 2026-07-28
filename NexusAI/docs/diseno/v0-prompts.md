# Prompts de v0.dev para pulir la UI de NexusAI

Cómo usar este documento: para cada pantalla, copiá el prompt completo en
[v0.dev](https://v0.dev), adjuntá la captura real indicada (están en
`informe-ipi/img/`) como referencia visual, y generá el diseño. Traé el
resultado (código o el link de v0) para portarlo a los componentes React
reales — estos prompts no reemplazan la lógica existente, solo piden una
capa visual más pulida sobre ella.

## Sistema de diseño actual (no inventar uno nuevo)

Todos los prompts de abajo ya incluyen este bloque, pero por si se arma un
prompt nuevo a mano, estos son los tokens reales del plugin
(`react/src/styles.css`):

```
Color primario:     #6366f1 (hover #4f46e5)
Fondos:             #ffffff / #f8fafc / #f1f5f9
Texto:              #0f172a (principal) / #64748b (secundario)
Bordes:             #e2e8f0
Radius:             4px / 8px / 10px / 12px / 16px / full (pills)
Sombras:            sutiles, el FAB tiene un tinte índigo
Fuente:              -apple-system, "Segoe UI", Roboto, sans-serif
Iconos:             estilo lucide (stroke, no rellenos), sin emojis
Tamaño del panel:   400×600px en desktop, bottom-sheet full-screen en mobile
```

Estética de referencia pedida en todos los prompts: **Linear, Vercel, v0.dev
mismo** — SaaS premium, minimalista, con jerarquía visual clara y micro
detalles cuidados (no un rediseño completo de marca).

---

## 1. Chat widget (pantalla principal, alumno)

**Qué es:** el widget de chat flotante que abre el alumno desde la navbar de
Moodle. Muestra la conversación con el asistente, respuestas en streaming,
citas a la fuente del material, e input de mensaje.

**Captura de referencia:** `informe-ipi/img/chat-widget.png`

**Prompt:**

> Rediseñá esta pantalla de chat de un asistente académico embebido en un LMS
> (tipo intercom/crisp pero para estudio). Es un panel de 400×600px anclado
> bajo un ícono de navbar, no una app full-screen.
>
> Sistema de diseño a respetar: color primario `#6366f1` (hover `#4f46e5`),
> fondos `#ffffff`/`#f8fafc`, texto `#0f172a`/`#64748b`, bordes `#e2e8f0`,
> radius entre 8px y 16px, fuente sans-serif del sistema, iconos estilo
> lucide (stroke, sin rellenos), sin emojis.
>
> La pantalla adjunta muestra: header con avatar del asistente + nombre +
> estado "Active · based on your course" + 4 íconos de acción; una respuesta
> del asistente citando la fuente ("Fuente: nombre del PDF") con un chip
> clickeable debajo; input de texto con botón de enviar; footer con texto
> "Answers based on your course content".
>
> Mejorá jerarquía visual, espaciado entre mensajes, el tratamiento del chip
> de cita (que se vea claramente interactivo/clickeable), y el estado vacío
> (primera vez que se abre, con las 3 sugerencias de pregunta). Buscá una
> estética tipo Linear/Vercel — premium pero minimalista, no recargada.
> Mantené el tamaño de panel y la posición del input abajo fijo.

---

## 2. Modo Estudio — Plan personalizado (alumno)

**Qué es:** la pestaña por defecto de "Modo Estudio". Combina errores de
quiz y preguntas sin responder del chat en una recomendación proactiva de
qué repasar, con un botón para practicar ese tema puntual.

**Captura de referencia:** `informe-ipi/img/studymode-plan.png`

**Prompt:**

> Rediseñá esta pantalla de "plan de estudio personalizado" dentro de un
> panel de 400×600px (mismo contexto de un widget embebido en un LMS, no una
> app full-screen). Mismo sistema de diseño que el resto del prompt: primario
> `#6366f1`, fondos `#ffffff`/`#f8fafc`, texto `#0f172a`/`#64748b`, bordes
> `#e2e8f0`, radius 8-16px, iconos lucide, sin emojis.
>
> La pantalla tiene 3 tabs arriba (Plan / Practice / Review, el primero
> activo) y debajo una lista de "cards" de tema recomendado: cada card tiene
> un ícono, el nombre del tema, una razón en texto de por qué se sugiere
> (basada en preguntas reales del alumno), un contador de "preguntas sin
> responder", y un botón "Practice this topic".
>
> Mejorá la card para que se sienta más "recomendación proactiva de un
> coach" que una fila de tabla — pensá en cómo herramientas como Linear o
> Notion presentan sugerencias accionables. Diseñá también el estado vacío
> (cuando no hay temas pendientes — "¡Vas bien!") con el mismo nivel de
> cuidado que el estado con contenido, no como un afterthought.

---

## 3. Modo Estudio — Quiz de práctica (alumno)

**Qué es:** el reproductor de preguntas de práctica generadas por IA sobre
el material del curso, con feedback inmediato por respuesta.

**Captura de referencia:** `informe-ipi/img/studymode-quiz.png`

**Prompt:**

> Rediseñá esta pantalla de quiz de práctica dentro de un panel de 400×600px
> embebido en un LMS. Mismo sistema de diseño: primario `#6366f1`, fondos
> `#ffffff`/`#f8fafc`, texto `#0f172a`/`#64748b`, bordes `#e2e8f0`, radius
> 8-16px, iconos lucide, sin emojis.
>
> La pantalla muestra: contador "Question X of N", el enunciado de la
> pregunta, 4 opciones de respuesta con letra (A/B/C/D) en un badge circular,
> y un botón "Check" abajo a la derecha.
>
> Mejorá el tratamiento visual de las opciones de respuesta (que se sientan
> claramente clickeables/seleccionables, con un estado hover y uno
> seleccionado bien diferenciados) y el contraste del progreso (X de N). No
> tengo capturado el estado de feedback (correcto/incorrecto) — diseñalo
> también: verde/rojo sutil, no estridente, con espacio para una explicación
> corta debajo de la opción correcta.

---

## 4. Buscador semántico (alumno y docente)

**Qué es:** búsqueda híbrida sobre el material del curso, con filtros por
tipo de archivo y por unidad/sección, resultados con el término resaltado.
Se reusa igual para alumno y para docente.

**Captura de referencia:** `informe-ipi/img/search-widget.png`

**Prompt:**

> Rediseñá esta pantalla de búsqueda dentro de un panel de 400×600px embebido
> en un LMS (mismo contexto de widget, no una app de búsqueda full-screen).
> Sistema de diseño: primario `#6366f1`, fondos `#ffffff`/`#f8fafc`, texto
> `#0f172a`/`#64748b`, bordes `#e2e8f0`, radius 8-16px, iconos lucide, sin
> emojis.
>
> La pantalla tiene: input de búsqueda + botón "Search"; una fila de chips
> de filtro por tipo de archivo (All/PDF/Word/PowerPoint/Excel/Text/CSV/
> Markdown/HTML); un selector de sección/unidad; y debajo, resultados en
> cards con ícono de archivo, nombre del PDF, fecha, y un fragmento de texto
> con el término de búsqueda resaltado.
>
> Mejorá la densidad de los chips de filtro (hoy son muchos y compiten
> visualmente con el resto) y el resaltado del término buscado dentro del
> fragmento (que se note pero no rompa la lectura). Diseñá también el estado
> "sin resultados" con el mismo cuidado.

---

## 5. Panel docente — Gestión de material

**Qué es:** pantalla donde el docente sube material del curso (PDF, Word,
etc.) y ve el estado de indexación de cada archivo. Vive en una página
completa de Moodle (`documents.php`), no en el widget flotante — puede usar
más ancho.

**Captura de referencia:** `informe-ipi/img/docente-panel.png`

**Prompt:**

> Rediseñá esta pantalla de gestión de materiales para un docente, dentro de
> una página completa de un LMS (no un panel angosto — hay más ancho
> disponible que en un widget de chat). Sistema de diseño: primario
> `#6366f1`, fondos `#ffffff`/`#f8fafc`, texto `#0f172a`/`#64748b`, bordes
> `#e2e8f0`, radius 8-16px, iconos lucide, sin emojis.
>
> La pantalla tiene: una barra de tabs (Material / Gaps detectados /
> Preguntas frecuentes / Generar examen / Buscar); un banner informativo
> arriba explicando qué hace la herramienta; una dropzone grande de
> "arrastrá tu archivo acá o hacé click"; y debajo, una tabla de material ya
> indexado con nombre de archivo, badge de estado ("Indexado"), fecha, y
> acción de eliminar.
>
> Mejorá la dropzone para que se sienta más invitante sin perder la
> seriedad de una herramienta de trabajo (no un producto de consumo), y la
> tabla de materiales para que escanee mejor con muchos archivos (hoy es una
> tabla simple). Diseñá también los estados "pending"/"indexing"/"error" del
> badge de estado, con la misma paleta semántica que ya usa el resto del
> plugin (verde éxito, azul en progreso, rojo error).

---

## Backlog — pantallas para una segunda tanda (sin prompt armado todavía)

Mismo sistema de diseño y mismo criterio (SaaS premium, sin recargar) aplica
a todas estas cuando se aborden:

- **Repaso** (`ReviewPanel.jsx`) — historial de errores agrupado por archivo
  fuente, con sugerencias de repaso generadas por IA.
- **Calendario** (`CalendarPanel.jsx`) — próximos exámenes/entregas leídos
  del calendario nativo de Moodle.
- **Gaps detectados — docente** (`GapsPanel.jsx`) — ya hay captura real en
  `informe-ipi/img/docente-gaps.png`, falta el prompt.
- **Preguntas frecuentes / FAQ dashboard — docente** (`FaqDashboardPanel.jsx`) —
  preguntas más repetidas agrupadas por tema por IA.
- **Generador de exámenes — docente** (`ExamGeneratorPanel.jsx`) — banco de
  preguntas editable, exportable a formato GIFT.
- **Chrome más chico**: `NavMenu.jsx` (menú "Ir a"), `HistoryDropdown.jsx`
  (historial de conversaciones) — más rápidos, se pueden resolver junto con
  el chat widget cuando se porte el resultado del prompt 1.
