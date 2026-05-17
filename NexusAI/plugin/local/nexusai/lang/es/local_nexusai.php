<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Strings en español para local_nexusai.
 *
 * Mantener TODAS las claves sincronizadas con lang/en/local_nexusai.php.
 * Si agregás un string nuevo, agregalo en los DOS archivos o el inglés
 * se va a usar como fallback (y queda mezclado).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'NexusAI';

// Capabilities.
$string['nexusai:use']           = 'Usar el asistente NexusAI en un curso';
$string['nexusai:manage']        = 'Gestionar materiales del curso para indexación con NexusAI';
$string['nexusai:viewanalytics'] = 'Ver el dashboard de analytics de NexusAI';

// Página de settings (admin).
$string['settings']                = 'Configuración de NexusAI';
$string['section_general']         = 'General';
$string['section_backend']         = 'Conexión con el backend';
$string['section_backend_desc']    = 'Configurá cómo el plugin se autentica contra el backend Python de NexusAI. Ver ADR-005 en el repositorio.';
$string['apiendpoint']             = 'URL del backend';
$string['apiendpoint_desc']        = 'URL base del backend Python de NexusAI (ej: http://localhost:8001).';
$string['apienabled']              = 'Activar NexusAI';
$string['apienabled_desc']         = 'Switch maestro. Desactivar para ocultar el chat en todo el sitio.';
$string['apikey']                  = 'API key';
$string['apikey_desc']             = 'Bearer API key que va en el header Authorization. Generar con: openssl rand -hex 32. Tiene que coincidir con NEXUSAI_API_KEY en el backend.';
$string['sharedsecret']            = 'Shared secret (HMAC)';
$string['sharedsecret_desc']       = 'Secreto que firma cada request con HMAC-SHA256. Generar con: openssl rand -hex 32. Tiene que coincidir con NEXUSAI_SHARED_SECRET en el backend.';

// Errores de la external function (los usan backend_client + chat_send).
$string['errorconfigmissing']      = 'La configuración de NexusAI está incompleta. Falta: {$a}. Completala en Administración del sitio → Plugins → Plugins locales → NexusAI.';
$string['errorbackend']            = 'Error del backend NexusAI: {$a}';
$string['errorbackendunreachable'] = 'No se puede contactar el backend NexusAI: {$a}. Verificá la URL, la red y que el contenedor del backend esté corriendo.';

// UI strings.
$string['chatwidget_title']        = 'Asistente NexusAI';
$string['chatwidget_placeholder']  = 'Preguntá lo que quieras sobre esta materia...';
$string['chatwidget_send']         = 'Enviar';
$string['chatwidget_loading']      = 'Cargando...';
$string['chatwidget_error']        = 'Algo salió mal. Intentá de nuevo en un momento.';

// Página de administración con health check.
$string['admin_page_title']        = 'NexusAI · Panel de administración';

// Vista docente — gestión de documentos.
$string['documents_page_title']    = 'NexusAI · Material';
$string['documents_page_noscript'] = 'Esta página requiere JavaScript habilitado para gestionar el material indexado por el asistente NexusAI.';

// Privacy API.
$string['privacy:metadata'] = 'El plugin NexusAI no almacena datos personales en Moodle. El historial de chat vive en el servicio backend externo de NexusAI.';
