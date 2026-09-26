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
 * Hook system:
 *   - Moodle 4.4+ → uses db/hooks.php + classes/hook/output/before_footer_listener.php
 *   - Moodle 4.1-4.3 → uses this file's `local_nexusai_before_footer()` function
 *
 * In Moodle 4.4+, the old function is still invoked for backward compat but its
 * return value is ignored (it only emits a deprecation warning). That's why we
 * detect the Moodle version here and skip on 4.4+ to avoid duplicating logic
 * or generating useless warnings.
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
 * Hook run by Moodle 4.1-4.3 before closing </body>.
 *
 * In Moodle 4.4+ hook handling happens in
 * classes/hook/output/before_footer_listener.php, so this function returns
 * empty to avoid duplication.
 *
 * @return string HTML that Moodle inserts before the footer (Moodle ≤ 4.3).
 */
function local_nexusai_before_footer(): string {
    global $CFG, $PAGE, $USER, $COURSE;

    // In Moodle 4.4+ the new hook system takes care of it.
    // Build 2024042200 = 4.4 LTS / 4.5. Anything from 2024 onward → use the new system.
    if ((int)$CFG->version >= 2024041600) {
        return '';
    }

    // Logic for Moodle 4.1-4.3 (legacy hook system).

    if (!isloggedin() || isguestuser() || !\local_nexusai\local\course_guard::plugin_enabled()) {
        return '';
    }

    // ONB-03: on the course-creation screen the widget shows the setup
    // tutorial. It's evaluated before the real-course guard because that's
    // precisely where there's no course yet ($COURSE->id === 1).
    $onboarding = \local_nexusai\visibility_helper::onboarding_hint();

    if (empty($COURSE->id) || $COURSE->id <= 1) {
        if ($onboarding === null || !\local_nexusai\local\course_guard::show_outside_course()) {
            // Other course-less pages: the full out-of-course experience is
            // 4.4+ only (new hook). On 4.1-4.3 it stays as before.
            return '';
        }

        $PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init', [
            [
                'courseid'   => 0,
                'userid'     => (int) $USER->id,
                'sesskey'    => sesskey(),
                'wwwroot'    => (string) (new moodle_url('/'))->out(false),
                'lang'       => local_nexusai_frontend_lang(),
                'isteacher'  => 0,
                'onboarding' => $onboarding,
            ],
        ]);

        return '<div id="local-nexusai-container" data-plugin="nexusai"></div>';
    }

    if (!\local_nexusai\local\course_guard::is_enabled((int) $COURSE->id)) {
        return '';
    }
    $context = context_course::instance($COURSE->id);
    if (!has_capability('local/nexusai:use', $context)) {
        return '';
    }

    $PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init', [
        [
            'courseid'   => (int) $COURSE->id,
            'userid'     => (int) $USER->id,
            'sesskey'    => sesskey(),
            'wwwroot'    => (string) (new moodle_url('/'))->out(false),
            'lang'       => local_nexusai_frontend_lang(),
            'isteacher'  => (int) has_capability('local/nexusai:manage', $context),
            'onboarding' => $onboarding,
        ],
    ]);

    return '<div id="local-nexusai-container" data-plugin="nexusai"></div>';
}

/**
 * Allows Moodle to serve files from the plugin's 'documents' area.
 *
 * URL: /pluginfile.php/{contextid}/local_nexusai/documents/{courseid}/{filename}
 * Access: requires local/nexusai:use (course students and teachers).
 */
function local_nexusai_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, $options = []) {
    if ($filearea !== 'documents') {
        return false;
    }

    require_login($course);
    if (!has_capability('local/nexusai:use', $context)) {
        return false;
    }

    $itemid  = (int) array_shift($args);
    $filename = array_shift($args);
    if (empty($filename)) {
        return false;
    }

    $fs   = get_file_storage();
    $file = $fs->get_file($context->id, 'local_nexusai', 'documents', $itemid, '/', $filename);
    if (!$file || $file->is_directory()) {
        return false;
    }

    send_stored_file($file, 86400, 0, $forcedownload, $options);
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
 * This hook works on ALL supported versions (Moodle 4.1 LTS through 4.5) —
 * it was not migrated to the new Hook API.
 *
 * @param navigation_node $navigation Course node we add the item to.
 * @param stdClass        $course     Current course object.
 * @param context_course  $context    Course context.
 */
function local_nexusai_extend_navigation_course($navigation, $course, $context): void {
    if (!has_capability('local/nexusai:manage', $context)
            || !\local_nexusai\local\course_guard::plugin_enabled()) {
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
