<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_gaps_archive`.
 *
 * Archiva o desarchiva un gap detectado (DOC-D08, issue #383). Opera sobre
 * los IDs reales de fila (`question_ids`, devueltos por `gaps_list`) — el
 * texto de la pregunta que ve el docente es solo el representante más
 * reciente del cluster semántico (DOC-D06), no una clave estable para
 * identificar qué filas archivar.
 *
 * Solo accesible para usuarios con capability `local/nexusai:manage`
 * (docentes y admins) — mismo criterio que `gaps_list`.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class gaps_archive extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'    => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'questionids' => new \external_multiple_structure(
                new \external_value(PARAM_ALPHANUMEXT, 'UUID de una fila de unanswered_questions'),
                'IDs de las filas a archivar/desarchivar (al menos 1)'
            ),
            'archived'    => new \external_value(PARAM_BOOL, 'true para archivar, false para desarchivar', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'course_id' => new \external_value(PARAM_INT, 'ID del curso'),
            'archived'  => new \external_value(PARAM_BOOL, 'Estado aplicado'),
            'affected'  => new \external_value(PARAM_INT, 'Cantidad de filas actualizadas'),
        ]);
    }

    public static function execute(int $courseid, array $questionids, bool $archived): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'    => $courseid,
            'questionids' => $questionids,
            'archived'    => $archived,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        if (empty($params['questionids'])) {
            throw new \invalid_parameter_exception('At least one question id must be provided');
        }

        $client   = new backend_client();
        $response = $client->archive_gap(
            (int) $params['courseid'],
            array_map('strval', $params['questionids']),
            (bool) $params['archived']
        );

        return [
            'course_id' => (int) ($response['course_id'] ?? $params['courseid']),
            'archived'  => (bool) ($response['archived'] ?? $params['archived']),
            'affected'  => (int) ($response['affected'] ?? 0),
        ];
    }
}
