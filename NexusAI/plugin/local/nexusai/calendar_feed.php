<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * CAL-07 (#377): feed .ics suscribible por URL personal y revocable.
 *
 * NO requiere sesión de Moodle — Google/Apple Calendar lo consultan
 * directamente y periódicamente, sin cookies ni login. Mismo patrón que usa
 * el propio `calendar/export_execute.php` de Moodle core (NO_MOODLE_COOKIES).
 *
 * Este archivo NO genera el VCALENDAR: valida el token propio de NexusAI
 * (revocable, independiente de la contraseña del usuario) y redirige al
 * export nativo de Moodle, que ya arma el ICS real con los eventos de todos
 * los cursos en los que el alumno está matriculado. Cero duplicación de la
 * lógica de generación de eventos/ICS de Moodle core.
 *
 * Query params:
 *   - token (string, 40 chars) — generado por local_nexusai_calendar_feed_get.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('NO_MOODLE_COOKIES', true);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/calendar/lib.php');

global $DB, $CFG;

$token = optional_param('token', '', PARAM_ALPHANUM);

if ($token === '' || strlen($token) !== 40) {
    http_response_code(404);
    die('Invalid feed token');
}

if (empty($CFG->enablecalendarexport)) {
    http_response_code(404);
    die('Calendar export is disabled on this site');
}

$row = $DB->get_record('local_nexusai_calendar_feed', ['token' => $token]);
if (!$row) {
    http_response_code(404);
    die('Invalid or revoked feed token');
}

$user = \core_user::get_user($row->userid);
if (!$user || $user->deleted || $user->suspended) {
    http_response_code(404);
    die('User not found');
}

// Token nativo de Moodle, calculado en el momento (no se persiste acá —
// depende de la contraseña del usuario, que puede cambiar). El token propio
// de NexusAI es el que es estable/revocable de cara al alumno.
$moodletoken = calendar_get_export_token($user);

$exporturl = new moodle_url('/calendar/export_execute.php', [
    'userid'      => $user->id,
    'authtoken'   => $moodletoken,
    'preset_what' => 'all',
    'preset_time' => 'recentupcoming',
]);

redirect($exporturl->out(false));
