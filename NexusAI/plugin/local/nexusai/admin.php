<?php
// This file is part of Moodle - https://moodle.org/
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
 * NexusAI administration page with backend status check.
 *
 * Accessible from: Site administration → Plugins → Local plugins → NexusAI
 * (the link is defined in settings.php via $ADMIN->add).
 *
 * Also directly reachable from the plugin via URL:
 *   /local/nexusai/admin.php
 *
 * Performs a GET /health against the configured backend and shows:
 *   - Connection status (OK / Error)
 *   - Backend version
 *   - Ping latency
 *   - Current config (endpoint, without credentials)
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/adminlib.php');
require_once($CFG->libdir . '/filelib.php');

// Only site admins can view this page.
require_login();
require_capability('moodle/site:config', context_system::instance());

admin_externalpage_setup('local_nexusai_admin');

$PAGE->set_url(new moodle_url('/local/nexusai/admin.php'));
$PAGE->set_title(get_string('admin_page_title', 'local_nexusai'));
$PAGE->set_heading(get_string('admin_page_title', 'local_nexusai'));

// Health check against the backend.

$endpoint = rtrim(trim((string) get_config('local_nexusai', 'api_endpoint')), '/');
$healthurl = $endpoint . '/health';

// Possible backend states: connected, error, or unconfigured.
$healthstatus  = null;
$healthdata    = [];
$healtherror   = '';
$healthlatency = null;

if (empty($endpoint)) {
    $healthstatus = 'unconfigured';
} else {
    $curl = new \curl();
    $curl->setopt([
        'CURLOPT_TIMEOUT'        => 10,
        'CURLOPT_CONNECTTIMEOUT' => 5,
        'CURLOPT_RETURNTRANSFER' => true,
    ]);

    $tstart   = microtime(true);
    $response = $curl->get($healthurl);
    $tend     = microtime(true);
    $httpinfo = $curl->get_info();
    $curlerr  = $curl->get_errno();

    $healthlatency = round(($tend - $tstart) * 1000);

    if ($curlerr || empty($httpinfo['http_code'])) {
        $healthstatus = 'error';
        $healtherror  = $curl->error ?: 'curl error #' . $curlerr;
    } else if ((int)$httpinfo['http_code'] !== 200) {
        $healthstatus = 'error';
        $healtherror  = 'HTTP ' . $httpinfo['http_code'];
    } else {
        $decoded = json_decode($response, true);
        if (is_array($decoded)) {
            $healthstatus = 'ok';
            $healthdata   = $decoded;
        } else {
            $healthstatus = 'error';
            $healtherror  = get_string('admin_health_invalid_response', 'local_nexusai');
        }
    }
}

// Output.

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('admin_page_title', 'local_nexusai'));

// Backend status card and active configuration, rendered by
// templates/admin_status.mustache.
if ($healthstatus === 'ok') {
    $statusicon  = '✅';
    $statusclass = 'alert-success';
    $statuslabel = get_string('admin_status_connected', 'local_nexusai');
} else if ($healthstatus === 'unconfigured') {
    $statusicon  = '⚙️';
    $statusclass = 'alert-warning';
    $statuslabel = get_string('admin_status_unconfigured', 'local_nexusai');
} else {
    $statusicon  = '❌';
    $statusclass = 'alert-danger';
    $statuslabel = get_string('admin_status_error', 'local_nexusai');
}

$settingsurl = new moodle_url('/admin/settings.php', ['section' => 'local_nexusai']);

if ($healthstatus === 'ok') {
    $statusdetail = '— ' . get_string('admin_health_latency', 'local_nexusai', s($healthlatency));
    if (!empty($healthdata['version'])) {
        $statusdetail .= ' · ' . get_string('admin_health_version', 'local_nexusai', s($healthdata['version']));
    }
} else if ($healthstatus === 'error') {
    $statusdetail = '— ' . s($healtherror);
} else {
    $statusdetail = '— ' . get_string('admin_health_configure_prompt', 'local_nexusai', $settingsurl->out());
}

$healthrows = [];
if ($healthstatus === 'ok') {
    foreach ($healthdata as $key => $val) {
        $healthrows[] = ['key' => (string) $key, 'value' => is_array($val) ? json_encode($val) : (string) $val];
    }
}

$enabled = (bool) get_config('local_nexusai', 'enabled');
$endpointvalue = (string) get_config('local_nexusai', 'api_endpoint');
$valuemasked = get_string('admin_value_masked', 'local_nexusai');
$configrows = [
    [
        'label'   => get_string('admin_plugin_enabled', 'local_nexusai'),
        'value'   => $enabled ? '✅ ' . get_string('yes') : '❌ ' . get_string('no'),
        'missing' => false,
    ],
    [
        'label'   => get_string('apiendpoint', 'local_nexusai'),
        'value'   => $endpointvalue,
        'missing' => $endpointvalue === '',
    ],
    [
        'label'   => get_string('apikey', 'local_nexusai'),
        'value'   => $valuemasked,
        'missing' => empty(get_config('local_nexusai', 'api_key')),
    ],
    [
        'label'   => get_string('sharedsecret', 'local_nexusai'),
        'value'   => $valuemasked,
        'missing' => empty(get_config('local_nexusai', 'shared_secret')),
    ],
];

echo $OUTPUT->render_from_template('local_nexusai/admin_status', [
    'refreshurl'    => $PAGE->url->out(false),
    'settingsurl'   => $settingsurl->out(false),
    'statusclass'   => $statusclass,
    'statusicon'    => $statusicon,
    'statuslabel'   => $statuslabel,
    'statusdetail'  => $statusdetail,
    'hashealthrows' => !empty($healthrows),
    'healthrows'    => $healthrows,
    'configrows'    => $configrows,
]);

echo $OUTPUT->footer();
