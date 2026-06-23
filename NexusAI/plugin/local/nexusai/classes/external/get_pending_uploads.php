<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_get_pending_uploads`.
 *
 * Devuelve la lista de archivos pendientes de confirmación para el docente actual
 * en un curso dado. Estos archivos fueron subidos a una sección del curso (mod_resource)
 * y están esperando que el docente decida si indexarlos en NexusAI.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class get_pending_uploads extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_multiple_structure {
        return new \external_multiple_structure(
            new \external_single_structure([
                'cmid'     => new \external_value(PARAM_INT,  'Course module ID del recurso'),
                'filename' => new \external_value(PARAM_TEXT, 'Nombre del archivo'),
                'mimetype' => new \external_value(PARAM_TEXT, 'MIME type del archivo'),
            ])
        );
    }

    public static function execute(int $courseid): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        $raw     = get_user_preferences(\local_nexusai\observer::PENDING_PREF, '{}');
        $pending = json_decode($raw, true);
        if (!is_array($pending)) {
            return [];
        }

        $result = [];
        foreach ($pending as $cmid => $entry) {
            if (((int) ($entry['courseid'] ?? 0)) !== (int) $params['courseid']) {
                continue;
            }
            $result[] = [
                'cmid'     => (int) $cmid,
                'filename' => (string) ($entry['filename'] ?? ''),
                'mimetype' => (string) ($entry['mimetype'] ?? ''),
            ];
        }

        return $result;
    }
}
