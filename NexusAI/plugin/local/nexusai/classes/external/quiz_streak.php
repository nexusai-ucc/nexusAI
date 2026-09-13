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
 * External function `local_nexusai_quiz_streak`.
 *
 * SP-16 (#354): racha de días consecutivos de actividad del alumno en el
 * curso (intentos de quiz o preguntas al chat), derivada de datos ya
 * persistidos en el backend — sin tabla ni migración nueva.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * SP-16 (#354): racha de días consecutivos de actividad del alumno en el curso (intentos de quiz o preguntas
 * al chat), derivada de datos ya persistidos en el backend — sin tabla ni migración nueva.
 */
class quiz_streak extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'currentstreak'  => new \external_value(PARAM_INT, 'Días consecutivos de actividad'),
            'practicedtoday' => new \external_value(PARAM_BOOL, 'true si ya hubo actividad hoy'),
        ]);
    }

    /**
     * SP-16 (#354): racha de días consecutivos de actividad del alumno en el curso (intentos de quiz o
     * preguntas al chat), derivada de datos ya persistidos en el backend — sin tabla ni migración nueva.
     *
     * @param int $courseid ID del curso
     * @return array
     */
    public static function execute(int $courseid): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $client   = new backend_client();
        $response = $client->get_streak((int) $params['courseid'], (int) $USER->id);

        return [
            'currentstreak'  => (int) ($response['current_streak'] ?? 0),
            'practicedtoday' => (bool) ($response['practiced_today'] ?? false),
        ];
    }
}
