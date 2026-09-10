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
 * External function `local_nexusai_onboarding_state_get` (ONB-05 / #428).
 *
 * Lee, para el usuario actual y un curso puntual, si el tutorial de
 * onboarding fue cerrado (`dismissed`) y qué pasos opcionales se marcaron
 * "no aplica" (`skipped`). Se persiste en `user_preferences` de **core**
 * (`set_user_preference()`/`get_user_preferences()`), no en una tabla propia
 * del plugin — por eso no cambia la declaración de Privacy (`null_provider`,
 * ver ADR-006 y ADR-010 sección 5).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class onboarding_state_get extends \external_api {
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'courseid'  => new \external_value(PARAM_INT, 'ID del curso consultado'),
            'dismissed' => new \external_value(PARAM_BOOL, 'El docente cerró el tutorial para este curso'),
            'skipped'   => new \external_multiple_structure(
                new \external_value(PARAM_ALPHANUMEXT, 'Key del paso marcado "no aplica"')
            ),
        ]);
    }

    public static function execute(int $courseid): array {
        $params = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        return self::read_state($params['courseid']);
    }

    /**
     * Separado de execute() para poder testearlo sin pasar por validate_context().
     *
     * @param int $courseid
     * @return array{courseid:int, dismissed:bool, skipped:string[]}
     */
    public static function read_state(int $courseid): array {
        $dismissed = get_user_preferences('local_nexusai_onb_dismissed_' . $courseid, '0') === '1';

        $skippedraw = get_user_preferences('local_nexusai_onb_skipped_' . $courseid, '[]');
        $skipped = json_decode($skippedraw, true);
        if (!is_array($skipped)) {
            $skipped = [];
        }

        return [
            'courseid'  => $courseid,
            'dismissed' => $dismissed,
            'skipped'   => array_values(array_map('strval', $skipped)),
        ];
    }
}
