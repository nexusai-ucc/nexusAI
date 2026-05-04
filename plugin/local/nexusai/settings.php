<?php
defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_nexusai', get_string('pluginname', 'local_nexusai'));
    $ADMIN->add('localplugins', $settings);

    $settings->add(new admin_setting_configtext(
        'local_nexusai/backendurl',
        get_string('setting_backendurl', 'local_nexusai'),
        get_string('setting_backendurl_desc', 'local_nexusai'),
        'http://localhost:8001'
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_nexusai/sharedsecret',
        get_string('setting_sharedsecret', 'local_nexusai'),
        get_string('setting_sharedsecret_desc', 'local_nexusai'),
        ''
    ));
}
