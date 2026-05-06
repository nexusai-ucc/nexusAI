<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_document_delete`.
 *
 * Borra un documento indexado y todos sus chunks asociados.
 * El backend hace ON DELETE CASCADE sobre chunks(document_id).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class document_delete extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'   => new \external_value(PARAM_INT, 'ID del curso (para validar capability)', VALUE_REQUIRED),
            'documentid' => new \external_value(PARAM_ALPHANUMEXT, 'UUID del documento a borrar', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'success' => new \external_value(PARAM_BOOL, 'true si se borró correctamente'),
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

        // Defensa: verificar que el documento pertenece al curso antes de borrar.
        $document = $client->get_document($params['documentid']);
        if (((int) ($document['course_id'] ?? 0)) !== (int) $params['courseid']) {
            throw new \moodle_exception(
                'errorbackend', 'local_nexusai', '',
                'Cannot delete: document does not belong to the requested course'
            );
        }

        $client->delete_document($params['documentid']);

        return ['success' => true];
    }
}
