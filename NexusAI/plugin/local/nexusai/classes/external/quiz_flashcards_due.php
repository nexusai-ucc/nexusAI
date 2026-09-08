<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_quiz_flashcards_due`.
 *
 * SP-11 (#315): flashcards ya generadas que "tocan hoy" según repetición
 * espaciada (SM-2), más vencidas primero. No llama al LLM — sirve del
 * banco ya persistido por `local_nexusai_quiz_generate`. Mismo shape de
 * pregunta que `quiz_generate` para poder renderizarse con el mismo
 * componente de flashcards del lado de React.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class quiz_flashcards_due extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'topic'    => new \external_value(PARAM_TEXT, 'Tema (opcional)', VALUE_DEFAULT, ''),
            'limit'    => new \external_value(PARAM_INT, 'Cantidad máxima (1..50)', VALUE_DEFAULT, 10),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'course_id' => new \external_value(PARAM_INT, 'ID del curso'),
            'questions' => new \external_multiple_structure(
                new \external_single_structure([
                    'id'                  => new \external_value(PARAM_ALPHANUMEXT, 'ID de la flashcard (UUID)', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'question_type'       => new \external_value(PARAM_ALPHANUMEXT, 'Tipo de pregunta'),
                    'question'            => new \external_value(PARAM_RAW,  'Frente de la tarjeta'),
                    'options'             => new \external_multiple_structure(
                        new \external_value(PARAM_RAW, 'Opción')
                    ),
                    'correct_index'       => new \external_value(PARAM_INT,  'Siempre -1 para flashcards'),
                    'explanation'         => new \external_value(PARAM_RAW,  'Dorso de la tarjeta'),
                    'source_filename'     => new \external_value(PARAM_TEXT, 'Archivo fuente'),
                    'source_document_id'  => new \external_value(PARAM_ALPHANUMEXT, 'ID del documento fuente', VALUE_OPTIONAL, null, NULL_ALLOWED),
                ])
            ),
        ]);
    }

    public static function execute(int $courseid, string $topic = '', int $limit = 10): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'topic'    => $topic,
            'limit'    => $limit,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $lim = max(1, min(50, (int) $params['limit']));

        $client   = new backend_client();
        $response = $client->flashcards_due(
            (int) $params['courseid'],
            (int) $USER->id,
            trim($params['topic']) === '' ? null : trim($params['topic']),
            $lim
        );

        $questions = is_array($response['questions'] ?? null) ? $response['questions'] : [];

        return [
            'course_id' => (int) ($response['course_id'] ?? $params['courseid']),
            'questions' => array_map(
                static function (array $q): array {
                    $opts = $q['options'] ?? [];
                    return [
                        'id'                  => isset($q['id']) ? (string) $q['id'] : null,
                        'question_type'       => (string) ($q['question_type'] ?? 'flashcard'),
                        'question'            => (string) ($q['question'] ?? ''),
                        'options'             => array_map(static fn($o) => (string) $o, is_array($opts) ? $opts : []),
                        'correct_index'       => (int) ($q['correct_index'] ?? -1),
                        'explanation'         => (string) ($q['explanation'] ?? ''),
                        'source_filename'     => (string) ($q['source_filename'] ?? ''),
                        'source_document_id'  => isset($q['source_document_id']) ? (string) $q['source_document_id'] : null,
                    ];
                },
                $questions
            ),
        ];
    }
}
