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
 * External function `local_nexusai_chat_message_feedback`.
 *
 * ASIST-01 (#321): saves the student's 👍/👎 vote on a specific assistant
 * answer, tied to `messages.id`. Anonymous by design on the backend side
 * — this proxy only resolves the real server-side $USER->id (never trusts
 * a client-supplied userid) before sending it off to be hashed.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * ASIST-01 (#321): saves the student's 👍/👎 vote on a specific assistant answer, tied to
 * `messages.id`.
 */
class chat_message_feedback extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'  => new \external_value(PARAM_INT, 'Course ID', VALUE_REQUIRED),
            'messageid' => new \external_value(PARAM_ALPHANUMEXT, 'Message ID (UUID)', VALUE_REQUIRED),
            'ishelpful' => new \external_value(PARAM_BOOL, 'true = 👍, false = 👎', VALUE_REQUIRED),
            'comment'   => new \external_value(PARAM_TEXT, 'Optional short comment (only with 👎)', VALUE_DEFAULT, ''),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'ok' => new \external_value(PARAM_BOOL, 'true if saved successfully'),
        ]);
    }

    /**
     * ASIST-01 (#321): saves the student's 👍/👎 vote on a specific assistant answer, tied to
     * `messages.id`.
     *
     * @param int $courseid Course ID
     * @param string $messageid Message ID (UUID)
     * @param bool $ishelpful true = 👍, false = 👎
     * @param string $comment Optional short comment (only with 👎)
     * @return array
     */
    public static function execute(int $courseid, string $messageid, bool $ishelpful, string $comment = ''): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'  => $courseid,
            'messageid' => $messageid,
            'ishelpful' => $ishelpful,
            'comment'   => $comment,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        $cleancomment = trim($params['comment']);
        if (mb_strlen($cleancomment) > 1000) {
            $cleancomment = mb_substr($cleancomment, 0, 1000);
        }

        $client   = new backend_client();
        $response = $client->submit_message_feedback(
            $params['messageid'],
            (int) $params['courseid'],
            (int) $USER->id,
            (bool) $params['ishelpful'],
            $cleancomment !== '' ? $cleancomment : null
        );

        return [
            'ok' => (bool) ($response['ok'] ?? true),
        ];
    }
}
