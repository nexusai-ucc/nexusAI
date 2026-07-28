<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Message providers (tipos de notificación) de local_nexusai — CAL-03 (issue #239).
 *
 * Registra el tipo de notificación "newmaterial" en el sistema nativo de
 * mensajería de Moodle. Esto hace que aparezca en Preferencias del usuario →
 * Notificaciones, dejando a cada alumno/docente elegir por qué canal
 * (popup/campanita, email, app) quiere recibirla — sin que NexusAI tenga que
 * implementar nada de eso.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$messageproviders = [

    // Se dispara cuando un docente sube material nuevo al curso (CAL-03).
    'newmaterial' => [
        'defaults' => [
            'popup' => MESSAGE_PERMITTED + MESSAGE_DEFAULT_LOGGEDIN + MESSAGE_DEFAULT_LOGGEDOFF,
            'email' => MESSAGE_PERMITTED + MESSAGE_DEFAULT_LOGGEDOFF,
        ],
    ],
];
