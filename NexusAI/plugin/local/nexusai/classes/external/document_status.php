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
 * External function `local_nexusai_document_status`.
 *
 * Current status of a document (pending | indexing | indexed | error).
 * The teacher view polls every 3 seconds while a document is being indexed
 * to show progress.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Current status of a document (pending | indexing | indexed | error).
 */
class document_status extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'   => new \external_value(PARAM_INT, 'Course ID (to validate the capability)', VALUE_REQUIRED),
            'documentid' => new \external_value(PARAM_ALPHANUMEXT, 'Document UUID', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'id'            => new \external_value(PARAM_ALPHANUMEXT, 'Document UUID'),
            'course_id'     => new \external_value(PARAM_INT, 'Course ID'),
            'uploader_id'   => new \external_value(PARAM_INT, 'Teacher ID'),
            'filename'      => new \external_value(PARAM_RAW, 'File name'),
            'mime_type'     => new \external_value(PARAM_RAW, 'MIME type'),
            'status'        => new \external_value(PARAM_ALPHA, 'pending | indexing | indexed | error'),
            'error_message' => new \external_value(PARAM_RAW, 'Error message, if applicable', VALUE_OPTIONAL),
        ]);
    }

    /**
     * Current status of a document (pending | indexing | indexed | error).
     *
     * @param int $courseid Course ID (to validate the capability)
     * @param string $documentid Document UUID
     * @return array
     */
    public static function execute(int $courseid, string $documentid): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'   => $courseid,
            'documentid' => $documentid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        $client = new backend_client();
        $document = $client->get_document($params['documentid']);

        // Defense: verify the document belongs to the requested course.
        // This prevents a teacher from viewing documents from other courses
        // by passing a courseid different from the one the UUID actually belongs to.
        if (((int) ($document['course_id'] ?? 0)) !== (int) $params['courseid']) {
            throw new \moodle_exception(
                'errorbackend',
                'local_nexusai',
                '',
                'Document does not belong to the requested course'
            );
        }

        return [
            'id'            => (string) ($document['id'] ?? ''),
            'course_id'     => (int) ($document['course_id'] ?? 0),
            'uploader_id'   => (int) ($document['uploader_id'] ?? 0),
            'filename'      => (string) ($document['filename'] ?? ''),
            'mime_type'     => (string) ($document['mime_type'] ?? ''),
            'status'        => (string) ($document['status'] ?? ''),
            'error_message' => $document['error_message'] ?? null,
        ];
    }
}
