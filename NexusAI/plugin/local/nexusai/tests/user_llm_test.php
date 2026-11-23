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
 * Tests for "My API key" (BYOK): the user's own AI provider key.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\external\backend_client;
use local_nexusai\local\usage_store;
use local_nexusai\local\user_llm;

/**
 * Covers storing the key, when it travels to the backend and how its usage is counted.
 *
 * @covers \local_nexusai\local\user_llm
 * @covers \local_nexusai\local\usage_store
 * @covers \local_nexusai\external\backend_client::user_llm_failure
 */
final class user_llm_test extends \advanced_testcase {
    /** @var string A key long enough to be valid. */
    private const KEY = 'sk-ant-test-0123456789-4f2a';

    /**
     * A student enrolled in a new course, logged in.
     *
     * @return array{0:\stdClass, 1:\stdClass} [user, course]
     */
    private function student_in_course(): array {
        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_and_enrol($course, 'student');
        $this->setUser($user);
        set_config('user_llm_enabled', 1, 'local_nexusai');
        return [$user, $course];
    }

    /**
     * The key is stored encrypted, comes back intact and is never shown in full.
     */
    public function test_save_encrypts_the_key_and_status_never_shows_it(): void {
        $this->resetAfterTest();
        [$user] = $this->student_in_course();

        user_llm::save((int) $user->id, 'anthropic', 'claude-sonnet-5-5', self::KEY, 1700000000);

        $stored = get_user_preferences(user_llm::PREFERENCE, null, $user->id);
        $this->assertStringNotContainsString(self::KEY, $stored, 'The preference never holds the key in clear.');
        $status = user_llm::status((int) $user->id);
        $this->assertSame('anthropic', $status['provider']);
        $this->assertSame('sk-ant…4f2a', $status['hint']);
        $this->assertArrayNotHasKey('key', $status);
        $this->assertSame(
            ['provider' => 'anthropic', 'model' => 'claude-sonnet-5-5', 'api_key' => self::KEY],
            user_llm::credentials((int) $user->id)
        );

        // A key that can no longer be decrypted (the site encryption key changed) is not active.
        $course = $this->getDataGenerator()->create_course();
        $broken = json_decode(get_user_preferences(user_llm::PREFERENCE, null, $user->id), true);
        $broken['key'] = 'not-a-valid-ciphertext';
        set_user_preference(user_llm::PREFERENCE, json_encode($broken), $user->id);
        $this->assertNotNull(user_llm::status((int) $user->id));
        $this->assertNull(user_llm::credentials((int) $user->id));
        $this->assertFalse(user_llm::active_for((int) $user->id, [(int) $course->id]));
        // One debugging() per failed decryption: credentials() above and inside active_for().
        $this->assertdebuggingcalledcount(2);

        user_llm::delete((int) $user->id);
        $this->assertNull(user_llm::status((int) $user->id));
        $this->assertNull(user_llm::credentials((int) $user->id));
    }

    /**
     * Only known providers, model names without spaces and keys of a sane length.
     */
    public function test_validate_rejects_unknown_providers_and_bad_values(): void {
        $this->assertSame(
            ['provider' => 'openai', 'model' => 'gpt-x', 'apikey' => self::KEY],
            user_llm::validate('openai', ' gpt-x ', ' ' . self::KEY . ' ')
        );
        $invalid = [
            ['http://169.254.169.254', 'm', self::KEY],
            ['openai', 'con espacio', self::KEY],
            ['openai', 'gpt-x', 'corta'],
            ['openai', 'gpt-x', 'sk con espacio adentro'],
        ];
        foreach ($invalid as [$p, $m, $k]) {
            try {
                user_llm::validate($p, $m, $k);
                $this->fail("Accepted $p / $m / $k");
            } catch (\invalid_parameter_exception $e) {
                $this->assertInstanceOf(\invalid_parameter_exception::class, $e);
            }
        }
    }

    /**
     * Courses allow own keys unless the teacher turns it off; the site switch beats them all.
     */
    public function test_course_permission_and_site_switch(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $course = $this->getDataGenerator()->create_course();
        $admin = get_admin();
        user_llm::save((int) $admin->id, 'openai', 'gpt-x', self::KEY, 0);

        // The site switch ships off: a saved key is not used until the administrator opts in.
        $this->assertFalse(user_llm::site_enabled(), 'Off by default.');
        $this->assertFalse(user_llm::active_for((int) $admin->id, [(int) $course->id]));
        unset_config('user_llm_enabled', 'local_nexusai');
        $this->assertFalse(user_llm::site_enabled(), 'A site that never saved the setting counts as off.');
        set_config('user_llm_enabled', 1, 'local_nexusai');

        $this->assertTrue(user_llm::course_allowed((int) $course->id), 'Allowed by default.');
        $this->assertTrue(user_llm::active_for((int) $admin->id, [(int) $course->id]));

        user_llm::set_course_allowed((int) $course->id, false);
        $this->assertFalse(user_llm::course_allowed((int) $course->id));
        $this->assertFalse(user_llm::active_for((int) $admin->id, [(int) $course->id]));

        user_llm::set_course_allowed((int) $course->id, true);
        set_config('user_llm_enabled', 0, 'local_nexusai');
        $this->assertFalse(user_llm::active_for((int) $admin->id, [(int) $course->id]), 'The site switch wins.');
    }

    /**
     * The key travels only for the logged-in user and only if every course of the request allows it.
     */
    public function test_add_to_body_only_for_the_user_and_allowed_courses(): void {
        $this->resetAfterTest();
        [$user, $course] = $this->student_in_course();
        $other = $this->getDataGenerator()->create_course();
        user_llm::save((int) $user->id, 'openai', 'gpt-x', self::KEY, 0);

        $body = user_llm::add_to_body(['course_id' => (int) $course->id, 'user_llm' => 'forged'], 'student');
        $this->assertSame(self::KEY, $body['user_llm']['api_key']);

        $this->assertArrayNotHasKey(
            'user_llm',
            user_llm::add_to_body(['course_id' => (int) $course->id], 'system'),
            'Tasks and observers never carry anybody\'s key.'
        );

        user_llm::set_course_allowed((int) $other->id, false);
        $multi = user_llm::add_to_body(
            ['course_id' => (int) $course->id, 'course_ids' => [(int) $course->id, (int) $other->id]],
            'student'
        );
        $this->assertArrayNotHasKey('user_llm', $multi, 'One course that does not allow it is enough to leave it out.');

        $this->setUser(null);
        $body = user_llm::add_to_body(['course_id' => (int) $course->id, 'user_llm' => 'forged'], 'student');
        $this->assertArrayNotHasKey('user_llm', $body, 'Nothing for a request without a logged-in user, not even a forged one.');
    }

    /**
     * Calls answered with the user's key are stored as such and stay out of the token budget.
     */
    public function test_byok_usage_is_stored_and_left_out_of_the_budget(): void {
        $this->resetAfterTest();
        [$user, $course] = $this->student_in_course();
        usage_store::record_calls((int) $user->id, (int) $course->id, 'student', [
            ['feature' => 'chat.stream', 'prompt_tokens' => 100, 'completion_tokens' => 20],
            ['feature' => 'chat.stream', 'prompt_tokens' => 900, 'completion_tokens' => 100, 'byok' => true],
        ], 'req-1');
        usage_store::record_calls((int) $user->id, (int) $course->id, 'student', [
            ['feature' => 'user-llm.test', 'prompt_tokens' => 5, 'completion_tokens' => 1, 'byok' => true],
        ], 'req-test');

        $this->assertSame(120, usage_store::chat_tokens_since((int) $user->id, 'student', 0));
        // Streamed answers come without a request id: they still count.
        usage_store::record_calls((int) $user->id, (int) $course->id, 'student', [
            ['feature' => 'chat.stream', 'prompt_tokens' => 50, 'completion_tokens' => 10, 'byok' => true],
        ]);
        $this->assertSame(['requests' => 2, 'tokens' => 1060], user_llm::month_usage((int) $user->id));
    }

    /**
     * The backend's 424 for a failed own key is recognised; any other error is not.
     */
    public function test_user_llm_failure_reads_only_the_backend_424(): void {
        $detail = json_encode(['detail' => [
            'error' => 'user_llm_failed',
            'reason' => 'rejected',
            'provider' => 'openai',
            'model' => 'gpt-x',
            'message' => 'OpenAI rechazó tu API key.',
        ]]);
        $failure = backend_client::user_llm_failure(
            new \moodle_exception('errorbackend', 'local_nexusai', '', 'HTTP 424: ' . $detail)
        );
        $this->assertSame('rejected', $failure['reason']);
        $this->assertSame('OpenAI rechazó tu API key.', $failure['message']);

        $this->assertNull(backend_client::user_llm_failure(
            new \moodle_exception('errorbackend', 'local_nexusai', '', 'HTTP 503: {"detail":"x"}')
        ));
    }
}
