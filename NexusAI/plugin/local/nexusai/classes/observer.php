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
 * Event observer for local_nexusai — auto-sync on course module creation.
 *
 * When a teacher creates a "resource" module (File) containing a supported
 * format (PDF, DOCX, PPTX, XLSX, CSV, MD, HTML or TXT), this observer
 * automatically sends it to the NexusAI backend for RAG indexing.
 *
 * Error behavior:
 *   - If the plugin is disabled → silent skip.
 *   - If the module isn't of type "resource" → silent skip.
 *   - If the file isn't in a supported format → silent skip.
 *   - If the backend fails → log error, does NOT interrupt Moodle (exception caught).
 *
 * Dependencies:
 *   - `local_nexusai\external\backend_client` — sends the file to the backend.
 *   - Moodle's filestore — reads the bytes of the uploaded file.
 *   - `course_guard::is_enabled()` — site-wide switch and per-course switch.
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
     * Name of the user preference where pending-confirmation uploads accumulate.
     * Value: JSON object {cmid: {courseid, context_id, filename, mimetype}}.
     */
    const PENDING_PREF = 'local_nexusai_pending_uploads';

    // Forums — Epic 06.

    /**
     * Indexes the first post of a new forum discussion.
     *
     * On Moodle 5.x, creating a discussion fires discussion_created but NOT post_created.
     * We read the firstpost from the m_forum_discussions table to index the content.
     *
     * @param \mod_forum\event\discussion_created $event
     */
    public static function forum_discussion_created(\mod_forum\event\discussion_created $event): void {
        if (!\local_nexusai\local\course_guard::is_enabled((int) $event->courseid)) {
            return;
        }

        global $DB;

        $discussionid = (int) $event->objectid;
        $courseid     = (int) $event->courseid;

        try {
            $discussion = $DB->get_record('forum_discussions', ['id' => $discussionid], 'id, firstpost');
            if (!$discussion || empty($discussion->firstpost)) {
                return;
            }
            self::index_forum_post_from_event((int) $discussion->firstpost, $courseid, $discussionid);
        } catch (\Throwable $e) {
            debugging(
                '[NexusAI] forum_discussion_created failed for discussion=' . $discussionid . ': ' . $e->getMessage(),
                DEBUG_NORMAL
            );
        }
    }

    /**
     * Indexes the embedding of a newly created forum post (replies to existing discussions).
     *
     * @param \mod_forum\event\post_created $event
     */
    public static function forum_post_created(\mod_forum\event\post_created $event): void {
        if (!\local_nexusai\local\course_guard::is_enabled((int) $event->courseid)) {
            return;
        }
        self::index_forum_post_from_event(
            (int) $event->objectid,
            (int) $event->courseid,
            (int) ($event->other['discussionid'] ?? 0)
        );
    }

    /**
     * Re-indexes the embedding of an edited post.
     *
     * The backend compares the content_hash and skips it if the content didn't change.
     *
     * @param \mod_forum\event\post_updated $event
     */
    public static function forum_post_updated(\mod_forum\event\post_updated $event): void {
        if (!\local_nexusai\local\course_guard::is_enabled((int) $event->courseid)) {
            return;
        }
        self::index_forum_post_from_event(
            (int) $event->objectid,
            (int) $event->courseid,
            (int) ($event->other['discussionid'] ?? 0)
        );
    }

    /**
     * Removes the embedding of a deleted post.
     *
     * The post is no longer in the DB by the time this event fires, so we
     * only need the post_id to call the backend.
     *
     * @param \mod_forum\event\post_deleted $event
     */
    public static function forum_post_deleted(\mod_forum\event\post_deleted $event): void {
        if (!\local_nexusai\local\course_guard::is_enabled((int) $event->courseid)) {
            return;
        }

        $postid = (int) $event->objectid;

        try {
            $client = new \local_nexusai\external\backend_client();
            $client->set_role('system');
            $client->delete_forum_post($postid);
        } catch (\Throwable $e) {
            debugging(
                '[NexusAI] forum_post_deleted failed for post=' . $postid . ': ' . $e->getMessage(),
                DEBUG_NORMAL
            );
        }
    }

    /**
     * Reads the post's content from the DB and calls the backend to index it.
     *
     * Logic shared between forum_post_created and forum_post_updated.
     *
     * @param int $postid       mdl_forum_posts ID.
     * @param int $courseid     Course ID.
     * @param int $discussionid mdl_forum_discussions ID.
     */
    private static function index_forum_post_from_event(int $postid, int $courseid, int $discussionid): void {
        global $DB;

        try {
            $post = $DB->get_record('forum_posts', ['id' => $postid]);
            if (!$post) {
                return;
            }

            // The message is stored as HTML — strip it for clean text.
            $content = trim(strip_tags($post->message ?? ''));

            // Very short posts ("Thanks" buttons, etc.) add nothing to RAG.
            if (strlen($content) < 10) {
                return;
            }

            $client = new \local_nexusai\external\backend_client();
            $client->set_role('system');
            $client->index_forum_post($postid, $discussionid, $courseid, $content);
        } catch (\Throwable $e) {
            debugging(
                '[NexusAI] forum post indexing failed for post=' . $postid . ': ' . $e->getMessage(),
                DEBUG_NORMAL
            );
        }
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
