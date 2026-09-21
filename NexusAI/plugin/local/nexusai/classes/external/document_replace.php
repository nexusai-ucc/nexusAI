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
 * External function `local_nexusai_document_replace`.
 *
 * CONT-07 (#356): replaces an existing document's file while keeping its
 * document_id (old chat citations keep pointing to the same id).
 * Same validators as document_upload.php (magic bytes, size, mimetype).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * CONT-07 (#356): replaces an existing document's file while keeping its document_id (old chat
 * citations keep pointing to the same id).
 */
class document_replace extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'    => new \external_value(PARAM_INT, 'Moodle course ID', VALUE_REQUIRED),
            'documentid'  => new \external_value(PARAM_ALPHANUMEXT, 'UUID of the document to replace', VALUE_REQUIRED),
            'filename'    => new \external_value(PARAM_FILE, 'New file name (with extension)', VALUE_REQUIRED),
            'mimetype'    => new \external_value(PARAM_RAW, 'MIME type detected by the browser', VALUE_REQUIRED),
            'content_b64' => new \external_value(PARAM_RAW, 'Binary content in base64', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'id'            => new \external_value(PARAM_ALPHANUMEXT, 'Document UUID (unchanged)'),
            'course_id'     => new \external_value(PARAM_INT, 'Course ID'),
            'uploader_id'   => new \external_value(PARAM_INT, 'ID of the teacher who uploaded it'),
            'filename'      => new \external_value(PARAM_RAW, 'File name'),
            'mime_type'     => new \external_value(PARAM_RAW, 'MIME type'),
            'section'       => new \external_value(PARAM_INT, 'Assigned section', VALUE_OPTIONAL, null, NULL_ALLOWED),
            'status'        => new \external_value(PARAM_ALPHA, 'pending | indexing | indexed | error'),
            'error_message' => new \external_value(
                PARAM_RAW,
                'Error message if status=error',
                VALUE_OPTIONAL,
                null,
                NULL_ALLOWED
            ),
        ]);
    }

    /** Allowed MIME types → magic-bytes validator (same as document_upload.php). */
    private const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        'text/markdown',
        'text/html',
    ];

    /**
     * Replaces an existing document's file while keeping its document_id (CONT-07, #356).
     *
     * @param int    $courseid   Course ID (the course context validates access).
     * @param string $documentid UUID of the document to replace.
     * @param string $filename   New file's name.
     * @param string $mimetype   MIME type: PDF, DOCX, PPTX, XLSX, CSV, MD, HTML or TXT.
     * @param string $contentb64 New file's binary content in base64.
     * @return array Document state after the replacement.
     */
    public static function execute(
        int $courseid,
        string $documentid,
        string $filename,
        string $mimetype,
        string $contentb64
    ): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'    => $courseid,
            'documentid'  => $documentid,
            'filename'    => $filename,
            'mimetype'    => $mimetype,
            'content_b64' => $contentb64,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        if (!in_array($params['mimetype'], self::ALLOWED_MIME_TYPES, true)) {
            throw new \invalid_parameter_exception(
                'Unsupported file type. Allowed: PDF, DOCX, PPTX, XLSX, CSV, MD, HTML, TXT. '
                . 'Got: ' . $params['mimetype']
            );
        }

        if (strlen($params['filename']) === 0 || strlen($params['filename']) > 255) {
            throw new \invalid_parameter_exception('Invalid filename length');
        }

        // Base64 inflates by ~33%, so a 20 MB file = ~27 MB in base64.
        if (strlen($params['content_b64']) > 30 * 1024 * 1024) {
            throw new \invalid_parameter_exception('File too large (max 20MB)');
        }

        $filebytes = base64_decode($params['content_b64'], true);
        if ($filebytes === false || $filebytes === '') {
            throw new \invalid_parameter_exception('Invalid base64 content');
        }

        self::validate_magic_bytes($filebytes, $params['mimetype']);

        $client = new backend_client();

        // Defense: verify the document belongs to the course before
        // replacing it (same criterion as document_reindex/document_delete).
        $document = $client->get_document($params['documentid']);
        if (((int) ($document['course_id'] ?? 0)) !== (int) $params['courseid']) {
            throw new \moodle_exception(
                'errorbackend',
                'local_nexusai',
                '',
                'Cannot replace: document does not belong to the requested course'
            );
        }

        $response = $client->replace_document(
            $params['documentid'],
            $params['filename'],
            $params['mimetype'],
            $filebytes
        );

        if (!isset($response['id'], $response['status'])) {
            throw new \moodle_exception(
                'errorbackend',
                'local_nexusai',
                '',
                'Backend replace response is missing required fields'
            );
        }

        // Update the copy in Moodle's file storage: delete the old one
        // (it may have had a different name) and save the new one under the current name.
        $fs = get_file_storage();
        $existing = $fs->get_file(
            $context->id,
            'local_nexusai',
            'documents',
            $params['courseid'],
            '/',
            $params['filename']
        );
        if ($existing) {
            $existing->delete();
        }
        $filerecord = [
            'contextid' => $context->id,
            'component' => 'local_nexusai',
            'filearea'  => 'documents',
            'itemid'    => (int) $params['courseid'],
            'filepath'  => '/',
            'filename'  => $params['filename'],
        ];
        $fs->create_file_from_string($filerecord, $filebytes);

        return [
            'id'            => (string) $response['id'],
            'course_id'     => (int) $response['course_id'],
            'uploader_id'   => (int) $response['uploader_id'],
            'filename'      => (string) $response['filename'],
            'mime_type'     => (string) $response['mime_type'],
            'section'       => isset($response['section']) ? (int) $response['section'] : null,
            'status'        => (string) $response['status'],
            'error_message' => $response['error_message'] ?? null,
        ];
    }

    /**
     * Verifies magic bytes against the declared MIME type.
     * Throws invalid_parameter_exception if they don't match.
     */
    private static function validate_magic_bytes(string $bytes, string $mimetype): void {
        switch ($mimetype) {
            case 'application/pdf':
                if (substr($bytes, 0, 5) !== '%PDF-') {
                    throw new \invalid_parameter_exception('File does not look like a valid PDF');
                }
                break;
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                if (substr($bytes, 0, 4) !== "PK\x03\x04") {
                    throw new \invalid_parameter_exception('File does not look like a valid DOCX');
                }
                break;
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                if (substr($bytes, 0, 4) !== "PK\x03\x04") {
                    throw new \invalid_parameter_exception('File does not look like a valid PPTX');
                }
                break;
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                if (substr($bytes, 0, 4) !== "PK\x03\x04") {
                    throw new \invalid_parameter_exception('File does not look like a valid XLSX');
                }
                break;
            case 'text/plain':
            case 'text/csv':
            case 'text/markdown':
            case 'text/html':
                if (!mb_check_encoding($bytes, 'UTF-8')) {
                    throw new \invalid_parameter_exception('Text file is not valid UTF-8');
                }
                break;
        }
    }
}
