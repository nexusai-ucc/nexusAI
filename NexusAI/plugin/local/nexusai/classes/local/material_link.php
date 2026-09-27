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
 * Where to open the material behind a document NexusAI cites (VIS-05).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

use local_nexusai\external\backend_client;

/**
 * Resolves a document to the URL of its activity, if the current user may open it.
 */
class material_link {
    /**
     * URL of the activity a document comes from.
     *
     * @param int $courseid Course id the caller says the document belongs to.
     * @param string $documentid Document UUID.
     * @param backend_client|null $client Backend client (a test double, or null for the real one).
     * @return \moodle_url|false|null The activity URL; false when the activity exists but the user
     *         cannot see it; null when the document is unknown, from another course or has no activity.
     */
    public static function url_for_document(int $courseid, string $documentid, ?backend_client $client = null) {
        try {
            $document = ($client ?? new backend_client())->get_document($documentid);
        } catch (\Throwable $e) {
            return null;
        }
        if ((int) ($document['course_id'] ?? 0) !== $courseid || empty($document['cmid'])) {
            return null;
        }
        return self::url_for_cmid($courseid, (int) $document['cmid']);
    }

    /**
     * URL of a "File" activity, if the current user can see it.
     *
     * Moodle decides: the eye icon, a hidden section, availability restrictions and
     * the user's role all count (`cm_info::uservisible`).
     *
     * @param int $courseid Course id.
     * @param int $cmid Course module id.
     * @return \moodle_url|false|null The URL; false if the user cannot see it; null if it does not
     *         exist in the course or is not a File activity.
     */
    public static function url_for_cmid(int $courseid, int $cmid) {
        $cm = get_fast_modinfo($courseid)->cms[$cmid] ?? null;
        if ($cm === null || $cm->modname !== 'resource' || !empty($cm->deletioninprogress)) {
            return null;
        }
        if (!$cm->uservisible) {
            return false;
        }
        return new \moodle_url('/mod/resource/view.php', ['id' => $cmid]);
    }
}
