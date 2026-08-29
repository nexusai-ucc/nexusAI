<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Feed iCalendar (.ics) suscribible de los eventos de un curso (CAL-07 / #377).
 *
 * A diferencia de CAL-06 (descarga puntual), esto es un endpoint al que Google
 * Calendar / Apple Calendar se suscriben y refrescan solos. Por eso NO puede
 * depender de la sesión de Moodle: la autenticación es un token opaco por
 * alumno, guardado como user preference (`local_nexusai_calfeedtoken`) — sin
 * tabla nueva. El alumno puede revocarlo generando uno nuevo.
 *
 * Query params:
 *   - token   (string) — token del alumno (44 chars, generado por la external fn)
 *   - course  (int)    — curso cuyos eventos se sirven
 *   - download (int)   — opcional; 1 fuerza descarga en vez de suscripción (lo usa CAL-06)
 *
 * Seguridad:
 *   - El token identifica al alumno. Se verifica además que ese alumno esté
 *     matriculado en el curso pedido — así la URL no expone eventos de cursos
 *     en los que no está inscripto.
 *   - Solo GET, solo lectura. No se listan datos de otros alumnos.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Sin cookies ni sesión: el feed lo pide el servidor de Google, no el browser del alumno.
define('NO_MOODLE_COOKIES', true);
define('NO_DEBUG_DISPLAY', true);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/calendar/lib.php');

global $DB, $CFG;

$token    = optional_param('token', '', PARAM_ALPHANUMEXT);
$courseid = optional_param('course', 0, PARAM_INT);
$download = optional_param('download', 0, PARAM_INT);

if (strlen($token) < 32 || $courseid <= 0) {
    http_response_code(400);
    die('Parámetros inválidos.');
}

// Resolver el alumno por su token (user preference). No hay índice sobre value,
// pero la tabla user_preferences es chica y el token tiene 256 bits de entropía.
$pref = $DB->get_record('user_preferences', [
    'name'  => 'local_nexusai_calfeedtoken',
    'value' => $token,
], '*', IGNORE_MULTIPLE);

if (!$pref) {
    http_response_code(404);
    die('Feed no encontrado. Puede que la suscripción haya sido revocada.');
}

$userid = (int) $pref->userid;

$course = $DB->get_record('course', ['id' => $courseid], '*', IGNORE_MISSING);
if (!$course) {
    http_response_code(404);
    die('Curso no encontrado.');
}

$context = context_course::instance($course->id);
if (!is_enrolled($context, $userid, '', true)) {
    http_response_code(403);
    die('El alumno de este feed no está matriculado en el curso.');
}

// Ventana de eventos: desde hace una semana (para que un evento recién pasado
// no desaparezca de golpe del calendario) hasta 120 días adelante.
$timestart = time() - 7 * DAYSECS;
$timeend   = time() + 120 * DAYSECS;

// Grupos del alumno en el curso: así el feed incluye los eventos dirigidos a
// sus grupos, pero no los de grupos a los que no pertenece.
$usergroups = array_keys(groups_get_all_groups((int) $course->id, $userid));

$events = calendar_get_legacy_events(
    $timestart,
    $timeend,
    [$userid],
    $usergroups ?: 0,
    [(int) $course->id]
);

// Tope defensivo: el feed es un endpoint sin login, no queremos servir
// respuestas gigantes si un curso tiene cientos de eventos.
if (count($events) > 200) {
    $events = array_slice($events, 0, 200);
}

$calname = format_string($course->shortname, true, ['context' => $context]) . ' — NexusAI';
$ics = local_nexusai_build_ics($events, $calname, $CFG->wwwroot);

header('Content-Type: text/calendar; charset=utf-8');
$disposition = $download ? 'attachment' : 'inline';
header('Content-Disposition: ' . $disposition . '; filename="curso-' . (int) $course->id . '.ics"');
header('Cache-Control: max-age=1800, private');
echo $ics;
exit;

/**
 * Arma el texto VCALENDAR (RFC 5545) a partir de los eventos de Moodle.
 *
 * @param array  $events  Eventos de calendar_get_legacy_events().
 * @param string $calname Nombre visible del calendario.
 * @param string $wwwroot URL base de Moodle (para el link de cada evento).
 * @return string
 */
function local_nexusai_build_ics(array $events, string $calname, string $wwwroot): string {
    $fold = static function (string $line): string {
        // RFC 5545: líneas de más de 75 octetos se pliegan con CRLF + espacio.
        $out = '';
        while (strlen($line) > 73) {
            $out .= substr($line, 0, 73) . "\r\n ";
            $line = substr($line, 73);
        }
        return $out . $line;
    };
    $esc = static function (string $v): string {
        // Neutraliza saltos de línea (evita inyección de líneas VEVENT falsas)
        // y escapa los separadores de campo de RFC 5545.
        $v = str_replace(["\r\n", "\r", "\n"], ' ', trim($v));
        return str_replace(['\\', ',', ';'], ['\\\\', '\\,', '\\;'], $v);
    };
    $dt = static function (int $ts): string {
        return gmdate('Ymd\THis\Z', $ts);
    };

    $lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//NexusAI//Course Calendar Feed//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:' . $esc($calname),
        'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
        'X-PUBLISHED-TTL:PT12H',
    ];

    $now = $dt(time());
    foreach ($events as $event) {
        $start = (int) $event->timestart;
        $end   = $start + (int) ($event->timeduration ?? 0);
        $uid   = 'nexusai-' . (int) $event->id . '@' . parse_url($wwwroot, PHP_URL_HOST);

        $summary = $esc((string) $event->name);
        $descparts = [];
        if (!empty($event->modulename)) {
            $descparts[] = ucfirst((string) $event->modulename);
        }
        $link = '';
        if (!empty($event->modulename) && !empty($event->instance)) {
            $link = $wwwroot . '/mod/' . $event->modulename . '/view.php?id=' . (int) $event->instance;
        }

        $lines[] = 'BEGIN:VEVENT';
        $lines[] = $fold('UID:' . $uid);
        $lines[] = 'DTSTAMP:' . $now;
        $lines[] = 'DTSTART:' . $dt($start);
        if ($end > $start) {
            $lines[] = 'DTEND:' . $dt($end);
        }
        $lines[] = $fold('SUMMARY:' . $summary);
        if ($descparts) {
            $lines[] = $fold('DESCRIPTION:' . $esc(implode(' · ', $descparts)));
        }
        if ($link) {
            $lines[] = $fold('URL:' . $link);
        }
        $lines[] = 'END:VEVENT';
    }

    $lines[] = 'END:VCALENDAR';
    return implode("\r\n", $lines) . "\r\n";
}
