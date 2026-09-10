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
 * External function `local_nexusai_privacy_delete`.
 *
 * Borra el historial personal del alumno (mensajes, errores de quiz) en un
 * curso. Los intentos de quiz se anonimizan, no se borran — ver docstring
 * de app/privacy/router.py en el backend (PRIV-01, issue #310).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Borra el historial personal del alumno (mensajes, errores de quiz) en un curso.
 */
class privacy_delete extends \external_api {
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
            'messages_deleted'         => new \external_value(PARAM_INT, 'Mensajes de chat borrados'),
            'quiz_errors_deleted'      => new \external_value(PARAM_INT, 'Errores de quiz borrados'),
            'quiz_attempts_anonymized' => new \external_value(PARAM_INT, 'Intentos de quiz anonimizados (no borrados, ver docstring del backend)'),
        ]);
    }

    /**
     * Borra el historial personal del alumno (mensajes, errores de quiz) en un curso.
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

        $client = new backend_client();
        // $USER->id real de la sesión — nunca un parámetro que el alumno
        // pueda manipular para borrar el historial de otra persona.
        return $client->privacy_delete((int) $USER->id, (int) $params['courseid']);
    }
}
