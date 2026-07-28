<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Message providers for local_nexusai.
 *
 * Registra los proveedores de mensajes nativos de Moodle para que los alumnos
 * puedan configurar sus preferencias de notificación (email, popup, etc.)
 * en Preferencias → Notificaciones de Moodle.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$messageproviders = [
    'cal_alert' => [
        'capability' => 'local/nexusai:use',
    ],
];
