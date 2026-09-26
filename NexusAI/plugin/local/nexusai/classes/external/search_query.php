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
 * External function `local_nexusai_search_query`.
 *
 * Proxy between React and the Python backend's /api/v1/search endpoint.
 * Returns fragments of the course material relevant to the query,
 * without going through the LLM (pure retrieval).
 *
 * Global mode (global=true): searches across ALL courses where the student
 * has the local/nexusai:use capability, not just the current course.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Proxy between React and the Python backend's /api/v1/search endpoint.
 */
class search_query extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'query'    => new \external_value(PARAM_RAW, 'Search query', VALUE_REQUIRED),
            'courseid' => new \external_value(PARAM_INT, 'Current course ID', VALUE_REQUIRED),
            'topk'     => new \external_value(PARAM_INT, 'Number of results (1..10)', VALUE_DEFAULT, 5),
            'global'   => new \external_value(PARAM_BOOL, 'Search across all of the user\'s courses', VALUE_DEFAULT, false),
            'materialtype' => new \external_value(PARAM_RAW, 'Filter by material type (mime type)', VALUE_DEFAULT, ''),
            'section'      => new \external_value(
                PARAM_INT,
                'Filter by course section/unit (-1 = no filter, BUS-05)',
                VALUE_DEFAULT,
                -1
            ),
            'sectionunassigned' => new \external_value(
                PARAM_BOOL,
                'Filter only material with no unit assigned (BUS-05)',
                VALUE_DEFAULT,
                false
            ),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'query'   => new \external_value(PARAM_RAW, 'Original query'),
            'total'   => new \external_value(PARAM_INT, 'Total results'),
            'results' => new \external_multiple_structure(
                new \external_single_structure([
                    'document_id'       => new \external_value(PARAM_RAW, 'Document UUID', VALUE_DEFAULT, ''),
                    'document_filename' => new \external_value(PARAM_TEXT, 'File name'),
                    'course_id'         => new \external_value(PARAM_INT, 'Source course ID', VALUE_DEFAULT, 0),
                    'course_name'       => new \external_value(
                        PARAM_TEXT,
                        'Course name (global mode only)',
                        VALUE_DEFAULT,
                        ''
                    ),
                    'chunk_index'       => new \external_value(PARAM_INT, 'Fragment index'),
                    'content'           => new \external_value(PARAM_RAW, 'Fragment text'),
                    'similarity'        => new \external_value(PARAM_FLOAT, 'Similarity score 0-1'),
                    'has_file'          => new \external_value(
                        PARAM_BOOL,
                        'The original file is available for download',
                        VALUE_DEFAULT,
                        false
                    ),
                    'mime_type'         => new \external_value(PARAM_RAW, 'Document MIME type', VALUE_DEFAULT, ''),
                    'section'           => new \external_value(
                        PARAM_INT,
                        'Document section',
                        VALUE_OPTIONAL,
                        null,
                        NULL_ALLOWED
                    ),
                ])
            ),
        ]);
    }

    /**
     * Proxy between React and the Python backend's /api/v1/search endpoint.
     *
     * @param string $query Search query
     * @param int $courseid Current course ID
     * @param int $topk Number of results (1..10)
     * @param bool $global Search across all of the user's courses
     * @param string $materialtype Filter by material type (mime type)
     * @param int $section Filter by course section/unit (-1 = no filter, BUS-05)
     * @param bool $sectionunassigned Filter only material with no unit assigned (BUS-05)
     * @return array
     */
    public static function execute(
        string $query,
        int $courseid,
        int $topk = 5,
        bool $global = false,
        string $materialtype = '',
        int $section = -1,
        bool $sectionunassigned = false
    ): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'query'             => $query,
            'courseid'          => $courseid,
            'topk'              => $topk,
            'global'            => $global,
            'materialtype'      => $materialtype,
            'section'           => $section,
            'sectionunassigned' => $sectionunassigned,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        $cleanquery = trim($params['query']);
        if ($cleanquery === '') {
            throw new \invalid_parameter_exception('Query cannot be empty');
        }
        if (mb_strlen($cleanquery) > 500) {
            throw new \invalid_parameter_exception('Query too long (max 500 characters)');
        }

        $topk = max(1, min(10, (int) $params['topk']));

        // Build the list of course IDs and a name map for the response.
        $courseids  = [(int) $params['courseid']];
        $coursenames = [(int) $params['courseid'] => ''];

        if (!empty($params['global'])) {
            $enrolled = enrol_get_users_courses($USER->id, true, 'id,fullname');
            $allowedids   = [];
            $allowednames = [];
            foreach ($enrolled as $c) {
                $ctx = \context_course::instance($c->id);
                if (has_capability('local/nexusai:use', $ctx)) {
                    $allowedids[]              = (int) $c->id;
                    $allowednames[(int) $c->id] = $c->fullname;
                }
            }
            if (!empty($allowedids)) {
                $courseids   = $allowedids;
                $coursenames = $allowednames;
            }
        }

        // A value of -1 means no section filter (BUS-05).
        $section = ((int) $params['section']) >= 0 ? (int) $params['section'] : null;

        $client   = new backend_client();
        $response = $client->search(
            (int) $params['courseid'],
            (int) $USER->id,
            $cleanquery,
            $topk,
            $courseids,
            (string) $params['materialtype'],
            $section,
            (bool) $params['sectionunassigned']
        );

        if (!isset($response['results'], $response['total'])) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'Invalid search response');
        }

        return [
            'query'   => (string) ($response['query'] ?? $cleanquery),
            'total'   => (int) $response['total'],
            'results' => array_map(
                static function (array $r) use ($coursenames): array {
                    $resultcourseid = (int) ($r['course_id'] ?? 0);
                    return [
                        'document_id'       => (string) ($r['document_id'] ?? ''),
                        'document_filename' => (string) ($r['document_filename'] ?? ''),
                        'course_id'         => $resultcourseid,
                        'course_name'       => $coursenames[$resultcourseid] ?? '',
                        'chunk_index'       => (int) ($r['chunk_index'] ?? 0),
                        'content'           => (string) ($r['content'] ?? ''),
                        'similarity'        => (float) ($r['similarity'] ?? 0.0),
                        'has_file'          => (bool) ($r['has_file'] ?? false),
                        'mime_type'         => (string) ($r['mime_type'] ?? ''),
                        'section'           => isset($r['section']) ? (int) $r['section'] : null,
                    ];
                },
                $response['results']
            ),
        ];
    }
}
