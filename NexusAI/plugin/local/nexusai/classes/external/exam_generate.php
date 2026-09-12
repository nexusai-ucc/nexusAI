<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_exam_generate`.
 *
 * Proxy entre React y el endpoint /api/v1/quiz/generate-exam del backend Python.
 * Genera un banco de preguntas de examen a partir de archivos elegidos por el
 * docente (EVAL-01, issue #235 / DOC-D04). A diferencia de `quiz_generate`
 * (alumno), este requiere la capability `local/nexusai:manage`.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class exam_generate extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'     => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'documentids'  => new \external_multiple_structure(
                new \external_value(PARAM_ALPHANUMEXT, 'UUID del documento fuente'),
                'Archivos del curso de los que sacar las preguntas (al menos 1)'
            ),
            'topic'        => new \external_value(PARAM_RAW, 'Tema opcional', VALUE_OPTIONAL, ''),
            'numquestions' => new \external_value(PARAM_INT, 'Cantidad de preguntas (1..20)', VALUE_OPTIONAL, 10),
            'questiontype' => new \external_value(PARAM_ALPHANUMEXT, 'Tipo de pregunta (multiple_choice|true_false|open|mix)', VALUE_OPTIONAL, 'multiple_choice'),
            'difficulty'   => new \external_value(PARAM_ALPHA, 'Dificultad (easy|medium|hard)', VALUE_OPTIONAL, 'medium'),
            // DOC-D09 (#390): temas con dificultad detectada (Gaps/FAQ) que el
            // docente eligió priorizar como contexto extra de generación.
            'topics'       => new \external_multiple_structure(
                new \external_single_structure([
                    'label'  => new \external_value(PARAM_TEXT, 'Texto del tema (gap o FAQ)'),
                    'source' => new \external_value(PARAM_ALPHA, 'Origen del tema: gap|faq'),
                ]),
                'Temas con dificultad detectada a priorizar (máx 15)',
                VALUE_OPTIONAL,
                []
            ),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'course_id' => new \external_value(PARAM_INT, 'ID del curso'),
            'topic'     => new \external_value(PARAM_RAW, 'Tema solicitado', VALUE_OPTIONAL, null, NULL_ALLOWED),
            'questions' => new \external_multiple_structure(
                new \external_single_structure([
                    'question_type'      => new \external_value(PARAM_ALPHANUMEXT, 'Tipo de pregunta'),
                    'question'           => new \external_value(PARAM_RAW,  'Texto de la pregunta'),
                    'options'            => new \external_multiple_structure(
                        new \external_value(PARAM_RAW, 'Opción')
                    ),
                    'correct_index'      => new \external_value(PARAM_INT,  'Índice de la opción correcta (-1..3)'),
                    'explanation'        => new \external_value(PARAM_RAW,  'Explicación / respuesta modelo'),
                    'source_filename'    => new \external_value(PARAM_TEXT, 'Archivo del que sale la pregunta'),
                    'source_document_id' => new \external_value(PARAM_ALPHANUMEXT, 'ID del documento fuente (UUID)', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'source_topic'       => new \external_value(PARAM_TEXT, 'Tema de dificultad detectada del que sale la pregunta (DOC-D09)', VALUE_OPTIONAL, null, NULL_ALLOWED),
                ])
            ),
        ]);
    }

    public static function execute(
        int $courseid,
        array $documentids,
        string $topic = '',
        int $numquestions = 10,
        string $questiontype = 'multiple_choice',
        string $difficulty = 'medium',
        array $topics = []
    ): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'     => $courseid,
            'documentids'  => $documentids,
            'topic'        => $topic,
            'numquestions' => $numquestions,
            'questiontype' => $questiontype,
            'difficulty'   => $difficulty,
            'topics'       => $topics,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        // Solo docentes/admins — a diferencia del quiz de práctica (local/nexusai:use),
        // el generador de exámenes usa la misma capability que gatea el resto del
        // dashboard docente (documents.php).
        require_capability('local/nexusai:manage', $context);

        if (empty($params['documentids'])) {
            throw new \invalid_parameter_exception('At least one document must be selected');
        }

        $cleantopic = trim((string) $params['topic']);
        if (mb_strlen($cleantopic) > 200) {
            throw new \invalid_parameter_exception('Topic too long (max 200 chars)');
        }
        $numq = max(1, min(20, (int) $params['numquestions']));

        $allowed_types = ['multiple_choice', 'true_false', 'open', 'mix'];
        $qtype = in_array($params['questiontype'], $allowed_types, true) ? $params['questiontype'] : 'multiple_choice';

        $allowed_difficulties = ['easy', 'medium', 'hard'];
        $difficulty = in_array($params['difficulty'], $allowed_difficulties, true) ? $params['difficulty'] : 'medium';

        // DOC-D09 (#390): sanitizar la lista de temas — origen restringido a
        // gap|faq, label recortado, y se ignora cualquier fila vacía.
        $allowed_topic_sources = ['gap', 'faq'];
        $focustopics = [];
        foreach (array_slice($params['topics'], 0, 15) as $t) {
            $label = trim((string) ($t['label'] ?? ''));
            if ($label === '') {
                continue;
            }
            $source = in_array($t['source'] ?? '', $allowed_topic_sources, true) ? $t['source'] : 'gap';
            $focustopics[] = ['label' => mb_substr($label, 0, 200), 'source' => $source];
        }

        $client   = new backend_client();
        $response = $client->generate_exam(
            (int) $params['courseid'],
            (int) $USER->id,
            array_map('strval', $params['documentids']),
            $cleantopic !== '' ? $cleantopic : null,
            $numq,
            $qtype,
            $difficulty,
            $focustopics
        );

        if (!isset($response['questions']) || !is_array($response['questions'])) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'Invalid exam response');
        }

        return [
            'course_id' => (int) ($response['course_id'] ?? $params['courseid']),
            'topic'     => isset($response['topic']) ? (string) $response['topic'] : null,
            'questions' => array_map(
                static function (array $q): array {
                    $opts = $q['options'] ?? [];
                    return [
                        'question_type'      => (string) ($q['question_type'] ?? 'multiple_choice'),
                        'question'           => (string) ($q['question'] ?? ''),
                        'options'            => array_map(static fn($o) => (string) $o, is_array($opts) ? $opts : []),
                        'correct_index'      => (int) ($q['correct_index'] ?? -1),
                        'explanation'        => (string) ($q['explanation'] ?? ''),
                        'source_filename'    => (string) ($q['source_filename'] ?? ''),
                        'source_document_id' => isset($q['source_document_id']) ? (string) $q['source_document_id'] : null,
                        'source_topic'       => isset($q['source_topic']) && $q['source_topic'] !== '' ? (string) $q['source_topic'] : null,
                    ];
                },
                $response['questions']
            ),
        ];
    }
}
