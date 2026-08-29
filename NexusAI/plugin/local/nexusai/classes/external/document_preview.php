<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_document_preview`.
 *
 * Devuelve los primeros caracteres del texto extraído de un documento
 * indexado (CONT-08 / #357). La vista docente lo muestra bajo demanda para
 * que el docente confirme que la extracción capturó contenido real.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class document_preview extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'   => new \external_value(PARAM_INT, 'ID del curso (para validar capability)', VALUE_REQUIRED),
            'documentid' => new \external_value(PARAM_ALPHANUMEXT, 'UUID del documento', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'document_id' => new \external_value(PARAM_ALPHANUMEXT, 'UUID del documento'),
            'filename'    => new \external_value(PARAM_RAW, 'Nombre del archivo'),
            'status'      => new \external_value(PARAM_ALPHA, 'pending | indexing | indexed | error'),
            'preview'     => new \external_value(PARAM_RAW, 'Texto extraído recortado, o null si todavía no hay', VALUE_OPTIONAL),
            'char_count'  => new \external_value(PARAM_INT, 'Cantidad de caracteres del preview'),
            'truncated'   => new \external_value(PARAM_BOOL, 'True si el texto extraído es más largo que el preview'),
        ]);
    }

    public static function execute(int $courseid, string $documentid): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'   => $courseid,
            'documentid' => $documentid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        $client   = new backend_client();
        $response = $client->get_document_preview($params['documentid']);

        // Defensa: el documento tiene que pertenecer al curso solicitado, para
        // que un docente no pueda leer material de otro curso pasando otro
        // courseid junto al UUID.
        if (((int) ($response['course_id'] ?? 0)) !== (int) $params['courseid']) {
            throw new \moodle_exception(
                'errorbackend', 'local_nexusai', '',
                'Document does not belong to the requested course'
            );
        }

        return [
            'document_id' => (string) ($response['document_id'] ?? ''),
            'filename'    => (string) ($response['filename'] ?? ''),
            'status'      => (string) ($response['status'] ?? ''),
            'preview'     => $response['preview'] ?? null,
            'char_count'  => (int) ($response['char_count'] ?? 0),
            'truncated'   => (bool) ($response['truncated'] ?? false),
        ];
    }
}
