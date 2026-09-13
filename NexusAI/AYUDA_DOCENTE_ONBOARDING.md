# Ayuda / Onboarding al Docente — detalle funcional

> Documento vivo de la épica de ayuda al docente (issues #424–#431, Sprint E).
> Decisión de arquitectura: [`docs/adr/010-onboarding-docente.md`](docs/adr/010-onboarding-docente.md).
> Plan de implementación: `Ingenieria-UCC/2026/Tesis/onboarding_docente_plan.md` (fuera del repo).

---

## 1. Para qué existe

NexusAI hoy solo acompaña al docente **después** de que el curso está armado.
Esta épica agrega ayuda en tres momentos:

1. **Al crear un curso nuevo** — un tutorial de primeros pasos.
2. **Al editar un curso existente** — una revisión de qué le falta.
3. **Dentro del panel docente** — una pestaña "Ayuda" que explica las
   herramientas propias de NexusAI.

**Regla de oro:** NexusAI **nunca escribe en Moodle**. Cada paso es un link a la
pantalla nativa donde el docente hace la acción él mismo.

---

## 2. Cómo se ve en producción

### 2.1 Crear un curso nuevo

El docente entra a *Cursos → Crear curso nuevo*. El widget de NexusAI detecta la
pantalla (pagetype `course-edit` sin `id`, con capability `moodle/course:create`)
y, en lugar del cartel de "estás fuera de un curso", muestra el tutorial:

```
┌─ NexusAI · Primeros pasos ──────────────────────────┐
│  Armá tu curso paso a paso. Cada paso te lleva a    │
│  la pantalla de Moodle donde lo hacés.              │
│                                                     │
│  1 ○ Completá los datos del curso        [Ir →]     │
│  2 ○ Creá las secciones / unidades        [Ir →]     │
│  3 ○ Subí material a NexusAI              [Ir →]     │
│  4 ○ Matriculá a tus alumnos             [Ir →]     │
│  5 ○ Creá grupos (si tu cursada usa)     [Ir →]     │
│  6 ○ Abrí un foro de consultas           [Ir →]     │
│  7 ○ Cargá fechas de exámenes/entregas   [Ir →]     │
│                                                     │
│  [ Cerrar tutorial ]                                 │
└─────────────────────────────────────────────────────┘
```

En modo `create` los pasos son una **lista fija** (no hay curso todavía sobre el
cual medir estado).

### 2.2 Editar un curso existente

En *Configuración del curso → Editar*, el widget ya tiene el `courseid` real.
Llama a `local_nexusai_course_setup_state` y muestra el mismo panel pero con el
**estado real**:

```
┌─ NexusAI · Revisión de tu curso ────────────────────┐
│  1 ✓ 4 secciones con contenido                       │
│  2 ✓ 12 alumnos matriculados                         │
│  3 ✓ 8 archivos indexados en NexusAI                 │
│  4 ⚠ No armaste grupos todavía          [Ir →] [No aplica] │
│  5 ⚠ No abriste ningún foro de consultas [Ir →]      │
│  6 ⚠ No cargaste fechas en el calendario [Ir →]      │
│                                                     │
│  [ Cerrar ]                                          │
└─────────────────────────────────────────────────────┘
```

- Los ✓ no se muestran como pendientes.
- "No aplica" (ej. una cursada sin grupos a propósito) saca el ítem de futuras
  revisiones.
- Curso completo → mensaje "Tu curso está listo 🎉".

### 2.3 Reabrir la ayuda cuando quieras

Botón fijo (ícono `?`) en el header del widget, visible solo para docentes.
Reabre el panel en modo review con el estado **actualizado** (refetch, no
cache). No depende de que Moodle "detecte que falta algo".

### 2.4 Pestaña "Ayuda" en NexusAI · Materiales

Al lado de Material / Preguntas de alumnos / Analytics / Generar examen /
Buscar, aparece **Ayuda**: una tarjeta por herramienta explicando qué es, para
qué sirve y cómo leerla. Contenido en la sección 5.

---

## 3. Qué pasa por debajo

| Componente | Rol |
|---|---|
| `visibility_helper::resolve()` | Se extiende para devolver `onboarding: 'create-course' \| 'review-course' \| null` según pagetype + params + capability. |
| `before_footer_listener.php` | Pasa el flag `onboarding` al bundle React vía `js_call_amd`. |
| `ChatApp.jsx` | Si `onboarding` está seteado, monta `OnboardingPanel` en vez del estado vacío. |
| `OnboardingPanel.jsx` | Componente único, modos `create` / `review`. Lista de pasos + links a Moodle. |
| `onboarding/steps.js` | Definición de los 7 pasos: id, título, descripción, `moodle_url` relativa, señal de `course_setup_state` que lo marca ✓. |
| `local_nexusai_course_setup_state` (external fn PHP) | Agrega 5 señales de Moodle in-process + 1 del backend. Solo lectura. |
| `local_nexusai_onboarding_state_get/set` (external fn PHP) | Lee/escribe `user_preferences` (`local_nexusai_onb_*`). Único write de la épica, y es en tabla de core. |
| `HelpPanel.jsx` | Pestaña "Ayuda" del panel docente. Contenido estático (sección 5). |

Ningún webservice de escritura de Moodle. Sin tablas nuevas. Sin migración
Alembic. La declaración de Privacy sigue en `null_provider` (ver ADR-006).

---

## 4. Copy de los pasos del tutorial (ONB-08)

> Estructura acá; el texto final se revisa en ONB-08 y se sincroniza con
> `react/src/onboarding/steps.js` (ES + EN).

### Paso 1 — Completá los datos del curso
**Qué:** nombre, nombre corto, categoría, fechas de inicio y fin, descripción.
**Por qué:** el nombre corto es el identificador del curso en toda la
plataforma; las fechas controlan cuándo tus alumnos ven el curso.
**Link:** `/course/edit.php` (esta misma pantalla).

### Paso 2 — Creá las secciones / unidades
**Qué:** dividí el curso en unidades temáticas (semanas, módulos, temas).
**Por qué:** NexusAI usa las secciones para organizar el material y ubicar de
qué unidad viene cada respuesta del asistente.
**Link:** `/course/view.php?id={courseid}` (con edición activada).

### Paso 3 — Subí material a NexusAI
**Qué:** PDFs, apuntes, diapositivas de cada unidad, desde la pestaña "Material"
de NexusAI.
**Por qué:** el asistente solo responde sobre lo que subiste. Sin material
indexado, el chat no tiene de dónde sacar respuestas.
**Link:** `/local/nexusai/documents.php?courseid={courseid}`.

### Paso 4 — Matriculá a tus alumnos
**Qué:** inscribí a los estudiantes (manual, por cohorte, o auto-matriculación
con clave).
**Por qué:** solo los alumnos matriculados pueden usar el asistente del curso.
**Link:** `/user/index.php?id={courseid}` → "Matricular usuarios".

### Paso 5 — Creá grupos (si tu cursada los usa)
**Qué:** comisiones, turnos, grupos de TP.
**Por qué:** si tu curso trabaja por comisión, los grupos te permiten filtrar
analytics y consultas por grupo. Si no los usás, marcá este paso como "no
aplica".
**Link:** `/group/index.php?id={courseid}`.

### Paso 6 — Abrí un foro de consultas
**Qué:** un foro donde los alumnos preguntan y vos (o NexusAI) respondés.
**Por qué:** NexusAI puede resumir hilos largos y sugerirte respuestas sobre el
foro, pero necesita que el foro exista.
**Link:** `/course/view.php?id={courseid}` → "Añadir una actividad" → Foro.

### Paso 7 — Cargá las fechas de exámenes y entregas
**Qué:** parciales, finales, fechas de entrega de TP en el calendario del curso.
**Por qué:** NexusAI muestra estas fechas a los alumnos en el panel Calendario y
puede mandar recordatorios.
**Link:** `/calendar/view.php?view=month&course={courseid}` → "Nuevo evento".

---

## 5. Contenido de la pestaña "Ayuda" (ONB-08)

> Una tarjeta por herramienta. Texto final en ONB-08.

### Material
Acá subís y gestionás los archivos que alimentan al asistente. Cada archivo
pasa por un proceso de indexado (lo ves como "procesando" → "indexado"). Una vez
indexado, el asistente puede citarlo en sus respuestas. Podés reemplazar un
archivo manteniendo su historial.

### Preguntas de alumnos (Gaps + FAQ)
- **Gaps detectados:** temas sobre los que tus alumnos preguntan mucho y el
  material no cubre bien — te señala dónde reforzar.
- **FAQ:** las preguntas más frecuentes agrupadas por tema, para que veas qué
  les cuesta sin leer cada conversación.

### Analytics
Uso del asistente en tu curso: cuántas consultas, en qué unidades se concentran,
evolución en el tiempo. Sirve para ver qué temas generan más dudas.

### Generar examen
Crea un borrador de examen (múltiple choice, V/F, desarrollo) a partir del
material indexado. Exportable en formato GIFT para importar a Moodle. **Siempre
revisá y editá las preguntas antes de usarlas.**

### Buscar
Búsqueda semántica sobre todo el material del curso: encontrás dónde se explica
un concepto aunque no sepas el nombre exacto del archivo.

---

## 6. Estado

Ver `Ingenieria-UCC/2026/Tesis/onboarding_docente_plan.md` (tabla de issues) y
el milestone **Post-MVP Sprint E** en GitHub.
