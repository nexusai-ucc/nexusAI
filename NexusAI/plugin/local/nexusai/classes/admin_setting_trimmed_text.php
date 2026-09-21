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
 * Text setting that strips leading and trailing whitespace when it is saved.
 *
 * A value pasted with a stray space (very easy with a URL, an API key or a
 * secret) is stored as typed by the stock Moodle settings, and the backend then
 * rejects the request with no hint about why.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/adminlib.php');

/**
 * Plain text admin setting that trims its value on save.
 */
class admin_setting_trimmed_text extends \admin_setting_configtext {
    /**
     * Saves the value without surrounding whitespace.
     *
     * @param mixed $data Submitted value.
     * @return string Empty string on success, an error message otherwise.
     */
    public function write_setting($data) {
        return parent::write_setting(is_string($data) ? trim($data) : $data);
    }
}
