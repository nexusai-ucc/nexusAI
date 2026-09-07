<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_calendar_feed_get`.
 *
 * CAL-07 (#377): get-or-create de la URL de suscripción al calendario del
 * alumno. No depende de FastAPI ni de HMAC — el token vive en la tabla
 * propia del plugin (`local_nexusai_calendar_feed`) y el feed real lo sirve
 * `calendar_feed.php`, redirigiendo al export nativo de Moodle.
 *
 * Es una función "de cuenta personal", no de curso: no hay `courseid` ni
 * capability de NexusAI que chequear — cualquier usuario logueado no-invitado
 * puede generar su propia URL, igual que el export de calendario nativo de
 * Moodle (`calendar/export.php`), del que esta función es un wrapper delgado.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class calendar_feed_get extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'enabled' => new \external_value(PARAM_BOOL, 'false si el sitio tiene deshabilitado el export de calendario'),
            'url'     => new \external_value(PARAM_URL, 'URL de suscripción .ics', VALUE_OPTIONAL, null, NULL_ALLOWED),
        ]);
    }

    public static function execute(): array {
        global $USER, $CFG, $DB;

        self::validate_parameters(self::execute_parameters(), []);

        $context = \context_user::instance($USER->id);
        self::validate_context($context);

        if (isguestuser()) {
            throw new \require_login_exception('Guests cannot subscribe to a calendar feed');
        }

        if (empty($CFG->enablecalendarexport)) {
            return ['enabled' => false, 'url' => null];
        }

        $row = $DB->get_record('local_nexusai_calendar_feed', ['userid' => $USER->id]);
        if (!$row) {
            $row = (object) [
                'userid'      => $USER->id,
                'token'       => random_string(40),
                'timecreated' => time(),
            ];
            $row->id = $DB->insert_record('local_nexusai_calendar_feed', $row);
        }

        $url = new \moodle_url('/local/nexusai/calendar_feed.php', ['token' => $row->token]);

        return ['enabled' => true, 'url' => $url->out(false)];
    }
}
