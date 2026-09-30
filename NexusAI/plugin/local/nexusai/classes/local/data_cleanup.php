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
 * Removes NexusAI data when Moodle deletes a course or a user (DATA-05).
 *
 * Moodle does not run the Privacy API when it deletes a course or a user, and
 * the plugin tables have no foreign keys, so without this the rows would stay
 * behind. The same rules as the privacy provider apply: content is deleted,
 * usage and interaction metrics are kept without the user.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

use core_privacy\local\request\approved_contextlist;
use local_nexusai\privacy\provider;

/**
 * Deletes a course's or a user's NexusAI data.
 */
class data_cleanup {
    /**
     * Deletes everything NexusAI keeps for a course that no longer exists.
     *
     * Also asks the backend to delete the course's indexed documents, when the
     * plugin is on; a backend failure is logged and does not stop Moodle.
     *
     * @param int $courseid Deleted course.
     */
    public static function delete_course(int $courseid): void {
        global $DB;
        provider::delete_course_rows($courseid, null);

        $questionids = $DB->get_fieldset_select('local_nexusai_qbank', 'id', 'courseid = :courseid', ['courseid' => $courseid]);
        if ($questionids) {
            [$insql, $params] = $DB->get_in_or_equal($questionids, SQL_PARAMS_NAMED);
            $DB->delete_records_select('local_nexusai_qbank_use', "questionid $insql", $params);
        }
        $cardids = $DB->get_fieldset_select('local_nexusai_flashcards', 'id', 'courseid = :courseid', ['courseid' => $courseid]);
        if ($cardids) {
            [$insql, $params] = $DB->get_in_or_equal($cardids, SQL_PARAMS_NAMED);
            $DB->delete_records_select('local_nexusai_fc_reviews', "flashcardid $insql", $params);
        }
        $coursetables = ['local_nexusai_qbank', 'local_nexusai_flashcards', 'local_nexusai_exams',
            'local_nexusai_forum_webhooks', 'local_nexusai_course'];
        foreach ($coursetables as $table) {
            $DB->delete_records($table, ['courseid' => $courseid]);
        }

        if (!course_guard::plugin_enabled()) {
            return;
        }
        try {
            $client = new \local_nexusai\external\backend_client();
            $client->set_role('system');
            $documents = $client->list_documents($courseid)['items'] ?? [];
            foreach ($documents as $doc) {
                $client->delete_document((string) $doc['id']);
            }
        } catch (\Throwable $e) {
            debugging('[NexusAI] Could not delete the documents of course ' . $courseid . ': ' . $e->getMessage(), DEBUG_NORMAL);
        }
    }

    /**
     * Deletes a deleted user's NexusAI data in every course.
     *
     * @param int $userid Deleted user.
     */
    public static function delete_user(int $userid): void {
        $user = (object) ['id' => $userid];
        $contextids = provider::get_contexts_for_userid($userid)->get_contextids();
        if ($contextids) {
            provider::delete_data_for_user(new approved_contextlist($user, 'local_nexusai', $contextids));
        }
    }
}
