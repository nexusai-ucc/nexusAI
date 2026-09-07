<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_calendar_feed_url`.
 *
 * Devuelve la URL del feed .ics suscribible del alumno para un curso
 * (CAL-07 / #377). Crea el token del alumno si todavía no tiene uno.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');
require_once($GLOBALS['CFG']->dirroot . '/local/nexusai/lib.php');

class calendar_feed_url extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'url' => new \external_value(PARAM_RAW, 'URL absoluta del feed .ics'),
        ]);
    }

    public static function execute(int $courseid): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        return [
            'url' => local_nexusai_calfeed_url((int) $USER->id, (int) $params['courseid']),
        ];
    }
}
