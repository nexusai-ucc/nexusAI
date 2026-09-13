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
 * External function `local_nexusai_quiz_flashcards_summary`.
 *
 * SP-11 (#315): cuántas flashcards ya generadas hasta ahora "tocan hoy"
 * (repetición espaciada SM-2) vs. el total generado — para el banner del
 * Modo Estudio antes de empezar a practicar.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * SP-11 (#315): cuántas flashcards ya generadas hasta ahora "tocan hoy" (repetición espaciada SM-2) vs.
 */
class quiz_flashcards_summary extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'topic'    => new \external_value(PARAM_TEXT, 'Tema (opcional)', VALUE_DEFAULT, ''),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'duecount'   => new \external_value(PARAM_INT, 'Flashcards que tocan hoy'),
            'totalcount' => new \external_value(PARAM_INT, 'Total de flashcards generadas'),
        ]);
    }

    /**
     * SP-11 (#315): cuántas flashcards ya generadas hasta ahora "tocan hoy" (repetición espaciada SM-2) vs.
     *
     * @param int $courseid ID del curso
     * @param string $topic Tema (opcional)
     * @return array
     */
    public static function execute(int $courseid, string $topic = ''): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'topic'    => $topic,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $client   = new backend_client();
        $response = $client->flashcards_summary(
            (int) $params['courseid'],
            (int) $USER->id,
            trim($params['topic']) === '' ? null : trim($params['topic'])
        );

        return [
            'duecount'   => (int) ($response['due_count'] ?? 0),
            'totalcount' => (int) ($response['total_count'] ?? 0),
        ];
    }
}
