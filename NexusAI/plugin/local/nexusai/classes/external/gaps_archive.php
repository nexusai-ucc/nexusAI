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
 * External function `local_nexusai_gaps_archive`.
 *
 * Archives or unarchives a detected gap (DOC-D08, issue #383). Operates on
 * the real row IDs (`question_ids`, returned by `gaps_list`) — the question
 * text the teacher sees is just the most recent representative of the
 * semantic cluster (DOC-D06), not a stable key to identify which rows to archive.
 *
 * Only accessible to users with the `local/nexusai:manage` capability
 * (teachers and admins) — same criterion as `gaps_list`.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Archives or unarchives a detected gap (DOC-D08, issue #383).
 */
class gaps_archive extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'    => new \external_value(PARAM_INT, 'Course ID', VALUE_REQUIRED),
            'questionids' => new \external_multiple_structure(
                new \external_value(PARAM_ALPHANUMEXT, 'UUID of an unanswered_questions row'),
                'IDs of the rows to archive/unarchive (at least 1)'
            ),
            'archived'    => new \external_value(PARAM_BOOL, 'true to archive, false to unarchive', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'course_id' => new \external_value(PARAM_INT, 'Course ID'),
            'archived'  => new \external_value(PARAM_BOOL, 'Applied state'),
            'affected'  => new \external_value(PARAM_INT, 'Number of rows updated'),
        ]);
    }

    /**
     * Archives or unarchives a detected gap (DOC-D08, issue #383).
     *
     * @param int $courseid Course ID
     * @param array $questionids IDs of the rows to archive/unarchive (at least 1)
     * @param bool $archived true to archive, false to unarchive
     * @return array
     */
    public static function execute(int $courseid, array $questionids, bool $archived): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'    => $courseid,
            'questionids' => $questionids,
            'archived'    => $archived,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        if (empty($params['questionids'])) {
            throw new \invalid_parameter_exception('At least one question id must be provided');
        }

        $client   = new backend_client();
        $response = $client->archive_gap(
            (int) $params['courseid'],
            array_map('strval', $params['questionids']),
            (bool) $params['archived']
        );

        return [
            'course_id' => (int) ($response['course_id'] ?? $params['courseid']),
            'archived'  => (bool) ($response['archived'] ?? $params['archived']),
            'affected'  => (int) ($response['affected'] ?? 0),
        ];
    }
}
