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
 * Privacy API provider for local_nexusai.
 *
 * The student data lives in the plugin's own tables (`local_nexusai_*`, see
 * docs/adr/014). Contexts, users, export and deletion are worked out with SQL.
 * Usage and interaction metrics are anonymised instead of deleted, so course
 * totals stay right; everything else is deleted. Rows migrated from the
 * backend that only carry a hash of the user id are found through that hash.
 *
 * The backend no longer stores the student's data: it receives the question
 * and the history to answer them, which is declared as an external location.
 * Three user preferences are covered too: onboarding state per course, files
 * pending indexing and the calendar feed token (never exported).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\transform;
use core_privacy\local\request\userlist;
use core_privacy\local\request\writer;

/**
 * Declares, lists, exports and deletes the personal data NexusAI keeps.
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\core_userlist_provider,
    \core_privacy\local\request\plugin\provider,
    \core_privacy\local\request\user_preference_provider {
    /**
     * Tables with a userid and a courseid of their own, and the fields exported for each.
     *
     * Messages, flashcard reviews and bank use hang from another table and are handled apart.
     */
    private const COURSE_TABLES = [
        'local_nexusai_chat_sessions' => ['uuid', 'multicourse', 'courseids', 'timecreated', 'timemodified'],
        'local_nexusai_interactions' => ['questionchars', 'answerchars', 'chunksretrieved', 'hascontext', 'multicourse',
            'tokensprompt', 'tokenscompletion', 'latencyms', 'endpoint', 'timecreated'],
        'local_nexusai_msg_feedback' => ['ishelpful', 'comment', 'timecreated', 'timemodified'],
        'local_nexusai_gaps' => ['uuid', 'question', 'maxsimilarity', 'chunksretrieved', 'timecreated', 'timearchived',
            'timestudentdismissed'],
        'local_nexusai_quiz_attempts' => ['uuid', 'questiontype', 'difficulty', 'topic', 'totalquestions', 'correctanswers',
            'score', 'timecreated', 'timedeleted'],
        'local_nexusai_quiz_errors' => ['uuid', 'questiontype', 'question', 'explanation', 'sourcefilename', 'options',
            'correctindex', 'userselectedindex', 'useranswer', 'aifeedback', 'aiscore', 'timecreated', 'timedismissed'],
        'local_nexusai_cal_alerts' => ['uuid', 'eventid', 'eventname', 'eventtimestamp', 'daysbefore', 'notified', 'timecreated'],
        'local_nexusai_usage' => ['role', 'feature', 'provider', 'model', 'fallback', 'prompttokens', 'completiontokens',
            'cachedprompttokens', 'embeddingtokens', 'audioseconds', 'costusd', 'cachehit', 'savedtokens', 'latencyms',
            'status', 'timecreated'],
        'local_nexusai_exams' => ['uuid', 'params', 'includepracticed', 'allnew', 'examdate', 'timereleased', 'timecreated'],
    ];

    /** Tables whose rows are kept without the user on a deletion request: they hold metrics, not content. */
    private const ANONYMISED_TABLES = ['local_nexusai_interactions', 'local_nexusai_usage'];

    /** Tables that also hold rows migrated from the backend, identified only by a hash of the user id. */
    private const HASHED_TABLES = ['local_nexusai_interactions', 'local_nexusai_msg_feedback'];

    /** Prefixes of the per-course onboarding preferences (the course id follows). */
    private const PREFERENCE_PREFIXES = ['local_nexusai_onb_dismissed_', 'local_nexusai_onb_skipped_'];

    /**
     * Describes the personal data NexusAI stores and sends.
     *
     * @param collection $collection Metadata collection to fill in.
     * @return collection The same collection, completed.
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_external_location_link(
            'nexusai_backend',
            [
                'user_id'    => 'privacy:metadata:nexusai_backend:user_id',
                'course_id'  => 'privacy:metadata:nexusai_backend:course_id',
                'content'    => 'privacy:metadata:nexusai_backend:content',
                'created_at' => 'privacy:metadata:nexusai_backend:created_at',
            ],
            'privacy:metadata:nexusai_backend'
        );

        $tables = [
            'local_nexusai_course' => ['usermodified', 'timemodified'],
            'local_nexusai_chat_sessions' => ['userid', 'courseid', 'courseids', 'timecreated'],
            'local_nexusai_messages' => ['role', 'content', 'tokensprompt', 'tokenscompletion', 'timecreated'],
            'local_nexusai_interactions' => ['userid', 'courseid', 'questionchars', 'tokensprompt', 'tokenscompletion',
                'latencyms', 'timecreated'],
            'local_nexusai_msg_feedback' => ['userid', 'ishelpful', 'comment', 'timecreated'],
            'local_nexusai_gaps' => ['userid', 'courseid', 'question', 'timecreated'],
            'local_nexusai_quiz_attempts' => ['userid', 'courseid', 'topic', 'score', 'timecreated'],
            'local_nexusai_quiz_errors' => ['userid', 'courseid', 'question', 'useranswer', 'aifeedback', 'timecreated'],
            'local_nexusai_fc_reviews' => ['userid', 'easefactor', 'timelastreviewed', 'timenextreview'],
            'local_nexusai_cal_alerts' => ['userid', 'courseid', 'eventname', 'daysbefore', 'timecreated'],
            'local_nexusai_usage' => ['userid', 'courseid', 'role', 'feature', 'prompttokens', 'completiontokens', 'costusd',
                'timecreated'],
            'local_nexusai_qbank_use' => ['userid', 'purpose', 'timecreated'],
            'local_nexusai_exams' => ['userid', 'courseid', 'params', 'examdate', 'timecreated'],
        ];
        foreach ($tables as $table => $fields) {
            $described = [];
            foreach ($fields as $field) {
                $described[$field] = "privacy:metadata:{$table}:{$field}";
            }
            $collection->add_database_table($table, $described, "privacy:metadata:{$table}");
        }

        $collection->add_user_preference('local_nexusai_pending_uploads', 'privacy:metadata:preference:pending_uploads');
        $collection->add_user_preference('local_nexusai_calfeedtoken', 'privacy:metadata:preference:calfeedtoken');
        $collection->add_user_preference('local_nexusai_onb', 'privacy:metadata:preference:onboarding');

        return $collection;
    }

    /**
     * Course contexts where the user has data in the plugin tables.
     *
     * @param int $userid User ID.
     * @return contextlist Course contexts to include in the request.
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        $contextlist = new contextlist();

        foreach (self::course_user_sql() as [$from, $useridfield, $hashed]) {
            $where = $hashed ? "($useridfield = :userid OR c.userhash = :userhash)" : "$useridfield = :userid";
            $params = ['contextlevel' => CONTEXT_COURSE, 'userid' => $userid];
            if ($hashed) {
                $params['userhash'] = self::user_hash($userid);
            }
            $contextlist->add_from_sql(
                "SELECT ctx.id FROM {context} ctx
                  WHERE ctx.contextlevel = :contextlevel
                    AND ctx.instanceid IN (SELECT c.courseid FROM $from WHERE $where)",
                $params
            );
        }

        return $contextlist;
    }

    /**
     * Lists the users with data in a course context.
     *
     * @param userlist $userlist User collection to fill in.
     */
    public static function get_users_in_context(userlist $userlist): void {
        $context = $userlist->get_context();
        if ($context->contextlevel !== CONTEXT_COURSE) {
            return;
        }

        // Rows kept only with a hash of the user id cannot be turned back into a user.
        foreach (self::course_user_sql() as [$from, $useridfield]) {
            $userlist->add_from_sql(
                'userid',
                "SELECT $useridfield AS userid FROM $from WHERE c.courseid = :courseid AND $useridfield > 0",
                ['courseid' => (int) $context->instanceid]
            );
        }
    }

    /**
     * Exports the user's data in each approved course.
     *
     * @param approved_contextlist $contextlist Approved contexts to export.
     */
    public static function export_user_data(approved_contextlist $contextlist): void {
        $userid = (int) $contextlist->get_user()->id;
        if (empty($userid)) {
            return;
        }

        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel === CONTEXT_COURSE) {
                self::export_course_tables($context, $userid, (int) $context->instanceid);
            }
        }
    }

    /**
     * Exports the user's NexusAI preferences.
     *
     * @param int $userid User ID.
     */
    public static function export_user_preferences(int $userid): void {
        $preferences = get_user_preferences(null, null, $userid);
        foreach ($preferences as $name => $value) {
            if (!self::is_plugin_preference($name)) {
                continue;
            }
            if ($name === 'local_nexusai_calfeedtoken') {
                // A secret that opens the user's calendar feed: say it exists, never export it.
                $value = get_string('privacy:preference:secret', 'local_nexusai');
            }
            writer::export_user_preference(
                'local_nexusai',
                $name,
                $value,
                get_string('privacy:metadata:preference:' . self::preference_key($name), 'local_nexusai')
            );
        }
    }

    /**
     * Deletes the user's data in each approved course.
     *
     * @param approved_contextlist $contextlist Approved contexts to delete.
     */
    public static function delete_data_for_user(approved_contextlist $contextlist): void {
        $userid = (int) $contextlist->get_user()->id;
        if (empty($userid)) {
            return;
        }

        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel === CONTEXT_COURSE) {
                self::delete_course_rows((int) $context->instanceid, [$userid]);
            }
        }

        self::anonymise_course_settings([$userid]);
    }

    /**
     * Deletes the data of an approved set of users in a course.
     *
     * @param approved_userlist $userlist Approved users to delete, with their context.
     */
    public static function delete_data_for_users(approved_userlist $userlist): void {
        $context = $userlist->get_context();
        if ($context->contextlevel !== CONTEXT_COURSE) {
            return;
        }
        $userids = array_map('intval', $userlist->get_userids());
        if (empty($userids)) {
            return;
        }

        self::delete_course_rows((int) $context->instanceid, $userids);

        self::anonymise_course_settings($userids);
    }

    /**
     * Deletes the data of every user in a course (for example when the course is deleted).
     *
     * @param \context $context Context (must be a course; ignored otherwise).
     */
    public static function delete_data_for_all_users_in_context(\context $context): void {
        if ($context->contextlevel !== CONTEXT_COURSE) {
            return;
        }

        self::delete_course_rows((int) $context->instanceid, null);
    }

    /**
     * Where each kind of row keeps its user and its course.
     *
     * The table holding the course is always aliased `c`.
     *
     * @return array[] [FROM clause, user id field, whether the table also has hash-only rows].
     */
    private static function course_user_sql(): array {
        $sql = [];
        foreach (array_keys(self::COURSE_TABLES) as $table) {
            $sql[] = ["{{$table}} c", 'c.userid', in_array($table, self::HASHED_TABLES, true)];
        }
        $sql[] = ['{local_nexusai_fc_reviews} r JOIN {local_nexusai_flashcards} c ON c.id = r.flashcardid', 'r.userid', false];
        $sql[] = ['{local_nexusai_qbank_use} u JOIN {local_nexusai_qbank} c ON c.id = u.questionid', 'u.userid', false];
        return $sql;
    }

    /**
     * Writes the user's rows of one course, grouped by kind of data.
     *
     * @param \context $context Course context.
     * @param int $userid User ID.
     * @param int $courseid Course ID.
     */
    private static function export_course_tables(\context $context, int $userid, int $courseid): void {
        global $DB;

        $root = get_string('pluginname', 'local_nexusai');
        foreach (self::COURSE_TABLES as $table => $fields) {
            $params = ['courseid' => $courseid, 'userid' => $userid];
            $where = 'courseid = :courseid AND userid = :userid';
            if (in_array($table, self::HASHED_TABLES, true)) {
                $params['userhash'] = self::user_hash($userid);
                $where = 'courseid = :courseid AND (userid = :userid OR userhash = :userhash)';
            }
            $rows = $DB->get_records_select($table, $where, $params, 'timecreated, id');
            if (!$rows) {
                continue;
            }
            $out = [];
            foreach ($rows as $row) {
                $item = self::pick($row, $fields);
                if ($table === 'local_nexusai_chat_sessions') {
                    $item['messages'] = array_values(array_map(
                        static fn($m) => self::pick($m, ['role', 'content', 'tokensprompt', 'tokenscompletion', 'timecreated']),
                        $DB->get_records('local_nexusai_messages', ['sessionid' => $row->id], 'timecreated, id')
                    ));
                }
                $out[] = $item;
            }
            writer::with_context($context)->export_data(
                [$root, get_string("privacy:metadata:{$table}", 'local_nexusai')],
                (object) ['items' => $out]
            );
        }

        $reviews = $DB->get_records_sql(
            'SELECT r.*, f.question FROM {local_nexusai_fc_reviews} r
               JOIN {local_nexusai_flashcards} f ON f.id = r.flashcardid
              WHERE r.userid = :userid AND f.courseid = :courseid',
            ['userid' => $userid, 'courseid' => $courseid]
        );
        if ($reviews) {
            writer::with_context($context)->export_data(
                [$root, get_string('privacy:metadata:local_nexusai_fc_reviews', 'local_nexusai')],
                (object) ['items' => array_values(array_map(static fn($r) => self::pick($r, ['question', 'easefactor',
                    'intervaldays', 'repetitions', 'timelastreviewed', 'timenextreview', 'timecreated']), $reviews))]
            );
        }

        $uses = $DB->get_records_sql(
            'SELECT u.*, q.questiontype, q.topic FROM {local_nexusai_qbank_use} u
               JOIN {local_nexusai_qbank} q ON q.id = u.questionid
              WHERE u.userid = :userid AND q.courseid = :courseid',
            ['userid' => $userid, 'courseid' => $courseid]
        );
        if ($uses) {
            writer::with_context($context)->export_data(
                [$root, get_string('privacy:metadata:local_nexusai_qbank_use', 'local_nexusai')],
                (object) ['items' => array_values(array_map(
                    static fn($u) => self::pick($u, ['purpose', 'questiontype', 'topic', 'timecreated']),
                    $uses
                ))]
            );
        }
    }

    /**
     * Deletes (or anonymises) the rows of some users, or of everyone, in one course.
     *
     * Moodle creates no foreign keys, so the rows that hang from a deleted one are
     * removed here too: a conversation's messages, and votes and metrics that point at them.
     *
     * @param int $courseid Course ID.
     * @param int[]|null $userids Users to delete, or null for every user of the course.
     */
    public static function delete_course_rows(int $courseid, ?array $userids): void {
        global $DB;

        // Two filters: by user id, and by user id or hash for the tables with rows migrated from the backend.
        $params = ['courseid' => $courseid];
        $hashparams = $params;
        $userwhere = '';
        $hashwhere = '';
        if ($userids !== null) {
            [$insql, $inparams] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'u');
            [$hashsql, $hashinparams] = $DB->get_in_or_equal(
                array_map([self::class, 'user_hash'], $userids),
                SQL_PARAMS_NAMED,
                'h'
            );
            $params += $inparams;
            $hashparams = $params + $hashinparams;
            $userwhere = " AND userid $insql";
            $hashwhere = " AND (userid $insql OR userhash $hashsql)";
        }

        // Conversations and their messages; votes and metrics stop pointing at the deleted messages.
        $sessionids = $DB->get_fieldset_select('local_nexusai_chat_sessions', 'id', 'courseid = :courseid' . $userwhere, $params);
        if ($sessionids) {
            [$sessql, $sesparams] = $DB->get_in_or_equal($sessionids, SQL_PARAMS_NAMED, 's');
            $messageids = $DB->get_fieldset_select('local_nexusai_messages', 'id', "sessionid $sessql", $sesparams);
            if ($messageids) {
                [$msgsql, $msgparams] = $DB->get_in_or_equal($messageids, SQL_PARAMS_NAMED, 'm');
                $DB->set_field_select('local_nexusai_interactions', 'messageid', null, "messageid $msgsql", $msgparams);
                $DB->set_field_select('local_nexusai_msg_feedback', 'messageid', null, "messageid $msgsql", $msgparams);
                $DB->delete_records_select('local_nexusai_messages', "id $msgsql", $msgparams);
            }
            $DB->delete_records_select('local_nexusai_chat_sessions', "id $sessql", $sesparams);
        }

        foreach (array_keys(self::COURSE_TABLES) as $table) {
            if ($table === 'local_nexusai_chat_sessions') {
                continue;
            }
            $hashed = in_array($table, self::HASHED_TABLES, true);
            $where = 'courseid = :courseid' . ($hashed ? $hashwhere : $userwhere);
            $whereparams = $hashed ? $hashparams : $params;
            if (in_array($table, self::ANONYMISED_TABLES, true)) {
                if ($hashed) {
                    // Both in one go: after clearing userid the rows would no longer match the filter.
                    $DB->execute("UPDATE {{$table}} SET userid = NULL, userhash = NULL WHERE $where", $whereparams);
                } else {
                    $DB->set_field_select($table, 'userid', null, $where, $whereparams);
                }
            } else if ($table === 'local_nexusai_exams') {
                // The exam belongs to the course; only the link to the teacher goes.
                $DB->set_field_select($table, 'userid', 0, $where, $whereparams);
            } else {
                $DB->delete_records_select($table, $where, $whereparams);
            }
        }

        // Flashcard reviews and bank use, found through the course of the card or question.
        $DB->delete_records_select(
            'local_nexusai_fc_reviews',
            'flashcardid IN (SELECT id FROM {local_nexusai_flashcards} WHERE courseid = :courseid)' . $userwhere,
            $params
        );
        $DB->delete_records_select(
            'local_nexusai_qbank_use',
            'questionid IN (SELECT id FROM {local_nexusai_qbank} WHERE courseid = :courseid)' . $userwhere,
            $params
        );
    }

    /**
     * The per-course setting is not the user's data, only who changed it: on a
     * deletion request the row stays and stops pointing at the user.
     *
     * @param int[] $userids Users to detach from the course settings.
     */
    private static function anonymise_course_settings(array $userids): void {
        global $DB;
        if (empty($userids)) {
            return;
        }
        [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED);
        $DB->set_field_select('local_nexusai_course', 'usermodified', 0, "usermodified $insql", $params);
    }

    /**
     * Pseudonymous id the backend used for some rows: SHA-256 of the user id (analytics/logger.py).
     *
     * @param int $userid User ID.
     * @return string
     */
    private static function user_hash(int $userid): string {
        return hash('sha256', (string) $userid);
    }

    /**
     * Copies some fields of a row, turning timestamps into readable dates.
     *
     * @param \stdClass $row Database row.
     * @param string[] $fields Fields to copy.
     * @return array
     */
    private static function pick(\stdClass $row, array $fields): array {
        $out = [];
        foreach ($fields as $field) {
            $value = $row->$field ?? null;
            if ($value !== null && strpos($field, 'time') === 0) {
                $value = transform::datetime((int) $value);
            }
            $out[$field] = $value;
        }
        return $out;
    }

    /**
     * Whether a preference name belongs to NexusAI.
     *
     * @param string $name Preference name.
     * @return bool
     */
    private static function is_plugin_preference(string $name): bool {
        return self::preference_key($name) !== null;
    }

    /**
     * Key of the language string that describes a NexusAI preference.
     *
     * @param string $name Preference name.
     * @return string|null Null when the preference is not NexusAI's.
     */
    private static function preference_key(string $name): ?string {
        if ($name === 'local_nexusai_pending_uploads') {
            return 'pending_uploads';
        }
        if ($name === 'local_nexusai_calfeedtoken') {
            return 'calfeedtoken';
        }
        foreach (self::PREFERENCE_PREFIXES as $prefix) {
            if (strpos($name, $prefix) === 0) {
                return 'onboarding';
            }
        }
        return null;
    }
}
