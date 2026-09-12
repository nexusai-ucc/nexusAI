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
    'newmaterial' => [],
];
