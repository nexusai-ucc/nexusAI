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
 * Event: NexusAI was turned on or off for a course.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\event;

/**
 * Logged when a teacher or admin changes whether a course uses NexusAI.
 *
 * @property-read array $other {
 *      - int enabled: 1 when turned on, 0 when turned off.
 * }
 */
class course_settings_updated extends \core\event\base {
    /**
     * Init method.
     *
     * @return void
     */
    protected function init() {
        $this->data['crud'] = 'u';
        $this->data['edulevel'] = self::LEVEL_TEACHING;
    }

    /**
     * Localised event name.
     *
     * @return string
     */
    public static function get_name() {
        return get_string('event_course_settings_updated', 'local_nexusai');
    }

    /**
     * Description for the logs.
     *
     * @return string
     */
    public function get_description() {
        $state = empty($this->other['enabled']) ? 'off' : 'on';
        return "The user with id '{$this->userid}' turned NexusAI {$state} for the course with id '{$this->courseid}'.";
    }

    /**
     * Link to the course settings page.
     *
     * @return \moodle_url
     */
    public function get_url() {
        return new \moodle_url('/local/nexusai/course_settings.php', ['courseid' => $this->courseid]);
    }

    /**
     * Validates the custom data.
     *
     * @return void
     * @throws \coding_exception
     */
    protected function validate_data() {
        parent::validate_data();
        if (!isset($this->other['enabled'])) {
            throw new \coding_exception('The \'enabled\' value must be set in other.');
        }
        if ($this->contextlevel != CONTEXT_COURSE) {
            throw new \coding_exception('Context level must be CONTEXT_COURSE.');
        }
    }
}
