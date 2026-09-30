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
 * External function `local_nexusai_document_list`.
 *
 * Lists all NexusAI-indexed documents of a course. The teacher view uses it
 * to show the status table.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Lists all NexusAI-indexed documents of a course.
 */
class document_list extends external_api {
    /**
     * Parameters for execute().
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Moodle course ID', VALUE_REQUIRED),
            // UX-17 (#387): optional — without limit, the backend returns
            // everything up to its internal cap (used by ExamGeneratorPanel.jsx,
            // which needs to choose among all indexed documents).
            'limit'    => new external_value(
                PARAM_INT,
                'Max items per page (no value: unpaginated, internal cap)',
                VALUE_DEFAULT,
                null,
                NULL_ALLOWED
            ),
            'offset'   => new external_value(PARAM_INT, 'Position to paginate from', VALUE_DEFAULT, 0),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'total' => new external_value(
                PARAM_INT,
                'Total number of course documents (for pagination, not the count already trimmed by limit)'
            ),
            'items' => new external_multiple_structure(
                new external_single_structure([
                    'id'            => new external_value(PARAM_ALPHANUMEXT, 'Document UUID'),
                    'course_id'     => new external_value(PARAM_INT, 'Course ID'),
                    'uploader_id'   => new external_value(PARAM_INT, 'ID of the teacher who uploaded it'),
                    'filename'      => new external_value(PARAM_RAW, 'File name'),
                    'mime_type'     => new external_value(PARAM_RAW, 'MIME type'),
                    'status'        => new external_value(PARAM_ALPHA, 'pending | indexing | indexed | error'),
                    'error_message' => new external_value(PARAM_RAW, 'Error message, if applicable', VALUE_OPTIONAL),
                    'section'       => new external_value(PARAM_INT, 'Unit number', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'section_name'  => new external_value(PARAM_TEXT, 'Unit name in the course', VALUE_OPTIONAL),
                    'cmid'          => new external_value(
                        PARAM_INT,
                        'Activity the document comes from',
                        VALUE_OPTIONAL,
                        null,
                        NULL_ALLOWED
                    ),
                    'activity_url'  => new external_value(PARAM_URL, 'Link to the activity in the classroom', VALUE_OPTIONAL),
                    'activity_status' => new external_value(
                        PARAM_ALPHA,
                        'visible | hidden | missing | none: state of the activity in the classroom',
                        VALUE_OPTIONAL
                    ),
                    'created_at'    => new external_value(PARAM_TEXT, 'Upload date (ISO 8601)', VALUE_OPTIONAL),
                    'updated_at'    => new external_value(PARAM_TEXT, 'Last update date (ISO 8601)', VALUE_OPTIONAL),
                ]),
                'Course documents, ordered by upload date descending'
            ),
        ]);
    }

    /**
     * Where a document lives in the classroom: unit, link to its activity and
     * whether that activity is visible, hidden or gone (VIS-03).
     *
     * @param array $doc Document as the backend returns it.
     * @param \course_modinfo $modinfo Course modinfo.
     * @return array
     */
    private static function activity_fields(array $doc, \course_modinfo $modinfo): array {
        $cmid = isset($doc['cmid']) ? (int) $doc['cmid'] : null;
        $out = [
            'section'         => isset($doc['section']) ? (int) $doc['section'] : null,
            'cmid'            => $cmid,
            'activity_status' => 'none',
        ];
        if ($cmid === null) {
            return $out;
        }
        $cm = $modinfo->cms[$cmid] ?? null;
        if ($cm === null || !empty($cm->deletioninprogress)) {
            $out['activity_status'] = 'missing';
            return $out;
        }
        $out['activity_status'] = $cm->visible && $cm->get_section_info()->visible ? 'visible' : 'hidden';
        $out['activity_url'] = $cm->url ? $cm->url->out(false) : '';
        $out['section'] = (int) $cm->sectionnum;
        $out['section_name'] = get_section_name($cm->course, $cm->sectionnum);
        return $out;
    }

    /**
     * Lists all NexusAI-indexed documents of a course.
     *
     * @param int $courseid Moodle course ID
     * @param int $limit Max items per page (no value: unpaginated, internal cap)
     * @param int $offset Position to paginate from
     * @return array
     */
    public static function execute(int $courseid, ?int $limit = null, int $offset = 0): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'limit'    => $limit,
            'offset'   => $offset,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        $offset = max(0, (int) $params['offset']);
        $limit  = $params['limit'] !== null ? max(1, (int) $params['limit']) : null;

        $client   = new backend_client();
        $response = $client->list_documents((int) $params['courseid'], $limit, $offset);
        $modinfo  = get_fast_modinfo((int) $params['courseid']);

        return [
            'total' => (int) ($response['total'] ?? 0),
            'items' => array_map(
                static fn(array $d) => self::activity_fields($d, $modinfo) + [
                    'id'            => (string) ($d['id'] ?? ''),
                    'course_id'     => (int) ($d['course_id'] ?? 0),
                    'uploader_id'   => (int) ($d['uploader_id'] ?? 0),
                    'filename'      => (string) ($d['filename'] ?? ''),
                    'mime_type'     => (string) ($d['mime_type'] ?? ''),
                    'status'        => (string) ($d['status'] ?? ''),
                    'error_message' => $d['error_message'] ?? null,
                    'created_at'    => isset($d['created_at']) ? (string) $d['created_at'] : null,
                    'updated_at'    => isset($d['updated_at']) ? (string) $d['updated_at'] : null,
                ],
                $response['items'] ?? []
            ),
        ];
    }
}
