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
 * Base class for the tests of the plugin's external functions (TPC-05, #577).
 *
 * Every external function follows the same shape: validate parameters, check
 * the capability and that NexusAI is on for the course, ask the backend (or a
 * local store) and map the answer. The backend is replaced by Moodle's own test
 * double, \curl::mock_response(): during PHPUnit the next \curl request returns
 * the queued body with HTTP 200 instead of going to the network, so
 * backend_client runs for real (signature, headers, JSON decoding) without a
 * backend.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

use core_external\external_api;

/**
 * Shared arrange steps and helpers for the external function tests.
 */
abstract class external_testcase extends \advanced_testcase {
    /**
     * Arrange: a course with NexusAI on, the backend configured and a user of
     * the given role enrolled and logged in.
     *
     * @param string $role Role to enrol the user with (student, editingteacher...).
     * @return \stdClass With course and user.
     */
    protected function setup_course(string $role = 'student'): \stdClass {
        $this->resetAfterTest();
        set_config('enabled', 1, 'local_nexusai');
        // Dummy values: \curl::mock_response() answers before any request leaves.
        set_config('api_endpoint', 'http://backend.test', 'local_nexusai');
        set_config('api_key', 'dummy_test_api_key_32_chars_long_x', 'local_nexusai');
        set_config('shared_secret', 'dummy_test_secret_32_chars_long_x', 'local_nexusai');

        $generator = $this->getDataGenerator();
        $data = new \stdClass();
        $data->course = $generator->create_course();
        $data->user = $generator->create_and_enrol($data->course, $role);
        \local_nexusai\local\course_guard::set_enabled((int) $data->course->id, true);
        $this->setUser($data->user);
        return $data;
    }

    /**
     * Queues the backend's answers, in the order the requests will be made.
     *
     * \curl keeps its mocks in a stack (array_pop), so they are pushed reversed.
     *
     * @param array ...$responses Decoded JSON bodies; a string is sent as is.
     * @return void
     */
    protected function mock_backend(...$responses): void {
        foreach (array_reverse($responses) as $response) {
            \curl::mock_response(is_string($response) ? $response : json_encode($response));
        }
    }

    /**
     * Act: runs an external function and validates its result against
     * execute_returns(), as the web service layer does.
     *
     * @param string $class External function class (fully qualified).
     * @param array $args Arguments for execute(), positional or named.
     * @return mixed The cleaned result.
     */
    protected function call(string $class, array $args) {
        $result = $class::execute(...$args);
        return external_api::clean_returnvalue($class::execute_returns(), $result);
    }

    /**
     * Asserts that running an external function stops with an error code.
     *
     * @param string $errorcode Expected moodle_exception error code.
     * @param string $class External function class.
     * @param array $args Arguments for execute().
     * @return void
     */
    protected function assert_call_fails(string $errorcode, string $class, array $args): void {
        try {
            $class::execute(...$args);
            $this->fail("Expected the error '$errorcode'.");
        } catch (\moodle_exception $e) {
            $this->assertSame($errorcode, $e->errorcode);
        }
    }

    /**
     * Turns NexusAI off for a course.
     *
     * @param int $courseid Course id.
     * @return void
     */
    protected function disable_course(int $courseid): void {
        \local_nexusai\local\course_guard::set_enabled($courseid, false);
    }
}
