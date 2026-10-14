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
 * Event observers of local_nexusai.
 *
 * No observer calls the NexusAI backend: they run inside the user's request,
 * so anything that needs the backend is queued as an ad hoc task and runs in
 * cron (task\sync_forum_post, task\sync_material, task\purge_backend_data).
 *
 * - A new "File" activity is offered to the teacher for indexing (a user
 *   preference read on the next page load), not indexed on its own.
 * - An updated or deleted "File" activity queues the index sync.
 * - Forum posts queue their indexing or removal.
 * - A deleted course or user has its NexusAI rows removed right away; the
 *   backend's copies are purged by a queued task.
 *
 * The activity and forum observers skip courses where NexusAI is off (the
 * deletion ones run anyway, so nothing is left behind), and none interrupts
 * Moodle if something fails.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

/**
 * Automatically syncs with the NexusAI backend when content is created/edited in Moodle.
 */
class observer {
    /** MIME types supported by the backend (kept in sync with extractor.py). */
    const SUPPORTED_MIME_TYPES = [
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
     * Callback for the course_module_created event.
     *
     * Only processes modules of type "resource" (Moodle File). Other types
     * (forum, quiz, label, etc.) are silently ignored.
     *
     * @param \core\event\course_module_created $event
     */
    public static function course_module_created(\core\event\course_module_created $event): void {
        // Off site-wide or in this course: do nothing (CURSO-01).
        if (!\local_nexusai\local\course_guard::is_enabled((int) $event->courseid)) {
            return;
        }

        // NexusAI created this activity itself (VIS-03) and indexes it in the same
        // step: asking the teacher to confirm it again would be wrong.
        if (\local_nexusai\local\material_activity::is_creating()) {
            return;
        }

        $data = $event->get_data();

        // Only "resource"-type modules have an attached file.
        if (($data['other']['modulename'] ?? '') !== 'resource') {
            return;
        }

        $cmid     = (int) $data['contextinstanceid'];
        $courseid = (int) $data['courseid'];
        $userid   = (int) $data['userid'];

        try {
            self::index_resource_module($cmid, $courseid, $userid);
        } catch (\Throwable $e) {
            // Never interrupt Moodle because of an indexing error.
            debugging(
                '[NexusAI] Auto-indexing failed for cmid=' . $cmid . ': ' . $e->getMessage(),
                DEBUG_NORMAL
            );
        }
    }

    /**
     * Callback for the course_deleted event (DATA-05): removes the course's NexusAI data.
     *
     * Runs even when NexusAI is off, so nothing is left behind.
     *
     * @param \core\event\course_deleted $event
     */
    public static function course_deleted(\core\event\course_deleted $event): void {
        try {
            \local_nexusai\local\data_cleanup::delete_course((int) $event->objectid);
        } catch (\Throwable $e) {
            debugging('[NexusAI] Cleanup of course ' . $event->objectid . ' failed: ' . $e->getMessage(), DEBUG_NORMAL);
        }
    }

    /**
     * Callback for the user_deleted event (DATA-05): removes the user's NexusAI data.
     *
     * @param \core\event\user_deleted $event
     */
    public static function user_deleted(\core\event\user_deleted $event): void {
        try {
            \local_nexusai\local\data_cleanup::delete_user((int) $event->objectid);
        } catch (\Throwable $e) {
            debugging('[NexusAI] Cleanup of user ' . $event->objectid . ' failed: ' . $e->getMessage(), DEBUG_NORMAL);
        }
    }

    /**
     * Callback for the course_module_deleted event (VIS-04).
     *
     * A "File" activity deleted in Moodle stops being used: its document leaves
     * the index, with its chunks and stored summaries.
     *
     * @param \core\event\course_module_deleted $event
     */
    public static function course_module_deleted(\core\event\course_module_deleted $event): void {
        self::sync_resource($event, 'remove');
    }

    /**
     * Callback for the course_module_updated event (VIS-04).
     *
     * If the file of a "File" activity changed, its document is indexed again.
     * Renaming the activity or changing its visibility does not touch the index.
     *
     * @param \core\event\course_module_updated $event
     */
    public static function course_module_updated(\core\event\course_module_updated $event): void {
        self::sync_resource($event, 'sync');
    }

    /**
     * Queues the index sync for a "File" activity event (\local_nexusai\task\sync_material):
     * the calls to the backend run in cron, never in the teacher's request.
     *
     * Skips courses where NexusAI is off, other kinds of activity and what
     * NexusAI is creating itself.
     *
     * @param \core\event\base $event Deleted or updated event of a course module.
     * @param string $action 'remove' or 'sync'.
     */
    private static function sync_resource(\core\event\base $event, string $action): void {
        $courseid = (int) $event->courseid;
        if (!\local_nexusai\local\course_guard::is_enabled($courseid)) {
            return;
        }
        if (($event->other['modulename'] ?? '') !== 'resource') {
            return;
        }
        if (\local_nexusai\local\material_activity::is_creating()) {
            return;
        }

        \local_nexusai\task\sync_material::queue($action, $courseid, (int) $event->objectid);
    }

    /**
     * Name of the user preference where pending-confirmation uploads accumulate.
     * Value: JSON object {cmid: {courseid, context_id, filename, mimetype}}.
     */
    const PENDING_PREF = 'local_nexusai_pending_uploads';

    // Forums — Epic 06.
    //
    // The observers only queue \local_nexusai\task\sync_forum_post: the call to
    // the backend runs in cron, so posting never waits for it (MMR-301 item 10).

    /**
     * Queues the indexing of the first post of a new forum discussion.
     *
     * On Moodle 5.x, creating a discussion fires discussion_created but NOT post_created.
     * We read the firstpost from the m_forum_discussions table.
     *
     * @param \mod_forum\event\discussion_created $event
     */
    public static function forum_discussion_created(\mod_forum\event\discussion_created $event): void {
        global $DB;

        if (!\local_nexusai\local\course_guard::is_enabled((int) $event->courseid)) {
            return;
        }

        $discussionid = (int) $event->objectid;
        $firstpost = (int) $DB->get_field('forum_discussions', 'firstpost', ['id' => $discussionid]);
        if ($firstpost > 0) {
            \local_nexusai\task\sync_forum_post::queue('index', $firstpost, (int) $event->courseid, $discussionid);
        }
    }

    /**
     * Queues the indexing of a newly created forum post (replies to existing discussions).
     *
     * @param \mod_forum\event\post_created $event
     */
    public static function forum_post_created(\mod_forum\event\post_created $event): void {
        self::queue_forum_post('index', $event);
    }

    /**
     * Queues the re-indexing of an edited post.
     *
     * The backend compares the content_hash and skips it if the content didn't change.
     *
     * @param \mod_forum\event\post_updated $event
     */
    public static function forum_post_updated(\mod_forum\event\post_updated $event): void {
        self::queue_forum_post('index', $event);
    }

    /**
     * Queues the removal of a deleted post's embedding.
     *
     * @param \mod_forum\event\post_deleted $event
     */
    public static function forum_post_deleted(\mod_forum\event\post_deleted $event): void {
        self::queue_forum_post('delete', $event);
    }

    /**
     * Queues the sync of the post an event is about.
     *
     * Indexing only happens while NexusAI is on for the course. A removal is queued
     * whenever the backend is configured: the post may have been indexed while the
     * course had NexusAI on, and it has to leave the backend even if the course was
     * turned off or is being deleted (MMR-301 item 4).
     *
     * @param string $action 'index' or 'delete'.
     * @param \core\event\base $event A forum post event.
     */
    private static function queue_forum_post(string $action, \core\event\base $event): void {
        $wanted = $action === 'delete'
            ? \local_nexusai\local\course_guard::backend_configured()
            : \local_nexusai\local\course_guard::is_enabled((int) $event->courseid);
        if (!$wanted) {
            return;
        }
        \local_nexusai\task\sync_forum_post::queue(
            $action,
            (int) $event->objectid,
            (int) $event->courseid,
            (int) ($event->other['discussionid'] ?? 0)
        );
    }

    // Resource modules (documents).

    /**
     * Reads the resource module's attached file and saves a pending-confirmation upload.
     *
     * @param int $cmid     Course module ID.
     * @param int $courseid Course ID.
     * @param int $userid   ID of the user who created the module (the teacher).
     */
    private static function index_resource_module(int $cmid, int $courseid, int $userid): void {
        global $CFG, $USER;

        require_once($CFG->dirroot . '/mod/resource/lib.php');

        $context = \context_module::instance($cmid);

        $fs    = get_file_storage();
        $files = $fs->get_area_files($context->id, 'mod_resource', 'content', false, 'itemid, filepath, filename', false);

        if (empty($files)) {
            return;
        }

        $file = reset($files);

        $mimetype = $file->get_mimetype();
        if (!in_array($mimetype, self::SUPPORTED_MIME_TYPES, true)) {
            return;
        }

        $filename = $file->get_filename();

        // Instead of indexing automatically, we save the info in a user preference
        // so the teacher can confirm it on the next page load (confirmation modal).
        $raw     = get_user_preferences(self::PENDING_PREF, '{}', $userid);
        $pending = json_decode($raw, true);
        if (!is_array($pending)) {
            $pending = [];
        }

        $pending[(string) $cmid] = [
            'courseid'   => $courseid,
            'context_id' => $context->id,
            'filename'   => $filename,
            'mimetype'   => $mimetype,
        ];

        set_user_preference(self::PENDING_PREF, json_encode($pending), $userid);

        debugging(
            '[NexusAI] Pending upload queued for "' . $filename . '" (cmid=' . $cmid . ', course=' . $courseid . ')',
            DEBUG_DEVELOPER
        );
    }
}
