<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_course_sections_list`.
 *
 * Lista las secciones/unidades de un curso (número + nombre visible) para
 * poblar el selector de sección al subir material y el filtro de búsqueda
 * (BUS-05). Es de lectura y no requiere `local/nexusai:manage` — los
 * alumnos también la necesitan para filtrar resultados de búsqueda.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class course_sections_list extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_multiple_structure {
        return new \external_multiple_structure(
            new \external_single_structure([
                'section' => new \external_value(PARAM_INT, 'Número de sección'),
                'name'    => new \external_value(PARAM_TEXT, 'Nombre visible de la sección'),
            ])
        );
    }

    public static function execute(int $courseid): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $modinfo = get_fast_modinfo($params['courseid']);
        $sections = $modinfo->get_listed_section_info_all();

        $out = [];
        foreach ($sections as $sectionnum => $sectioninfo) {
            $out[] = [
                'section' => (int) $sectionnum,
                'name'    => get_section_name($params['courseid'], $sectioninfo),
            ];
        }

        return $out;
    }
}
