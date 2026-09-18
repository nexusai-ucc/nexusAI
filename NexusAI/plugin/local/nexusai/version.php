<?php
// This file is part of the NexusAI plugin for Moodle.
//
// NexusAI is free software: you can redistribute it and/or modify
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
$plugin->version   = 2026091200;
// Feat: admin Privacy API (plugin\provider + core_userlist_provider). CI now
// also runs against MySQL, in addition to PostgreSQL (Marketplace requirement).
$plugin->release   = '0.17.10';
$plugin->maturity  = MATURITY_ALPHA;

// We support Moodle 4.1 LTS (build 2022112800) up to 4.5.
// If someone tries to install on an older version, Moodle blocks it on its own.
$plugin->requires  = 2022112800;        // Moodle 4.1 LTS.
$plugin->supported = [401, 405];        // 4.1 to 4.5
