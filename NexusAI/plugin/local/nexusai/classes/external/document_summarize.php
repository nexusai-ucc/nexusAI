<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_document_summarize`.
 *
 * Proxy entre React y el endpoint /api/v1/documents/summarize del backend Python.
 * Genera un resumen del documento usando el LLM configurado (BUS-03).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class document_summarize extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'documentid' => new \external_value(PARAM_RAW, 'UUID del documento a resumir', VALUE_REQUIRED),
            'courseid'   => new \external_value(PARAM_INT, 'ID del curso de Moodle', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'document_id'       => new \external_value(PARAM_RAW,  'UUID del documento'),
            'document_filename' => new \external_value(PARAM_TEXT, 'Nombre del archivo'),
            'summary'           => new \external_value(PARAM_RAW,  'Resumen generado por IA'),
            'chunks_used'       => new \external_value(PARAM_INT,  'Fragmentos usados para el resumen'),
            'total_chunks'      => new \external_value(PARAM_INT,  'Total de fragmentos del documento'),
        ]);
    }

    public static function execute(string $documentid, int $courseid): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'documentid' => $documentid,
            'courseid'   => $courseid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $cleandocid = trim($params['documentid']);
        if ($cleandocid === '') {
            throw new \invalid_parameter_exception('Document ID cannot be empty');
        }

        $client   = new backend_client();
        $response = $client->summarize_document(
            $cleandocid,
            (int) $params['courseid'],
            (int) $USER->id
        );

        if (!isset($response['summary'], $response['document_filename'])) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'Invalid summarize response');
        }

        return [
            'document_id'       => (string) ($response['document_id']       ?? $cleandocid),
            'document_filename' => (string) ($response['document_filename']  ?? ''),
            'summary'           => (string) ($response['summary']            ?? ''),
            'chunks_used'       => (int)    ($response['chunks_used']        ?? 0),
            'total_chunks'      => (int)    ($response['total_chunks']       ?? 0),
        ];
    }
}
