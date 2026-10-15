<?php
// This file is part of Moodle - https://moodle.org/
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
 * Tests for the calendar feed token lookup.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->dirroot . '/local/nexusai/lib.php');

/**
 * Covers local_nexusai_calfeed_user_by_token().
 *
 * Since Moodle 5.0 user_preferences.value is a text column, where a plain
 * `value = ?` condition throws textconditionsnotallowed: the lookup has to work
 * on 4.5 (char column) and on 5.x (text column).
 *
 * @covers ::local_nexusai_calfeed_user_by_token
 */
final class calendar_feed_token_test extends \advanced_testcase {
    /**
     * Each token resolves to its own user.
     */
    public function test_a_token_resolves_to_its_user(): void {
        $this->resetAfterTest();
        $alice = $this->getDataGenerator()->create_user();
        $bob = $this->getDataGenerator()->create_user();

        $alicetoken = local_nexusai_calfeed_get_or_create_token((int) $alice->id);
        $bobtoken = local_nexusai_calfeed_get_or_create_token((int) $bob->id);

        $this->assertSame((int) $alice->id, local_nexusai_calfeed_user_by_token($alicetoken));
        $this->assertSame((int) $bob->id, local_nexusai_calfeed_user_by_token($bobtoken));
    }

    /**
     * Unknown, empty, partial and rotated tokens resolve to nobody.
     */
    public function test_other_tokens_resolve_to_nobody(): void {
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();
        $token = local_nexusai_calfeed_get_or_create_token((int) $user->id);

        $this->assertNull(local_nexusai_calfeed_user_by_token(''));
        $this->assertNull(local_nexusai_calfeed_user_by_token(str_repeat('x', 44)));
        $this->assertNull(local_nexusai_calfeed_user_by_token(substr($token, 0, 32)));

        // A rotated token no longer opens the feed.
        $newtoken = local_nexusai_calfeed_rotate_token((int) $user->id);
        $this->assertNull(local_nexusai_calfeed_user_by_token($token));
        $this->assertSame((int) $user->id, local_nexusai_calfeed_user_by_token($newtoken));
    }

    /**
     * Another preference with the same value is not taken for a feed token.
     */
    public function test_only_the_feed_preference_is_looked_up(): void {
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();
        $value = str_repeat('a', 44);
        set_user_preference('local_nexusai_some_other_pref', $value, $user);

        $this->assertNull(local_nexusai_calfeed_user_by_token($value));
    }
}
