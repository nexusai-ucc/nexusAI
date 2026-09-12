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
 * Página de administración de NexusAI con verificación del estado del backend.
 *
 * Accesible desde: Site administration → Plugins → Local plugins → NexusAI
 * (el link se define en settings.php como $ADMIN->add).
 *
 * También se puede acceder directamente desde el plugin via URL:
 *   /local/nexusai/admin.php
 *
 * Realiza un GET /health al backend configurado y muestra:
 *   - Estado de conexión (OK / Error)
 *   - Versión del backend
 *   - Latencia del ping
 *   - Config actual (endpoint, sin credenciales)
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/adminlib.php');
require_once($CFG->libdir . '/filelib.php');

// Solo admins del sitio pueden ver esta página.
require_login();
require_capability('moodle/site:config', context_system::instance());

admin_externalpage_setup('local_nexusai_admin');

$PAGE->set_url(new moodle_url('/local/nexusai/admin.php'));
$PAGE->set_title(get_string('admin_page_title', 'local_nexusai'));
$PAGE->set_heading(get_string('admin_page_title', 'local_nexusai'));

// Health check al backend.

$endpoint = rtrim((string) get_config('local_nexusai', 'api_endpoint'), '/');
$healthurl = $endpoint . '/health';

// Estado posible del backend: conectado, con error, o sin configurar.
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
            $healtherror  = 'Respuesta inválida (no JSON)';
        }
    }
}

// Output.

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('admin_page_title', 'local_nexusai'));

// Tarjeta de estado del backend.
// El HTML se arma como string y se hace un único echo, en vez de cortar y
// reabrir el tag <?php varias veces: con archivos que mezclan HTML+PHP así,
// moodle-cs interpreta cada reapertura como si necesitara su propio docblock
// de archivo (moodle.Commenting.MissingDocblock.File), lo cual generaba ~26
// falsos positivos acá.
$statusicon  = '';
$statusclass = '';
$statuslabel = '';

if ($healthstatus === 'ok') {
    $statusicon  = '✅';
    $statusclass = 'alert-success';
    $statuslabel = 'Conectado';
} else if ($healthstatus === 'unconfigured') {
    $statusicon  = '⚙️';
    $statusclass = 'alert-warning';
    $statuslabel = 'Sin configurar';
} else {
    $statusicon  = '❌';
    $statusclass = 'alert-danger';
    $statuslabel = 'Error de conexión';
}

$settingsurl = new moodle_url('/admin/settings.php', ['section' => 'local_nexusai']);

if ($healthstatus === 'ok') {
    $statusdetail = '— latencia <strong>' . s($healthlatency) . ' ms</strong>';
    if (!empty($healthdata['version'])) {
        $statusdetail .= ' · versión backend <code>' . s($healthdata['version']) . '</code>';
    }
} else if ($healthstatus === 'error') {
    $statusdetail = '— ' . s($healtherror);
} else {
    $statusdetail = '— Configurá el endpoint en <a href="' . $settingsurl->out() . '">Configuración del plugin</a>';
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

$enabledlabel = get_config('local_nexusai', 'enabled') ? '✅ Sí' : '❌ No';

$endpointvalue = get_config('local_nexusai', 'api_endpoint');
$endpointlabel = empty($endpointvalue) ? '<em class="text-muted">no configurado</em>' : s($endpointvalue);

$apikeyvalue = get_config('local_nexusai', 'api_key');
$apikeylabel = empty($apikeyvalue) ? '<em class="text-muted">no configurado</em>' : '●●●●●●●● (configurado)';

$sharedsecretvalue = get_config('local_nexusai', 'shared_secret');
$sharedsecretlabel = empty($sharedsecretvalue) ? '<em class="text-muted">no configurado</em>' : '●●●●●●●● (configurado)';

echo '
<div class="container-fluid nexusai-admin">
    <div class="row mb-4">
        <div class="col-md-8">

            <!-- Estado del backend -->
            <div class="card mb-3">
                <div class="card-header d-flex align-items-center justify-content-between">
                    <strong>Estado del backend</strong>
                    <a href="' . $PAGE->url->out() . '" class="btn btn-sm btn-outline-secondary">
                        Verificar de nuevo
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

            <!-- Configuración activa (sin credenciales) -->
            <div class="card mb-3">
                <div class="card-header">
                    <strong>Configuración activa</strong>
                </div>
                <div class="card-body">
                    <table class="table table-sm mb-0">
                        <tbody>
                            <tr>
                                <td class="text-muted" style="width:180px">Plugin habilitado</td>
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
                            Editar configuración
                        </a>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>
';

echo $OUTPUT->footer();
