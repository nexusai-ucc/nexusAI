<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Regla de visibilidad compartida del widget (UX-02).
 *
 * Antes de UX-02, el widget solo existía dentro de páginas de curso real
 * ($COURSE->id > 1) — ese guard vivía inline en before_footer_listener.php.
 * UX-02 suma un segundo punto de inyección (el ícono de la navbar primaria,
 * classes/hook/navigation/primary_extend_listener.php) que debe decidir
 * exactamente lo mismo que el footer: si el ícono existe pero el contenedor
 * del panel no, el click no hace nada. Esta clase es la única fuente de
 * verdad que ambos hooks consultan.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

defined('MOODLE_INTERNAL') || die();

class visibility_helper {

    /**
     * Resuelve si el usuario actual debe ver el widget en la página actual y,
     * si es dentro de un curso real, si tiene la capability para usarlo.
     *
     * Reglas:
     *   - Logueado y no invitado, siempre.
     *   - Dentro de un curso real ($COURSE->id > 1): requiere además
     *     `local/nexusai:use` en ese curso — si no la tiene, no se muestra
     *     nada (ni ícono ni panel), igual que antes de UX-02.
     *   - Fuera de curso (dashboard, home, admin, etc.): se muestra igual,
     *     con courseid=0 — el panel entra a un estado vacío en vez de
     *     intentar usar un curso inexistente.
     *
     * @return array{courseid:int, isteacher:bool}|null null si no corresponde mostrar nada.
     */
    public static function resolve(): ?array {
        global $COURSE;

        if (!isloggedin() || isguestuser()) {
            return null;
        }

        if (!empty($COURSE->id) && $COURSE->id > 1) {
            $context = \context_course::instance($COURSE->id);
            if (!has_capability('local/nexusai:use', $context)) {
                return null;
            }

            return [
                'courseid'  => (int) $COURSE->id,
                'isteacher' => has_capability('local/nexusai:manage', $context),
            ];
        }

        return [
            'courseid'  => 0,
            'isteacher' => false,
        ];
    }

    /**
     * ONB-03: detecta si la página actual es la de **crear un curso nuevo** y
     * el usuario puede crearlo. En ese caso el widget muestra el tutorial de
     * armado de curso en vez del cartel de "no hay curso".
     *
     * La pantalla de crear y la de editar comparten `$PAGE->pagetype`
     * (`course-edit`, verificado contra Moodle 4.1 — ver ADR-010). La
     * distinción es por parámetro: sin `id` = crear, con `id` = editar (editar
     * lo maneja ONB-04, todavía no).
     *
     * @return string|null 'create-course' o null.
     */
    public static function onboarding_hint(): ?string {
        global $PAGE;

        if ($PAGE->pagetype !== 'course-edit') {
            return null;
        }

        // Editar un curso existente → ONB-04 (todavía no implementado).
        if (optional_param('id', 0, PARAM_INT) > 0) {
            return null;
        }

        $categoryid = optional_param('category', 0, PARAM_INT);
        try {
            $catcontext = $categoryid > 0
                ? \context_coursecat::instance($categoryid, IGNORE_MISSING)
                : \context_system::instance();
        } catch (\Throwable $e) {
            $catcontext = \context_system::instance();
        }

        if ($catcontext && has_capability('moodle/course:create', $catcontext)) {
            return 'create-course';
        }

        return null;
    }
}
