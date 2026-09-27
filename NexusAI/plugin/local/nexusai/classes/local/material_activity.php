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
 * Creates the Moodle "File" activity that backs each document uploaded from NexusAI (VIS-03).
 *
 * Everything a teacher uploads through NexusAI becomes a real `mod_resource`
 * activity in the unit they choose. It is the same material as the one in the
 * virtual classroom, not a parallel copy, so Moodle decides who can see it
 * (see visible_material) and NexusAI answers only from what the user can see.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Creates and removes the activity behind a NexusAI document.
 */
class material_activity {
    /** @var bool True while this class is creating an activity (read by the observer). */
    private static bool $creating = false;

    /**
     * Whether an activity is being created by NexusAI right now.
     *
     * The `course_module_created` observer asks this to skip what NexusAI
     * itself just created: that file is indexed by the upload, and asking the
     * teacher to confirm it a second time would be wrong.
     *
     * @return bool
     */
    public static function is_creating(): bool {
        return self::$creating;
    }

    /**
     * Checks that the current user may create this activity, before anything is created.
     *
     * @param \stdClass $course     Course record.
     * @param int       $section    Section number the activity goes in.
     * @param int       $size       File size in bytes.
     * @param bool      $visible    Whether the activity will be visible to students.
     * @throws \required_capability_exception Without permission to add activities.
     * @throws \moodle_exception If the section does not exist or the file is too big.
     */
    public static function require_can_create(\stdClass $course, int $section, int $size, bool $visible): void {
        global $CFG;

        $context = \context_course::instance($course->id);
        require_capability('moodle/course:manageactivities', $context);
        require_capability('mod/resource:addinstance', $context);
        if (!$visible) {
            require_capability('moodle/course:activityvisibility', $context);
        }

        if ($section < 0 || $section > course_get_format($course)->get_last_section_number()) {
            throw new \moodle_exception('materialsectioninvalid', 'local_nexusai');
        }

        $maxbytes = get_user_max_upload_file_size($context, $CFG->maxbytes, $course->maxbytes);
        if ($maxbytes != USER_CAN_IGNORE_FILE_SIZE_LIMITS && $size > $maxbytes) {
            throw new \moodle_exception('materialtoolarge', 'local_nexusai', '', display_size($maxbytes));
        }
    }

    /**
     * Creates the "File" activity in the given unit.
     *
     * Call require_can_create() first.
     *
     * @param \stdClass $course   Course record.
     * @param int       $section  Section number.
     * @param string    $filename File name, also used as the activity name.
     * @param string    $bytes    File content.
     * @param bool      $visible  Whether students can see it. Moodle's eye icon.
     * @return int Course module id (cmid).
     */
    public static function create(\stdClass $course, int $section, string $filename, string $bytes, bool $visible): int {
        global $CFG, $DB, $USER;

        require_once($CFG->dirroot . '/course/modlib.php');
        require_once($CFG->dirroot . '/lib/resourcelib.php');

        // The form-based API reads the file from the user's draft area.
        $draftid = file_get_unused_draft_itemid();
        get_file_storage()->create_file_from_string([
            'contextid' => \context_user::instance($USER->id)->id,
            'component' => 'user',
            'filearea'  => 'draft',
            'itemid'    => $draftid,
            'filepath'  => '/',
            'filename'  => $filename,
        ], $bytes);

        $info = (object) [
            'modulename'          => 'resource',
            'module'              => $DB->get_field('modules', 'id', ['name' => 'resource'], MUST_EXIST),
            'course'              => $course->id,
            'section'             => $section,
            'name'                => $filename,
            'intro'               => '',
            'introformat'         => FORMAT_HTML,
            'showdescription'     => 0,
            'visible'             => $visible ? 1 : 0,
            'visibleoncoursepage' => 1,
            'cmidnumber'          => '',
            'groupmode'           => 0,
            'groupingid'          => 0,
            'availability'        => null,
            'completion'          => 0,
            'display'             => RESOURCELIB_DISPLAY_AUTO,
            'printintro'          => 0,
            'showsize'            => 0,
            'showtype'            => 0,
            'files'               => $draftid,
        ];

        self::$creating = true;
        try {
            $created = add_moduleinfo($info, $course);
        } finally {
            self::$creating = false;
        }
        return (int) $created->coursemodule;
    }

    /**
     * Puts a new file in an existing "File" activity, so the classroom and the index show the same one.
     *
     * Used when the teacher replaces a document from NexusAI. The file API does not fire
     * `course_module_updated`, so the caller reindexes on its own and nothing is indexed twice.
     *
     * @param int    $cmid     Course module id.
     * @param string $filename New file name.
     * @param string $bytes    New file content.
     */
    public static function replace_file(int $cmid, string $filename, string $bytes): void {
        global $DB;

        $context = \context_module::instance($cmid);
        $cm = get_coursemodule_from_id('resource', $cmid, 0, false, MUST_EXIST);

        $fs = get_file_storage();
        $fs->delete_area_files($context->id, 'mod_resource', 'content');
        $fs->create_file_from_string([
            'contextid' => $context->id,
            'component' => 'mod_resource',
            'filearea'  => 'content',
            'itemid'    => 0,
            'filepath'  => '/',
            'filename'  => $filename,
            'sortorder' => 1,
        ], $bytes);

        // A new revision makes browsers fetch the new file instead of a cached one.
        $DB->set_field('resource', 'revision', (int) $DB->get_field('resource', 'revision', ['id' => $cm->instance]) + 1, [
            'id' => $cm->instance,
        ]);
        $DB->set_field('resource', 'timemodified', time(), ['id' => $cm->instance]);
    }

    /**
     * Removes an activity this class created, when the rest of the upload failed.
     *
     * @param int $cmid Course module id.
     */
    public static function remove(int $cmid): void {
        global $CFG;
        require_once($CFG->dirroot . '/course/lib.php');
        course_delete_module($cmid);
    }
}
