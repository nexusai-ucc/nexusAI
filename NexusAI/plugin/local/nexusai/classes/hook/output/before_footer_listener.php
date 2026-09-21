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
 * Listener for the `core\hook\output\before_footer_html_generation` hook.
 *
 * This is the replacement for the old `local_nexusai_before_footer()`
 * callback. On Moodle 4.4+, the hooks system invokes this method before
 * closing </body>, allowing HTML/JS to be injected into any page's footer.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\hook\output;

use core\hook\output\before_footer_html_generation;
use local_nexusai\visibility_helper;

/**
 * Injects the chat widget before the footer on Moodle 4.4+ (replaces the legacy callback).
 */
class before_footer_listener {
    /**
     * Callback executed by Moodle before generating the footer HTML.
     *
     * The visibility rule (logged in, not a guest, capability in a real
     * course) lives in visibility_helper::resolve() — shared with the
     * primary navbar icon (primary_extend_listener.php, UX-02) so there's
     * never a clickable icon without a panel behind it. Outside a real
     * course, courseid arrives as 0 and the panel enters an empty state.
     *
     * If the widget should be shown, injects the container div and asks
     * Moodle to load the `local_nexusai/chatwidget-lazy` AMD bundle.
     *
     * @param before_footer_html_generation $hook The hook, with methods like add_html() etc.
     */
    public static function callback(before_footer_html_generation $hook): void {
        global $CFG, $PAGE, $USER;

        // The function below lives in lib.php, which Moodle does not autoload.
        require_once($CFG->dirroot . '/local/nexusai/lib.php');

        $context = visibility_helper::resolve();
        if ($context === null) {
            return;
        }

        $courseid  = $context['courseid'];
        $isteacher = $context['isteacher'];

        // ONB-03: on the create-course screen the widget shows the
        // setup tutorial instead of the "no course" placeholder.
        $onboarding = visibility_helper::onboarding_hint();

        // 2. Load the React bundle via AMD/RequireJS.
        $PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init', [
            [
                'courseid'   => $courseid,
                'userid'     => (int) $USER->id,
                'sesskey'    => sesskey(),
                'wwwroot'    => (string) (new \moodle_url('/'))->out(false),
                'lang'       => \local_nexusai_frontend_lang(),
                'isteacher'  => (int) $isteacher,
                'onboarding' => $onboarding,
            ],
        ]);

        // For teachers: load the module that shows the confirmation prompt
        // when they upload a file to a course section.
        if ($isteacher && $courseid > 0) {
            $PAGE->requires->js_call_amd('local_nexusai/upload-prompt', 'init', [
                ['courseid' => $courseid],
            ]);
        }

        // F-08: similar-posts detector in forum forms.
        // Loaded on any forum page (mod-forum-*): on Moodle 5.x the new-discussion
        // form can be shown inline in mod-forum-view, not just in mod-forum-post.
        // The JS self-limits if there's no input[name="subject"].
        // $courseid > 0 preserves the pre-UX-02 behavior (a site forum on the
        // frontpage, courseid=1, never triggered this).
        if ($courseid > 0 && strpos($PAGE->pagetype, 'mod-forum') === 0) {
            $PAGE->requires->js_call_amd('local_nexusai/forum-duplicate-checker', 'init', [
                [
                    'courseid' => $courseid,
                    'wwwroot'  => (string) (new \moodle_url('/'))->out(false),
                ],
            ]);
        }

        // F-10/F-11: thread summary + AI reply suggestion.
        // Only on mod-forum-discuss (discuss.php?d=X) — open discussion pages.
        if ($courseid > 0 && $PAGE->pagetype === 'mod-forum-discuss') {
            $discussionid = (int) optional_param('d', 0, PARAM_INT);
            if ($discussionid > 0) {
                $amdparams = [
                    'discussionid' => $discussionid,
                    'courseid'     => $courseid,
                ];
                $PAGE->requires->js_call_amd('local_nexusai/forum-thread-summarizer', 'init', [$amdparams]);
                $PAGE->requires->js_call_amd('local_nexusai/forum-reply-suggester', 'init', [$amdparams]);
            }
        }

        // 3. Inject the container where React mounts the component.
        // The new system uses $hook->add_html() instead of returning a string.
        $hook->add_html('<div id="local-nexusai-container" data-plugin="nexusai"></div>');
    }
}
