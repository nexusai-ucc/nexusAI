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
 * Tests for backend_client::interface_language().
 *
 * The backend words some fixed messages (no indexed material, reindex errors) in the
 * language of the interface, and only knows "es" and "en".
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\external\backend_client;

/**
 * Tests for backend_client::interface_language().
 *
 * @covers \local_nexusai\external\backend_client::interface_language
 */
final class backend_client_language_test extends \advanced_testcase {
    /**
     * Data provider: Moodle language code and the language sent to the backend.
     *
     * @return array
     */
    public static function language_provider(): array {
        return [
            'spanish' => ['es', 'es'],
            'spanish argentina' => ['es_ar', 'es'],
            'spanish mexico' => ['es_mx', 'es'],
            'english' => ['en', 'en'],
            'english us' => ['en_us', 'en'],
            'upper case' => ['ES', 'es'],
            'unsupported language falls back to english' => ['fr', 'en'],
            'empty falls back to english' => ['', 'en'],
        ];
    }

    /**
     * The Moodle language code is reduced to "es" or "en".
     *
     * @dataProvider language_provider
     * @param string $current Moodle language code.
     * @param string $expected Language sent to the backend.
     */
    public function test_interface_language_maps_moodle_codes(string $current, string $expected): void {
        $this->assertSame($expected, backend_client::interface_language($current));
    }

    /**
     * Without an argument it uses the language of the current user.
     */
    public function test_interface_language_defaults_to_the_current_language(): void {
        $this->resetAfterTest();

        $this->assertSame('en', backend_client::interface_language());
    }
}
