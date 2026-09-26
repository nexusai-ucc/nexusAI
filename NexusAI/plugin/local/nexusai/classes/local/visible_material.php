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
 * Course material the current user is allowed to see (VIS-02).
 *
 * The backend answers only with documents that come from an activity the
 * user can see. It cannot work that out by itself: visibility in Moodle
 * depends on the activity's eye icon, its section, availability restrictions
 * (date, group, grade, completion) and the user's capabilities, and it is
 * different for each person. So this class asks Moodle, for the logged-in
 * user, and the result travels to the backend inside the signed request body
 * as `visible_cmids`. It is computed here, on the server, on every request:
 * it never comes from the browser.
 *
 * `cm_info::uservisible` already accounts for all of the above. Teachers see
 * hidden activities through `moodle/course:viewhiddenactivities`, and a
 * teacher who switches role to student sees what a student sees, because
 * capability checks follow the session's role switch.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Computes the activity ids (cmid) visible to the current user.
 */
class visible_material {
    /** @var int Upper bound the backend accepts (app/shared/visibility.py). */
    const MAX_CMIDS = 5000;

    /**
     * Activity ids the current user can see in one course.
     *
     * @param int $courseid Course id.
     * @return int[] Sorted, unique. Empty when nothing is visible.
     */
    public static function for_course(int $courseid): array {
        return self::for_courses([$courseid]);
    }

    /**
     * Activity ids the current user can see across several courses.
     *
     * Activity ids are unique site-wide, so one flat list is enough even for
     * the multi-course chat.
     *
     * @param int[] $courseids Course ids.
     * @return int[] Sorted, unique. Empty when nothing is visible.
     */
    public static function for_courses(array $courseids): array {
        $cmids = [];
        foreach (array_unique(array_map('intval', $courseids)) as $courseid) {
            if ($courseid <= SITEID) {
                continue;
            }
            foreach (get_fast_modinfo($courseid)->get_cms() as $cm) {
                if ($cm->uservisible && empty($cm->deletioninprogress)) {
                    $cmids[] = (int) $cm->id;
                }
            }
        }
        $cmids = array_values(array_unique($cmids));
        sort($cmids);
        return array_slice($cmids, 0, self::MAX_CMIDS);
    }

    /**
     * Adds `visible_cmids` to a JSON request body bound for the backend.
     *
     * The courses come from the body itself (`course_ids`, or `course_id`),
     * so a caller cannot ask about one course and get material of another.
     * Any `visible_cmids` already in the body is overwritten.
     *
     * @param string $body JSON body.
     * @return string JSON body with `visible_cmids`, ready to be signed.
     * @throws \moodle_exception If the body is not a JSON object.
     */
    public static function add_to_body(string $body): string {
        $payload = json_decode($body, true);
        if (!is_array($payload)) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'Invalid request body');
        }
        $courseids = !empty($payload['course_ids']) && is_array($payload['course_ids'])
            ? $payload['course_ids']
            : [$payload['course_id'] ?? 0];
        $payload['visible_cmids'] = self::for_courses($courseids);

        $newbody = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($newbody === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $newbody;
    }
}
