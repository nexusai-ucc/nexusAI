/**
 * Definition of the steps of the course setup tutorial (ONB-03 / ONB-04).
 *
 * Each step:
 *   - `key`      stable identifier (also the `course_setup_state` signal that
 *                marks it ✓ in review mode — ONB-04).
 *   - `title` / `why`  ES/EN copy. The final text is polished in ONB-08; this is a
 *                working version, not a placeholder.
 *   - `href(ctx)`  builds the link to Moodle's native screen. `ctx` carries
 *                `{ wwwroot, courseid }`. NexusAI never runs the action:
 *                it only opens the screen where the teacher does it.
 *
 * The order of the array is the order they are shown in.
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
 * In review mode (ONB-04): given the `course_setup_state` response, decides
 * the state of each step. `skipped` (ONB-05) marks optional steps the
 * teacher excluded by hand ("not applicable") — it only counts while the real
 * signal is not present yet; if the step is already met, "done" wins anyway.
 *
 * @param {object} step  An element of COURSE_SETUP_STEPS.
 * @param {object|null} state  Response of getCourseSetupState(), or null.
 * @param {string[]} [skipped]  Response of getOnboardingState().skipped.
 * @returns {"done"|"pending"|"skipped"|"unknown"}
 */
export function stepStatus(step, state, skipped = []) {
    if (!state) return "unknown";
    const signalKey = step.signal || step.key;
    const signal = state[signalKey];
    if (!signal || signal.present === null || signal.present === undefined) {
        return "unknown";
    }
    if (signal.present) return "done";
    return skipped.includes(signalKey) ? "skipped" : "pending";
}
