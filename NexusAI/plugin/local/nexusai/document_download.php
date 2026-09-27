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
 * Opens the material behind a source cited by NexusAI (VIS-05).
 *
 * Every document NexusAI holds comes from a "File" activity of the course, so
 * opening it means opening that activity: Moodle applies its own rules (eye
 * icon, hidden section, availability restrictions, role) and shows its own
 * error to whoever cannot see it. There is no separate copy of the file that
 * could be reached around those rules.
 *
 * Query params:
 *   - courseid    (int)    — Moodle course ID
 *   - document_id (string) — UUID of the document, as the backend returns it
 *   - sesskey     (string) — Moodle CSRF token
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

$courseid   = optional_param('courseid', 0, PARAM_INT);
$documentid = optional_param('document_id', '', PARAM_ALPHANUMEXT);

if ($courseid <= 0) {
    http_response_code(400);
    die(get_string('errorcourseidrequired', 'local_nexusai'));
}
if ($documentid === '' || strlen($documentid) > 64) {
    http_response_code(400);
    die(get_string('errorinvalidparams', 'local_nexusai'));
}

$context = context_course::instance($courseid);
require_capability('local/nexusai:use', $context);
if (!\local_nexusai\local\course_guard::is_enabled($courseid)) {
    http_response_code(403);
    die(get_string('coursedisabled', 'local_nexusai'));
}

$url = \local_nexusai\local\material_link::url_for_document($courseid, $documentid);
if ($url === null) {
    http_response_code(404);
    die(get_string('errorfilenotavailable', 'local_nexusai'));
}
if ($url === false) {
    http_response_code(403);
    die(get_string('errormaterialhidden', 'local_nexusai'));
}

redirect($url);
