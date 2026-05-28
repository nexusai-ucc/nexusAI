<?php
// This file is part of the NexusAI plugin for Moodle.
//
// NexusAI is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Version metadata for local_nexusai.
 *
 * Moodle reads this file to know:
 *   - which version of the plugin is installed (for upgrades)
 *   - which Moodle versions it supports
 *   - any other plugins it depends on
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$plugin->component = 'local_nexusai';
$plugin->version   = 2026052800;        // YYYYMMDDXX — Sprint 4: buscador semántico + chat multi-curso.
$plugin->release   = '0.4.0';            // Sprint 4: Feature A (search) + Feature B (multi-curso).
$plugin->maturity  = MATURITY_ALPHA;

// Soportamos Moodle 4.1 LTS (build 2022112800) en adelante hasta 4.5.
// Si alguien intenta instalar en una versión vieja, Moodle lo bloquea solo.
$plugin->requires  = 2022112800;        // Moodle 4.1 LTS
$plugin->supported = [401, 405];        // 4.1 a 4.5
