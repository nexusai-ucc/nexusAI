<?php
// This file is part of the NexusAI plugin for Moodle.

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
 * externo (Postgres). Por eso todavía NO implementamos
 * `\core_privacy\local\request\plugin\provider` (el flujo de "Data requests"
 * disparado por el admin de Moodle) — eso es un próximo paso más grande, separado de
 * PRIV-01 (issue #310), que solo cubre autoservicio del propio alumno.
 *
 * Lo que SÍ cambia con PRIV-01: declaramos vía `add_external_location_link()` qué
 * datos personales viajan a ese sistema externo, y exponemos al propio alumno un
 * mecanismo de autoservicio (external functions
 * `local_nexusai_privacy_export`/`local_nexusai_privacy_delete`, ver
 * classes/external/) para que pueda pedir su historial o borrarlo sin pasar por el
 * admin.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\privacy;

use core_privacy\local\metadata\collection;

defined('MOODLE_INTERNAL') || die();

class provider implements \core_privacy\local\metadata\provider {

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
}
