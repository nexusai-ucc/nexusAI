<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_search_query`.
 *
 * Proxy entre React y el endpoint /api/v1/search del backend Python.
 * Devuelve fragmentos del material del curso relevantes a la consulta,
 * sin pasar por el LLM (retrieval puro).
 *
 * Modo global (global=true): busca en TODOS los cursos donde el alumno
 * tiene la capability local/nexusai:use, no solo en el curso actual.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class search_query extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'query'    => new \external_value(PARAM_RAW, 'Consulta de búsqueda', VALUE_REQUIRED),
            'courseid' => new \external_value(PARAM_INT, 'ID del curso actual', VALUE_REQUIRED),
            'topk'     => new \external_value(PARAM_INT, 'Cantidad de resultados (1..10)', VALUE_OPTIONAL, 5),
            'global'   => new \external_value(PARAM_BOOL, 'Buscar en todos los cursos del usuario', VALUE_OPTIONAL, false),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'query'   => new \external_value(PARAM_RAW, 'Consulta original'),
            'total'   => new \external_value(PARAM_INT, 'Total de resultados'),
            'results' => new \external_multiple_structure(
                new \external_single_structure([
                    'document_id'       => new \external_value(PARAM_RAW, 'UUID del documento', VALUE_OPTIONAL, ''),
                    'document_filename' => new \external_value(PARAM_TEXT, 'Nombre del archivo'),
                    'course_id'         => new \external_value(PARAM_INT, 'ID del curso fuente', VALUE_OPTIONAL, 0),
                    'course_name'       => new \external_value(PARAM_TEXT, 'Nombre del curso (solo en modo global)', VALUE_OPTIONAL, ''),
                    'chunk_index'       => new \external_value(PARAM_INT, 'Índice del fragmento'),
                    'content'           => new \external_value(PARAM_RAW, 'Texto del fragmento'),
                    'similarity'        => new \external_value(PARAM_FLOAT, 'Score de similitud 0-1'),
                    'has_file'          => new \external_value(PARAM_BOOL, 'El archivo original está disponible para descarga', VALUE_OPTIONAL, false),
                ])
            ),
        ]);
    }

    public static function execute(string $query, int $courseid, int $topk = 5, bool $global = false): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'query'    => $query,
            'courseid' => $courseid,
            'topk'     => $topk,
            'global'   => $global,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $cleanquery = trim($params['query']);
        if ($cleanquery === '') {
            throw new \invalid_parameter_exception('Query cannot be empty');
        }
        if (mb_strlen($cleanquery) > 500) {
            throw new \invalid_parameter_exception('Query too long (max 500 characters)');
        }

        $topk = max(1, min(10, (int) $params['topk']));

        // Build the list of course IDs and a name map for the response.
        $courseids  = [(int) $params['courseid']];
        $coursenames = [(int) $params['courseid'] => ''];

        if (!empty($params['global'])) {
            $enrolled = enrol_get_users_courses($USER->id, true, 'id,fullname');
            $allowedids   = [];
            $allowednames = [];
            foreach ($enrolled as $c) {
                $ctx = \context_course::instance($c->id);
                if (has_capability('local/nexusai:use', $ctx)) {
                    $allowedids[]              = (int) $c->id;
                    $allowednames[(int) $c->id] = $c->fullname;
                }
            }
            if (!empty($allowedids)) {
                $courseids   = $allowedids;
                $coursenames = $allowednames;
            }
        }

        $client   = new backend_client();
        $response = $client->search(
            (int) $params['courseid'],
            (int) $USER->id,
            $cleanquery,
            $topk,
            $courseids
        );

        if (!isset($response['results'], $response['total'])) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'Invalid search response');
        }

        return [
            'query'   => (string) ($response['query'] ?? $cleanquery),
            'total'   => (int) $response['total'],
            'results' => array_map(
                static function (array $r) use ($coursenames): array {
                    $resultcourseid = (int) ($r['course_id'] ?? 0);
                    return [
                        'document_id'       => (string) ($r['document_id'] ?? ''),
                        'document_filename' => (string) ($r['document_filename'] ?? ''),
                        'course_id'         => $resultcourseid,
                        'course_name'       => $coursenames[$resultcourseid] ?? '',
                        'chunk_index'       => (int) ($r['chunk_index'] ?? 0),
                        'content'           => (string) ($r['content'] ?? ''),
                        'similarity'        => (float) ($r['similarity'] ?? 0.0),
                        'has_file'          => (bool) ($r['has_file'] ?? false),
                    ];
                },
                $response['results']
            ),
        ];
    }
}
