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
 * Widget's shared visibility rule (UX-02).
 *
 * Before UX-02, the widget only existed within real course pages
 * ($COURSE->id > 1) — that guard lived inline in before_footer_listener.php.
 * UX-02 adds a second injection point (the primary navbar icon,
 * classes/hook/navigation/primary_extend_listener.php) that must decide
 * exactly the same thing as the footer: if the icon exists but the panel
 * container doesn't, the click does nothing. This class is the single
 * source of truth both hooks consult.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

/**
 * Single visibility rule for the NexusAI widget, shared by before_footer_listener
 * and primary_extend_listener so there's never a clickable icon without a panel behind it.
 */
class visibility_helper {
    /**
     * Resolves whether the current user should see the widget on the current
     * page and, if inside a real course, whether they have the capability to use it.
     *
     * Rules:
     *   - Logged in and not a guest, always.
     *   - Inside a real course ($COURSE->id > 1): also requires
     *     `local/nexusai:use` in that course — without it, nothing is shown
     *     (neither icon nor panel), same as before UX-02.
     *   - Outside a course (dashboard, home, admin, etc.): shown regardless,
     *     with courseid=0 — the panel enters an empty state instead of
     *     trying to use a nonexistent course.
     *
     * @return array{courseid:int, isteacher:bool}|null null if nothing should be shown.
     */
    public static function resolve(): ?array {
        global $COURSE;

        if (!isloggedin() || isguestuser()) {
            return null;
        }

        if (!empty($COURSE->id) && $COURSE->id > 1) {
            $context = \context_course::instance($COURSE->id);
            if (!has_capability('local/nexusai:use', $context)) {
                return null;
            }

            return [
                'courseid'  => (int) $COURSE->id,
                'isteacher' => has_capability('local/nexusai:manage', $context),
            ];
        }

        return [
            'courseid'  => 0,
            'isteacher' => false,
        ];
    }

    /**
     * ONB-03: detects whether the current page is **create a new course**
     * and the user can create it. In that case the widget shows the
     * course-setup tutorial instead of the "no course" placeholder.
     *
     * The create and edit screens share `$PAGE->pagetype`
     * (`course-edit`, verified against Moodle 4.1 — see ADR-010). The
     * distinction is by parameter: no `id` = create, with `id` = edit
     * (review mode, ONB-04).
     *
     * @return string|null 'create-course', 'review-course' or null.
     */
    public static function onboarding_hint(): ?string {
        global $PAGE, $COURSE;

        if ($PAGE->pagetype !== 'course-edit') {
            return null;
        }

        $editid = optional_param('id', 0, PARAM_INT);

        if ($editid > 0) {
            // ONB-04: editing an existing course. require_login($course) in
            // course/edit.php already leaves $COURSE set to the edited
            // course before the footer hook runs — the same mechanism
            // resolve() depends on for the normal widget.
            if (empty($COURSE->id) || (int) $COURSE->id !== $editid) {
                return null;
            }

            $context = \context_course::instance($COURSE->id);
            if (!has_capability('local/nexusai:manage', $context)) {
                return null;
            }

            // ONB-05: if the teacher already closed the tutorial for this
            // course, it isn't auto-shown again — it stays reachable by hand
            // from the "Course review" tab of the normal widget (ONB-06).
            // Without this, this page would fall back to the normal widget
            // (ChatApp) for that course. We reuse the same accessor as the
            // external function, instead of rebuilding the user_preferences
            // key by hand, so the two can't diverge if the dismissal storage
            // changes.
            if (\local_nexusai\external\onboarding_state_get::read_state((int) $COURSE->id)['dismissed']) {
                return null;
            }

            return 'review-course';
        }

        $categoryid = optional_param('category', 0, PARAM_INT);
        try {
            $catcontext = $categoryid > 0
                ? \context_coursecat::instance($categoryid, IGNORE_MISSING)
                : \context_system::instance();
        } catch (\Throwable $e) {
            $catcontext = \context_system::instance();
        }

        if ($catcontext && has_capability('moodle/course:create', $catcontext)) {
            return 'create-course';
        }

        return null;
    }
}
