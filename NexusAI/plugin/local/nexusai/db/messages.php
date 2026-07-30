<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Message providers (tipos de notificación) de local_nexusai.
 *
 * Registra los tipos de notificación nativos de Moodle: CAL-02 (alertas de
 * calendario configuradas por el alumno) y CAL-03 (material nuevo subido al
 * curso). Aparecen en Preferencias del usuario → Notificaciones.
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

    // CAL-03 — se dispara cuando un docente sube material nuevo al curso.
    'newmaterial' => [
        'defaults' => [
            'popup' => MESSAGE_PERMITTED + MESSAGE_DEFAULT_LOGGEDIN + MESSAGE_DEFAULT_LOGGEDOFF,
            'email' => MESSAGE_PERMITTED + MESSAGE_DEFAULT_LOGGEDOFF,
        ],
    ],
];
