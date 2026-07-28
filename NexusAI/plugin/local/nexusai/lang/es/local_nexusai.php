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
$string['chatwidget_navtrigger']   = 'Asistente NexusAI';

// Página de administración con health check.
$string['admin_page_title']        = 'NexusAI · Panel de administración';

// Vista docente — gestión de documentos.
$string['documents_page_title']    = 'NexusAI · Material';
$string['documents_page_noscript'] = 'Esta página requiere JavaScript habilitado para gestionar el material indexado por el asistente NexusAI.';

// Prompt de confirmación al subir archivo a sección del curso.
$string['upload_prompt_title']   = 'NexusAI — nuevo material';
$string['upload_prompt_body']    = '¿Querés indexar <strong>{$a}</strong> en los materiales de NexusAI para que los alumnos puedan consultarlo en el asistente?';
$string['upload_prompt_yes']     = 'Sí, agregar';
$string['upload_prompt_no']      = 'No por ahora';
$string['upload_prompt_success'] = '"{$a}" fue agregado a NexusAI correctamente.';
$string['upload_prompt_error']   = 'No se pudo indexar el archivo en NexusAI. Podés intentarlo desde la sección de materiales.';

// Notificaciones — material nuevo subido (CAL-03, issue #239).
$string['messageprovider:newmaterial'] = 'Material nuevo subido a un curso';
$string['newmaterial_subject']         = 'Nuevo material en {$a}';
$string['newmaterial_body']            = 'Se subió un nuevo archivo "{$a->filename}" al curso {$a->course}. Ya podés consultarlo con el asistente NexusAI.';
$string['newmaterial_body_html']       = 'Se subió un nuevo archivo <strong>{$a->filename}</strong> al curso <strong>{$a->course}</strong>. Ya podés consultarlo con el asistente NexusAI.';
$string['newmaterial_small']           = 'Nuevo material: {$a}';

// Privacy API.
$string['privacy:metadata'] = 'El plugin NexusAI no almacena datos personales en Moodle. El historial de chat vive en el servicio backend externo de NexusAI.';
