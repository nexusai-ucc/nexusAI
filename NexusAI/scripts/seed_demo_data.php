<?php
/**
 * Script de seed de datos de demo para NexusAI.
 *
 * Crea 3 cursos, 4 docentes, 8 alumnos, secciones con nombre,
 * foros con discusiones, eventos de calendario (parciales y entregas).
 *
 * Correr desde seed_demo.sh o manualmente:
 *   $MOODLE_DOCKER_DIR/bin/moodle-docker-compose exec -T webserver \
 *     php /var/www/html/seed_demo_data.php
 */

define('CLI_SCRIPT', true);
require(__DIR__ . '/config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->libdir . '/moodlelib.php');
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/calendar/lib.php');
require_once($CFG->dirroot . '/mod/forum/lib.php');
require_once($CFG->dirroot . '/enrol/manual/externallib.php');

cli_writeln('');
cli_writeln('=== NexusAI — Seed de datos de demo ===');
cli_writeln('');

// ── Helpers ──────────────────────────────────────────────────────────────────

function seed_log(string $msg): void {
    cli_writeln('  ' . $msg);
}

function seed_ok(string $msg): void {
    cli_writeln('  ✓ ' . $msg);
}

function seed_skip(string $msg): void {
    cli_writeln('  · (ya existe) ' . $msg);
}

function get_or_create_user(array $data): int {
    global $DB, $CFG;
    if ($existing = $DB->get_record('user', ['username' => $data['username']])) {
        seed_skip("Usuario {$data['username']}");
        return (int)$existing->id;
    }
    $user                = new stdClass();
    $user->username      = $data['username'];
    $user->password      = $data['password'];
    $user->firstname     = $data['firstname'];
    $user->lastname      = $data['lastname'];
    $user->email         = $data['email'];
    $user->auth          = 'manual';
    $user->confirmed     = 1;
    $user->mnethostid    = $CFG->mnet_localhost_id;
    $user->lang          = 'es';
    $user->timezone      = 'America/Argentina/Cordoba';
    $id = user_create_user($user, true, false);
    seed_ok("Usuario creado: {$data['username']} ({$data['firstname']} {$data['lastname']})");
    return (int)$id;
}

function get_or_create_course(array $data): stdClass {
    global $DB;
    if ($existing = $DB->get_record('course', ['shortname' => $data['shortname']])) {
        seed_skip("Curso {$data['shortname']}");
        return $existing;
    }
    $course              = new stdClass();
    $course->fullname    = $data['fullname'];
    $course->shortname   = $data['shortname'];
    $course->summary     = $data['summary'];
    $course->summaryformat = FORMAT_HTML;
    $course->category    = 1;
    $course->numsections = count($data['sections']);
    $course->startdate   = mktime(0, 0, 0, 3, 1, 2026);
    $course->enddate     = mktime(0, 0, 0, 11, 30, 2026);
    $course->visible     = 1;
    $course->showgrades  = 1;
    $course->lang        = 'es';
    $created = create_course($course);
    seed_ok("Curso creado: {$data['fullname']} (id={$created->id})");
    return $created;
}

function set_section_name(int $courseid, int $section_num, string $name, string $summary = ''): void {
    global $DB;
    if ($sec = $DB->get_record('course_sections', ['course' => $courseid, 'section' => $section_num])) {
        $sec->name    = $name;
        $sec->summary = $summary;
        $sec->summaryformat = FORMAT_HTML;
        $DB->update_record('course_sections', $sec);
    }
}

function enroll_user_in_course(int $userid, int $courseid, string $roleshortname): void {
    global $DB;
    $enrol    = enrol_get_plugin('manual');
    $instances = enrol_get_instances($courseid, true);
    $manual   = null;
    foreach ($instances as $inst) {
        if ($inst->enrol === 'manual') { $manual = $inst; break; }
    }
    if (!$manual) {
        $manual = $enrol->add_default_instance(get_course($courseid));
    }
    $role = $DB->get_record('role', ['shortname' => $roleshortname], '*', MUST_EXIST);
    $enrol->enrol_user($manual, $userid, $role->id);
}

function create_calendar_event(int $courseid, string $name, string $date, int $duration_hours = 2): void {
    global $DB;
    if ($DB->record_exists('event', ['courseid' => $courseid, 'name' => $name])) {
        seed_skip("Evento '$name' en curso $courseid");
        return;
    }
    $event              = new stdClass();
    $event->name        = $name;
    $event->description = '';
    $event->format      = FORMAT_HTML;
    $event->courseid    = $courseid;
    $event->groupid     = 0;
    $event->userid      = 2; // admin
    $event->modulename  = '';
    $event->instance    = 0;
    $event->eventtype   = 'course';
    $event->timestart   = strtotime($date);
    $event->timeduration = $duration_hours * 3600;
    $event->visible     = 1;
    $event->timeduration = $duration_hours * 3600;
    calendar_event::create($event, false);
    seed_ok("Evento: '$name' el $date");
}

function create_forum_with_discussions(int $courseid, int $section_num, string $forum_name, array $discussions): void {
    global $DB;

    // Si el foro ya existe, no duplicar
    if ($DB->record_exists('forum', ['course' => $courseid, 'name' => $forum_name])) {
        seed_skip("Foro '$forum_name' en curso $courseid");
        return;
    }

    // Crear foro
    $forum              = new stdClass();
    $forum->course      = $courseid;
    $forum->type        = 'general';
    $forum->name        = $forum_name;
    $forum->intro       = '<p>Espacio para consultas y debates del curso.</p>';
    $forum->introformat = FORMAT_HTML;
    $forum->timemodified = time();
    $forum->forcesubscribe = 0;
    $forum->id          = $DB->insert_record('forum', $forum);

    // Crear course module
    $module             = $DB->get_record('modules', ['name' => 'forum'], '*', MUST_EXIST);
    $cm                 = new stdClass();
    $cm->course         = $courseid;
    $cm->module         = $module->id;
    $cm->instance       = $forum->id;
    $cm->section        = $section_num;
    $cm->visible        = 1;
    $cm->added          = time();
    $cm->id             = $DB->insert_record('course_modules', $cm);

    course_add_cm_to_section($courseid, $cm->id, $section_num);
    rebuild_course_cache($courseid, true);

    seed_ok("Foro creado: '$forum_name'");

    // Crear discusiones
    foreach ($discussions as $disc) {
        $discussion              = new stdClass();
        $discussion->course      = $courseid;
        $discussion->forum       = $forum->id;
        $discussion->name        = $disc['subject'];
        $discussion->firstpost   = 0;
        $discussion->userid      = $disc['userid'];
        $discussion->groupid     = -1;
        $discussion->assessed    = 0;
        $discussion->timemodified = time() - rand(3600, 86400 * 5);
        $discussion->usermodified = $disc['userid'];
        $discussion->timestart   = 0;
        $discussion->timeend     = 0;
        $discussion->pinned      = 0;
        $discussion->timelocked  = 0;
        $discussion->id          = $DB->insert_record('forum_discussions', $discussion);

        $post                    = new stdClass();
        $post->discussion        = $discussion->id;
        $post->parent            = 0;
        $post->userid            = $disc['userid'];
        $post->created           = $discussion->timemodified;
        $post->modified          = $discussion->timemodified;
        $post->mailed            = 0;
        $post->subject           = $disc['subject'];
        $post->message           = '<p>' . $disc['message'] . '</p>';
        $post->messageformat     = FORMAT_HTML;
        $post->messagetrust      = 0;
        $post->attachment        = '';
        $post->totalscore        = 0;
        $post->mailnow           = 0;
        $post->id                = $DB->insert_record('forum_posts', $post);

        $DB->set_field('forum_discussions', 'firstpost', $post->id, ['id' => $discussion->id]);
        seed_ok("  Discusión: '{$disc['subject']}'");

        // Agregar respuestas si las hay
        if (!empty($disc['replies'])) {
            foreach ($disc['replies'] as $reply) {
                $rpost               = new stdClass();
                $rpost->discussion   = $discussion->id;
                $rpost->parent       = $post->id;
                $rpost->userid       = $reply['userid'];
                $rpost->created      = time() - rand(1800, 43200);
                $rpost->modified     = $rpost->created;
                $rpost->mailed       = 0;
                $rpost->subject      = 'Re: ' . $disc['subject'];
                $rpost->message      = '<p>' . $reply['message'] . '</p>';
                $rpost->messageformat = FORMAT_HTML;
                $rpost->messagetrust = 0;
                $rpost->attachment   = '';
                $rpost->totalscore   = 0;
                $rpost->mailnow      = 0;
                $DB->insert_record('forum_posts', $rpost);
            }
        }
    }
}

// ── 1. USUARIOS ───────────────────────────────────────────────────────────────

cli_writeln('── Creando usuarios ──');

$teachers = [
    ['username' => 'dr.garcia',    'password' => 'Garcia123!',   'firstname' => 'Carlos',   'lastname' => 'García',    'email' => 'garcia@nexusai.test'],
    ['username' => 'dra.lopez',    'password' => 'Lopez123!',    'firstname' => 'Laura',    'lastname' => 'López',     'email' => 'lopez@nexusai.test'],
    ['username' => 'dr.martinez',  'password' => 'Martinez123!', 'firstname' => 'Diego',    'lastname' => 'Martínez',  'email' => 'martinez@nexusai.test'],
    ['username' => 'dr.perez',     'password' => 'Perez123!',    'firstname' => 'Andrés',   'lastname' => 'Pérez',     'email' => 'perez@nexusai.test'],
];

$students = [
    ['username' => 'alumno1', 'password' => 'Alumno123!', 'firstname' => 'María',    'lastname' => 'González',   'email' => 'alumno1@nexusai.test'],
    ['username' => 'alumno2', 'password' => 'Alumno123!', 'firstname' => 'Tomás',    'lastname' => 'Rodríguez',  'email' => 'alumno2@nexusai.test'],
    ['username' => 'alumno3', 'password' => 'Alumno123!', 'firstname' => 'Valentina','lastname' => 'Fernández',  'email' => 'alumno3@nexusai.test'],
    ['username' => 'alumno4', 'password' => 'Alumno123!', 'firstname' => 'Facundo',  'lastname' => 'López',      'email' => 'alumno4@nexusai.test'],
    ['username' => 'alumno5', 'password' => 'Alumno123!', 'firstname' => 'Lucía',    'lastname' => 'Martín',     'email' => 'alumno5@nexusai.test'],
    ['username' => 'alumno6', 'password' => 'Alumno123!', 'firstname' => 'Mateo',    'lastname' => 'Sánchez',    'email' => 'alumno6@nexusai.test'],
    ['username' => 'alumno7', 'password' => 'Alumno123!', 'firstname' => 'Agustina', 'lastname' => 'Torres',     'email' => 'alumno7@nexusai.test'],
    ['username' => 'alumno8', 'password' => 'Alumno123!', 'firstname' => 'Ignacio',  'lastname' => 'Díaz',       'email' => 'alumno8@nexusai.test'],
];

$teacher_ids = [];
foreach ($teachers as $t) {
    $teacher_ids[$t['username']] = get_or_create_user($t);
}

$student_ids = [];
foreach ($students as $s) {
    $student_ids[$s['username']] = get_or_create_user($s);
}

// ── 2. CURSOS ─────────────────────────────────────────────────────────────────

cli_writeln('');
cli_writeln('── Creando cursos ──');

$courses_data = [
    [
        'fullname'  => 'Bases de Datos — 2026',
        'shortname' => 'BDD-2026',
        'summary'   => '<p>Introducción al diseño y gestión de bases de datos relacionales. Cubre el modelo relacional, SQL, normalización y transacciones.</p>',
        'sections'  => [
            1 => 'Unidad 1: Modelo Relacional y Álgebra Relacional',
            2 => 'Unidad 2: SQL — DDL y DML',
            3 => 'Unidad 3: Normalización (1FN, 2FN, 3FN, BCNF)',
            4 => 'Unidad 4: Transacciones, Concurrencia e Índices',
            5 => 'Trabajos Prácticos',
        ],
        'teachers'  => ['dr.garcia', 'dra.lopez'],
        'students'  => ['alumno1', 'alumno2', 'alumno3', 'alumno4', 'alumno5'],
        'events'    => [
            ['Parcial 1 — BDD',                 '2026-09-10 09:00:00', 3],
            ['Parcial 2 — BDD',                 '2026-10-22 09:00:00', 3],
            ['Entrega TP1: Diseño E-R',         '2026-09-05 23:59:00', 0],
            ['Entrega TP2: SQL Avanzado',        '2026-10-10 23:59:00', 0],
            ['Recuperatorio — BDD',             '2026-11-05 09:00:00', 3],
            ['Examen Final — BDD',              '2026-12-03 09:00:00', 3],
        ],
        'forum_discussions' => [
            [
                'subject' => '¿Cuál es la diferencia entre clave primaria y clave foránea?',
                'message' => 'Estoy estudiando para el parcial y no me queda claro cuándo usar cada una. En el TP me pedían definir la FK pero no sé si la puse bien.',
                'userid_key' => 'alumno1',
                'replies' => [
                    ['message' => 'La clave primaria identifica de forma única cada fila de la tabla. La clave foránea es una referencia a la clave primaria de otra tabla — sirve para establecer relaciones entre tablas.', 'userid_key' => 'dr.garcia'],
                ],
            ],
            [
                'subject' => 'Error en la normalización del TP — relación no cumple 3FN',
                'message' => 'En el TP2 me dicen que mi relación no cumple 3FN pero no veo por qué. La dependencia transitiva la eliminé. ¿Me pueden dar una pista?',
                'userid_key' => 'alumno3',
                'replies' => [],
            ],
            [
                'subject' => '¿SQL usa índices automáticamente o hay que crearlos?',
                'message' => 'Entendí que los índices mejoran la performance de las consultas, pero no sé si el motor los crea solo o si tenemos que definirlos en el CREATE TABLE.',
                'userid_key' => 'alumno2',
                'replies' => [
                    ['message' => 'Los motores crean automáticamente un índice sobre la clave primaria (PRIMARY KEY). Para otros campos que uses frecuentemente en WHERE o JOIN conviene crearlos manualmente con CREATE INDEX.', 'userid_key' => 'dra.lopez'],
                ],
            ],
        ],
    ],
    [
        'fullname'  => 'Sistemas Operativos — 2026',
        'shortname' => 'SO-2026',
        'summary'   => '<p>Estudio de los fundamentos de los sistemas operativos modernos: procesos, memoria, sistema de archivos y seguridad.</p>',
        'sections'  => [
            1 => 'Unidad 1: Procesos e Hilos',
            2 => 'Unidad 2: Gestión de Memoria y Paginación',
            3 => 'Unidad 3: Sistema de Archivos',
            4 => 'Unidad 4: Seguridad y Protección',
            5 => 'Laboratorios y TPs',
        ],
        'teachers'  => ['dr.martinez'],
        'students'  => ['alumno1', 'alumno4', 'alumno5', 'alumno6', 'alumno7'],
        'events'    => [
            ['Parcial 1 — SO',               '2026-09-17 14:00:00', 3],
            ['Parcial 2 — SO',               '2026-10-29 14:00:00', 3],
            ['Entrega Lab 1: Shell scripting','2026-09-12 23:59:00', 0],
            ['Entrega Lab 2: Scheduler',     '2026-10-17 23:59:00', 0],
            ['Recuperatorio — SO',           '2026-11-12 14:00:00', 3],
            ['Examen Final — SO',            '2026-12-10 14:00:00', 3],
        ],
        'forum_discussions' => [
            [
                'subject' => '¿Cuál es la diferencia entre proceso e hilo (thread)?',
                'message' => 'Leí que los hilos comparten memoria pero no entiendo bien qué significa eso en la práctica. ¿Un proceso puede tener varios hilos?',
                'userid_key' => 'alumno6',
                'replies' => [
                    ['message' => 'Sí, un proceso puede tener múltiples hilos. Los hilos de un mismo proceso comparten el espacio de direcciones de memoria (heap, código, datos globales), pero cada uno tiene su propia pila (stack) y registros. Los procesos en cambio tienen espacios de memoria separados.', 'userid_key' => 'dr.martinez'],
                ],
            ],
            [
                'subject' => 'No entiendo la diferencia entre paginación y segmentación',
                'message' => 'El apunte habla de los dos pero no veo cuándo se usa uno y cuándo el otro. ¿Son excluyentes?',
                'userid_key' => 'alumno5',
                'replies' => [],
            ],
            [
                'subject' => '¿Cómo funciona el algoritmo de reemplazo LRU?',
                'message' => 'Para el parcial necesito entender LRU bien. Entiendo que saca la página menos recientemente usada pero no sé cómo se implementa eficientemente.',
                'userid_key' => 'alumno4',
                'replies' => [
                    ['message' => 'La implementación más común es con una lista doblemente enlazada combinada con un hash map. Cada acceso mueve la página al frente de la lista en O(1). La víctima es siempre el elemento al final.', 'userid_key' => 'dr.martinez'],
                ],
            ],
        ],
    ],
    [
        'fullname'  => 'Algoritmos y Estructuras de Datos — 2026',
        'shortname' => 'AED-2026',
        'summary'   => '<p>Estudio de algoritmos fundamentales y estructuras de datos: arrays, listas enlazadas, árboles, grafos y algoritmos de búsqueda y ordenamiento.</p>',
        'sections'  => [
            1 => 'Unidad 1: Arrays, Listas y Pilas',
            2 => 'Unidad 2: Árboles Binarios y AVL',
            3 => 'Unidad 3: Grafos — BFS, DFS, Dijkstra',
            4 => 'Unidad 4: Algoritmos de Ordenamiento',
            5 => 'Laboratorios',
        ],
        'teachers'  => ['dra.lopez', 'dr.perez'],
        'students'  => ['alumno2', 'alumno3', 'alumno6', 'alumno7', 'alumno8'],
        'events'    => [
            ['Parcial 1 — AED',              '2026-09-08 11:00:00', 3],
            ['Parcial 2 — AED',              '2026-10-20 11:00:00', 3],
            ['Entrega TP: Árbol AVL',        '2026-09-28 23:59:00', 0],
            ['Entrega TP: Grafo Dijkstra',   '2026-10-30 23:59:00', 0],
            ['Recuperatorio — AED',          '2026-11-10 11:00:00', 3],
            ['Examen Final — AED',           '2026-12-08 11:00:00', 3],
        ],
        'forum_discussions' => [
            [
                'subject' => '¿Cuándo conviene usar lista enlazada en vez de array?',
                'message' => 'En el laboratorio tengo que elegir entre las dos. El profesor dijo que depende de las operaciones, pero no tengo claro cuándo una es mejor que la otra.',
                'userid_key' => 'alumno8',
                'replies' => [
                    ['message' => 'Array: acceso aleatorio O(1), inserción/eliminación en el medio O(n). Lista enlazada: acceso secuencial O(n), inserción/eliminación al inicio O(1). Si necesitás acceder por índice frecuentemente → array. Si insertás/eliminás mucho al principio o en posiciones conocidas → lista.', 'userid_key' => 'dr.perez'],
                ],
            ],
            [
                'subject' => 'Duda con la rotación del árbol AVL en el TP',
                'message' => 'Implementé la rotación simple a la derecha pero el árbol queda desbalanceado en ciertos casos. No sé si el error está en el cálculo del factor de balance.',
                'userid_key' => 'alumno3',
                'replies' => [],
            ],
            [
                'subject' => '¿Cuál es la complejidad de Dijkstra con heap?',
                'message' => 'Sé que sin heap es O(V²) pero con priority queue me confundo. ¿Es O((V+E) log V)?',
                'userid_key' => 'alumno7',
                'replies' => [
                    ['message' => 'Correcto: con un min-heap (priority queue) la complejidad es O((V + E) log V). En grafos densos (E ≈ V²) no hay ventaja sobre la versión naive. En grafos esparsos (E ≪ V²) el heap es significativamente mejor.', 'userid_key' => 'dra.lopez'],
                ],
            ],
        ],
    ],
];

// ── 3. CREAR CURSOS, SECCIONES, INSCRIPCIONES, EVENTOS Y FOROS ───────────────

foreach ($courses_data as $cd) {
    cli_writeln('');
    cli_writeln("── Procesando: {$cd['fullname']} ──");

    $course = get_or_create_course($cd);
    $cid    = (int)$course->id;

    // Secciones
    foreach ($cd['sections'] as $num => $name) {
        // Asegurarse de que la sección existe
        if (!$DB->record_exists('course_sections', ['course' => $cid, 'section' => $num])) {
            course_create_section($cid, $num);
        }
        set_section_name($cid, $num, $name);
        seed_ok("Sección $num: $name");
    }

    // Docentes
    foreach ($cd['teachers'] as $tkey) {
        enroll_user_in_course($teacher_ids[$tkey], $cid, 'editingteacher');
        seed_ok("Docente inscripto: $tkey");
    }

    // Alumnos
    foreach ($cd['students'] as $skey) {
        enroll_user_in_course($student_ids[$skey], $cid, 'student');
        seed_ok("Alumno inscripto: $skey");
    }

    // Eventos de calendario
    foreach ($cd['events'] as $ev) {
        create_calendar_event($cid, $ev[0], $ev[1], $ev[2] ?? 2);
    }

    // Foro con discusiones
    $discussions = [];
    foreach ($cd['forum_discussions'] as $disc) {
        $uid = $disc['userid_key'];
        $uid_resolved = isset($teacher_ids[$uid]) ? $teacher_ids[$uid] : $student_ids[$uid];
        $d = ['subject' => $disc['subject'], 'message' => $disc['message'], 'userid' => $uid_resolved, 'replies' => []];
        foreach ($disc['replies'] as $r) {
            $ruid = isset($teacher_ids[$r['userid_key']]) ? $teacher_ids[$r['userid_key']] : $student_ids[$r['userid_key']];
            $d['replies'][] = ['message' => $r['message'], 'userid' => $ruid];
        }
        $discussions[] = $d;
    }
    create_forum_with_discussions($cid, 1, 'Consultas y debates del curso', $discussions);
}

// ── 4. RESUMEN ────────────────────────────────────────────────────────────────

cli_writeln('');
cli_writeln('=== Seed completado ===');
cli_writeln('');
cli_writeln('Usuarios creados:');
cli_writeln('  Docentes:');
foreach ($teachers as $t) {
    cli_writeln("    {$t['username']} / {$t['password']}  ({$t['firstname']} {$t['lastname']})");
}
cli_writeln('  Alumnos: alumno1..alumno8 / Alumno123!');
cli_writeln('');
cli_writeln('Cursos creados:');
foreach ($courses_data as $cd) {
    cli_writeln("  · {$cd['fullname']} ({$cd['shortname']})");
}
cli_writeln('');
cli_writeln('Próximos pasos manuales:');
cli_writeln('  1. Subir PDFs al curso desde el widget NexusAI (como docente)');
cli_writeln('     o copiarlos a moodle/repository/ y usar el file manager de Moodle.');
cli_writeln('  2. Verificar que los foros tienen discusiones en:');
cli_writeln('     http://localhost:8080 → entrar al curso → Consultas y debates del curso');
cli_writeln('  3. Iniciar sesión como alumno1 / Alumno123! para testear el widget.');
cli_writeln('');
