<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Página de settings de admin para local_nexusai.
 *
 * Aparece en: Site administration → Plugins → Local plugins → NexusAI
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

    // ----- Sección general -----
    $settings->add(new admin_setting_heading(
        'local_nexusai/section_general',
        get_string('section_general', 'local_nexusai'),
        ''
    ));

    // Switch maestro on/off.
    $settings->add(new admin_setting_configcheckbox(
        'local_nexusai/enabled',
        get_string('apienabled', 'local_nexusai'),
        get_string('apienabled_desc', 'local_nexusai'),
        1
    ));

    // ----- Sección backend -----
    $settings->add(new admin_setting_heading(
        'local_nexusai/section_backend',
        get_string('section_backend', 'local_nexusai'),
        get_string('section_backend_desc', 'local_nexusai')
    ));

    // URL del backend Python.
    $settings->add(new admin_setting_configtext(
        'local_nexusai/api_endpoint',
        get_string('apiendpoint', 'local_nexusai'),
        get_string('apiendpoint_desc', 'local_nexusai'),
        'http://localhost:8001',
        PARAM_RAW
    ));

    // Bearer API key del backend (capa 1 de auth — ver ADR-005).
    // Usamos passwordunmask para que el valor quede oculto en la UI tras guardar.
    $settings->add(new admin_setting_configpasswordunmask(
        'local_nexusai/api_key',
        get_string('apikey', 'local_nexusai'),
        get_string('apikey_desc', 'local_nexusai'),
        ''
    ));

    // Shared secret HMAC (capa 2 de auth — ver ADR-005).
    $settings->add(new admin_setting_configpasswordunmask(
        'local_nexusai/shared_secret',
        get_string('sharedsecret', 'local_nexusai'),
        get_string('sharedsecret_desc', 'local_nexusai'),
        ''
    ));

    $ADMIN->add('localplugins', $settings);

    // Página de administración con health check del backend.
    $ADMIN->add('localplugins', new admin_externalpage(
        'local_nexusai_admin',
        get_string('admin_page_title', 'local_nexusai'),
        new moodle_url('/local/nexusai/admin.php'),
        'moodle/site:config'
    ));
}
