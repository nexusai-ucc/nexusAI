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
 * External function `local_nexusai_document_upload`.
 *
 * Receives the file content as base64 directly from React (FileReader over
 * HTML5 drag-and-drop), validates it and forwards it to the Python backend.
 *
 * Decision: we do NOT use Moodle's draft area or the traditional filepicker.
 * Reasons:
 *   - The draft area + filepicker is server-rendered and requires a page reload.
 *     React + FileReader → base64 → AJAX gives a smooth UX with no reload.
 *   - The Python backend already expects base64 (see app/documents/router.py),
 *     so we're not adding overhead.
 *   - Maximum accepted size: 20 MB → in base64 within the request's JSON,
 *     ~27 MB. Under Moodle's typical post_max_size (64 MB).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Receives the file content as base64 directly from React (FileReader over HTML5
 * drag-and-drop), validates it and forwards it to the Python backend.
 */
class document_upload extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'    => new \external_value(PARAM_INT, 'Moodle course ID', VALUE_REQUIRED),
            'filename'    => new \external_value(PARAM_FILE, 'File name (with extension)', VALUE_REQUIRED),
            'mimetype'    => new \external_value(PARAM_RAW, 'MIME type detected by the browser', VALUE_REQUIRED),
            'content_b64' => new \external_value(PARAM_RAW, 'Binary content in base64', VALUE_REQUIRED),
            'section'     => new \external_value(
                PARAM_INT,
                'Course section/unit (-1 = unassigned, BUS-05)',
                VALUE_DEFAULT,
                -1
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
            'id'            => new \external_value(PARAM_ALPHANUMEXT, 'UUID of the created document'),
            'course_id'     => new \external_value(PARAM_INT, 'Course ID'),
            'uploader_id'   => new \external_value(PARAM_INT, 'ID of the teacher who uploaded it'),
            'filename'      => new \external_value(PARAM_RAW, 'File name'),
            'mime_type'     => new \external_value(PARAM_RAW, 'MIME type'),
            'section'       => new \external_value(PARAM_INT, 'Assigned section', VALUE_OPTIONAL, null, NULL_ALLOWED),
            'status'        => new \external_value(PARAM_ALPHA, 'pending | indexing | indexed | error'),
            'error_message' => new \external_value(PARAM_RAW, 'Error message if status=error', VALUE_OPTIONAL),
        ]);
    }

    /** Allowed MIME types → magic-bytes validator. */
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
     * Receives a file's content as base64 from React, validates it and forwards it to the backend.
     *
     * @param int    $courseid    Course ID (the course context validates access).
     * @param string $filename    Uploaded file's name.
     * @param string $mimetype    MIME type: PDF, DOCX, PPTX, XLSX, CSV, MD, HTML or TXT.
     * @param string $contentb64  File's binary content in base64.
     * @param int    $section     Course section/unit (-1 = unassigned, BUS-05).
     * @return array Document state after the upload.
     */
    public static function execute(
        int $courseid,
        string $filename,
        string $mimetype,
        string $contentb64,
        int $section = -1
    ): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'    => $courseid,
            'filename'    => $filename,
            'mimetype'    => $mimetype,
            'content_b64' => $contentb64,
            'section'     => $section,
        ]);

        // Validate the course context + manage capability.
        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        // Validate the MIME type against the list of allowed types.
        if (!in_array($params['mimetype'], self::ALLOWED_MIME_TYPES, true)) {
            throw new \invalid_parameter_exception(
                'Unsupported file type. Allowed: PDF, DOCX, PPTX, XLSX, CSV, MD, HTML, TXT. '
                . 'Got: ' . $params['mimetype']
            );
        }

        // Defense: the filename can't have path traversal or weird characters.
        // PARAM_FILE already filters most of it, but we re-check the length.
        if (strlen($params['filename']) === 0 || strlen($params['filename']) > 255) {
            throw new \invalid_parameter_exception('Invalid filename length');
        }

        // Validate the base64 size before decoding (saves memory if it's oversized).
        // base64 inflates by ~33%, so a 20 MB file = ~27 MB in base64.
        // We give it margin and reject > 30 MB of base64.
        if (strlen($params['content_b64']) > 30 * 1024 * 1024) {
            throw new \invalid_parameter_exception('File too large (max 20MB)');
        }

        // Decode base64 to get the binary content and validate magic bytes.
        // base64_decode with strict=true rejects invalid characters.
        $filebytes = base64_decode($params['content_b64'], true);
        if ($filebytes === false || $filebytes === '') {
            throw new \invalid_parameter_exception('Invalid base64 content');
        }

        // Validate magic bytes against the declared MIME type.
        self::validate_magic_bytes($filebytes, $params['mimetype']);

        // A value of -1 means the teacher didn't pick a section (BUS-05) → null is sent to the backend.
        $section = $params['section'] >= 0 ? (int) $params['section'] : null;

        // POST to the backend with HMAC. The backend client re-encodes to
        // base64 (yes, double encode/decode, but the backend's contract
        // lives in services/api/app/documents/router.py and it's cleaner this way).
        $client = new backend_client();
        $response = $client->upload_document(
            (int) $params['courseid'],
            (int) $USER->id, // Always from the server, never from the client.
            $params['filename'],
            $params['mimetype'],
            $filebytes,
            $section
        );

        // Validate the response's shape.
        if (!isset($response['id'], $response['status'])) {
            throw new \moodle_exception(
                'errorbackend',
                'local_nexusai',
                '',
                'Backend upload response is missing required fields'
            );
        }

        // Save a copy in Moodle's file storage so it can be served via
        // pluginfile.php without depending on the Python backend's disk.
        // itemid = course_id to group by course. Filename unique per course
        // (already validated by the backend with a collision check).
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
            $existing->delete();  // Replaces it if it already existed (re-upload).
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

        // CAL-03 (issue #239): notify the course's users that there's new
        // material. Best-effort — must never break the upload's response.
        \local_nexusai\notifier::notify_new_material(
            (int) $params['courseid'],
            $params['filename'],
            (int) $USER->id
        );

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
                // PDF: "%PDF-".
                if (substr($bytes, 0, 5) !== '%PDF-') {
                    throw new \invalid_parameter_exception('File does not look like a valid PDF');
                }
                break;
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                // DOCX is a ZIP: magic bytes PK\x03\x04.
                if (substr($bytes, 0, 4) !== "PK\x03\x04") {
                    throw new \invalid_parameter_exception('File does not look like a valid DOCX');
                }
                break;
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                // PPTX is a ZIP, same as DOCX.
                if (substr($bytes, 0, 4) !== "PK\x03\x04") {
                    throw new \invalid_parameter_exception('File does not look like a valid PPTX');
                }
                break;
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                // XLSX is a ZIP, same as DOCX.
                if (substr($bytes, 0, 4) !== "PK\x03\x04") {
                    throw new \invalid_parameter_exception('File does not look like a valid XLSX');
                }
                break;
            case 'text/plain':
            case 'text/csv':
            case 'text/markdown':
            case 'text/html':
                // Text formats: verify it's valid UTF-8 (mb_check_encoding).
                if (!mb_check_encoding($bytes, 'UTF-8')) {
                    throw new \invalid_parameter_exception('Text file is not valid UTF-8');
                }
                break;
        }
    }
}
