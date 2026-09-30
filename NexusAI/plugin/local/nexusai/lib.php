<?php
// This file is part of the NexusAI plugin for Moodle.
//
// NexusAI is free software: you can redistribute it and/or modify
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
 * Library functions for local_nexusai.
 *
 * The widget is injected through the hooks API (db/hooks.php and
 * classes/hook/output/before_footer_listener.php). The old
 * `local_nexusai_before_footer()` callback for Moodle 4.1-4.3 was removed when
 * the minimum became Moodle 4.5 (DATA-02).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Normalizes Moodle's language into the code the React frontend understands.
 *
 * current_language() can return regional variants (es_ar, es_mx, en_us,
 * en_gb) or languages without their own package in the frontend
 * (fr, pt_br...). The widget's dictionaries only distinguish "es" vs "en"
 * (anything that isn't exactly "es" falls back to English) — without this
 * normalization, a Moodle installed with a regional variant shows up in
 * English even if the site is in Spanish.
 *
 * @return string "es" or "en".
 */
function local_nexusai_frontend_lang(): string {
    $lang = strtolower((string) current_language());
    // Keep only the primary subtag: "es_ar" -> "es", "en_us" -> "en".
    $primary = explode('_', $lang)[0];
    return $primary === 'es' ? 'es' : 'en';
}

/**
 * Serves nothing from the plugin's file areas (VIS-05).
 *
 * Until VIS-05 the plugin kept its own copy of each uploaded document and
 * served it here to any student of the course, hidden or not. Every document
 * is now a "File" activity of the course and is opened through it
 * (document_download.php), so Moodle's visibility rules always apply. Copies
 * left by older versions are not served.
 *
 * @param stdClass $course Course.
 * @param stdClass|null $cm Course module.
 * @param context $context Context.
 * @param string $filearea File area.
 * @param array $args Remaining path.
 * @param bool $forcedownload Whether to force the download.
 * @param array $options Options.
 * @return bool Always false: nothing is served.
 */
function local_nexusai_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, $options = []) {
    return false;
}

/**
 * Name of the user preference where the calendar feed token lives (CAL-07).
 */
define('LOCAL_NEXUSAI_CALFEED_PREF', 'local_nexusai_calfeedtoken');

/**
 * Returns the student's calendar feed token, creating it if it doesn't exist.
 *
 * The token is per-student (not per-course): a single subscription covers
 * all their courses, and revoking it cuts all of them off. Stored as a user
 * preference — no table.
 *
 * @param int $userid
 * @return string 44-character token.
 */
function local_nexusai_calfeed_get_or_create_token(int $userid): string {
    $token = get_user_preferences(LOCAL_NEXUSAI_CALFEED_PREF, null, $userid);
    if (empty($token) || strlen($token) < 32) {
        $token = local_nexusai_calfeed_rotate_token($userid);
    }
    return $token;
}

/**
 * Generates a new token for the student and discards the previous one (revocation).
 *
 * @param int $userid
 * @return string The new token.
 */
function local_nexusai_calfeed_rotate_token(int $userid): string {
    $token = random_string(44);
    set_user_preference(LOCAL_NEXUSAI_CALFEED_PREF, $token, $userid);
    return $token;
}

/**
 * Absolute URL of a course's .ics feed for a student.
 *
 * @param int $userid
 * @param int $courseid
 * @return string
 */
function local_nexusai_calfeed_url(int $userid, int $courseid): string {
    $token = local_nexusai_calfeed_get_or_create_token($userid);
    return (new moodle_url('/local/nexusai/calendar_feed.php', [
        'token'  => $token,
        'course' => $courseid,
    ]))->out(false);
}

/**
 * Hook run by Moodle when building a course's navbar.
 *
 * We add a "📚 NexusAI" link to the document management page, ONLY visible
 * to users with the local/nexusai:manage capability (teachers and admins).
 * Students don't see this link — they interact with the floating chat only.
 *
 * This callback works on every supported version (Moodle 4.5 LTS through 5.2);
 * Moodle has not moved it to the hooks API.
 *
 * @param navigation_node $navigation Course node we add the item to.
 * @param stdClass        $course     Current course object.
 * @param context_course  $context    Course context.
 */
function local_nexusai_extend_navigation_course($navigation, $course, $context): void {
    if (!has_capability('local/nexusai:manage', $context) || !\local_nexusai\local\course_guard::plugin_enabled()) {
        return;
    }

    // Always reachable for teachers, even with NexusAI off in the course:
    // it is where they turn it on (CURSO-01).
    $navigation->add_node(navigation_node::create(
        get_string('course_settings_title', 'local_nexusai'),
        new moodle_url('/local/nexusai/course_settings.php', ['courseid' => $course->id]),
        navigation_node::TYPE_SETTING,
        null,
        'local_nexusai_course_settings',
        new pix_icon('i/settings', '')
    ));

    if (!\local_nexusai\local\course_guard::is_enabled((int) $course->id)) {
        return;
    }

    $url = new moodle_url('/local/nexusai/documents.php', ['courseid' => $course->id]);
    $node = navigation_node::create(
        get_string('documents_page_title', 'local_nexusai'),
        $url,
        navigation_node::TYPE_SETTING,
        null,
        'local_nexusai_documents',
        new pix_icon('i/files', '')
    );

    $navigation->add_node($node);
}
