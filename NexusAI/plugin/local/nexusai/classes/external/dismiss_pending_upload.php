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
 * External function `local_nexusai_dismiss_pending_upload`.
 *
 * El docente eligió NO indexar el archivo en NexusAI.
 * Solo elimina la entrada de la user preference sin enviar nada al backend.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class dismiss_pending_upload extends \external_api {
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'cmid' => new \external_value(PARAM_INT, 'Course module ID del recurso a descartar', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'success' => new \external_value(PARAM_BOOL, 'Siempre true'),
        ]);
    }

    public static function execute(int $cmid): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'cmid' => $cmid,
        ]);

        // No necesitamos validar capability aquí: el peor caso es que alguien
        // borre una preference propia. Aun así, require login está garantizado
        // por loginrequired: true en services.php.
        $raw     = get_user_preferences(\local_nexusai\observer::PENDING_PREF, '{}');
        $pending = json_decode($raw, true);
        if (!is_array($pending)) {
            return ['success' => true];
        }

        unset($pending[(string) $params['cmid']]);
        set_user_preference(\local_nexusai\observer::PENDING_PREF, json_encode($pending));

        return ['success' => true];
    }
}
