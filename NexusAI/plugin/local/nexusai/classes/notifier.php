<?php
// This file is part of the NexusAI plugin for Moodle.
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * NexusAI notifications — CAL-03 (issue #239).
 *
 * Notifies a course's users (students + teachers, anyone with
 * `local/nexusai:use`) when new material is uploaded, using Moodle's native
 * messaging system (`message_send()` + `db/messages.php`) instead of a
 * custom mechanism — this way users get the notification bell, email, and
 * per-channel notification preferences Moodle already has, for free.
 *
 * Fires when the upload is CONFIRMED (document_upload / confirm_pending_upload),
 * not when it finishes indexing in the backend — indexing is asynchronous on
 * the Python side and there's no callback to PHP when it finishes. See the
 * limitation documented in this feature's PR.
 *
 * Error behavior: best-effort. A failure here (e.g. message_send rejected,
 * a course with 500 enrolled users and a timeout) must NEVER break the
 * teacher's upload flow — it's logged with debugging() and execution continues.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

/**
 * Notifies a course's users when new material is uploaded (CAL-03, #239).
 */
class notifier {
    /**
     * Notifies the course's users that there's new material (best-effort).
     *
     * @param int    $courseid  ID of the course where the file was uploaded.
     * @param string $filename  Name of the uploaded file.
     * @param int    $teacherid $USER->id of the teacher who uploaded it (excluded from recipients).
     */
    public static function notify_new_material(int $courseid, string $filename, int $teacherid): void {
        try {
            self::send_notifications($courseid, $filename, $teacherid);
        } catch (\Throwable $e) {
            // Never interrupt the teacher's upload because a notification failed.
            debugging(
                'local_nexusai: failed to notify about new material (courseid=' . $courseid . '): ' . $e->getMessage(),
                DEBUG_DEVELOPER
            );
        }
    }

    /**
     * Resolves recipients and sends them the notification, one by one.
     *
     * @param int    $courseid  ID of the course where the file was uploaded.
     * @param string $filename  Name of the uploaded file.
     * @param int    $teacherid $USER->id of the teacher who uploaded it (excluded from recipients).
     */
    private static function send_notifications(int $courseid, string $filename, int $teacherid): void {
        if (!\local_nexusai\local\course_guard::is_enabled($courseid)) {
            return; // Off site-wide or in this course — no side effects.
        }

        $course = get_course($courseid);
        $context = \context_course::instance($courseid);

        // Everyone who can use the assistant in this course (students +
        // teachers) — same capability that gates the chat, so there's no
        // need to filter by role by hand. onlyactive=true excludes
        // suspended/expired enrolments.
        $recipients = get_enrolled_users($context, 'local/nexusai:use', 0, 'u.*', null, 0, 0, true);
        if (empty($recipients)) {
            return;
        }

        $teacher = \core_user::get_user($teacherid) ?: \core_user::get_noreply_user();
        $courseurl = new \moodle_url('/course/view.php', ['id' => $course->id]);

        foreach ($recipients as $recipient) {
            if ((int) $recipient->id === $teacherid) {
                continue; // Don't notify yourself.
            }
            self::send_one($course, $courseurl, $recipient, $teacher, $filename);
        }
    }

    /**
     * Builds and sends a new-material notification to a specific recipient.
     *
     * @param \stdClass  $course    Course where the material was uploaded.
     * @param \moodle_url $courseurl Course URL, for the notification's link.
     * @param \stdClass  $recipient Recipient user.
     * @param \stdClass  $teacher   Sender user (teacher who uploaded the material).
     * @param string     $filename  Name of the uploaded file.
     */
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
