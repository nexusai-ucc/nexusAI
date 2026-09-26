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
 * NexusAI per-course switch: the teacher turns NexusAI on or off for the course.
 *
 * Reachable even with NexusAI off, because it is where it gets turned on.
 * Turning it off hides NexusAI for every student of the course and stops any
 * token use there; nothing is deleted.
 *
 * URL: /local/nexusai/course_settings.php?courseid=X
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');

global $PAGE, $OUTPUT, $DB;

$courseid = required_param('courseid', PARAM_INT);
$course = $DB->get_record('course', ['id' => $courseid], '*', MUST_EXIST);

require_login($course);
$context = context_course::instance($course->id);
require_capability('local/nexusai:manage', $context);

$pageurl = new moodle_url('/local/nexusai/course_settings.php', ['courseid' => $course->id]);
$PAGE->set_url($pageurl);
$PAGE->set_context($context);
$PAGE->set_pagelayout('incourse');
$PAGE->set_title(get_string('course_settings_title', 'local_nexusai'));
$PAGE->set_heading($course->fullname);

$siteenabled = \local_nexusai\local\course_guard::plugin_enabled();
$form = new \local_nexusai\form\course_settings_form($pageurl, [
    'courseid' => (int) $course->id,
    'enabled' => \local_nexusai\local\course_guard::course_setting((int) $course->id),
]);

if ($form->is_cancelled()) {
    redirect(new moodle_url('/course/view.php', ['id' => $course->id]));
}

if ($data = $form->get_data()) {
    \local_nexusai\local\course_guard::set_enabled((int) $course->id, !empty($data->enabled));
    redirect(
        $pageurl,
        get_string(
            !empty($data->enabled) ? 'course_enabled_saved_on' : 'course_enabled_saved_off',
            'local_nexusai'
        ),
        null,
        \core\output\notification::NOTIFY_SUCCESS
    );
}

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('course_settings_title', 'local_nexusai'));
if (!$siteenabled) {
    echo $OUTPUT->notification(get_string('course_site_disabled', 'local_nexusai'), 'warning');
}
echo html_writer::tag('p', get_string('course_settings_intro', 'local_nexusai'));
$form->display();
echo $OUTPUT->footer();
