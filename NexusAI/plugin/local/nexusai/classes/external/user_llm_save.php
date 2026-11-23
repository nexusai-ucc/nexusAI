<?php
// This file is part of Moodle - https://moodle.org/
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
 * External function `local_nexusai_user_llm_save` ("My API key").
 *
 * Tests the key against its provider through the backend and saves it,
 * encrypted, only if the provider answered. A key that does not work is never
 * stored: the user gets the reason (rejected, no credit, unknown model...).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use local_nexusai\local\user_llm;

/**
 * Tests and saves the logged-in user's own API key.
 */
class user_llm_save extends external_api {
    /**
     * Parameters for execute().
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course the screen was opened from', VALUE_REQUIRED),
            'provider' => new external_value(PARAM_ALPHANUMEXT, 'Provider id', VALUE_REQUIRED),
            'model' => new external_value(PARAM_RAW_TRIMMED, 'Model name', VALUE_REQUIRED),
            'apikey' => new external_value(PARAM_RAW_TRIMMED, 'API key', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return self::result_structure();
    }

    /**
     * Result of a test: ok, or the reason the provider gave, plus the new state.
     *
     * @return external_single_structure
     */
    public static function result_structure(): external_single_structure {
        return new external_single_structure([
            'ok' => new external_value(PARAM_BOOL, 'Whether the provider answered'),
            'reason' => new external_value(PARAM_ALPHA, 'Why it failed: rejected, quota, model, request, unavailable; empty if ok'),
            'message' => new external_value(PARAM_TEXT, 'Message for the user when it failed'),
            'state' => user_llm_get::state_structure(),
        ]);
    }

    /**
     * Tests the key and, if it works, saves it.
     *
     * @param int $courseid Course.
     * @param string $provider Provider id.
     * @param string $model Model name.
     * @param string $apikey API key.
     * @return array
     */
    public static function execute(int $courseid, string $provider, string $model, string $apikey): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'provider' => $provider,
            'model' => $model,
            'apikey' => $apikey,
        ]);
        $courseid = (int) $params['courseid'];
        user_llm_get::check_access($courseid);
        \local_nexusai\local\course_guard::require_enabled($courseid);
        if (!user_llm::site_enabled()) {
            throw new \moodle_exception('userllm_sitedisabled', 'local_nexusai');
        }
        $clean = user_llm::validate($params['provider'], $params['model'], $params['apikey']);
        $userid = (int) $USER->id;

        $result = self::probe($userid, $courseid, [
            'provider' => $clean['provider'],
            'model' => $clean['model'],
            'api_key' => $clean['apikey'],
        ]);
        if ($result['ok']) {
            user_llm::save($userid, $clean['provider'], $clean['model'], $clean['apikey'], time());
        }
        $result['state'] = user_llm_get::state($userid, $courseid);
        return $result;
    }

    /**
     * Asks the backend to try the key once.
     *
     * @param int $userid User.
     * @param int $courseid Course.
     * @param array $credentials {provider, model, api_key}.
     * @return array{ok:bool, reason:string, message:string}
     */
    public static function probe(int $userid, int $courseid, array $credentials): array {
        try {
            (new backend_client())->test_user_llm($userid, $courseid, $credentials);
            return ['ok' => true, 'reason' => '', 'message' => ''];
        } catch (\moodle_exception $e) {
            $failure = backend_client::user_llm_failure($e);
            if ($failure === null) {
                // The backend itself failed, not the user's provider.
                return [
                    'ok' => false,
                    'reason' => 'unavailable',
                    'message' => get_string('errorchatunavailable', 'local_nexusai'),
                ];
            }
            // The reason comes from the backend; the text, from this plugin's strings.
            $translated = user_llm::failure($failure['reason'], (string) $credentials['provider'], (string) $credentials['model']);
            return ['ok' => false, 'reason' => $translated['reason'], 'message' => $translated['message']];
        }
    }
}
