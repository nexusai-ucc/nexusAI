<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_onboarding_state_set` (ONB-05 / #428).
 *
 * Guarda, para el usuario actual y un curso puntual, si el tutorial fue
 * cerrado (`dismissed`) y qué pasos opcionales están marcados "no aplica"
 * (`skipped`). Reemplazo completo (read-modify-write desde el front) —
 * mismo patrón simple que el resto del plugin, sin operaciones parciales.
 *
 * Único write de toda la épica de onboarding (ADR-010), y es sobre
 * `user_preferences` de core, no una tabla propia.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class onboarding_state_set extends \external_api {

    /** Tope de items en `skipped` — son 6 pasos posibles como mucho hoy, 20 da margen. */
    private const MAX_SKIPPED = 20;

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'  => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'dismissed' => new \external_value(PARAM_BOOL, 'Cerrar (true) o reabrir (false) el tutorial', VALUE_REQUIRED),
            'skipped'   => new \external_multiple_structure(
                new \external_value(PARAM_ALPHANUMEXT, 'Key del paso marcado "no aplica"'),
                'Pasos opcionales excluidos de futuras revisiones',
                VALUE_REQUIRED
            ),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'success' => new \external_value(PARAM_BOOL, 'Guardado correctamente'),
        ]);
    }

    public static function execute(int $courseid, bool $dismissed, array $skipped): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'  => $courseid,
            'dismissed' => $dismissed,
            'skipped'   => $skipped,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        self::write_state($params['courseid'], $params['dismissed'], $params['skipped']);

        return ['success' => true];
    }

    /**
     * Separado de execute() para poder testearlo sin pasar por validate_context().
     */
    public static function write_state(int $courseid, bool $dismissed, array $skipped): void {
        $skipped = array_slice(array_values(array_unique($skipped)), 0, self::MAX_SKIPPED);

        set_user_preference('local_nexusai_onb_dismissed_' . $courseid, $dismissed ? '1' : '0');
        set_user_preference('local_nexusai_onb_skipped_' . $courseid, json_encode($skipped));
    }
}
