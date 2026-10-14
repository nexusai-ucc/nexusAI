<?php
// This file is part of Moodle - https://moodle.org/
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
 * Version metadata for local_nexusai.
 *
 * Moodle reads this file to know:
 *   - which version of the plugin is installed (for upgrades)
 *   - which Moodle versions it supports
 *   - any other plugins it depends on
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$plugin->component = 'local_nexusai';
$plugin->version   = 2026101404;
// Fix: voice questions in the chat were always refused — MediaRecorder reports the
// codec as a MIME parameter ("audio/webm;codecs=opus") and the type was compared whole.
// Fix: deleting a course purges its forum posts from the backend through the
// before_course_deleted hook (new in db/hooks.php) — course_deleted fires after
// remove_course_contents() has already removed the posts.
// Fix: deleting a single forum (course left intact) also purges its posts from the
// backend, via pre_course_module_delete() — course_module_deleted fires too late,
// after mod_forum has already removed the posts it would need to find.
$plugin->release   = '0.19.0';
$plugin->maturity  = MATURITY_BETA;

// We support Moodle 4.5 LTS (build 2024100700) up to 5.3. The UCC runs 5.0.
// If someone tries to install on an older version, Moodle blocks it on its own.
$plugin->requires  = 2024100700;        // Moodle 4.5 LTS.
$plugin->supported = [405, 503];        // 4.5 to 5.3
