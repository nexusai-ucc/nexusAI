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
 * Admin settings page for local_nexusai.
 *
 * Appears in: Site administration → Plugins → Local plugins → NexusAI
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage(
        'local_nexusai',
        get_string('settings', 'local_nexusai')
    );

    // General section.
    $settings->add(new admin_setting_heading(
        'local_nexusai/section_general',
        get_string('section_general', 'local_nexusai'),
        ''
    ));

    // Master on/off switch.
    $settings->add(new admin_setting_configcheckbox(
        'local_nexusai/enabled',
        get_string('apienabled', 'local_nexusai'),
        get_string('apienabled_desc', 'local_nexusai'),
        1
    ));

    // Backend section.
    $settings->add(new admin_setting_heading(
        'local_nexusai/section_backend',
        get_string('section_backend', 'local_nexusai'),
        get_string('section_backend_desc', 'local_nexusai')
    ));

    // Python backend URL.
    $settings->add(new admin_setting_configtext(
        'local_nexusai/api_endpoint',
        get_string('apiendpoint', 'local_nexusai'),
        get_string('apiendpoint_desc', 'local_nexusai'),
        'http://localhost:8001',
        PARAM_RAW
    ));

    // Backend bearer API key (auth layer 1 — see ADR-005).
    // We use passwordunmask so the value stays hidden in the UI after saving.
    $settings->add(new admin_setting_configpasswordunmask(
        'local_nexusai/api_key',
        get_string('apikey', 'local_nexusai'),
        get_string('apikey_desc', 'local_nexusai'),
        ''
    ));

    // HMAC shared secret (auth layer 2 — see ADR-005).
    $settings->add(new admin_setting_configpasswordunmask(
        'local_nexusai/shared_secret',
        get_string('sharedsecret', 'local_nexusai'),
        get_string('sharedsecret_desc', 'local_nexusai'),
        ''
    ));

    // Notifications section.
    $settings->add(new admin_setting_heading(
        'local_nexusai/section_notifications',
        get_string('section_notifications', 'local_nexusai'),
        get_string('section_notifications_desc', 'local_nexusai')
    ));

    // Sender email for calendar alerts and NexusAI notifications.
    // If left empty, Moodle's global noreplyaddress is used.
    $settings->add(new admin_setting_configtext(
        'local_nexusai/alert_from_email',
        get_string('alert_from_email', 'local_nexusai'),
        get_string('alert_from_email_desc', 'local_nexusai'),
        'nexus.ai.mail@gmail.com',
        PARAM_EMAIL
    ));

    $ADMIN->add('localplugins', $settings);

    // Administration page with backend health check.
    $ADMIN->add('localplugins', new admin_externalpage(
        'local_nexusai_admin',
        get_string('admin_page_title', 'local_nexusai'),
        new moodle_url('/local/nexusai/admin.php'),
        'moodle/site:config'
    ));
}
