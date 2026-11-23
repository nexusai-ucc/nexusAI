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
 * Tests for the "My API key" web services (BYOK).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

use local_nexusai\local\user_llm;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/external_testcase.php');

/**
 * Covers get, save, test and delete of the user's own API key.
 *
 * @covers \local_nexusai\external\user_llm_get
 * @covers \local_nexusai\external\user_llm_save
 * @covers \local_nexusai\external\user_llm_test
 * @covers \local_nexusai\external\user_llm_delete
 */
final class user_llm_functions_test extends external_testcase {
    /** @var string A key long enough to be valid. */
    private const KEY = 'sk-proj-test-0123456789-9z9z';

    /**
     * A course with NexusAI on and the site switch of own keys on (it ships off).
     *
     * @param string $role Role of the user in the course.
     * @return \stdClass
     */
    protected function setup_course(string $role = 'student'): \stdClass {
        $data = parent::setup_course($role);
        set_config('user_llm_enabled', 1, 'local_nexusai');
        return $data;
    }

    /**
     * Criterion: without a key the screen offers the providers and nothing is active.
     */
    public function test_get_without_a_key(): void {
        $data = $this->setup_course();

        $state = $this->call(user_llm_get::class, [(int) $data->course->id]);

        $this->assertTrue($state['siteenabled']);
        $this->assertTrue($state['courseallowed']);
        $this->assertFalse($state['configured']);
        $this->assertFalse($state['active']);
        $this->assertSame(array_keys(user_llm::PROVIDERS), array_column($state['providers'], 'id'));
    }

    /**
     * Criterion: a key the provider answered with is saved and shown only as a hint.
     */
    public function test_save_keeps_the_key_once_the_provider_answered(): void {
        $data = $this->setup_course();
        $this->mock_backend(['ok' => true, 'provider' => 'openai', 'model' => 'gpt-x', 'latency_ms' => 120.0]);

        $result = $this->call(user_llm_save::class, [(int) $data->course->id, 'openai', 'gpt-x', self::KEY]);

        $this->assertTrue($result['ok']);
        $this->assertTrue($result['state']['configured']);
        $this->assertTrue($result['state']['active']);
        $this->assertSame('sk-pro…9z9z', $result['state']['keyhint']);
        $this->assertStringNotContainsString(self::KEY, json_encode($result));
        $this->assertSame(self::KEY, user_llm::credentials((int) $data->user->id)['api_key']);
    }

    /**
     * Criterion: when the test fails the key is not saved and the user gets a reason.
     */
    public function test_save_does_not_keep_a_key_that_failed(): void {
        $data = $this->setup_course();
        $this->mock_backend('no es json');

        $result = $this->call(user_llm_save::class, [(int) $data->course->id, 'openai', 'gpt-x', self::KEY]);

        $this->assertFalse($result['ok']);
        $this->assertSame('unavailable', $result['reason']);
        $this->assertNotSame('', $result['message']);
        $this->assertFalse($result['state']['configured']);
        $this->assertNull(user_llm::credentials((int) $data->user->id));
    }

    /**
     * Criterion: nothing is saved while the administrator has own keys turned off.
     */
    public function test_save_refused_when_the_site_switch_is_off(): void {
        $data = $this->setup_course();
        set_config('user_llm_enabled', 0, 'local_nexusai');

        $this->assert_call_fails('userllm_sitedisabled', user_llm_save::class, [
            (int) $data->course->id, 'openai', 'gpt-x', self::KEY,
        ]);
    }

    /**
     * Criterion: "Test again" sends the saved key and records when it answered.
     */
    public function test_test_again_and_delete(): void {
        $data = $this->setup_course();
        $userid = (int) $data->user->id;
        user_llm::save($userid, 'openai', 'gpt-x', self::KEY, 0);
        $this->mock_backend(['ok' => true, 'provider' => 'openai', 'model' => 'gpt-x', 'latency_ms' => 80.0]);

        $result = $this->call(user_llm_test::class, [(int) $data->course->id]);
        $this->assertTrue($result['ok']);
        $this->assertGreaterThan(0, $result['state']['timetested']);

        $state = $this->call(user_llm_delete::class, [(int) $data->course->id]);
        $this->assertFalse($state['configured']);
        $this->assertNull(user_llm::status($userid));
    }
}
