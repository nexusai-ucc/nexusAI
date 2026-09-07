<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_calendar_feed_revoke`.
 *
 * CAL-07 (#377): revoca la URL de suscripción actual del alumno borrando su
 * token. La próxima llamada a `local_nexusai_calendar_feed_get` genera uno
 * nuevo — la URL vieja queda inválida de inmediato (calendar_feed.php ya no
 * la va a encontrar en la tabla).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class calendar_feed_revoke extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'success' => new \external_value(PARAM_BOOL, 'true si se borró (o ya no existía) el token'),
        ]);
    }

    public static function execute(): array {
        global $USER, $DB;

        self::validate_parameters(self::execute_parameters(), []);

        $context = \context_user::instance($USER->id);
        self::validate_context($context);

        if (isguestuser()) {
            throw new \require_login_exception('Guests cannot manage a calendar feed');
        }

        $DB->delete_records('local_nexusai_calendar_feed', ['userid' => $USER->id]);

        return ['success' => true];
    }
}
