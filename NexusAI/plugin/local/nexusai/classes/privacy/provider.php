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
 * Moodle 3.5+ requires every plugin to declare what personal data it handles, to comply
 * with GDPR/Law 25.326. See docs/adr/006-privacy-strategy.md for the full context of
 * this decision (two-stage strategy: null_provider while there was no way to
 * export/delete the remote data, metadata\provider once the backend exposed that
 * API — see ADR-006's trigger table, "The NexusAI backend exposes an
 * export/delete API per user").
 *
 * The plugin itself still doesn't store personal data in Moodle tables — all the
 * history (chat messages, quiz attempts and errors) lives in the external NexusAI
 * backend (Postgres). PRIV-01 (issue #310) implemented `metadata\provider` and the
 * student self-service (external functions `local_nexusai_privacy_export`/
 * `local_nexusai_privacy_delete`, see classes/external/).
 *
 * This file adds the step ADR-006 left pending: `plugin\provider` and
 * `core_userlist_provider`, which hook into Moodle's admin tool
 * (Site administration → Users → Privacy → Data requests) so an ADMIN can
 * process a GDPR request without depending on the student using self-service.
 *
 * The NexusAI backend has no "list me the courses with this user's data"
 * endpoint — only export/delete by an already-known user_id+course_id. That's why
 * `get_contexts_for_userid()`/`get_users_in_context()` approximate via what Moodle
 * knows locally: courses where the user is enrolled and has the
 * `local/nexusai:use` capability. Over-including is safe (a course with no real
 * activity gives an empty export/delete); under-including would be a real
 * non-compliance.
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
use core_privacy\local\request\userlist;
use local_nexusai\external\backend_client;

/**
 * Declares via metadata\provider what personal data travels to the external NexusAI
 * backend, and via plugin\provider/core_userlist_provider hooks into the admin
 * Data requests flow.
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\core_userlist_provider,
    \core_privacy\local\request\plugin\provider {
    /**
     * Describes what personal data travels to the external NexusAI backend.
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

        // CURSO-01: who last changed the per-course NexusAI switch.
        $collection->add_database_table(
            'local_nexusai_course',
            [
                'usermodified' => 'privacy:metadata:local_nexusai_course:usermodified',
                'timemodified' => 'privacy:metadata:local_nexusai_course:timemodified',
            ],
            'privacy:metadata:local_nexusai_course'
        );

        return $collection;
    }

    /**
     * Courses (contexts) where the user has personal data in the backend.
     *
     * Approximation: every course where they're enrolled and still hold the
     * `local/nexusai:use` capability — the backend doesn't expose its own
     * index of "which courses does this user have history in", so we
     * over-include rather than risk leaving out a real context.
     *
     * @param int $userid User ID.
     * @return contextlist Course contexts to include in the request.
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        $contextlist = new contextlist();

        $courses = enrol_get_users_courses($userid, true, ['id']);
        foreach ($courses as $course) {
            $context = \context_course::instance((int) $course->id);
            if (has_capability('local/nexusai:use', $context, $userid)) {
                // Careful: contextlist::add_user_context(int $userid) adds the
                // user's PERSONAL context (CONTEXT_USER) -- it doesn't accept a
                // course $context as a second argument (it was silently ignored).
                // The course context has to be added explicitly by id.
                $contextlist->add_from_sql(
                    'SELECT id FROM {context} WHERE id = :contextid',
                    ['contextid' => $context->id]
                );
            }
        }

        return $contextlist;
    }

    /**
     * Exports the user's personal data in each approved context.
     *
     * Reuses `backend_client::privacy_export()` (the same one used by the
     * student's self-service), one call per approved course.
     *
     * @param approved_contextlist $contextlist Approved contexts to export.
     */
    public static function export_user_data(approved_contextlist $contextlist): void {
        $userid = (int) $contextlist->get_user()->id;
        if (empty($userid)) {
            return;
        }

        // Only instantiated if there's at least one course context to process --
        // backend_client validates the plugin config in its constructor and
        // throws if it's missing, even if there's nothing to export.
        $client = null;

        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel !== CONTEXT_COURSE) {
                continue;
            }

            $client ??= new backend_client();
            $courseid = (int) $context->instanceid;
            $data = $client->privacy_export($userid, $courseid);

            \core_privacy\local\request\writer::with_context($context)
                ->export_data(
                    [get_string('pluginname', 'local_nexusai')],
                    (object) $data
                );
        }
    }

    /**
     * Deletes the user's personal data in each approved context.
     *
     * @param approved_contextlist $contextlist Approved contexts to delete.
     */
    public static function delete_data_for_user(approved_contextlist $contextlist): void {
        $userid = (int) $contextlist->get_user()->id;
        if (empty($userid)) {
            return;
        }

        $client = null;

        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel !== CONTEXT_COURSE) {
                continue;
            }

            $client ??= new backend_client();
            $client->privacy_delete($userid, (int) $context->instanceid);
        }

        self::anonymise_course_settings([$userid]);
    }

    /**
     * The per-course setting is not the user's data, only who changed it: on a
     * deletion request the row stays and stops pointing at the user.
     *
     * @param int[] $userids Users to detach from the course settings.
     * @return void
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
     * Deletes the data of ALL users in a context (e.g. when deleting a course).
     *
     * No bulk endpoint on the backend: iterates enrolled users with the
     * `local/nexusai:use` capability and calls `privacy_delete()` one by one.
     * Acceptable for a course's typical size (tens/hundreds of students).
     *
     * @param \context $context Context (must be a course; ignored otherwise).
     */
    public static function delete_data_for_all_users_in_context(\context $context): void {
        if ($context->contextlevel !== CONTEXT_COURSE) {
            return;
        }

        $courseid = (int) $context->instanceid;
        $client = null;

        $users = get_enrolled_users($context, 'local/nexusai:use', 0, 'u.id');
        foreach ($users as $user) {
            $client ??= new backend_client();
            $client->privacy_delete((int) $user->id, $courseid);
        }
    }

    /**
     * Lists the users with personal data in a course context.
     *
     * Same over-inclusion criterion as get_contexts_for_userid(): everyone
     * enrolled with the `local/nexusai:use` capability.
     *
     * @param userlist $userlist User collection to fill in.
     */
    public static function get_users_in_context(userlist $userlist): void {
        $context = $userlist->get_context();
        if ($context->contextlevel !== CONTEXT_COURSE) {
            return;
        }

        $users = get_enrolled_users($context, 'local/nexusai:use', 0, 'u.id');
        foreach ($users as $user) {
            $userlist->add_user((int) $user->id);
        }
    }

    /**
     * Deletes the data of an approved set of users in a context.
     *
     * @param approved_userlist $userlist Approved users to delete, with their context.
     */
    public static function delete_data_for_users(approved_userlist $userlist): void {
        $context = $userlist->get_context();
        if ($context->contextlevel !== CONTEXT_COURSE) {
            return;
        }

        $courseid = (int) $context->instanceid;
        $client = null;

        foreach ($userlist->get_userids() as $userid) {
            $client ??= new backend_client();
            $client->privacy_delete((int) $userid, $courseid);
        }

        self::anonymise_course_settings(array_map('intval', $userlist->get_userids()));
    }
}
