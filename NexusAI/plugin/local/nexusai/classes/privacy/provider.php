<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Privacy API provider para local_nexusai.
 *
 * Moodle 3.5+ exige que todo plugin declare qué datos personales maneja, para cumplir
 * GDPR. Si no se declara nada, Moodle muestra advertencias en el panel de admin y el
 * plugin no pasa los checks de moodle.org.
 *
 * En esta etapa (Sprint 1) el plugin NO almacena datos personales en la DB de Moodle.
 * Todo el historial de chat vive en el backend Python externo (Postgres+pgvector).
 * Por eso usamos `null_provider` con un motivo claro.
 *
 * Cuando empecemos a guardar logs de uso o caché de respuestas en tablas de Moodle,
 * vamos a tener que migrar a `\core_privacy\local\metadata\provider` y exponer
 * export/delete. Ver ADR-006 (a redactar).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\privacy;

defined('MOODLE_INTERNAL') || die();

class provider implements \core_privacy\local\metadata\null_provider {

    /**
     * Devuelve el string (de lang/) que explica por qué este plugin no guarda
     * datos personales en Moodle.
     *
     * @return string Identifier de la lang string en local_nexusai/privacy:metadata
     */
    public static function get_reason(): string {
        return 'privacy:metadata';
    }
}
