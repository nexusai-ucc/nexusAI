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
 * External function `local_nexusai_privacy_export`.
 *
 * Exporta el historial personal del alumno (mensajes, intentos y errores
 * de quiz) en un curso, para que lo pueda ver/descargar (PRIV-01, issue #310).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Exporta el historial personal del alumno (mensajes, intentos y errores de quiz) en un curso, para que lo
 * pueda ver/descargar (PRIV-01, issue #310).
 */
class privacy_export extends \external_api {
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
            'user_id'   => new \external_value(PARAM_INT, '$USER->id del alumno'),
            'course_id' => new \external_value(PARAM_INT, 'ID del curso'),
            'messages' => new \external_multiple_structure(
                new \external_single_structure([
                    'session_id' => new \external_value(PARAM_RAW, 'UUID de la sesión de chat'),
                    'role'       => new \external_value(PARAM_ALPHA, 'user | assistant'),
                    'content'    => new \external_value(PARAM_RAW, 'Texto del mensaje'),
                    'created_at' => new \external_value(PARAM_RAW, 'Timestamp ISO 8601'),
                ])
            ),
            'quiz_attempts' => new \external_multiple_structure(
                new \external_single_structure([
                    'id'              => new \external_value(PARAM_RAW, 'UUID del intento'),
                    'question_type'   => new \external_value(PARAM_ALPHANUMEXT, 'Tipo de pregunta', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'difficulty'      => new \external_value(PARAM_ALPHA, 'easy | medium | hard'),
                    'topic'           => new \external_value(PARAM_RAW, 'Tema', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'total_questions' => new \external_value(PARAM_INT, 'Cantidad de preguntas'),
                    'correct_answers' => new \external_value(PARAM_INT, 'Respuestas correctas'),
                    'score'           => new \external_value(PARAM_FLOAT, 'Puntaje 0.0-1.0'),
                    'created_at'      => new \external_value(PARAM_RAW, 'Timestamp ISO 8601'),
                ])
            ),
            'quiz_errors' => new \external_multiple_structure(
                new \external_single_structure([
                    'id'            => new \external_value(PARAM_RAW, 'UUID del error'),
                    'question_type' => new \external_value(PARAM_ALPHANUMEXT, 'Tipo de pregunta'),
                    'question'      => new \external_value(PARAM_RAW, 'Enunciado'),
                    'explanation'   => new \external_value(PARAM_RAW, 'Explicación de la respuesta correcta'),
                    'user_answer'   => new \external_value(PARAM_RAW, 'Respuesta del alumno', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'ai_feedback'   => new \external_value(PARAM_RAW, 'Feedback del LLM', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'ai_score'      => new \external_value(PARAM_FLOAT, 'Score del LLM 0.0-1.0', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'created_at'    => new \external_value(PARAM_RAW, 'Timestamp ISO 8601'),
                ])
            ),
        ]);
    }

    /**
     * Exporta el historial personal del alumno (mensajes, intentos y errores de quiz) en un curso, para que
     * lo pueda ver/descargar (PRIV-01, issue #310).
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
        // Se usa el $USER->id real de la sesión — nunca un parámetro que el alumno
        // pueda manipular para pedir el historial de otra persona.
        return $client->privacy_export((int) $USER->id, (int) $params['courseid']);
    }
}
