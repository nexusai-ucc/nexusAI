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
 * External function `local_nexusai_document_reindex`.
 *
 * Re-runs indexing on an already-uploaded document, without requesting a new
 * file (CONT-09, #358) — the backend reads the file it already has saved on
 * disk from the original upload. Unlike `document_replace`, it receives no
 * content in the request.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Re-runs indexing on an already-uploaded document, without requesting a new file (CONT-09, #358)
 * — the backend reads the file it already has saved on disk from the original upload.
 */
class document_reindex extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'   => new \external_value(PARAM_INT, 'Course ID (to validate the capability)', VALUE_REQUIRED),
            'documentid' => new \external_value(PARAM_ALPHANUMEXT, 'UUID of the document to reindex', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'id'            => new \external_value(PARAM_ALPHANUMEXT, 'Document ID'),
            'course_id'     => new \external_value(PARAM_INT, 'Course ID'),
            'uploader_id'   => new \external_value(PARAM_INT, 'ID of whoever originally uploaded the file'),
            'filename'      => new \external_value(PARAM_TEXT, 'File name'),
            'mime_type'     => new \external_value(PARAM_RAW, 'MIME type'),
            'status'        => new \external_value(PARAM_ALPHA, 'pending | indexing | indexed | error'),
            'error_message' => new \external_value(
                PARAM_RAW,
                'Error message if status=error',
                VALUE_OPTIONAL,
                null,
                NULL_ALLOWED
            ),
            'created_at'    => new \external_value(PARAM_RAW, 'Creation timestamp', VALUE_OPTIONAL, null, NULL_ALLOWED),
            'updated_at'    => new \external_value(
                PARAM_RAW,
                'Last update timestamp',
                VALUE_OPTIONAL,
                null,
                NULL_ALLOWED
            ),
        ]);
    }

    /**
     * Re-runs indexing on an already-uploaded document, without requesting a new file (CONT-09,
     * #358) — the backend reads the file it already has saved on disk from the original upload.
     *
     * @param int $courseid Course ID (to validate the capability)
     * @param string $documentid UUID of the document to reindex
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

        // Defense: verify the document belongs to the course before
        // reindexing (same criterion as document_delete/document_status).
        $document = $client->get_document($params['documentid']);
        if (((int) ($document['course_id'] ?? 0)) !== (int) $params['courseid']) {
            throw new \moodle_exception(
                'errorbackend',
                'local_nexusai',
                '',
                'Cannot reindex: document does not belong to the requested course'
            );
        }

        $response = $client->reindex_document($params['documentid']);

        return [
            'id'            => (string) ($response['id'] ?? $params['documentid']),
            'course_id'     => (int) ($response['course_id'] ?? $params['courseid']),
            'uploader_id'   => (int) ($response['uploader_id'] ?? 0),
            'filename'      => (string) ($response['filename'] ?? ''),
            'mime_type'     => (string) ($response['mime_type'] ?? ''),
            'status'        => (string) ($response['status'] ?? 'pending'),
            'error_message' => $response['error_message'] ?? null,
            'created_at'    => isset($response['created_at']) ? (string) $response['created_at'] : null,
            'updated_at'    => isset($response['updated_at']) ? (string) $response['updated_at'] : null,
        ];
    }
}
