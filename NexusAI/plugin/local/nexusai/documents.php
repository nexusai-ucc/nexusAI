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
 * NexusAI per-course document management page.
 *
 * Access: only users with the local/nexusai:manage capability in the course context.
 *
 * URL: /local/nexusai/documents.php?courseid=X
 *
 * This page renders a minimal PHP shell (header, breadcrumbs, container)
 * and loads the `documents-manager-lazy` React bundle that handles the whole
 * UX: drag-and-drop, the polling table, reindex/delete.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');

global $PAGE, $OUTPUT, $USER, $COURSE, $DB;

// 1. Resolve the course.
$courseid = required_param('courseid', PARAM_INT);
$course = $DB->get_record('course', ['id' => $courseid], '*', MUST_EXIST);

// ONB-07 (#430): optional initial tab (e.g. ?tab=help from the
// OnboardingPanel link in review mode). DocumentsManager.jsx ignores any
// value that doesn't match one of its keys and falls back to "material".
$initialtab = optional_param('tab', '', PARAM_ALPHA);

// 2. Login + capability.
require_login($course);
$context = context_course::instance($course->id);
require_capability('local/nexusai:manage', $context);

// 3. Page setup.
$pageurl = new moodle_url('/local/nexusai/documents.php', ['courseid' => $courseid]);
$PAGE->set_url($pageurl);
$PAGE->set_context($context);
$PAGE->set_course($course);
$PAGE->set_pagelayout('incourse');
$PAGE->set_title(
    format_string($course->shortname) . ': ' . get_string('documents_page_title', 'local_nexusai')
);
$PAGE->set_heading(format_string($course->fullname));

// Breadcrumb: Course → NexusAI.
$PAGE->navbar->add(
    get_string('documents_page_title', 'local_nexusai'),
    $pageurl
);

// 4. Load the documents React bundle.
$PAGE->requires->js_call_amd('local_nexusai/documents-manager-lazy', 'init', [
    [
        'courseid'  => (int) $course->id,
        'userid'    => (int) $USER->id,
        'sesskey'   => sesskey(),
        'wwwroot'   => (string) (new moodle_url('/'))->out(false),
        'lang'      => local_nexusai_frontend_lang(),
        'fullname'  => (string) format_string($course->fullname),
        'shortname' => (string) format_string($course->shortname),
        'initialtab' => $initialtab,
    ],
]);

// 5. Render.
echo $OUTPUT->header();

echo $OUTPUT->heading(get_string('documents_page_title', 'local_nexusai'));

// Container where React mounts the app.
echo '<div id="local-nexusai-documents-app" data-plugin="nexusai"></div>';

// Noscript fallback for users without JS enabled.
echo '<noscript><div class="alert alert-warning">' .
    get_string('documents_page_noscript', 'local_nexusai') .
    '</div></noscript>';

echo $OUTPUT->footer();
