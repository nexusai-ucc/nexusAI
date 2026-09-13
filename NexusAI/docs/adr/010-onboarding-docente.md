# ADR-010: Alcance del copiloto de ayuda / onboarding al docente

| | |
|---|---|
| **Estado** | Propuesta |
| **Fecha** | 2026-08-30 |
| **Autor/es** | Santiago Tricherri |
| **Decididores** | Equipo NexusAI (pendiente aprobación en PR) |

---

## Contexto

Hasta hoy NexusAI solo existe **dentro de un curso ya creado** (pestaña
"NexusAI · Materiales" + chat flotante). El docente que arma un curso nuevo
—sobre todo si no domina Moodle— no tiene ninguna guía: crea el curso a ciegas
y recién ve NexusAI cuando ya está todo hecho.

En la reunión con Leandro (profesor) surgió el pedido de que NexusAI **acompañe
al docente mientras arma y mantiene su curso**, no solo cuando ya está listo.
Se identificaron tres momentos:

1. **Crear un curso nuevo** — guía de "primeros pasos".
2. **Editar un curso existente** — revisión de qué le falta.
3. **Una pestaña "Ayuda"** dentro de Materiales — explicación de las
   herramientas que el propio equipo construyó (Gaps, Analytics, FAQ, generador
   de examen, buscador).

La épica se descompone en 8 issues (#424–#431). Antes de tocar código hace
falta fijar el alcance para no construir tres features separadas ni abrir la
puerta a que NexusAI escriba en Moodle.

### Fuerzas en juego

- **Tiempo:** Sprint E, ~20 SP. No hay margen para infraestructura pesada.
- **Riesgo de scope creep:** "ayudar a armar el curso" puede interpretarse como
  "crear grupos/foros/matrícula automáticamente". Eso es otro proyecto
  (automatización con escritura en Moodle) y multiplica el riesgo de romper
  datos del docente.
- **Privacy (ADR-006):** hoy el plugin declara `null_provider` — no persiste
  datos personales en Moodle. Cualquier cosa que persistamos tiene que caber en
  esa declaración o forzaría migrar a `metadata\provider`.
- **Bundle:** el `chatwidget` está cerca del límite de 600 KB de webpack
  (ver ADR-008 pendiente). El componente nuevo entra ahí.
- **Reuso:** los tres puntos de entrada muestran esencialmente la misma UI
  (una lista de pasos con links). Conviene un solo componente.

## Decisión

### 1. Una sola feature reusable, tres puntos de montaje

Se construye **un** componente `OnboardingPanel` con dos modos (`create` y
`review`) y se monta en tres lugares:

| Punto de entrada | Página Moodle | `courseid` | Modo | Origen de los pasos |
|---|---|---|---|---|
| Crear curso nuevo | `course/edit.php` (sin `id`) | 0 | `create` | Lista fija de 7 pasos |
| Editar curso existente | `course/edit.php?id=X` | \>0 | `review` | `course_setup_state` (ONB-02) |
| Pestaña "Ayuda" | panel docente (`DocumentsManager`) | \>0 | — (contenido estático) | `HelpPanel` (ONB-07/08) |

El botón de "reabrir ayuda" (ONB-06) reusa el mismo `OnboardingPanel` en modo
`review`.

### 2. NexusAI NO escribe nada en Moodle

Alcance **estrictamente de lectura y guía**:

- Cada paso del tutorial es un **link a la pantalla nativa de Moodle** donde el
  docente hace la acción él mismo.
- NexusAI no crea ni modifica cursos, secciones, grupos, foros, matrículas ni
  eventos de calendario.
- La automatización de esas acciones queda **explícitamente fuera de alcance**
  de esta épica (y de esta tesis, salvo decisión futura formalizada en otro
  ADR).

### 3. Señales del "estado de setup" del curso (entrada para ONB-02)

El endpoint de ONB-02 devuelve, por curso, un booleano + un conteo para cada
una de estas señales:

| Señal | Fuente | API |
|---|---|---|
| `sections` — secciones con contenido | Moodle, in-process | `get_fast_modinfo()` / `course_get_format()->get_sections()` |
| `groups` — grupos definidos | Moodle, in-process | `groups_get_all_groups($courseid)` |
| `students` — alumnos matriculados | Moodle, in-process | `count_enrolled_users($context, '', 0, true)` filtrando rol estudiante |
| `forums` — foros del curso | Moodle, in-process | `$DB->count_records('forum', ['course' => $courseid])` |
| `calendar` — eventos del curso | Moodle, in-process | `calendar_get_events()` scopeado al curso, ventana −30d…+365d |
| `material` — material indexado en NexusAI | Backend Python | `GET /api/v1/courses/{id}/stats` (ya existe, BACK-13) |

Si más adelante se agrega una señal, se actualiza este ADR con un cambio menor
(la lista de señales no es "inmutable" como la decisión de fondo).

### 4. El endpoint es una external function PHP, no un endpoint FastAPI nuevo

`local_nexusai_course_setup_state` vive en el plugin. Junta las 5 señales de
Moodle **en el mismo proceso** (sin webservices remotos ni round-trips HTTP) y
agrega la señal de material pegándole al backend vía `backend_client`. Si el
backend no responde, `material` degrada a `present: null` y el resto funciona.

**Por qué no en FastAPI:** el backend Python no puede consultar
grupos/foros/matrícula de Moodle sin que el plugin se los pase primero. Si el
plugin ya los tiene, mandarlos al backend para que los devuelva es una llamada
de red de más, sin ningún valor agregado.

### 5. Persistencia del estado del tutorial: user preferences de Moodle

ONB-05 necesita recordar, **por docente + curso**:

- `local_nexusai_onb_dismissed_{courseid}` — bool, "cerré el tutorial".
- `local_nexusai_onb_skipped_{courseid}` — JSON array, ítems marcados "no
  aplica a mi curso".

Se guardan con `set_user_preference()` (tabla core `user_preferences`).
**No** se crean tablas `local_nexusai_*` nuevas. **No** se usa `localStorage`
(tiene que sobrevivir a cambiar de dispositivo).

**Impacto en Privacy (ADR-006):** `user_preferences` es una tabla de core, no
del plugin, y core ya la cubre en su propio provider. El plugin sigue sin
tablas propias con datos personales → **`null_provider` se mantiene**. Se
documenta la preferencia en el `get_metadata` igualmente si migramos a futuro.

### 6. Detección de la pantalla y del rol

**Pagetype = `course-edit`** — idéntico para crear y para editar. El pagetype
se deriva del path del script: `course/edit.php` **no** llama `set_pagetype()`,
así que `moodle_page` lo calcula desde el `set_url('/course/edit.php', ...)` en
`lib/pagelib.php::initialise_default_pagetype` (`course/edit` → `course-edit`).

La distinción crear vs editar se hace por parámetro:

| Caso | Condición en el listener PHP |
|---|---|
| Crear curso | `$PAGE->pagetype === 'course-edit'` **y** `optional_param('id', 0, PARAM_INT) === 0` **y** `has_capability('moodle/course:create', $catcontext)` donde `$catcontext = context_coursecat::instance(optional_param('category', ...))` |
| Editar curso | `$PAGE->pagetype === 'course-edit'` **y** `id > 0` (acá `visibility_helper` ya resuelve `courseid` e `isteacher` normal) |

> **Verificación (2026-08-30):** confirmado sobre la instancia corriendo del
> equipo — Moodle **4.1 (Build 20221128)**, contenedor `nexusai-moodle` — con un
> bootstrap CLI que invoca el `moodle_page` real:
>
> ```php
> $PAGE->set_context(context_system::instance());
> $PAGE->set_pagelayout('admin');
> $PAGE->set_url('/course/edit.php', ['category' => 1]);  // crear
> echo $PAGE->pagetype;  // -> "course-edit"
>
> $PAGE->set_url('/course/edit.php', ['id' => 2]);        // editar
> echo $PAGE->pagetype;  // -> "course-edit"
> ```
>
> - [x] Moodle 4.1 — pagetype (crear): **`course-edit`**
> - [x] Moodle 4.1 — pagetype (editar): **`course-edit`**
> - [ ] Moodle 4.4 / 5.x — re-confirmar cuando haya una instancia disponible.
>   `initialise_default_pagetype` no cambió entre 4.1 y 5.x, así que se espera
>   el mismo valor. El JS se auto-limita si no matchea (cae al estado vacío
>   actual), así que un cambio de pagetype no rompe nada, solo desactiva el
>   tutorial hasta ajustar la condición.

## Alternativas evaluadas

### Alternativa A — Tres features separadas (una por punto de entrada)

**Pros:** cada una se puede shippear y testear aislada.

**Contras:** tres componentes con 80% de código repetido; el copy y los links a
Moodle se duplican en tres lugares; ONB-08 (contenido) tendría que llenar tres
estructuras distintas.

**Por qué no:** el costo de mantenimiento supera el beneficio. Un solo
componente con dos modos cubre los tres casos.

### Alternativa B — NexusAI crea los recursos por el docente (automatización)

Ej: botón "Crear foro de consultas" que llama `mod_forum` write API.

**Pros:** experiencia más "mágica".

**Contras:** requiere webservices de escritura, manejo de errores parciales
(¿qué pasa si crea el foro pero falla el grupo?), rollback, y sube el riesgo de
romper datos reales del docente. Cambia la declaración de Privacy. Es
básicamente otro proyecto.

**Por qué no:** fuera de alcance de la tesis. Si se retoma, va en un ADR nuevo.

### Alternativa C — Endpoint de estado en FastAPI

Mover la agregación de señales al backend Python.

**Pros:** consistencia con "toda la lógica en el backend".

**Contras:** el backend no tiene acceso a la data de Moodle (grupos, foros,
matrícula) — habría que pasársela desde el plugin, con lo cual el round-trip no
aporta nada. Suma latencia y un punto de falla.

**Por qué no:** la data vive en Moodle; la agregación va donde está la data.

### Alternativa D — Persistir el dismissal en `localStorage`

**Pros:** cero backend.

**Contras:** el issue #428 pide explícitamente que sobreviva a cambiar de
dispositivo. `localStorage` es por navegador.

**Por qué no:** no cumple el criterio de aceptación.

## Consecuencias

### Positivas

- Un solo componente para mantener y un solo lugar donde vive el copy.
- La declaración de Privacy (`null_provider`) no cambia.
- Sin tablas nuevas, sin migración Alembic, sin webservices de escritura.
- El endpoint de estado reusa lo que ya existe (`/courses/{id}/stats`).
- El tutorial nunca puede romper el curso del docente: solo abre pantallas.

### Negativas / trade-offs aceptados

- El docente hace cada paso manualmente — más fricción que una automatización.
- `OnboardingPanel` suma peso al bundle, ya cerca del límite de webpack.
- La detección "crear curso" depende de un pagetype no documentado oficialmente
  por Moodle (aunque estable en el source).
- `course_setup_state` hace una llamada al backend en cada apertura del modo
  review (mitigable con un cache corto en el front).

### Cómo se mitigan

- **Fricción:** el copy de cada paso (ONB-08) explica el *por qué*, no solo el
  *dónde* — la guía tiene valor aunque no automatice.
- **Bundle:** medir con `npm run build` en ONB-03; si se pasa, cargar
  `OnboardingPanel` como chunk lazy (se abre bajo demanda, no en el render
  inicial).
- **Pagetype:** confirmar visualmente en 4.1 y 5.x antes de cerrar ONB-03
  (checklist de arriba). El JS se auto-limita: si el pagetype no matchea, cae al
  estado vacío actual — no rompe nada.
- **Llamada al backend:** cachear `course_setup_state` en memoria del front por
  la duración de la sesión del panel; refetch solo al reabrir manualmente.

## Cuándo revisar esta decisión

- Si el equipo decide que NexusAI **sí** debe crear recursos en Moodle
  (automatización) → ADR nuevo que reemplaza la sección 2.
- Si se agregan tablas `local_nexusai_*` con datos personales por otra feature
  → revisar si conviene mover también el estado del onboarding ahí y migrar a
  `metadata\provider` (ver ADR-006).
- Si Moodle cambia `initialise_default_pagetype` en una versión futura y
  `course-edit` deja de valer.

## Referencias

- Issues #424–#431 (épica Onboarding al Docente).
- Plan detallado: `Ingenieria-UCC/2026/Tesis/onboarding_docente_plan.md` (fuera del repo).
- `AYUDA_DOCENTE_ONBOARDING.md` (raíz del repo) — detalle funcional y copy.
- ADR-006 (Privacy strategy) — por qué el estado va en `user_preferences`.
- ADR-008 pendiente (bundle AMD) — límite de 600 KB.
- Moodle source: `moodle-src/lib/pagelib.php`, `moodle-src/course/edit.php`.
- `plugin/local/nexusai/classes/visibility_helper.php` — regla de visibilidad
  actual que se extiende.

---

*Última actualización: 2026-08-30*
