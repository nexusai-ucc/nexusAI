/**
 * Definición de los pasos del tutorial de armado de curso (ONB-03 / ONB-04).
 *
 * Cada paso:
 *   - `key`      identificador estable (también la señal de `course_setup_state`
 *                que lo marca ✓ en modo revisión — ONB-04).
 *   - `title` / `why`  copy ES/EN. El texto final se pule en ONB-08; acá va una
 *                versión funcional, no un placeholder.
 *   - `href(ctx)`  arma el link a la pantalla nativa de Moodle. `ctx` trae
 *                `{ wwwroot, courseid }`. NexusAI nunca ejecuta la acción:
 *                solo abre la pantalla donde el docente la hace.
 *
 * El orden del array es el orden en que se muestran.
 */

function url(wwwroot, path) {
    return String(wwwroot || "/").replace(/\/$/, "") + path;
}

export const COURSE_SETUP_STEPS = [
    {
        key: "sections",
        title: { es: "Completá los datos del curso", en: "Fill in the course details" },
        why: {
            es: "El nombre corto identifica al curso en toda la plataforma y las fechas controlan cuándo lo ven tus alumnos.",
            en: "The short name identifies the course across the platform and the dates control when students can see it.",
        },
        href: ({ wwwroot, courseid }) =>
            courseid > 0
                ? url(wwwroot, `/course/edit.php?id=${courseid}`)
                : url(wwwroot, "/course/edit.php"),
    },
    {
        key: "sections_content",
        signal: "sections",
        title: { es: "Creá las secciones o unidades", en: "Create the sections or units" },
        why: {
            es: "NexusAI usa las secciones para organizar el material y ubicar de qué unidad viene cada respuesta del asistente.",
            en: "NexusAI uses sections to organise the material and to tell which unit each assistant answer comes from.",
        },
        href: ({ wwwroot, courseid }) =>
            url(wwwroot, courseid > 0 ? `/course/view.php?id=${courseid}` : "/course/"),
    },
    {
        key: "material",
        signal: "material",
        title: { es: "Subí material a NexusAI", en: "Upload material to NexusAI" },
        why: {
            es: "El asistente solo responde sobre lo que subiste. Sin material indexado, el chat no tiene de dónde sacar respuestas.",
            en: "The assistant only answers about what you upload. With no indexed material, the chat has nothing to work from.",
        },
        href: ({ wwwroot, courseid }) =>
            url(wwwroot, courseid > 0 ? `/local/nexusai/documents.php?courseid=${courseid}` : "/"),
    },
    {
        key: "students",
        signal: "students",
        title: { es: "Matriculá a tus alumnos", en: "Enrol your students" },
        why: {
            es: "Solo los alumnos matriculados pueden usar el asistente del curso.",
            en: "Only enrolled students can use the course assistant.",
        },
        href: ({ wwwroot, courseid }) =>
            url(wwwroot, courseid > 0 ? `/user/index.php?id=${courseid}` : "/"),
    },
    {
        key: "groups",
        signal: "groups",
        optional: true,
        title: { es: "Creá grupos (si tu cursada los usa)", en: "Create groups (if your course uses them)" },
        why: {
            es: "Si tu curso trabaja por comisión, los grupos te dejan filtrar analytics y consultas por grupo. Si no los usás, marcá este paso como “no aplica”.",
            en: "If your course runs by cohort, groups let you filter analytics and questions by group. If you don't use them, mark this step as “not applicable”.",
        },
        href: ({ wwwroot, courseid }) =>
            url(wwwroot, courseid > 0 ? `/group/index.php?id=${courseid}` : "/"),
    },
    {
        key: "forums",
        signal: "forums",
        title: { es: "Abrí un foro de consultas", en: "Open a Q&A forum" },
        why: {
            es: "NexusAI puede resumir hilos largos y sugerirte respuestas sobre el foro, pero necesita que el foro exista.",
            en: "NexusAI can summarise long threads and suggest replies on the forum, but the forum has to exist first.",
        },
        href: ({ wwwroot, courseid }) =>
            url(wwwroot, courseid > 0 ? `/course/view.php?id=${courseid}` : "/"),
    },
    {
        key: "calendar",
        signal: "calendar",
        title: { es: "Cargá las fechas de exámenes y entregas", en: "Add exam and due dates" },
        why: {
            es: "NexusAI muestra estas fechas a los alumnos en el panel Calendario y puede mandar recordatorios.",
            en: "NexusAI shows these dates to students in the Calendar panel and can send reminders.",
        },
        href: ({ wwwroot, courseid }) =>
            url(
                wwwroot,
                courseid > 0
                    ? `/calendar/view.php?view=month&course=${courseid}`
                    : "/calendar/view.php?view=month"
            ),
    },
];

/**
 * En modo revisión (ONB-04): dada la respuesta de `course_setup_state`, decide
 * el estado de cada paso.
 *
 * @param {object} step  Un elemento de COURSE_SETUP_STEPS.
 * @param {object|null} state  Respuesta de getCourseSetupState(), o null.
 * @returns {"done"|"pending"|"unknown"}
 */
export function stepStatus(step, state) {
    if (!state) return "unknown";
    const signalKey = step.signal || step.key;
    const signal = state[signalKey];
    if (!signal || signal.present === null || signal.present === undefined) {
        return "unknown";
    }
    return signal.present ? "done" : "pending";
}
