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
 * Download of documents uploaded to the NexusAI plugin.
 *
 * Serves the file directly from Moodle's file storage, without depending
 * on the Python backend. The file is saved in Moodle during the upload
 * (see classes/external/document_upload.php).
 *
 * Query params:
 *   - courseid  (int)    — Moodle course ID (to locate the file in Moodle)
 *   - filename  (string) — File name
 *   - sesskey   (string) — Moodle CSRF token
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('NO_DEBUG_DISPLAY', true);

require_once(__DIR__ . '/../../config.php');

global $USER, $CFG;

require_login();
if (isguestuser()) {
    http_response_code(403);
    die(get_string('erroraccessdenied', 'local_nexusai'));
}
require_sesskey();

$courseid = optional_param('courseid', 0, PARAM_INT);
$filename = optional_param('filename', '', PARAM_FILE);

if ($courseid <= 0) {
    http_response_code(400);
    die(get_string('errorcourseidrequired', 'local_nexusai'));
}

// Sanitize filename: file name only, no path traversal.
$filename = basename($filename);
if ($filename === '' || strlen($filename) > 255) {
    http_response_code(400);
    die(get_string('errorinvalidfilename', 'local_nexusai'));
}

$context = context_course::instance($courseid);
require_capability('local/nexusai:use', $context);

$fs   = get_file_storage();
$file = $fs->get_file($context->id, 'local_nexusai', 'documents', $courseid, '/', $filename);

if (!$file || $file->is_directory()) {
    http_response_code(404);
    die(get_string('errorfilenotavailable', 'local_nexusai'));
}

// Delegates Content-Type, Content-Disposition, caching and ranges to Moodle core.
send_stored_file($file, 86400, 0, false, ['filename' => $filename]);
