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
 * Pseudonyms for the authors of forum posts sent to the backend.
 *
 * The backend only uses the author as a label in the prompt, to tell posts of
 * different people apart, so names never need to leave Moodle: each author of a
 * thread becomes "Participant 1", "Participant 2"… in order of appearance.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Gives each author of one thread a stable pseudonym.
 */
class forum_author_alias {
    /** @var array<int, string> Pseudonym by user id. */
    private array $aliases = [];

    /**
     * The author's pseudonym in this thread; the same user always gets the same one.
     *
     * @param int $userid Author of the post.
     * @return string
     */
    public function for_user(int $userid): string {
        if (!isset($this->aliases[$userid])) {
            $this->aliases[$userid] = 'Participant ' . (count($this->aliases) + 1);
        }
        return $this->aliases[$userid];
    }
}
