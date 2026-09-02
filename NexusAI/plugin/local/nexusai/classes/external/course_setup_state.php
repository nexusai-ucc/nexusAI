<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_course_setup_state` (ONB-02 / #425).
 *
 * Agrega en una sola llamada el "estado de setup" de un curso: qué le falta
 * armar al docente. Alimenta el tutorial de creación (ONB-03) y el modo
 * revisión al editar (ONB-04).
 *
 * Todas las señales de Moodle se resuelven **in-process** (sin webservices
 * remotos): secciones con contenido, grupos, alumnos matriculados, foros y
 * eventos de calendario. La única señal externa es "material indexado en
 * NexusAI", que viene del backend Python vía `backend_client::get_course_stats`
 * — si el backend no responde, esa señal degrada a `present = null` y el
 * resto de la respuesta sigue siendo válida.
 *
 * Es **100% lectura**: no escribe nada en Moodle (ver ADR-010).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');
require_once($GLOBALS['CFG']->dirroot . '/group/lib.php');
require_once($GLOBALS['CFG']->dirroot . '/calendar/lib.php');

class course_setup_state extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
        ]);
    }

    /**
     * Estructura de una señal individual: presente + conteo.
     *
     * `present` admite null solo en la señal `material` (backend caído).
     */
    private static function signal_structure(string $desc, bool $nullablepresent = false): \external_single_structure {
        return new \external_single_structure([
            'present' => new \external_value(
                PARAM_BOOL,
                $desc . ' — presente',
                $nullablepresent ? VALUE_DEFAULT : VALUE_REQUIRED,
                null,
                $nullablepresent ? NULL_ALLOWED : NULL_NOT_ALLOWED
            ),
            'count'   => new \external_value(PARAM_INT, $desc . ' — cantidad', VALUE_DEFAULT, 0),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso consultado'),
            'sections' => self::signal_structure('Secciones con al menos una actividad/recurso'),
            'groups'   => self::signal_structure('Grupos definidos en el curso'),
            'students' => self::signal_structure('Alumnos matriculados (rol con arquetipo student)'),
            'forums'   => self::signal_structure('Foros del curso'),
            'calendar' => self::signal_structure('Eventos de calendario propios del curso'),
            'material' => self::signal_structure('Material indexado en NexusAI', true),
        ]);
    }

    public static function execute(int $courseid): array {
        $params = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        $state = self::gather_moodle_signals($params['courseid'], $context);
        $state['courseid'] = (int) $params['courseid'];
        $state['material'] = self::material_signal(self::fetch_course_stats($params['courseid']));

        return $state;
    }

    /**
     * Junta las 5 señales que viven en Moodle. Separado de execute() para
     * poder testearlo con un curso generado sin depender del backend.
     *
     * @param int        $courseid
     * @param \context    $context  Contexto del curso (para contar matrícula).
     * @return array{sections:array, groups:array, students:array, forums:array, calendar:array}
     */
    public static function gather_moodle_signals(int $courseid, \context $context): array {
        global $DB;

        // --- Secciones con contenido (al menos un módulo, oculto o no) ---
        $modinfo = get_fast_modinfo($courseid);
        $sectionswithcontent = 0;
        foreach ($modinfo->get_sections() as $cmids) {
            if (!empty($cmids)) {
                $sectionswithcontent++;
            }
        }

        // --- Grupos ---
        $groupcount = count(groups_get_all_groups($courseid));

        // --- Alumnos matriculados (solo roles con arquetipo student) ---
        $studentroles = array_keys(get_archetype_roles('student'));
        $studentcount = empty($studentroles)
            ? 0
            : count_role_users($studentroles, $context);

        // --- Foros ---
        $forumcount = $DB->count_records('forum', ['course' => $courseid]);

        // --- Eventos de calendario propios del curso (no los de usuario) ---
        $calendarcount = $DB->count_records_select(
            'event',
            "courseid = :courseid AND eventtype <> 'user'",
            ['courseid' => $courseid]
        );

        return [
            'sections' => self::signal($sectionswithcontent),
            'groups'   => self::signal($groupcount),
            'students' => self::signal($studentcount),
            'forums'   => self::signal($forumcount),
            'calendar' => self::signal($calendarcount),
        ];
    }

    /**
     * Construye una señal a partir de un conteo: present = count > 0.
     */
    public static function signal(int $count): array {
        $count = max(0, $count);
        return ['present' => $count > 0, 'count' => $count];
    }

    /**
     * Traduce la respuesta de `/courses/{id}/stats` a una señal. `null` (el
     * backend no respondió) → present desconocido.
     *
     * @param array|null $stats Respuesta del backend o null si falló.
     * @return array{present:bool|null, count:int}
     */
    public static function material_signal(?array $stats): array {
        if ($stats === null) {
            return ['present' => null, 'count' => 0];
        }
        $count = (int) ($stats['document_count'] ?? 0);
        $present = array_key_exists('has_indexed_content', $stats)
            ? (bool) $stats['has_indexed_content']
            : $count > 0;
        return ['present' => $present, 'count' => max(0, $count)];
    }

    /**
     * Pide las stats de material al backend. Cualquier fallo (config
     * incompleta, backend caído, timeout) devuelve null en lugar de romper
     * toda la external function.
     *
     * @param int $courseid
     * @return array|null
     */
    private static function fetch_course_stats(int $courseid): ?array {
        try {
            return (new backend_client())->get_course_stats($courseid);
        } catch (\Throwable $e) {
            debugging(
                'local_nexusai course_setup_state: no se pudo obtener course stats: ' . $e->getMessage(),
                DEBUG_DEVELOPER
            );
            return null;
        }
    }
}
