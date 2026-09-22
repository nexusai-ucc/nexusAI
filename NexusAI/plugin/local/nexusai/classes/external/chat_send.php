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
 * External function `local_nexusai_chat_send`.
 *
 * This is the proxy between the React frontend (which arrives via core/ajax)
 * and the NexusAI Python backend. It does 5 things:
 *
 *   1. Validates the Moodle session (require_login + course capability).
 *   2. Sanitizes the input with the declared external_value.
 *   3. Resolves the real USERID from $USER (NOT from the client — it would be forgeable).
 *   4. Calls backend_client::send_message(), which signs and POSTs with HMAC.
 *   5. Returns the typed response according to execute_returns().
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

// Compat with Moodle 4.1 LTS through 4.5: the legacy global classes
// `external_api`, `external_function_parameters`, etc. remain available
// across the whole range. The `core_external\*` namespace only exists from
// 4.2 onward, so we avoid depending on it.
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * This is the proxy between the React frontend (which arrives via core/ajax) and the NexusAI Python backend.
 */
class chat_send extends \external_api {
    /**
     * Defines the input contract (what React sends via core/ajax).
     *
     * Moodle validates these parameters automatically:
     *   - Correct types (PARAM_*)
     *   - Required vs optional
     *   - Applying VALUE_DEFAULT if missing
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'question'  => new \external_value(
                PARAM_RAW,
                'Student\'s question to the assistant (1..2000 characters)',
                VALUE_REQUIRED
            ),
            'courseid'  => new \external_value(
                PARAM_INT,
                'Moodle course ID where the question is asked',
                VALUE_REQUIRED
            ),
            // The userid arrives only as a client hint. We IGNORE it and use the
            // real server-side $USER->id (defense against impersonation).
            // We declare it to avoid breaking backwards compat with old clients.
            'userid'    => new \external_value(
                PARAM_INT,
                'IGNORED. The backend uses the server\'s $USER->id. Accepted only for compat.',
                VALUE_DEFAULT,
                0
            ),
            'sessionid' => new \external_value(
                PARAM_ALPHANUMEXT,
                'Existing session UUID, or empty to create a new one',
                VALUE_DEFAULT,
                ''
            ),
            'multicourse' => new \external_value(
                PARAM_BOOL,
                'If true, searches across ALL the student\'s courses with indexed material (Feature B)',
                VALUE_DEFAULT,
                false
            ),
        ]);
    }

    /**
     * Defines the output contract (what we return to React).
     *
     * The React client (chat.js) uses these same keys: session_id, answer, messages.
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'session_id' => new \external_value(
                PARAM_ALPHANUMEXT,
                'Session UUID (new or existing)'
            ),
            'answer' => new \external_value(
                PARAM_RAW,
                'Assistant\'s answer'
            ),
            'messages' => new \external_multiple_structure(
                new \external_single_structure([
                    'id'         => new \external_value(PARAM_ALPHANUMEXT, 'Message UUID'),
                    'role'       => new \external_value(PARAM_ALPHA, 'user | assistant | system'),
                    'content'    => new \external_value(PARAM_RAW, 'Message text'),
                    'created_at' => new \external_value(PARAM_RAW, 'Message ISO 8601 timestamp'),
                ]),
                'Full list of the session\'s messages, in chronological order'
            ),
        ]);
    }

    /**
     * Endpoint logic.
     *
     * @param string $question
     * @param int    $courseid
     * @param int|null $userid    Ignored — we use the real $USER->id
     * @param string|null $sessionid UUID or ''
     * @return array{session_id: string, answer: string, messages: array}
     */
    public static function execute(
        string $question,
        int $courseid,
        ?int $userid = 0,
        ?string $sessionid = '',
        bool $multicourse = false
    ): array {
        global $USER;

        // 1. Validate parameters (Moodle already did type validation).
        $params = self::validate_parameters(self::execute_parameters(), [
            'question'    => $question,
            'courseid'    => $courseid,
            'userid'      => $userid ?? 0,
            'sessionid'   => $sessionid ?? '',
            'multicourse' => $multicourse,
        ]);

        // 2. Validate the course context + capability.
        // The course has to exist AND the user has to have access.
        // validate_context() also fires require_login() internally and
        // sets up the correct context on $PAGE.
        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        // Resolved server-side, same capability visibility_helper.php already
        // uses to compute 'isteacher' for the frontend. Drives the backend's
        // per-role token budget (app/shared/token_budget.py) — NEVER trust a
        // role sent by the client.
        $isteacher = has_capability('local/nexusai:manage', $context);

        // 3. Business-rule validation.
        $cleanquestion = trim($params['question']);
        if ($cleanquestion === '') {
            throw new \invalid_parameter_exception('Question cannot be empty');
        }
        if (mb_strlen($cleanquestion) > 2000) {
            throw new \invalid_parameter_exception('Question too long (max 2000 characters)');
        }

        // The sessionid has to be a UUID v4 or empty. PARAM_ALPHANUMEXT already
        // blocks injection; we check for a reasonable length here.
        $cleansessionid = trim($params['sessionid']);
        if ($cleansessionid !== '' && (strlen($cleansessionid) < 8 || strlen($cleansessionid) > 64)) {
            throw new \invalid_parameter_exception('Invalid session id format');
        }
        if ($cleansessionid === '') {
            $cleansessionid = null;  // The backend accepts null to create a new session.
        }

        // 4. Call the Python backend.
        // userid is ALWAYS from $USER, NEVER from the parameter. If an
        // attacker sends a userid other than their own, we silently ignore it.
        $client = new backend_client();

        if (!empty($params['multicourse'])) {
            // Feature B: resolve the courses the student is enrolled in.
            // enrol_get_users_courses() is native to Moodle 4.1-4.5 and respects
            // course visibility and active enrolments.
            $enrolledcourses = enrol_get_users_courses(
                (int) $USER->id,
                true,
                ['id', 'shortname', 'fullname']
            );
            $courseids   = [];
            $coursenames = [];
            foreach ($enrolledcourses as $course) {
                $cid = (int) $course->id;
                $courseids[] = $cid;
                $coursenames[(string) $cid] = $course->fullname
                    ?? $course->shortname
                    ?? 'Course';
            }
            // Defensive fallback: if it couldn't be resolved, use the current course.
            if (empty($courseids)) {
                $courseids   = [(int) $params['courseid']];
                $coursenames = [(string) $params['courseid'] => 'Current course'];
            }

            $response = $client->send_message_multicourse(
                $courseids,
                $coursenames,
                (int) $USER->id,
                $cleanquestion,
                $cleansessionid,
                $isteacher
            );
        } else {
            $response = $client->send_message(
                (int) $params['courseid'],
                (int) $USER->id,
                $cleanquestion,
                $cleansessionid,
                $isteacher
            );
        }

        // 5. Validate the response's shape.
        // The backend already validated internally with Pydantic, but as an
        // external function we have to return exactly the shape declared in
        // execute_returns() or Moodle will reject it.
        if (!isset($response['session_id'], $response['answer'], $response['messages'])) {
            throw new \moodle_exception(
                'errorbackend',
                'local_nexusai',
                '',
                'Backend response is missing required fields'
            );
        }

        return [
            'session_id' => (string) $response['session_id'],
            'answer'     => (string) $response['answer'],
            'messages'   => array_map(
                static fn(array $m) => [
                    'id'         => (string) ($m['id'] ?? ''),
                    'role'       => (string) ($m['role'] ?? ''),
                    'content'    => (string) ($m['content'] ?? ''),
                    'created_at' => (string) ($m['created_at'] ?? ''),
                ],
                $response['messages']
            ),
        ];
    }
}
