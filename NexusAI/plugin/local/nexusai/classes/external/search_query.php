<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_search_query`.
 *
 * Proxy entre React y el endpoint /api/v1/search del backend Python.
 * Devuelve fragmentos del material del curso relevantes a la consulta,
 * sin pasar por el LLM (retrieval puro).
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
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'topk'     => new \external_value(PARAM_INT, 'Cantidad de resultados (1..10)', VALUE_OPTIONAL, 5),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'query'   => new \external_value(PARAM_RAW, 'Consulta original'),
            'total'   => new \external_value(PARAM_INT, 'Total de resultados'),
            'results' => new \external_multiple_structure(
                new \external_single_structure([
                    'document_filename' => new \external_value(PARAM_TEXT, 'Nombre del archivo'),
                    'chunk_index'       => new \external_value(PARAM_INT, 'Índice del fragmento'),
                    'content'           => new \external_value(PARAM_RAW, 'Texto del fragmento'),
                    'similarity'        => new \external_value(PARAM_FLOAT, 'Score de similitud 0-1'),
                ])
            ),
        ]);
    }

    public static function execute(string $query, int $courseid, int $topk = 5): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'query'    => $query,
            'courseid' => $courseid,
            'topk'     => $topk,
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

        $client   = new backend_client();
        $response = $client->search(
            (int) $params['courseid'],
            (int) $USER->id,
            $cleanquery,
            $topk
        );

        if (!isset($response['results'], $response['total'])) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'Invalid search response');
        }

        return [
            'query'   => (string) ($response['query'] ?? $cleanquery),
            'total'   => (int) $response['total'],
            'results' => array_map(
                static fn(array $r) => [
                    'document_filename' => (string) ($r['document_filename'] ?? ''),
                    'chunk_index'       => (int) ($r['chunk_index'] ?? 0),
                    'content'           => (string) ($r['content'] ?? ''),
                    'similarity'        => (float) ($r['similarity'] ?? 0.0),
                ],
                $response['results']
            ),
        ];
    }
}
