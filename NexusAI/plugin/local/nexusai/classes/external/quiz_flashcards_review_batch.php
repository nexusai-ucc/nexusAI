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
 * External function `local_nexusai_quiz_flashcards_review_batch`.
 *
 * SP-11 (#315): aplica repetición espaciada (SM-2) sobre el resultado de
 * autoevaluación de una sesión de flashcards. Se llama una sola vez al
 * final de la sesión (mismo patrón que quiz_attempt_save/quiz_errors_record),
 * no por tarjeta.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * SP-11 (#315): aplica repetición espaciada (SM-2) sobre el resultado de autoevaluación de una sesión de
 * flashcards.
 */
class quiz_flashcards_review_batch extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'reviews'  => new \external_multiple_structure(
                new \external_single_structure([
                    'flashcardid' => new \external_value(PARAM_ALPHANUMEXT, 'ID de la flashcard (UUID)', VALUE_REQUIRED),
                    'knewit'      => new \external_value(PARAM_BOOL, 'true = la sabía, false = no la sabía', VALUE_REQUIRED),
                ]),
                'Resultado de autoevaluación por flashcard'
            ),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'updated' => new \external_value(PARAM_INT, 'Cantidad de flashcards con estado actualizado'),
        ]);
    }

    /**
     * SP-11 (#315): aplica repetición espaciada (SM-2) sobre el resultado de autoevaluación de una sesión de
     * flashcards.
     *
     * @param int $courseid ID del curso
     * @param array $reviews Resultado de autoevaluación por flashcard
     * @return array
     */
    public static function execute(int $courseid, array $reviews): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'reviews'  => $reviews,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        if (empty($params['reviews'])) {
            return ['updated' => 0];
        }

        // Tope defensivo: una sesión de flashcards no debería tener más de 50.
        $cleanreviews = array_slice($params['reviews'], 0, 50);
        $cleanreviews = array_map(static fn(array $r): array => [
            'flashcard_id' => (string) $r['flashcardid'],
            'knew_it'      => (bool) $r['knewit'],
        ], $cleanreviews);

        $client   = new backend_client();
        $response = $client->flashcards_review_batch((int) $params['courseid'], (int) $USER->id, $cleanreviews);

        return [
            'updated' => (int) ($response['updated'] ?? 0),
        ];
    }
}
