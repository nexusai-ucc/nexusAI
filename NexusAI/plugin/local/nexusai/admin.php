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

$endpoint = rtrim((string) get_config('local_nexusai', 'api_endpoint'), '/');
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

// Backend status card.
// The HTML is built as a string and echoed once, instead of closing and
// reopening the <?php tag repeatedly: in files that mix HTML+PHP that way,
// moodle-cs treats each reopening as if it needed its own file docblock
// (moodle.Commenting.MissingDocblock.File), which generated ~26 false
// positives here.
$statusicon  = '';
$statusclass = '';
$statuslabel = '';

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

$healthtablerows = '';
if ($healthstatus === 'ok' && !empty($healthdata)) {
    foreach ($healthdata as $key => $val) {
        $displayval = is_array($val) ? json_encode($val) : (string) $val;
        $healthtablerows .= '<tr>'
            . '<td class="text-muted" style="width:180px"><code>' . s($key) . '</code></td>'
            . '<td>' . s($displayval) . '</td>'
            . '</tr>';
    }
}
$healthtable = '';
if ($healthtablerows !== '') {
    $healthtable = '<table class="table table-sm mt-3 mb-0"><tbody>' . $healthtablerows . '</tbody></table>';
}

$enabledlabel = get_config('local_nexusai', 'enabled')
    ? '✅ ' . get_string('yes')
    : '❌ ' . get_string('no');

$notconfigured = '<em class="text-muted">' . get_string('admin_status_unconfigured', 'local_nexusai') . '</em>';
$valuemasked = get_string('admin_value_masked', 'local_nexusai');

$endpointvalue = get_config('local_nexusai', 'api_endpoint');
$endpointlabel = empty($endpointvalue) ? $notconfigured : s($endpointvalue);

$apikeyvalue = get_config('local_nexusai', 'api_key');
$apikeylabel = empty($apikeyvalue) ? $notconfigured : $valuemasked;

$sharedsecretvalue = get_config('local_nexusai', 'shared_secret');
$sharedsecretlabel = empty($sharedsecretvalue) ? $notconfigured : $valuemasked;

echo '
<div class="container-fluid nexusai-admin">
    <div class="row mb-4">
        <div class="col-md-8">

            <!-- Backend status -->
            <div class="card mb-3">
                <div class="card-header d-flex align-items-center justify-content-between">
                    <strong>' . get_string('admin_backend_status', 'local_nexusai') . '</strong>
                    <a href="' . $PAGE->url->out() . '" class="btn btn-sm btn-outline-secondary">
                        ' . get_string('admin_check_again', 'local_nexusai') . '
                    </a>
                </div>
                <div class="card-body">
                    <div class="alert ' . $statusclass . ' mb-0" role="alert">
                        <span style="font-size:1.2em">' . $statusicon . '</span>
                        <strong>' . $statuslabel . '</strong>
                        ' . $statusdetail . '
                    </div>
                    ' . $healthtable . '
                </div>
            </div>

            <!-- Active configuration (without credentials) -->
            <div class="card mb-3">
                <div class="card-header">
                    <strong>' . get_string('admin_active_config', 'local_nexusai') . '</strong>
                </div>
                <div class="card-body">
                    <table class="table table-sm mb-0">
                        <tbody>
                            <tr>
                                <td class="text-muted" style="width:180px">' . get_string('admin_plugin_enabled', 'local_nexusai') . '</td>
                                <td>' . $enabledlabel . '</td>
                            </tr>
                            <tr>
                                <td class="text-muted">API endpoint</td>
                                <td>' . $endpointlabel . '</td>
                            </tr>
                            <tr>
                                <td class="text-muted">API key</td>
                                <td>' . $apikeylabel . '</td>
                            </tr>
                            <tr>
                                <td class="text-muted">Shared secret</td>
                                <td>' . $sharedsecretlabel . '</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="mt-2">
                        <a href="' . $settingsurl->out() . '" class="btn btn-sm btn-primary">
                            ' . get_string('admin_edit_config', 'local_nexusai') . '
                        </a>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>
';

echo $OUTPUT->footer();
