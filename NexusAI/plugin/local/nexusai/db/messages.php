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
    // CAL-02 — alerta configurable por el alumno antes del vencimiento de un evento.
    'cal_alert' => [
        'capability' => 'local/nexusai:use',
    ],
    // CAL-03 — notificación a alumnos cuando un docente sube material nuevo.
    'newmaterial' => [
        'defaults' => [
            'popup' => MESSAGE_PERMITTED + MESSAGE_DEFAULT_LOGGEDIN + MESSAGE_DEFAULT_LOGGEDOFF,
            'email' => MESSAGE_PERMITTED + MESSAGE_DEFAULT_LOGGEDOFF,
        ],
    ],
];
