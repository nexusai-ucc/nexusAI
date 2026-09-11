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

$string['admin_page_title'] = 'NexusAI · Panel de administración';
$string['alert_from_email'] = 'Email remitente de alertas';
$string['alert_from_email_desc'] = 'Dirección que aparece como remitente en los mails de alerta de calendario NexusAI. Si se deja vacío se usa el "noreply" global de Moodle (Site administration → Server → Email).';
$string['apienabled'] = 'Activar NexusAI';
$string['apienabled_desc'] = 'Switch maestro. Desactivar para ocultar el chat en todo el sitio.';
$string['apiendpoint'] = 'URL del backend';
$string['apiendpoint_desc'] = 'URL base del backend Python de NexusAI (ej: http://localhost:8001).';
$string['apikey'] = 'API key';
$string['apikey_desc'] = 'Bearer API key que va en el header Authorization. Generar con: openssl rand -hex 32. Tiene que coincidir con NEXUSAI_API_KEY en el backend.';
$string['cal_alert_body'] = 'Tu evento "{$a}" vence pronto. Revisá el calendario del curso en NexusAI.';
$string['cal_alert_subject'] = 'Recordatorio: {$a}';
$string['chatwidget_error'] = 'Algo salió mal. Intentá de nuevo en un momento.';
$string['chatwidget_loading'] = 'Cargando...';
$string['chatwidget_navtrigger'] = 'Asistente NexusAI';
$string['chatwidget_placeholder'] = 'Preguntá lo que quieras sobre esta materia...';
$string['chatwidget_send'] = 'Enviar';
$string['chatwidget_title'] = 'Asistente NexusAI';
$string['documents_page_noscript'] = 'Esta página requiere JavaScript habilitado para gestionar el material indexado por el asistente NexusAI.';
$string['documents_page_title'] = 'NexusAI · Material';
$string['errorbackend'] = 'Error del backend NexusAI: {$a}';
$string['errorbackendunreachable'] = 'No se puede contactar el backend NexusAI: {$a}. Verificá la URL, la red y que el contenedor del backend esté corriendo.';
$string['errorconfigmissing'] = 'La configuración de NexusAI está incompleta. Falta: {$a}. Completala en Administración del sitio → Plugins → Plugins locales → NexusAI.';
$string['messageprovider:cal_alert'] = 'Alertas de calendario NexusAI';
$string['messageprovider:newmaterial'] = 'Material nuevo subido a un curso';
$string['newmaterial_body'] = 'Se subió un nuevo archivo "{$a->filename}" al curso {$a->course}. Ya podés consultarlo con el asistente NexusAI.';
$string['newmaterial_body_html'] = 'Se subió un nuevo archivo <strong>{$a->filename}</strong> al curso <strong>{$a->course}</strong>. Ya podés consultarlo con el asistente NexusAI.';
$string['newmaterial_small'] = 'Nuevo material: {$a}';
$string['newmaterial_subject'] = 'Nuevo material en {$a}';
$string['nexusai:manage'] = 'Gestionar materiales del curso para indexación con NexusAI';
$string['nexusai:use'] = 'Usar el asistente NexusAI en un curso';
$string['nexusai:viewanalytics'] = 'Ver el dashboard de analytics de NexusAI';
$string['pluginname'] = 'NexusAI';
$string['privacy:metadata:nexusai_backend'] = 'Para brindar el asistente académico, NexusAI envía y almacena datos personales en su servicio backend externo (fuera de Moodle).';
$string['privacy:metadata:nexusai_backend:content'] = 'El contenido enviado: texto de los mensajes de chat, respuestas de quiz.';
$string['privacy:metadata:nexusai_backend:course_id'] = 'El ID del curso en el que se generó el dato.';
$string['privacy:metadata:nexusai_backend:created_at'] = 'La fecha y hora en la que se generó el dato.';
$string['privacy:metadata:nexusai_backend:user_id'] = 'El ID de usuario de Moodle, para identificar de quién es cada mensaje/intento.';
$string['section_backend'] = 'Conexión con el backend';
$string['section_backend_desc'] = 'Configurá cómo el plugin se autentica contra el backend Python de NexusAI. Ver ADR-005 en el repositorio.';
$string['section_general'] = 'General';
$string['section_notifications'] = 'Notificaciones';
$string['section_notifications_desc'] = 'Email remitente de las alertas de calendario y notificaciones del plugin.';
$string['settings'] = 'Configuración de NexusAI';
$string['sharedsecret'] = 'Shared secret (HMAC)';
$string['sharedsecret_desc'] = 'Secreto que firma cada request con HMAC-SHA256. Generar con: openssl rand -hex 32. Tiene que coincidir con NEXUSAI_SHARED_SECRET en el backend.';
$string['upload_prompt_body'] = '¿Querés indexar <strong>{$a}</strong> en los materiales de NexusAI para que los alumnos puedan consultarlo en el asistente?';
$string['upload_prompt_error'] = 'No se pudo indexar el archivo en NexusAI. Podés intentarlo desde la sección de materiales.';
$string['upload_prompt_no'] = 'No por ahora';
$string['upload_prompt_success'] = '"{$a}" fue agregado a NexusAI correctamente.';
$string['upload_prompt_title'] = 'NexusAI — nuevo material';
$string['upload_prompt_yes'] = 'Sí, agregar';
