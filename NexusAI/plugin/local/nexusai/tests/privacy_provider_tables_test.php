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
 * Tests for the privacy provider over the plugin's own tables (DATA-03, issue #523).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;
use local_nexusai\privacy\provider;

/**
 * Covers contexts, users, export and deletion on the local_nexusai_* tables.
 *
 * The backend is not configured in tests, so only the local tables are involved.
 *
 * @covers \local_nexusai\privacy\provider
 */
final class privacy_provider_tables_test extends \core_privacy\tests\provider_testcase {
    /**
     * Inserts one row of every kind for a user in a course.
     *
     * @param int $userid User ID.
     * @param int $courseid Course ID.
     * @param string $tag Text to recognise the rows by.
     * @return array Ids of the inserted rows, by table.
     */
    private function seed(int $userid, int $courseid, string $tag): array {
        global $DB;
        $now = time();
        $uuid = static fn() => \core\uuid::generate();
        $ids = [];
        $ids['session'] = $DB->insert_record('local_nexusai_chat_sessions', ['uuid' => $uuid(), 'userid' => $userid,
            'courseid' => $courseid, 'multicourse' => 0, 'timecreated' => $now, 'timemodified' => $now]);
        $ids['question'] = $DB->insert_record('local_nexusai_messages', ['uuid' => $uuid(), 'sessionid' => $ids['session'],
            'role' => 'user', 'content' => "pregunta $tag", 'timecreated' => $now]);
        $ids['answer'] = $DB->insert_record('local_nexusai_messages', ['uuid' => $uuid(), 'sessionid' => $ids['session'],
            'role' => 'assistant', 'content' => "respuesta $tag", 'tokensprompt' => 10, 'tokenscompletion' => 5,
            'timecreated' => $now]);
        $ids['interaction'] = $DB->insert_record('local_nexusai_interactions', ['courseid' => $courseid, 'userid' => $userid,
            'messageid' => $ids['question'], 'questionchars' => 10, 'answerchars' => 20, 'tokensprompt' => 10,
            'tokenscompletion' => 5, 'latencyms' => 100, 'endpoint' => 'stream', 'timecreated' => $now]);
        $ids['feedback'] = $DB->insert_record('local_nexusai_msg_feedback', ['messageid' => $ids['answer'],
            'courseid' => $courseid, 'userid' => $userid, 'ishelpful' => 1, 'comment' => "voto $tag",
            'timecreated' => $now, 'timemodified' => $now]);
        $ids['gap'] = $DB->insert_record('local_nexusai_gaps', ['uuid' => $uuid(), 'courseid' => $courseid, 'userid' => $userid,
            'question' => "gap $tag", 'questionhash' => sha1($tag), 'timecreated' => $now]);
        $ids['attempt'] = $DB->insert_record('local_nexusai_quiz_attempts', ['uuid' => $uuid(), 'courseid' => $courseid,
            'userid' => $userid, 'topic' => "tema $tag", 'totalquestions' => 5, 'correctanswers' => 3, 'score' => 0.6,
            'timecreated' => $now]);
        $ids['error'] = $DB->insert_record('local_nexusai_quiz_errors', ['uuid' => $uuid(), 'courseid' => $courseid,
            'userid' => $userid, 'questiontype' => 'multiple_choice', 'question' => "error $tag", 'explanation' => 'x',
            'timecreated' => $now]);
        $card = $DB->get_field('local_nexusai_flashcards', 'id', ['courseid' => $courseid, 'contenthash' => 'card']);
        if (!$card) {
            $card = $DB->insert_record('local_nexusai_flashcards', ['uuid' => $uuid(), 'courseid' => $courseid,
                'contenthash' => 'card', 'question' => 'q', 'explanation' => 'e', 'timecreated' => $now]);
        }
        $ids['review'] = $DB->insert_record('local_nexusai_fc_reviews', ['flashcardid' => $card, 'userid' => $userid,
            'timecreated' => $now, 'timemodified' => $now]);
        $ids['alert'] = $DB->insert_record('local_nexusai_cal_alerts', ['uuid' => $uuid(), 'userid' => $userid,
            'courseid' => $courseid, 'eventid' => $courseid, 'eventname' => "evento $tag", 'timecreated' => $now]);
        $ids['usage'] = $DB->insert_record('local_nexusai_usage', ['userid' => $userid, 'courseid' => $courseid,
            'role' => 'student', 'feature' => 'chat.stream', 'prompttokens' => 10, 'timecreated' => $now]);
        $question = $DB->get_field('local_nexusai_qbank', 'id', ['courseid' => $courseid, 'contenthash' => 'q1']);
        if (!$question) {
            $question = $DB->insert_record('local_nexusai_qbank', ['uuid' => $uuid(), 'courseid' => $courseid,
                'topichash' => 't', 'questiontype' => 'multiple_choice', 'difficulty' => 'medium', 'contenthash' => 'q1',
                'payload' => '{}', 'timecreated' => $now]);
        }
        $ids['bankuse'] = $DB->insert_record('local_nexusai_qbank_use', ['userid' => $userid, 'questionid' => $question,
            'purpose' => 'practice', 'timecreated' => $now]);
        $ids['exam'] = $DB->insert_record('local_nexusai_exams', ['uuid' => $uuid(), 'courseid' => $courseid,
            'userid' => $userid, 'params' => '{}', 'timecreated' => $now]);
        return $ids;
    }

    /**
     * Counts the rows of a user that should be gone after deleting their data.
     *
     * @param int $userid User ID.
     * @return int
     */
    private function personal_rows(int $userid): int {
        global $DB;
        $count = 0;
        foreach (['chat_sessions', 'msg_feedback', 'gaps', 'quiz_attempts', 'quiz_errors', 'fc_reviews', 'cal_alerts',
                'usage', 'interactions', 'qbank_use', 'exams'] as $table) {
            $count += $DB->count_records("local_nexusai_$table", ['userid' => $userid]);
        }
        return $count;
    }

    /**
     * A user with data only in the plugin tables gets that course, without being enrolled.
     */
    public function test_contexts_come_from_the_plugin_tables(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $other = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();
        $this->seed((int) $user->id, (int) $course->id, 'a');

        $ids = array_map('intval', provider::get_contexts_for_userid((int) $user->id)->get_contextids());

        $this->assertSame([(int) \context_course::instance($course->id)->id], $ids);
        $this->assertNotContains((int) \context_course::instance($other->id)->id, $ids);
    }

    /**
     * Rows migrated from the backend with only a hash of the user id still lead to the course.
     */
    public function test_contexts_include_rows_identified_by_the_backend_hash(): void {
        global $DB;
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();
        $DB->insert_record('local_nexusai_interactions', ['courseid' => $course->id,
            'userhash' => hash('sha256', (string) $user->id), 'latencyms' => 1, 'endpoint' => 'stream', 'timecreated' => time()]);

        $ids = array_map('intval', provider::get_contexts_for_userid((int) $user->id)->get_contextids());

        $this->assertSame([(int) \context_course::instance($course->id)->id], $ids);
    }

    /**
     * Every user with rows in the course is listed.
     */
    public function test_users_in_context_come_from_the_plugin_tables(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $one = $this->getDataGenerator()->create_user();
        $two = $this->getDataGenerator()->create_user();
        $this->seed((int) $one->id, (int) $course->id, 'a');
        $this->seed((int) $two->id, (int) $course->id, 'b');

        $userlist = new userlist(\context_course::instance($course->id), 'local_nexusai');
        provider::get_users_in_context($userlist);

        $this->assertEqualsCanonicalizing([(int) $one->id, (int) $two->id], array_map('intval', $userlist->get_userids()));
    }

    /**
     * The export has the user's conversation with its messages, and nothing of other users.
     */
    public function test_export_writes_the_users_rows_only(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();
        $other = $this->getDataGenerator()->create_user();
        $this->seed((int) $user->id, (int) $course->id, 'mio');
        $this->seed((int) $other->id, (int) $course->id, 'ajeno');
        $context = \context_course::instance($course->id);

        $this->export_context_data_for_user((int) $user->id, $context, 'local_nexusai');

        $root = get_string('pluginname', 'local_nexusai');
        $sessions = writer::with_context($context)->get_data(
            [$root, get_string('privacy:metadata:local_nexusai_chat_sessions', 'local_nexusai')]
        );
        $this->assertCount(1, $sessions->items);
        $contents = array_column($sessions->items[0]['messages'], 'content');
        $this->assertSame(['pregunta mio', 'respuesta mio'], $contents);

        $gaps = writer::with_context($context)->get_data(
            [$root, get_string('privacy:metadata:local_nexusai_gaps', 'local_nexusai')]
        );
        $this->assertSame(['gap mio'], array_column($gaps->items, 'question'));
        $reviews = writer::with_context($context)->get_data(
            [$root, get_string('privacy:metadata:local_nexusai_fc_reviews', 'local_nexusai')]
        );
        $this->assertCount(1, $reviews->items);
    }

    /**
     * Deleting a user removes their content, anonymises metrics and leaves other users alone.
     */
    public function test_delete_for_user_removes_content_and_anonymises_metrics(): void {
        global $DB;
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();
        $other = $this->getDataGenerator()->create_user();
        $mine = $this->seed((int) $user->id, (int) $course->id, 'mio');
        $this->seed((int) $other->id, (int) $course->id, 'ajeno');
        $before = $this->personal_rows((int) $other->id);

        provider::delete_data_for_user(new approved_contextlist($user, 'local_nexusai',
            [\context_course::instance($course->id)->id]));

        $this->assertSame(0, $this->personal_rows((int) $user->id));
        $this->assertFalse($DB->record_exists('local_nexusai_messages', ['sessionid' => $mine['session']]));
        // Metrics stay, without the user.
        $this->assertTrue($DB->record_exists('local_nexusai_usage', ['id' => $mine['usage'], 'userid' => null]));
        $this->assertTrue($DB->record_exists('local_nexusai_interactions', ['id' => $mine['interaction'], 'userid' => null,
            'messageid' => null]));
        // The exam stays in the course, detached from the teacher.
        $this->assertSame(0, (int) $DB->get_field('local_nexusai_exams', 'userid', ['id' => $mine['exam']]));
        // Shared course content and other users are untouched.
        $this->assertSame(1, $DB->count_records('local_nexusai_flashcards', ['courseid' => $course->id]));
        $this->assertSame(1, $DB->count_records('local_nexusai_qbank', ['courseid' => $course->id]));
        $this->assertSame($before, $this->personal_rows((int) $other->id));
    }

    /**
     * A deletion in one course does not touch the same user's data in another course.
     */
    public function test_delete_for_user_is_limited_to_the_approved_course(): void {
        global $DB;
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $other = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();
        $this->seed((int) $user->id, (int) $course->id, 'a');
        $this->seed((int) $user->id, (int) $other->id, 'b');

        provider::delete_data_for_user(new approved_contextlist($user, 'local_nexusai',
            [\context_course::instance($course->id)->id]));

        $this->assertSame(0, $DB->count_records('local_nexusai_gaps', ['courseid' => $course->id]));
        $this->assertSame(1, $DB->count_records('local_nexusai_gaps', ['courseid' => $other->id]));
        $this->assertSame(1, $DB->count_records('local_nexusai_chat_sessions', ['courseid' => $other->id]));
        $this->assertSame(1, $DB->count_records('local_nexusai_fc_reviews', ['userid' => $user->id]));
    }

    /**
     * Rows migrated with only the backend hash are anonymised too.
     */
    public function test_delete_for_user_clears_hash_only_rows(): void {
        global $DB;
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $user = $this->getDataGenerator()->create_user();
        $hash = hash('sha256', (string) $user->id);
        $id = $DB->insert_record('local_nexusai_interactions', ['courseid' => $course->id, 'userhash' => $hash,
            'latencyms' => 1, 'endpoint' => 'stream', 'timecreated' => time()]);
        $vote = $DB->insert_record('local_nexusai_msg_feedback', ['courseid' => $course->id, 'userhash' => $hash,
            'ishelpful' => 1, 'timecreated' => time(), 'timemodified' => time()]);

        provider::delete_data_for_user(new approved_contextlist($user, 'local_nexusai',
            [\context_course::instance($course->id)->id]));

        $this->assertNull($DB->get_field('local_nexusai_interactions', 'userhash', ['id' => $id]));
        $this->assertFalse($DB->record_exists('local_nexusai_msg_feedback', ['id' => $vote]));
    }

    /**
     * Deleting some users of a course removes only theirs.
     */
    public function test_delete_for_users_removes_only_the_approved_users(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $one = $this->getDataGenerator()->create_user();
        $two = $this->getDataGenerator()->create_user();
        $this->seed((int) $one->id, (int) $course->id, 'a');
        $this->seed((int) $two->id, (int) $course->id, 'b');
        $before = $this->personal_rows((int) $two->id);

        provider::delete_data_for_users(new approved_userlist(\context_course::instance($course->id), 'local_nexusai',
            [(int) $one->id]));

        $this->assertSame(0, $this->personal_rows((int) $one->id));
        $this->assertSame($before, $this->personal_rows((int) $two->id));
    }

    /**
     * Deleting everyone in a course empties the personal rows of that course only.
     */
    public function test_delete_for_all_users_in_context(): void {
        global $DB;
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $other = $this->getDataGenerator()->create_course();
        $one = $this->getDataGenerator()->create_user();
        $two = $this->getDataGenerator()->create_user();
        $this->seed((int) $one->id, (int) $course->id, 'a');
        $this->seed((int) $two->id, (int) $course->id, 'b');
        $this->seed((int) $one->id, (int) $other->id, 'c');

        provider::delete_data_for_all_users_in_context(\context_course::instance($course->id));

        $this->assertSame(0, $DB->count_records('local_nexusai_chat_sessions', ['courseid' => $course->id]));
        $this->assertSame(0, $DB->count_records('local_nexusai_quiz_errors', ['courseid' => $course->id]));
        $this->assertSame(0, $DB->count_records_select('local_nexusai_usage', 'courseid = ? AND userid IS NOT NULL',
            [$course->id]));
        $this->assertSame(1, $DB->count_records('local_nexusai_chat_sessions', ['courseid' => $other->id]));
    }

    /**
     * Preferences are exported, and the calendar feed token is never written out.
     */
    public function test_preferences_are_exported_without_the_feed_token(): void {
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();
        set_user_preference('local_nexusai_calfeedtoken', 'super-secret', $user);
        set_user_preference('local_nexusai_onb_dismissed_5', '1', $user);
        set_user_preference('some_other_pref', 'x', $user);

        provider::export_user_preferences((int) $user->id);

        $prefs = writer::with_context(\context_system::instance())->get_user_preferences('local_nexusai');
        $this->assertSame('1', $prefs->local_nexusai_onb_dismissed_5->value);
        $this->assertNotSame('super-secret', $prefs->local_nexusai_calfeedtoken->value);
        $this->assertObjectNotHasProperty('some_other_pref', $prefs);
    }

    /**
     * Every table and field declared in the metadata has its language string.
     */
    public function test_metadata_strings_exist(): void {
        $collection = provider::get_metadata(new \core_privacy\local\metadata\collection('local_nexusai'));
        $manager = get_string_manager();
        foreach ($collection->get_collection() as $item) {
            $this->assertTrue($manager->string_exists($item->get_summary(), 'local_nexusai'), $item->get_summary());
            foreach ($item->get_privacy_fields() ?? [] as $string) {
                $this->assertTrue($manager->string_exists($string, 'local_nexusai'), $string);
            }
        }
    }
}
