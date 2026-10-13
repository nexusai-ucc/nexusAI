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
 * Tests for the pseudonyms of forum authors sent to the backend.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\local\forum_author_alias;

/**
 * Each author of a thread gets a stable pseudonym, numbered in order of appearance.
 *
 * @covers \local_nexusai\local\forum_author_alias
 */
final class forum_author_alias_test extends \basic_testcase {
    /**
     * The same user keeps the same pseudonym; a new user gets the next number.
     */
    public function test_pseudonyms_are_stable_and_numbered_by_appearance(): void {
        $aliases = new forum_author_alias();

        $this->assertSame('Participant 1', $aliases->for_user(42));
        $this->assertSame('Participant 2', $aliases->for_user(7));
        $this->assertSame('Participant 1', $aliases->for_user(42));
        $this->assertSame('Participant 3', $aliases->for_user(1000));
    }

    /**
     * Each thread numbers its authors from 1, independently of other threads.
     */
    public function test_each_thread_starts_from_one(): void {
        $first = new forum_author_alias();
        $first->for_user(42);
        $first->for_user(7);

        $second = new forum_author_alias();
        $this->assertSame('Participant 1', $second->for_user(7));
    }
}
