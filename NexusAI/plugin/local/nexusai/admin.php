<?php
// This file is part of the NexusAI plugin for Moodle.

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

// ============================================================
// Health check al backend
// ============================================================

$endpoint = rtrim((string) get_config('local_nexusai', 'api_endpoint'), '/');
$healthurl = $endpoint . '/health';

$health_status  = null;  // 'ok' | 'error' | 'unconfigured'
$health_data    = [];
$health_error   = '';
$health_latency = null;

if (empty($endpoint)) {
    $health_status = 'unconfigured';
} else {
    $curl = new \curl();
    $curl->setopt([
        'CURLOPT_TIMEOUT'        => 10,
        'CURLOPT_CONNECTTIMEOUT' => 5,
        'CURLOPT_RETURNTRANSFER' => true,
    ]);

    $t_start   = microtime(true);
    $response  = $curl->get($healthurl);
    $t_end     = microtime(true);
    $http_info = $curl->get_info();
    $curl_err  = $curl->get_errno();

    $health_latency = round(($t_end - $t_start) * 1000);

    if ($curl_err || empty($http_info['http_code'])) {
        $health_status = 'error';
        $health_error  = $curl->error ?: 'curl error #' . $curl_err;
    } elseif ((int)$http_info['http_code'] !== 200) {
        $health_status = 'error';
        $health_error  = 'HTTP ' . $http_info['http_code'];
    } else {
        $decoded = json_decode($response, true);
        if (is_array($decoded)) {
            $health_status = 'ok';
            $health_data   = $decoded;
        } else {
            $health_status = 'error';
            $health_error  = 'Respuesta inválida (no JSON)';
        }
    }
}

// ============================================================
// Output
// ============================================================

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('admin_page_title', 'local_nexusai'));

// --- Tarjeta de estado del backend ---
$status_icon  = '';
$status_class = '';
$status_label = '';

if ($health_status === 'ok') {
    $status_icon  = '✅';
    $status_class = 'alert-success';
    $status_label = 'Conectado';
} elseif ($health_status === 'unconfigured') {
    $status_icon  = '⚙️';
    $status_class = 'alert-warning';
    $status_label = 'Sin configurar';
} else {
    $status_icon  = '❌';
    $status_class = 'alert-danger';
    $status_label = 'Error de conexión';
}

?>
<div class="container-fluid nexusai-admin">
    <div class="row mb-4">
        <div class="col-md-8">

            <!-- Estado del backend -->
            <div class="card mb-3">
                <div class="card-header d-flex align-items-center justify-content-between">
                    <strong>Estado del backend</strong>
                    <a href="<?php echo $PAGE->url->out(); ?>" class="btn btn-sm btn-outline-secondary">
                        Verificar de nuevo
                    </a>
                </div>
                <div class="card-body">
                    <div class="alert <?php echo $status_class; ?> mb-0" role="alert">
                        <span style="font-size:1.2em"><?php echo $status_icon; ?></span>
                        <strong><?php echo $status_label; ?></strong>
                        <?php if ($health_status === 'ok'): ?>
                            — latencia <strong><?php echo $health_latency; ?> ms</strong>
                            <?php if (!empty($health_data['version'])): ?>
                                · versión backend <code><?php echo s($health_data['version']); ?></code>
                            <?php endif; ?>
                        <?php elseif ($health_status === 'error'): ?>
                            — <?php echo s($health_error); ?>
                        <?php else: ?>
                            — Configurá el endpoint en
                            <a href="<?php echo (new moodle_url('/admin/settings.php', ['section' => 'local_nexusai']))->out(); ?>">
                                Configuración del plugin
                            </a>
                        <?php endif; ?>
                    </div>

                    <?php if ($health_status === 'ok' && !empty($health_data)): ?>
                    <table class="table table-sm mt-3 mb-0">
                        <tbody>
                            <?php foreach ($health_data as $key => $val): ?>
                            <tr>
                                <td class="text-muted" style="width:180px"><code><?php echo s($key); ?></code></td>
                                <td><?php echo s(is_array($val) ? json_encode($val) : (string)$val); ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <?php endif; ?>
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
                                <td>
                                    <?php echo get_config('local_nexusai', 'enabled') ? '✅ Sí' : '❌ No'; ?>
                                </td>
                            </tr>
                            <tr>
                                <td class="text-muted">API endpoint</td>
                                <td>
                                    <?php
                                    $ep = get_config('local_nexusai', 'api_endpoint');
                                    echo empty($ep) ? '<em class="text-muted">no configurado</em>' : s($ep);
                                    ?>
                                </td>
                            </tr>
                            <tr>
                                <td class="text-muted">API key</td>
                                <td>
                                    <?php
                                    $ak = get_config('local_nexusai', 'api_key');
                                    echo empty($ak) ? '<em class="text-muted">no configurado</em>' : '●●●●●●●● (configurado)';
                                    ?>
                                </td>
                            </tr>
                            <tr>
                                <td class="text-muted">Shared secret</td>
                                <td>
                                    <?php
                                    $ss = get_config('local_nexusai', 'shared_secret');
                                    echo empty($ss) ? '<em class="text-muted">no configurado</em>' : '●●●●●●●● (configurado)';
                                    ?>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="mt-2">
                        <a href="<?php echo (new moodle_url('/admin/settings.php', ['section' => 'local_nexusai']))->out(); ?>"
                           class="btn btn-sm btn-primary">
                            Editar configuración
                        </a>
                    </div>
                </div>
            </div>

        </div>
    </div>
</div>

<?php
echo $OUTPUT->footer();
