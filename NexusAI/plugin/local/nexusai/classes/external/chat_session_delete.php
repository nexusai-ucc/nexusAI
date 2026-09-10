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
 * External function `local_nexusai_chat_session_delete`.
 *
 * Borra una sesión de chat puntual del alumno (ASIST-02, #350). El backend
 * valida ownership de la sesión contra el user_id real de Moodle antes de
 * borrar — el user_id nunca se acepta como parámetro del cliente.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class chat_session_delete extends \external_api {
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'  => new \external_value(PARAM_INT, 'Curso (para capability check)', VALUE_REQUIRED),
            'sessionid' => new \external_value(PARAM_ALPHANUMEXT, 'UUID de sesión a borrar', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'success' => new \external_value(PARAM_BOOL, 'true si se borró correctamente'),
        ]);
    }

    public static function execute(int $courseid, string $sessionid): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'  => $courseid,
            'sessionid' => $sessionid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $cleansessionid = trim($params['sessionid']);
        if ($cleansessionid === '' || strlen($cleansessionid) < 8 || strlen($cleansessionid) > 64) {
            throw new \invalid_parameter_exception('Invalid session id');
        }

        $client   = new backend_client();
        $response = $client->delete_chat_session((int) $USER->id, $cleansessionid);

        return [
            'success' => (bool) ($response['success'] ?? false),
        ];
    }
}
