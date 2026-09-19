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
 * Event observer registration for local_nexusai.
 *
 * Registers Moodle's event observers. When a teacher uploads a supported
 * resource (PDF, DOCX, PPTX, XLSX, CSV, MD, HTML, TXT) to a course module,
 * the observer detects it and sends it to the NexusAI backend for automatic
 * indexing.
 *
 * This complements the manual upload from the teacher view (/documents.php):
 * with this observer, any resource the teacher uploads from Moodle's
 * standard interface (Add an activity → File) also gets indexed.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$observers = [
    [
        'eventname'    => '\core\event\course_module_created',
        'callback'     => '\local_nexusai\observer::course_module_created',
        'includefile'  => null,
        'internal'     => false,
        'priority'     => 0,
    ],

    // Forums — Epic 06: index posts on create/edit/delete.
    // On Moodle 5.x, creating a new discussion fires discussion_created (NOT post_created).
    // post_created only fires for replies to existing discussions.
    [
        'eventname'   => '\mod_forum\event\discussion_created',
        'callback'    => '\local_nexusai\observer::forum_discussion_created',
        'includefile' => null,
        'internal'    => false,
        'priority'    => 200,
    ],
    [
        'eventname'   => '\mod_forum\event\post_created',
        'callback'    => '\local_nexusai\observer::forum_post_created',
        'includefile' => null,
        'internal'    => false,
        'priority'    => 200,
    ],
    [
        'eventname'   => '\mod_forum\event\post_updated',
        'callback'    => '\local_nexusai\observer::forum_post_updated',
        'includefile' => null,
        'internal'    => false,
        'priority'    => 200,
    ],
    [
        'eventname'   => '\mod_forum\event\post_deleted',
        'callback'    => '\local_nexusai\observer::forum_post_deleted',
        'includefile' => null,
        'internal'    => false,
        'priority'    => 200,
    ],
];
