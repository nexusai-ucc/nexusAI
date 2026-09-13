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
 * External function `local_nexusai_forum_webhook_save`.
 *
 * Guarda (o borra, con url = '') la URL de webhook Slack/Discord/Teams del
 * curso para el digest semanal del foro (FOR-07, #378). La URL vive en el
 * backend Python — el plugin no tiene tabla de configuración por-curso
 * propia (ver forum_weekly_digest.php).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Guarda (o borra, con url = '') la URL de webhook Slack/Discord/Teams del curso para el digest semanal del
 * foro (FOR-07, #378).
 */
class forum_webhook_save extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'   => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'webhookurl' => new \external_value(PARAM_URL, 'URL del webhook (vacío para borrar)', VALUE_DEFAULT, ''),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'webhook_url' => new \external_value(PARAM_URL, 'URL guardada', VALUE_OPTIONAL, null, NULL_ALLOWED),
        ]);
    }

    /**
     * Guarda (o borra, con url = '') la URL de webhook Slack/Discord/Teams del curso para el digest semanal
     * del foro (FOR-07, #378).
     *
     * @param int $courseid ID del curso
     * @param string $webhookurl URL del webhook (vacío para borrar)
     * @return array
     */
    public static function execute(int $courseid, string $webhookurl = ''): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'   => $courseid,
            'webhookurl' => $webhookurl,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        $client = new backend_client();
        $response = $client->save_forum_webhook($params['courseid'], $params['webhookurl']);

        return [
            'webhook_url' => $response['webhook_url'] ?? null,
        ];
    }
}
