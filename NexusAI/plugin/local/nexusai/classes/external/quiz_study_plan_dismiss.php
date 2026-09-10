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
 * External function `local_nexusai_quiz_study_plan_dismiss`.
 *
 * SP-13 (#323): descarta un tema puntual del Plan de estudio del propio
 * alumno sin borrar el historial subyacente (quiz_errors/unanswered_questions
 * siguen intactos para el docente). Opera sobre los IDs reales de fila
 * (`quiz_error_ids`/`gap_question_ids`, devueltos por `quiz_study_plan`) — el
 * texto de "topic" lo genera el LLM en cada llamada, no es una clave estable.
 *
 * Mismo patrón que `gaps_archive.php`, pero:
 *   - capability `local/nexusai:use` (no `:manage`) — es la vista del propio
 *     alumno, no una herramienta docente.
 *   - `userid` siempre de `$USER->id`, nunca del cliente.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class quiz_study_plan_dismiss extends \external_api {
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'       => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'quizerrorids'   => new \external_multiple_structure(
                new \external_value(PARAM_ALPHANUMEXT, 'UUID de una fila de quiz_errors'),
                'IDs de errores de quiz a descartar',
                VALUE_DEFAULT,
                []
            ),
            'gapquestionids' => new \external_multiple_structure(
                new \external_value(PARAM_ALPHANUMEXT, 'UUID de una fila de unanswered_questions'),
                'IDs de preguntas sin responder a descartar',
                VALUE_DEFAULT,
                []
            ),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'affected' => new \external_value(PARAM_INT, 'Cantidad de filas actualizadas'),
        ]);
    }

    public static function execute(int $courseid, array $quizerrorids = [], array $gapquestionids = []): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'       => $courseid,
            'quizerrorids'   => $quizerrorids,
            'gapquestionids' => $gapquestionids,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        if (empty($params['quizerrorids']) && empty($params['gapquestionids'])) {
            throw new \invalid_parameter_exception('At least one id must be provided');
        }

        $client   = new backend_client();
        $response = $client->dismiss_study_plan_topic(
            (int) $params['courseid'],
            (int) $USER->id,
            array_map('strval', $params['quizerrorids']),
            array_map('strval', $params['gapquestionids'])
        );

        return [
            'affected' => (int) ($response['affected'] ?? 0),
        ];
    }
}
