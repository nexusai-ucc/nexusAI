<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_quiz_flashcards_summary`.
 *
 * SP-11 (#315): cuántas flashcards ya generadas hasta ahora "tocan hoy"
 * (repetición espaciada SM-2) vs. el total generado — para el banner del
 * Modo Estudio antes de empezar a practicar.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class quiz_flashcards_summary extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'topic'    => new \external_value(PARAM_TEXT, 'Tema (opcional)', VALUE_DEFAULT, ''),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'duecount'   => new \external_value(PARAM_INT, 'Flashcards que tocan hoy'),
            'totalcount' => new \external_value(PARAM_INT, 'Total de flashcards generadas'),
        ]);
    }

    public static function execute(int $courseid, string $topic = ''): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'topic'    => $topic,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $client   = new backend_client();
        $response = $client->flashcards_summary(
            (int) $params['courseid'],
            (int) $USER->id,
            trim($params['topic']) === '' ? null : trim($params['topic'])
        );

        return [
            'duecount'   => (int) ($response['due_count'] ?? 0),
            'totalcount' => (int) ($response['total_count'] ?? 0),
        ];
    }
}
