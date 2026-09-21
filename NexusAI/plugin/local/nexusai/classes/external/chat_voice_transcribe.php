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
 * External function `local_nexusai_chat_voice_transcribe`.
 *
 * Receives a short audio clip (spoken question, recorded with MediaRecorder
 * in the browser) as base64, same pattern as `document_upload.php`, and
 * forwards it to the Python backend to transcribe (VOICE-01, #314).
 *
 * Unlike `document_upload`, the capability is `local/nexusai:use`
 * (not `manage`) — voice is just another way to ask the chat a question,
 * available to students, not just teachers (same capability as
 * `chat_send.php`). The transcribed text is NEVER sent as a message here —
 * the frontend shows it in the composer so the student can confirm/edit it
 * before sending it through the normal `chat_send` flow.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Receives a short audio clip recorded in the browser and forwards it to the Python backend to transcribe (VOICE-01, #314).
 */
class chat_voice_transcribe extends \external_api {
    /** Maximum accepted base64 size — short audio, 14 MB is plenty
     *  (~10 MB decoded, base64 inflates by ~33%). */
    private const MAX_B64_BYTES = 14 * 1024 * 1024;

    /** Formats MediaRecorder typically produces depending on the browser. */
    private const ALLOWED_MIME_TYPES = [
        'audio/webm',
        'audio/ogg',
        'audio/mp4',
        'audio/mpeg',
        'audio/wav',
        'audio/x-m4a',
    ];

    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'    => new \external_value(PARAM_INT, 'Course ID (to validate the capability)', VALUE_REQUIRED),
            'mimetype'    => new \external_value(PARAM_RAW, 'MIME type detected by the browser', VALUE_REQUIRED),
            'content_b64' => new \external_value(PARAM_RAW, 'Audio in base64', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'text' => new \external_value(PARAM_RAW, 'Transcribed text'),
        ]);
    }

    /**
     * Transcribes a short audio clip recorded in the browser via the Python backend.
     *
     * @param int $courseid Course ID (to validate the capability)
     * @param string $mimetype MIME type detected by the browser
     * @param string $contentb64 Audio in base64
     * @return array
     */
    public static function execute(int $courseid, string $mimetype, string $contentb64): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'    => $courseid,
            'mimetype'    => $mimetype,
            'content_b64' => $contentb64,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        if (!in_array($params['mimetype'], self::ALLOWED_MIME_TYPES, true)) {
            throw new \invalid_parameter_exception(
                'Unsupported audio type. Allowed: ' . implode(', ', self::ALLOWED_MIME_TYPES)
                . '. Got: ' . $params['mimetype']
            );
        }

        if (strlen($params['content_b64']) > self::MAX_B64_BYTES) {
            throw new \invalid_parameter_exception('Audio too large (max 10MB)');
        }

        $audiobytes = base64_decode($params['content_b64'], true);
        if ($audiobytes === false || $audiobytes === '') {
            throw new \invalid_parameter_exception('Invalid base64 content');
        }

        $client = new backend_client();
        $response = $client->transcribe_audio($params['mimetype'], $audiobytes);

        return [
            'text' => (string) ($response['text'] ?? ''),
        ];
    }
}
