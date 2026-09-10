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
 * External function `local_nexusai_quiz_suggest_difficulty`.
 *
 * SP-12 (#322): sugiere una dificultad de partida para el generador de quiz
 * de práctica, basada en el promedio de `score` de los últimos intentos del
 * alumno en ese tema/curso (`quiz_attempts`, ya persistido — sin tabla ni
 * migración nueva). Es una sugerencia, nunca una restricción: el alumno
 * siempre puede elegir otra dificultad a mano.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * SP-12 (#322): sugiere una dificultad de partida para el generador de quiz de práctica, basada en el
 * promedio de `score` de los últimos intentos del alumno en ese tema/curso (`quiz_attempts`, ya persistido —
 * sin tabla ni migración nueva).
 */
class quiz_suggest_difficulty extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'topic'    => new \external_value(PARAM_TEXT, 'Tema elegido por el alumno (vacío = historial general)', VALUE_DEFAULT, ''),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'difficulty'       => new \external_value(PARAM_ALPHA, 'easy | medium | hard', VALUE_OPTIONAL, null, NULL_ALLOWED),
            'reason'           => new \external_value(PARAM_TEXT, 'Motivo de la sugerencia', VALUE_OPTIONAL, null, NULL_ALLOWED),
            'basedonattempts'  => new \external_value(PARAM_INT, 'Cantidad de intentos usados para la sugerencia'),
            'accuracypct'      => new \external_value(PARAM_INT, '% de aciertos redondeado', VALUE_OPTIONAL, null, NULL_ALLOWED),
        ]);
    }

    /**
     * SP-12 (#322): sugiere una dificultad de partida para el generador de quiz de práctica, basada en el
     * promedio de `score` de los últimos intentos del alumno en ese tema/curso (`quiz_attempts`, ya
     * persistido — sin tabla ni migración nueva).
     *
     * @param int $courseid ID del curso
     * @param string $topic Tema elegido por el alumno (vacío = historial general)
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
        $response = $client->suggest_difficulty(
            (int) $params['courseid'],
            (int) $USER->id,
            trim($params['topic']) === '' ? null : trim($params['topic'])
        );

        return [
            'difficulty'      => $response['difficulty'] ?? null,
            'reason'          => $response['reason'] ?? null,
            'basedonattempts' => (int) ($response['based_on_attempts'] ?? 0),
            'accuracypct'     => isset($response['accuracy_pct']) ? (int) $response['accuracy_pct'] : null,
        ];
    }
}
