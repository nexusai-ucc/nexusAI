<?php
// This file is part of the NexusAI demo environment (not part of the plugin).
//
// Configura el Moodle de la demo de la defensa: plugin, sitio, curso y cuentas.
// Es idempotente: se puede correr de nuevo sin duplicar nada.
//
// Uso (dentro del contenedor moodle, como www-data):
//   php /opt/demo/setup_demo.php --accounts=/opt/demo-outputs/cuentas.csv
//   php /opt/demo/setup_demo.php --material=/opt/demo-outputs/informe-ipi.pdf
//
// Lee del entorno: NEXUSAI_API_KEY, NEXUSAI_SHARED_SECRET.

define('CLI_SCRIPT', true);

require('/var/www/html/config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once($CFG->libdir . '/enrollib.php');

[$options, $unrecognised] = cli_get_params(
    [
        'accounts' => '',
        'material' => '',
        'courseshortname' => 'nexusai-tesis',
        'coursename' => 'NexusAI: la tesis',
        'endpoint' => 'http://api:8000',
        'help' => false,
    ],
    ['h' => 'help']
);

if ($unrecognised || $options['help']) {
    cli_writeln("Configura el Moodle de la demo de NexusAI.\n");
    cli_writeln("  --accounts=PATH        CSV de generar_cuentas.py (username,password,role,firstname,lastname)");
    cli_writeln("  --material=PATH        PDF a subir como material del curso, como el docente");
    cli_writeln("  --courseshortname=S    Nombre corto del curso (default nexusai-tesis)");
    cli_writeln("  --coursename=S         Nombre del curso (default 'NexusAI: la tesis')");
    cli_writeln("  --endpoint=URL         URL interna del backend (default http://api:8000)");
    exit($unrecognised ? 1 : 0);
}

$admin = get_admin();
\core\session\manager::set_user($admin);

// ── 1. Plugin: backend por la red interna ─────────────────────────────────
$apikey = getenv('NEXUSAI_API_KEY');
$secret = getenv('NEXUSAI_SHARED_SECRET');
if ($apikey && $secret) {
    set_config('enabled', 1, 'local_nexusai');
    set_config('api_endpoint', $options['endpoint'], 'local_nexusai');
    set_config('api_key', $apikey, 'local_nexusai');
    set_config('shared_secret', $secret, 'local_nexusai');
    cli_writeln("[ok] Plugin conectado a {$options['endpoint']}");
} else {
    cli_writeln("[--] Sin NEXUSAI_API_KEY/NEXUSAI_SHARED_SECRET en el entorno: no se toca la conexión del plugin");
}

// ── 2. Sitio: cerrado, en español, sin mensajería ─────────────────────────
set_config('lang', 'es');
set_config('forcelogin', 1);
set_config('guestloginbutton', 0);
set_config('registerauth', '');
set_config('messaging', 0);
set_config('passwordpolicy', 0);
set_config('enablemobilewebservice', 0);
cli_writeln("[ok] Sitio: login obligatorio, sin invitados, sin autoregistro, sin mensajería");

// Nadie del público edita su perfil ni su contraseña, ni ve la lista de participantes.
$syscontext = context_system::instance();
$userrole = $DB->get_record('role', ['shortname' => 'user'], '*', MUST_EXIST);
$studentrole = $DB->get_record('role', ['shortname' => 'student'], '*', MUST_EXIST);
foreach (['moodle/user:editownprofile', 'moodle/user:changeownpassword'] as $cap) {
    assign_capability($cap, CAP_PROHIBIT, $userrole->id, $syscontext->id, true);
}
foreach (['moodle/course:viewparticipants', 'moodle/user:viewdetails'] as $cap) {
    assign_capability($cap, CAP_PROHIBIT, $studentrole->id, $syscontext->id, true);
}
$syscontext->mark_dirty();
cli_writeln("[ok] Permisos: sin edición de perfil ni contraseña; alumnos sin lista de participantes");

// ── 3. Curso ──────────────────────────────────────────────────────────────
$course = $DB->get_record('course', ['shortname' => $options['courseshortname']]);
if (!$course) {
    $data = (object) [
        'fullname' => $options['coursename'],
        'shortname' => $options['courseshortname'],
        'category' => $DB->get_field_select('course_categories', 'MIN(id)', '1=1'),
        'format' => 'topics',
        'numsections' => 1,
        'visible' => 1,
        'summary' => 'Curso de la demo de la defensa: el material es el informe de la tesis.',
        'summaryformat' => FORMAT_HTML,
    ];
    $course = create_course($data);
    cli_writeln("[ok] Curso creado: {$course->fullname} (id {$course->id})");
} else {
    cli_writeln("[ok] Curso existente: {$course->fullname} (id {$course->id})");
}
\local_nexusai\local\course_guard::set_enabled((int) $course->id, true);
cli_writeln("[ok] NexusAI activado en el curso");

// ── 4. Cuentas ────────────────────────────────────────────────────────────
$teacher = null;
if ($options['accounts']) {
    if (!is_readable($options['accounts'])) {
        cli_error("No se puede leer {$options['accounts']}");
    }
    $manual = enrol_get_plugin('manual');
    $instance = $DB->get_record('enrol', ['courseid' => $course->id, 'enrol' => 'manual'], '*', IGNORE_MULTIPLE);
    if (!$instance) {
        $manual->add_instance($course);
        $instance = $DB->get_record('enrol', ['courseid' => $course->id, 'enrol' => 'manual'], '*', MUST_EXIST);
    }
    $roles = [
        'student' => $studentrole->id,
        'editingteacher' => $DB->get_field('role', 'id', ['shortname' => 'editingteacher'], MUST_EXIST),
    ];

    $fh = fopen($options['accounts'], 'r');
    $header = fgetcsv($fh);
    $created = 0;
    $updated = 0;
    while (($row = fgetcsv($fh)) !== false) {
        $r = array_combine($header, $row);
        $role = $r['role'] === 'docente' ? 'editingteacher' : 'student';
        $username = core_text::strtolower(trim($r['username']));
        $existing = $DB->get_record('user', ['username' => $username, 'mnethostid' => $CFG->mnet_localhost_id]);
        if ($existing) {
            update_internal_user_password($existing, $r['password']);
            $userid = (int) $existing->id;
            $updated++;
        } else {
            $userid = user_create_user((object) [
                'username' => $username,
                'password' => $r['password'],
                'auth' => 'manual',
                'confirmed' => 1,
                'mnethostid' => $CFG->mnet_localhost_id,
                'firstname' => $r['firstname'],
                'lastname' => $r['lastname'],
                'email' => $username . '@demo.invalid',
                'lang' => 'es',
                'emailstop' => 1,
            ], true, false);
            $created++;
        }
        $manual->enrol_user($instance, $userid, $roles[$role]);
        if ($role === 'editingteacher' && !$teacher) {
            $teacher = $DB->get_record('user', ['id' => $userid]);
        }
    }
    fclose($fh);
    cli_writeln("[ok] Cuentas: {$created} creadas, {$updated} actualizadas, todas matriculadas");
}

// ── 5. Material (opcional) ─────────────────────────────────────────────────
if ($options['material']) {
    if (!is_readable($options['material'])) {
        cli_error("No se puede leer {$options['material']}");
    }
    if (!$teacher) {
        $teacher = $DB->get_record_sql(
            "SELECT u.* FROM {user} u
               JOIN {role_assignments} ra ON ra.userid = u.id
               JOIN {role} r ON r.id = ra.roleid AND r.shortname = 'editingteacher'
              WHERE ra.contextid = ?",
            [context_course::instance($course->id)->id],
            IGNORE_MULTIPLE
        );
    }
    if (!$teacher) {
        cli_error('No hay docente en el curso: correr primero con --accounts');
    }
    // Se sube como el docente, por la misma función que usa el panel de materiales.
    \core\session\manager::set_user($teacher);
    $filename = basename($options['material']);
    $result = \local_nexusai\external\document_upload::execute(
        (int) $course->id,
        $filename,
        'application/pdf',
        base64_encode(file_get_contents($options['material'])),
        0,
        true
    );
    cli_writeln("[ok] Material {$filename}: estado {$result['status']}, cmid " . ($result['cmid'] ?? '-'));
    \core\session\manager::set_user($admin);
}

purge_caches();
cli_writeln("\nListo. Curso: {$CFG->wwwroot}/course/view.php?id={$course->id}");
