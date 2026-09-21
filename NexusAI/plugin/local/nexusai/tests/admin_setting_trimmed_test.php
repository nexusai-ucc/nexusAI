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
 * Tests for the admin settings that trim whitespace on save.
 *
 * A value pasted with a stray space (URL, API key, shared secret) used to be stored
 * as typed, which made the request signature fail while the admin panel still
 * reported the backend as reachable.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

/**
 * Tests for admin_setting_trimmed_text and admin_setting_trimmed_password.
 *
 * @covers \local_nexusai\admin_setting_trimmed_text
 * @covers \local_nexusai\admin_setting_trimmed_password
 */
final class admin_setting_trimmed_test extends \advanced_testcase {
    /**
     * The URL is saved without surrounding whitespace.
     */
    public function test_text_setting_trims_on_save(): void {
        $this->resetAfterTest();
        $setting = new admin_setting_trimmed_text('local_nexusai/api_endpoint', 'Endpoint', 'Description', '');

        $error = $setting->write_setting("  https://api.example.org/ \n");

        $this->assertSame('', $error);
        $this->assertSame('https://api.example.org/', get_config('local_nexusai', 'api_endpoint'));
    }

    /**
     * The API key and the shared secret are saved without surrounding whitespace.
     */
    public function test_password_setting_trims_on_save(): void {
        $this->resetAfterTest();
        $setting = new admin_setting_trimmed_password('local_nexusai/api_key', 'API key', 'Description', '');

        $error = $setting->write_setting(" \t0123456789abcdef  ");

        $this->assertSame('', $error);
        $this->assertSame('0123456789abcdef', get_config('local_nexusai', 'api_key'));
    }

    /**
     * Whitespace inside the value is not touched.
     */
    public function test_inner_whitespace_is_kept(): void {
        $this->resetAfterTest();
        $setting = new admin_setting_trimmed_password('local_nexusai/shared_secret', 'Secret', 'Description', '');

        $setting->write_setting(' abc def ');

        $this->assertSame('abc def', get_config('local_nexusai', 'shared_secret'));
    }
}
