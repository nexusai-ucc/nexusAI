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
 * One chat question and its answer, with the conversation kept in Moodle (DATA-05).
 *
 * Shared by the non-streaming web service (external/chat_send.php) and the
 * streaming script (chat_stream.php):
 *
 * 1. The question is stored before calling the backend, so it is not lost if
 *    the backend fails.
 * 2. The backend gets the last messages as history (it no longer stores the
 *    conversation, see DATA-04) and the token limits set by the admin.
 * 3. With the answer, the assistant message, the interaction metrics, the
 *    unanswered-question signal and the token usage are stored here.
 *
 * A multi-course conversation stays in the course where the chat was opened,
 * with the list of courses it searched; before, it ended up in whichever
 * course came first among the student's enrolments.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Prepares the request for a chat question and stores what comes back.
 */
class chat_turn {
    /** @var \stdClass Conversation. */
    public \stdClass $session;

    /** @var \stdClass The stored question. */
    public \stdClass $question;

    /** @var int Course where the chat is open. */
    public int $courseid;

    /** @var int User asking. */
    public int $userid;

    /** @var bool Whether the user asks as a teacher (drives the token budget). */
    public bool $isteacher;

    /** @var int[] Courses searched. */
    public array $courseids;

    /** @var array Course names by id, for multi-course answers. */
    public array $coursenames;

    /**
     * Resolves the courses, stores the question and keeps what is needed for the request.
     *
     * @param int $userid User asking (always $USER->id).
     * @param int $courseid Course where the chat is open.
     * @param string $question Question, already validated.
     * @param string|null $sessionuuid Existing conversation, or null for a new one.
     * @param bool $multicourse Whether to search every course of the user with NexusAI on.
     */
    public function __construct(int $userid, int $courseid, string $question, ?string $sessionuuid, bool $multicourse) {
        $this->userid = $userid;
        $this->courseid = $courseid;
        $this->isteacher = has_capability('local/nexusai:manage', \context_course::instance($courseid));
        $this->courseids = [$courseid];
        $this->coursenames = [];
        if ($multicourse) {
            $this->resolve_courses();
        }
        $this->session = chat_store::get_or_create_session($userid, $courseid, $sessionuuid, $this->courseids);
        $this->question = chat_store::add_message($this->session, 'user', $question);
    }

    /**
     * Every enrolled course with NexusAI on; the teacher budget applies if the
     * user manages any of them.
     */
    private function resolve_courses(): void {
        $courses = enrol_get_users_courses($this->userid, true, ['id', 'shortname', 'fullname']);
        $ids = [];
        $names = [];
        foreach ($courses as $course) {
            $cid = (int) $course->id;
            if (!course_guard::is_enabled($cid)) {
                continue;
            }
            $ids[] = $cid;
            $names[(string) $cid] = $course->fullname ?? $course->shortname ?? 'Course';
            if (has_capability('local/nexusai:manage', \context_course::instance($cid))) {
                $this->isteacher = true;
            }
        }
        if (!in_array($this->courseid, $ids, true)) {
            array_unshift($ids, $this->courseid);
        }
        $this->courseids = $ids;
        $this->coursenames = $names;
    }

    /**
     * Whether the conversation searches several courses.
     *
     * @return bool
     */
    public function is_multicourse(): bool {
        return count($this->courseids) > 1;
    }

    /**
     * The role the usage is recorded with.
     *
     * @return string student or teacher.
     */
    public function role(): string {
        return $this->isteacher ? 'teacher' : 'student';
    }

    /**
     * Body of the request to the backend's chat.
     *
     * @return array
     */
    public function payload(): array {
        $limits = usage_store::limits($this->role());
        $payload = [
            'question' => $this->question->content,
            'course_id' => $this->courseid,
            'user_id' => $this->userid,
            'is_teacher' => $this->isteacher,
            'history' => chat_store::history((int) $this->session->id, (int) $this->question->id),
            'token_limit_hourly' => $limits['hourly'],
            'token_limit_daily' => $limits['daily'],
        ];
        if ($this->is_multicourse()) {
            $payload['course_ids'] = $this->courseids;
            $payload['course_names'] = $this->coursenames;
        }
        return $payload;
    }

    /**
     * Stores the answer and what the backend returned with it.
     *
     * @param string $answer Answer text.
     * @param array $done The backend's `done` event, or the JSON response of the non-streaming chat.
     * @param string $endpoint stream or messages.
     * @param bool $withusage Whether to store the usage that comes in $done (the stream).
     *                        The non-streaming chat gets it from the X-NexusAI-Usage header instead.
     * @return \stdClass The assistant message.
     */
    public function finish(string $answer, array $done, string $endpoint, bool $withusage): \stdClass {
        $metrics = is_array($done['metrics'] ?? null) ? $done['metrics'] : [];
        $answermessage = chat_store::add_message(
            $this->session,
            'assistant',
            $answer,
            isset($done['prompt_tokens']) ? (int) $done['prompt_tokens'] : null,
            isset($done['completion_tokens']) ? (int) $done['completion_tokens'] : null
        );
        chat_store::record_interaction($this->courseid, $this->userid, $this->question, $answer, $metrics, $endpoint);
        if (!$this->is_multicourse() && is_array($done['gap'] ?? null)) {
            chat_store::record_gap($this->courseid, $this->userid, $this->question->content, $done['gap']);
        }
        if ($withusage && is_array($done['usage'] ?? null)) {
            usage_store::record_calls($this->userid, $this->courseid, $this->role(), $done['usage']);
        }
        if (is_array($done['budget'] ?? null)) {
            usage_store::remember_budget($this->userid, $this->role(), $done['budget']);
        }
        return $answermessage;
    }
}
