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
 * Small helpers shared by the stores that keep student data in Moodle (DATA-05).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Ids and dates in the format the frontend already expects from the backend.
 */
class store_util {
    /**
     * A new public id for a row: the web services and React keep using UUIDs.
     *
     * @return string
     */
    public static function uuid(): string {
        return \core\uuid::generate();
    }

    /**
     * A timestamp as an ISO 8601 date in UTC, like the backend returned it.
     *
     * @param int|null $time Unix time.
     * @return string|null
     */
    public static function iso(?int $time): ?string {
        return $time === null ? null : gmdate('Y-m-d\TH:i:s+00:00', $time);
    }

    /**
     * Normalised text used to group repeated questions: trimmed and lower case.
     *
     * @param string $text Text.
     * @return string
     */
    public static function normalise(string $text): string {
        return \core_text::strtolower(trim($text));
    }

    /**
     * Hash of a normalised question, to group and index repeated questions.
     *
     * @param string $text Text.
     * @return string 40 hex characters.
     */
    public static function question_hash(string $text): string {
        return sha1(self::normalise($text));
    }
}
