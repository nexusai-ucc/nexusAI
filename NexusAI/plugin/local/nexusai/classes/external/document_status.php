<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_document_status`.
 *
 * Estado actual de un documento (pending | indexing | indexed | error).
 * La vista docente hace polling cada 3 segundos mientras un documento está
 * indexándose para mostrar progreso.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class document_status extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'   => new \external_value(PARAM_INT, 'ID del curso (para validar capability)', VALUE_REQUIRED),
            'documentid' => new \external_value(PARAM_ALPHANUMEXT, 'UUID del documento', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'id'            => new \external_value(PARAM_ALPHANUMEXT, 'UUID del documento'),
            'course_id'     => new \external_value(PARAM_INT, 'ID del curso'),
            'uploader_id'   => new \external_value(PARAM_INT, 'ID del docente'),
            'filename'      => new \external_value(PARAM_RAW, 'Nombre del archivo'),
            'mime_type'     => new \external_value(PARAM_RAW, 'MIME type'),
            'status'        => new \external_value(PARAM_ALPHA, 'pending | indexing | indexed | error'),
            'error_message' => new \external_value(PARAM_RAW, 'Mensaje de error si aplica', VALUE_OPTIONAL),
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

        $client = new backend_client();
        $document = $client->get_document($params['documentid']);

        // Defensa: verificar que el documento pertenece al curso solicitado.
        // Esto previene que un docente vea documentos de otros cursos pasando
        // un courseid distinto al UUID que le corresponde.
        if (((int) ($document['course_id'] ?? 0)) !== (int) $params['courseid']) {
            throw new \moodle_exception(
                'errorbackend', 'local_nexusai', '',
                'Document does not belong to the requested course'
            );
        }

        return [
            'id'            => (string) ($document['id'] ?? ''),
            'course_id'     => (int) ($document['course_id'] ?? 0),
            'uploader_id'   => (int) ($document['uploader_id'] ?? 0),
            'filename'      => (string) ($document['filename'] ?? ''),
            'mime_type'     => (string) ($document['mime_type'] ?? ''),
            'status'        => (string) ($document['status'] ?? ''),
            'error_message' => $document['error_message'] ?? null,
        ];
    }
}
