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
$string['apiendpoint']             = 'URL del backend';
$string['apiendpoint_desc']        = 'URL base del backend Python de NexusAI (ej: http://localhost:8001).';
$string['apienabled']              = 'Activar NexusAI';
$string['apienabled_desc']         = 'Switch maestro. Desactivar para ocultar el chat en todo el sitio.';

// UI strings.
$string['chatwidget_title']        = 'Asistente NexusAI';
$string['chatwidget_placeholder']  = 'Preguntá lo que quieras sobre esta materia...';
$string['chatwidget_send']         = 'Enviar';
$string['chatwidget_loading']      = 'Cargando...';
$string['chatwidget_error']        = 'Algo salió mal. Intentá de nuevo en un momento.';

// Privacy API.
$string['privacy:metadata'] = 'El plugin NexusAI no almacena datos personales en Moodle. El historial de chat vive en el servicio backend externo de NexusAI.';
