<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Página de settings de admin para local_nexusai.
 *
 * Aparece en: Site administration → Plugins → Local plugins → NexusAI
 *
 * Por ahora exponemos lo mínimo: URL del backend y switch maestro.
 * En sprints futuros se va a expandir (rate limits, modelo a usar, etc.).
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

    // Switch maestro on/off.
    $settings->add(new admin_setting_configcheckbox(
        'local_nexusai/enabled',
        get_string('apienabled', 'local_nexusai'),
        get_string('apienabled_desc', 'local_nexusai'),
        1  // default: enabled
    ));

    // URL del backend Python. Por defecto apunta al docker-compose local.
    $settings->add(new admin_setting_configtext(
        'local_nexusai/api_endpoint',
        get_string('apiendpoint', 'local_nexusai'),
        get_string('apiendpoint_desc', 'local_nexusai'),
        'http://localhost:8001',
        PARAM_URL
    ));

    $ADMIN->add('localplugins', $settings);
}
