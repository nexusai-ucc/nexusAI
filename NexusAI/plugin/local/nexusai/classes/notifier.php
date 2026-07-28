<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Notificaciones de NexusAI — CAL-03 (issue #239).
 *
 * Notifica a los usuarios de un curso (alumnos + docentes, cualquiera con
 * `local/nexusai:use`) cuando se sube material nuevo, usando el sistema
 * nativo de mensajería de Moodle (`message_send()` + `db/messages.php`) en
 * vez de un mecanismo propio — así los usuarios heredan gratis la campanita,
 * el email y las preferencias de notificación por canal que Moodle ya tiene.
 *
 * Se dispara al CONFIRMAR la subida (document_upload / confirm_pending_upload),
 * no cuando termina de indexarse en el backend — la indexación es asíncrona
 * del lado Python y no hay callback hacia PHP cuando termina. Ver limitación
 * documentada en el PR de este feature.
 *
 * Comportamiento de errores: best-effort. Un fallo acá (ej. message_send
 * rechazado, curso con 500 inscriptos y timeout) NUNCA debe romper el flujo
 * de subida del docente — se loguea con debugging() y se sigue.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

defined('MOODLE_INTERNAL') || die();

class notifier {

    /**
     * Notifica a los usuarios del curso que hay material nuevo (best-effort).
     *
     * @param int    $courseid  ID del curso donde se subió el archivo.
     * @param string $filename  Nombre del archivo subido.
     * @param int    $teacherid $USER->id del docente que subió (se excluye de los destinatarios).
     */
    public static function notify_new_material(int $courseid, string $filename, int $teacherid): void {
        try {
            self::send_notifications($courseid, $filename, $teacherid);
        } catch (\Throwable $e) {
            // Nunca interrumpir la subida del docente por un fallo de notificación.
            debugging(
                'local_nexusai: fallo notificando material nuevo (courseid=' . $courseid . '): ' . $e->getMessage(),
                DEBUG_DEVELOPER
            );
        }
    }

    private static function send_notifications(int $courseid, string $filename, int $teacherid): void {
        if (empty(get_config('local_nexusai', 'enabled'))) {
            return; // switch maestro apagado — sin efectos secundarios.
        }

        $course = get_course($courseid);
        $context = \context_course::instance($courseid);

        // Todos los que pueden usar el asistente en este curso (alumnos +
        // docentes) — misma capability que gatea el chat, así no hace falta
        // filtrar por rol a mano. onlyactive=true excluye inscripciones
        // suspendidas/vencidas.
        $recipients = get_enrolled_users($context, 'local/nexusai:use', 0, 'u.*', null, 0, 0, true);
        if (empty($recipients)) {
            return;
        }

        $teacher = \core_user::get_user($teacherid) ?: \core_user::get_noreply_user();
        $courseurl = new \moodle_url('/course/view.php', ['id' => $course->id]);

        foreach ($recipients as $recipient) {
            if ((int) $recipient->id === $teacherid) {
                continue; // no notificarse a uno mismo.
            }
            self::send_one($course, $courseurl, $recipient, $teacher, $filename);
        }
    }

    private static function send_one(
        \stdClass $course,
        \moodle_url $courseurl,
        \stdClass $recipient,
        \stdClass $teacher,
        string $filename
    ): void {
        $a = (object) ['filename' => $filename, 'course' => $course->fullname];
        $ahtml = (object) ['filename' => s($filename), 'course' => s($course->fullname)];

        $message = new \core\message\message();
        $message->component         = 'local_nexusai';
        $message->name               = 'newmaterial';
        $message->courseid          = $course->id;
        $message->userfrom          = $teacher;
        $message->userto            = $recipient;
        $message->subject           = get_string('newmaterial_subject', 'local_nexusai', $course->shortname);
        $message->fullmessage       = get_string('newmaterial_body', 'local_nexusai', $a);
        $message->fullmessageformat = FORMAT_PLAIN;
        $message->fullmessagehtml   = get_string('newmaterial_body_html', 'local_nexusai', $ahtml);
        $message->smallmessage      = get_string('newmaterial_small', 'local_nexusai', $filename);
        $message->notification      = 1;
        $message->contexturl        = $courseurl->out(false);
        $message->contexturlname    = $course->fullname;

        message_send($message);
    }
}
