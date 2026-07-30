<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Scheduled tasks for local_nexusai.
 *
 * El cron de Moodle ejecuta estas tareas automáticamente según la frecuencia
 * definida. `send_calendar_alerts` corre cada hora para enviar notificaciones
 * de vencimiento próximo a los alumnos.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$tasks = [
    [
        'classname'  => '\local_nexusai\task\send_calendar_alerts',
        'blocking'   => 0,
        'minute'     => '0',
        'hour'       => '*',
        'day'        => '*',
        'month'      => '*',
        'dayofweek'  => '*',
    ],
];
