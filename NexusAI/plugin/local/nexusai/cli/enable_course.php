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
 * CLI: turn NexusAI on or off for courses by id.
 *
 * Meant for trying it out one course at a time.
 *
 * Usage:
 *   php local/nexusai/cli/enable_course.php --courseid=3 [--off]
 *   php local/nexusai/cli/enable_course.php --list
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');

[$options, $unrecognised] = cli_get_params(
    ['courseid' => 0, 'off' => false, 'list' => false, 'help' => false],
    ['h' => 'help']
);

if ($unrecognised || $options['help'] || (!$options['list'] && empty($options['courseid']))) {
    cli_writeln("Turn NexusAI on or off for a course.\n");
    cli_writeln("Options:");
    cli_writeln("  --courseid=N  Course id.");
    cli_writeln("  --off         Turn it off instead of on.");
    cli_writeln("  --list        List courses and whether NexusAI is on.");
    exit($unrecognised ? 1 : 0);
}

if ($options['list']) {
    foreach ($DB->get_records_select('course', 'id > ?', [SITEID], 'id', 'id, shortname') as $course) {
        $state = \local_nexusai\local\course_guard::is_enabled((int) $course->id) ? 'ON ' : 'off';
        cli_writeln("{$state}  {$course->id}  {$course->shortname}");
    }
    exit(0);
}

$courseid = (int) $options['courseid'];
if (!$DB->record_exists('course', ['id' => $courseid]) || $courseid <= SITEID) {
    cli_error("Course {$courseid} does not exist.");
}

// The event needs a user: attribute the change to the site admin.
\core\session\manager::set_user(get_admin());
\local_nexusai\local\course_guard::set_enabled($courseid, empty($options['off']));
cli_writeln("NexusAI is now " . (empty($options['off']) ? 'ON' : 'off') . " for course {$courseid}.");
