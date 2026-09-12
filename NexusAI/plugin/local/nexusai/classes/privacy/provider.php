<?php
// This file is part of the NexusAI plugin for Moodle.
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Privacy API provider para local_nexusai.
 *
 * Moodle 3.5+ exige que todo plugin declare qué datos personales maneja, para cumplir
 * GDPR/Ley 25.326. Ver docs/adr/006-privacy-strategy.md para el contexto completo de
 * esta decisión (estrategia en dos etapas: null_provider mientras no había forma de
 * exportar/borrar el dato remoto, metadata\provider una vez que el backend expone esa
 * API — ver la tabla de triggers de ADR-006, "El backend NexusAI expone API de
 * export/delete por user").
 *
 * El plugin en sí sigue sin almacenar datos personales en tablas de Moodle — todo el
 * historial (mensajes de chat, intentos y errores de quiz) vive en el backend NexusAI
 * externo (Postgres). PRIV-01 (issue #310) implementó `metadata\provider` y el
 * autoservicio del alumno (external functions `local_nexusai_privacy_export`/
 * `local_nexusai_privacy_delete`, ver classes/external/).
 *
 * Este archivo agrega el paso que ADR-006 dejaba pendiente: `plugin\provider` y
 * `core_userlist_provider`, que enganchan con la herramienta de admin de Moodle
 * (Site administration → Users → Privacy → Data requests) para que un ADMIN pueda
 * procesar un pedido GDPR sin depender de que el alumno use el autoservicio.
 *
 * El backend NexusAI no tiene un endpoint "listame los cursos con datos de este
 * user" — solo export/delete por user_id+course_id ya conocido. Por eso
 * `get_contexts_for_userid()`/`get_users_in_context()` aproximan vía lo que Moodle
 * sabe localmente: cursos donde el usuario está inscripto y tiene la capability
 * `local/nexusai:use`. Sobre-incluir es seguro (un curso sin actividad real da un
 * export/delete vacío); sub-incluir sería un incumplimiento real.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\userlist;
use local_nexusai\external\backend_client;

/**
 * Declara vía metadata\provider qué datos personales viajan al backend NexusAI externo,
 * y vía plugin\provider/core_userlist_provider engancha con el flujo admin de
 * Data requests.
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\plugin\provider,
    \core_privacy\local\request\core_userlist_provider {
    /**
     * Describe qué datos personales viajan al backend NexusAI externo.
     *
     * @param collection $collection Colección de metadata a completar.
     * @return collection La misma colección, completa.
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_external_location_link(
            'nexusai_backend',
            [
                'user_id'    => 'privacy:metadata:nexusai_backend:user_id',
                'course_id'  => 'privacy:metadata:nexusai_backend:course_id',
                'content'    => 'privacy:metadata:nexusai_backend:content',
                'created_at' => 'privacy:metadata:nexusai_backend:created_at',
            ],
            'privacy:metadata:nexusai_backend'
        );

        return $collection;
    }

    /**
     * Cursos (contextos) donde el usuario tiene datos personales en el backend.
     *
     * Aproximación: todo curso donde está inscripto y conserva la capability
     * `local/nexusai:use` — el backend no expone un índice propio de "en qué
     * cursos tiene historial este user", así que sobre-incluimos en vez de
     * arriesgar dejar afuera un contexto real.
     *
     * @param int $userid ID del usuario.
     * @return contextlist Contextos de curso a incluir en el pedido.
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        $contextlist = new contextlist();

        $courses = enrol_get_users_courses($userid, true, ['id']);
        foreach ($courses as $course) {
            $context = \context_course::instance((int) $course->id);
            if (has_capability('local/nexusai:use', $context, $userid)) {
                $contextlist->add_user_context($userid, $context);
            }
        }

        return $contextlist;
    }

    /**
     * Exporta los datos personales del usuario en cada contexto aprobado.
     *
     * Reusa `backend_client::privacy_export()` (el mismo que el autoservicio del
     * alumno), una llamada por curso aprobado.
     *
     * @param approved_contextlist $contextlist Contextos aprobados para exportar.
     */
    public static function export_user_data(approved_contextlist $contextlist): void {
        $userid = (int) $contextlist->get_user()->id;
        if (empty($userid)) {
            return;
        }

        $client = new backend_client();

        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel !== CONTEXT_COURSE) {
                continue;
            }

            $courseid = (int) $context->instanceid;
            $data = $client->privacy_export($userid, $courseid);

            \core_privacy\local\request\writer::with_context($context)
                ->export_data(
                    [get_string('pluginname', 'local_nexusai')],
                    (object) $data
                );
        }
    }

    /**
     * Borra los datos personales del usuario en cada contexto aprobado.
     *
     * @param approved_contextlist $contextlist Contextos aprobados para borrar.
     */
    public static function delete_data_for_user(approved_contextlist $contextlist): void {
        $userid = (int) $contextlist->get_user()->id;
        if (empty($userid)) {
            return;
        }

        $client = new backend_client();

        foreach ($contextlist->get_contexts() as $context) {
            if ($context->contextlevel !== CONTEXT_COURSE) {
                continue;
            }

            $client->privacy_delete($userid, (int) $context->instanceid);
        }
    }

    /**
     * Borra los datos de TODOS los usuarios en un contexto (ej. al borrar un curso).
     *
     * Sin endpoint bulk en el backend: itera los usuarios inscriptos con la
     * capability `local/nexusai:use` y llama `privacy_delete()` uno por uno.
     * Aceptable para el tamaño típico de un curso (decenas/cientos de alumnos).
     *
     * @param \context $context Contexto (debe ser de curso; se ignora si no lo es).
     */
    public static function delete_data_for_all_users_in_context(\context $context): void {
        if ($context->contextlevel !== CONTEXT_COURSE) {
            return;
        }

        $courseid = (int) $context->instanceid;
        $client = new backend_client();

        $users = get_enrolled_users($context, 'local/nexusai:use', 0, 'u.id');
        foreach ($users as $user) {
            $client->privacy_delete((int) $user->id, $courseid);
        }
    }

    /**
     * Lista los usuarios con datos personales en un contexto de curso.
     *
     * Mismo criterio de sobre-inclusión que get_contexts_for_userid(): todo
     * inscripto con la capability `local/nexusai:use`.
     *
     * @param userlist $userlist Colección de usuarios a completar.
     */
    public static function get_users_in_context(userlist $userlist): void {
        $context = $userlist->get_context();
        if ($context->contextlevel !== CONTEXT_COURSE) {
            return;
        }

        $users = get_enrolled_users($context, 'local/nexusai:use', 0, 'u.id');
        foreach ($users as $user) {
            $userlist->add_user((int) $user->id);
        }
    }

    /**
     * Borra los datos de un conjunto aprobado de usuarios en un contexto.
     *
     * @param approved_userlist $userlist Usuarios aprobados para borrar, con su contexto.
     */
    public static function delete_data_for_users(approved_userlist $userlist): void {
        $context = $userlist->get_context();
        if ($context->contextlevel !== CONTEXT_COURSE) {
            return;
        }

        $courseid = (int) $context->instanceid;
        $client = new backend_client();

        foreach ($userlist->get_userids() as $userid) {
            $client->privacy_delete((int) $userid, $courseid);
        }
    }
}
