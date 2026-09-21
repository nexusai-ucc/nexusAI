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
 * External function `local_nexusai_document_pre_exam_summary`.
 *
 * Proxy between React and the Python backend's
 * /api/v1/documents/pre-exam-summary endpoint. Generates a review summary
 * combining all relevant indexed material for an upcoming exam, optionally
 * scoped to a course unit/section (BUS-04).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Proxy between React and the Python backend's /api/v1/documents/pre-exam-summary endpoint.
 */
class document_pre_exam_summary extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'Moodle course ID', VALUE_REQUIRED),
            'section'  => new \external_value(PARAM_INT, 'Optional unit/section', VALUE_DEFAULT, null, NULL_ALLOWED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'summary'          => new \external_value(PARAM_RAW, 'AI-generated review summary'),
            'documents_used'   => new \external_multiple_structure(
                new \external_single_structure([
                    'document_id' => new \external_value(PARAM_RAW, 'Document UUID'),
                    'filename'    => new \external_value(PARAM_TEXT, 'File name'),
                ])
            ),
            'total_documents'  => new \external_value(PARAM_INT, 'Number of documents used'),
        ]);
    }

    /**
     * Proxy between React and the Python backend's /api/v1/documents/pre-exam-summary endpoint.
     *
     * @param int $courseid Moodle course ID
     * @param int $section Optional unit/section
     * @return array
     */
    public static function execute(int $courseid, ?int $section = null): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'section'  => $section,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $client   = new backend_client();
        $response = $client->pre_exam_summary(
            (int) $params['courseid'],
            (int) $USER->id,
            isset($params['section']) ? (int) $params['section'] : null
        );

        return [
            'summary'         => (string) ($response['summary'] ?? ''),
            'documents_used'  => array_map(
                static fn(array $d) => [
                    'document_id' => (string) ($d['document_id'] ?? ''),
                    'filename'    => (string) ($d['filename'] ?? ''),
                ],
                $response['documents_used'] ?? []
            ),
            'total_documents' => (int) ($response['total_documents'] ?? 0),
        ];
    }
}
