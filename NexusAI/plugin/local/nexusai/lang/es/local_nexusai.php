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

$string['admin_active_config'] = 'Configuración activa';
$string['admin_backend_status'] = 'Estado del backend';
$string['admin_check_again'] = 'Verificar de nuevo';
$string['admin_edit_config'] = 'Editar configuración';
$string['admin_health_configure_prompt'] = 'Configurá el endpoint en <a href="{$a}">Configuración del plugin</a>';
$string['admin_health_invalid_response'] = 'Respuesta inválida (no JSON)';
$string['admin_health_latency'] = 'latencia <strong>{$a} ms</strong>';
$string['admin_health_version'] = 'versión backend <code>{$a}</code>';
$string['admin_page_title'] = 'NexusAI · Panel de administración';
$string['admin_plugin_enabled'] = 'Plugin habilitado';
$string['admin_status_connected'] = 'Conectado';
$string['admin_status_error'] = 'Error de conexión';
$string['admin_status_unconfigured'] = 'Sin configurar';
$string['admin_value_masked'] = '●●●●●●●● (configurado)';
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
$string['course_enabled'] = 'Usar NexusAI en este curso';
$string['course_enabled_help'] = 'Con la opción activada, los alumnos de este curso pueden usar el asistente NexusAI, los quizzes, las flashcards y el resto de las herramientas. Desactivada, NexusAI desaparece para todos los alumnos del curso y no se hace ninguna consulta en su nombre. No se borra nada: el historial del chat, las preguntas y los documentos vuelven cuando lo activás de nuevo.';
$string['course_enabled_saved_off'] = 'NexusAI quedó desactivado en este curso.';
$string['course_enabled_saved_on'] = 'NexusAI quedó activado en este curso.';
$string['course_settings_intro'] = 'Elegí si NexusAI está disponible en este curso. Vale para todos los alumnos del curso.';
$string['course_settings_title'] = 'NexusAI en este curso';
$string['course_site_disabled'] = 'El administrador desactivó NexusAI en todo el sitio, así que no va a funcionar en este curso aunque lo actives acá.';
$string['coursedisabled'] = 'NexusAI está desactivado en este curso.';
$string['default_course_enabled'] = 'Activado por defecto en los cursos';
$string['default_course_enabled_desc'] = 'Si los cursos que no tienen su propia configuración usan NexusAI. Viene desactivado, para poder activar los cursos de a uno (los docentes desde la configuración del curso, o con el script cli/enable_course.php).';
$string['documents_page_noscript'] = 'Esta página requiere JavaScript habilitado para gestionar el material indexado por el asistente NexusAI.';
$string['documents_page_title'] = 'NexusAI · Material';
$string['erroraccessdenied'] = 'Acceso denegado';
$string['errorbackend'] = 'Error del backend NexusAI: {$a}';
$string['errorbackendunreachable'] = 'No se puede contactar el backend NexusAI: {$a}. Verificá la URL, la red y que el contenedor del backend esté corriendo.';
$string['errorconfigmissing'] = 'La configuración de NexusAI está incompleta. Falta: {$a}. Completala en Administración del sitio → Plugins → Plugins locales → NexusAI.';
$string['errorcourseidrequired'] = 'courseid requerido';
$string['errorcoursenotfound'] = 'Curso no encontrado.';
$string['errorfeednotfound'] = 'Feed no encontrado. Puede que la suscripción haya sido revocada.';
$string['errorfilenotavailable'] = 'El archivo no está disponible. Para habilitarlo, eliminá y volvé a subir el documento desde la sección Documentos del plugin.';
$string['errorinvalidfilename'] = 'filename inválido';
$string['errorinvalidparams'] = 'Parámetros inválidos.';
$string['errorusernotenrolled'] = 'El alumno de este feed no está matriculado en el curso.';
$string['event_course_settings_updated'] = 'Configuración de NexusAI del curso actualizada';
$string['forum_similar_close'] = 'Cerrar aviso';
$string['forum_similar_found'] = 'Ya existe una discusión similar ({$a}% de similitud):';
$string['forum_similar_more'] = 'y {$a} más';
$string['forum_similar_view'] = 'Ver discusión';
$string['forum_suggest_button'] = 'Sugerir respuesta';
$string['forum_suggest_close'] = 'Cerrar sugerencia';
$string['forum_suggest_empty'] = 'NexusAI: no se pudo generar una sugerencia.';
$string['forum_suggest_error'] = 'NexusAI: error al generar la sugerencia. Intentá de nuevo.';
$string['forum_suggest_material'] = 'Con material del curso';
$string['forum_suggest_title'] = 'NexusAI sugiere:';
$string['forum_suggest_use'] = 'Usar esta respuesta';
$string['forum_suggest_working'] = 'Generando…';
$string['forum_summary_button'] = 'Resumir hilo';
$string['forum_summary_close'] = 'Cerrar resumen';
$string['forum_summary_error'] = 'NexusAI: no se pudo resumir el hilo. Intentá de nuevo.';
$string['forum_summary_keypoints'] = 'Puntos clave';
$string['forum_summary_loading'] = 'Resumiendo hilo';
$string['forum_summary_resolved'] = 'Discusión resuelta';
$string['forum_summary_title'] = 'NexusAI — Resumen del hilo';
$string['forum_summary_truncated'] = 'El hilo es largo — se resumieron los primeros {$a} posts.';
$string['forum_summary_unresolved'] = 'Sin respuesta definitiva';
$string['forum_summary_working'] = 'Resumiendo…';
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
$string['privacy:metadata:local_nexusai_course'] = 'Si cada curso usa NexusAI y quién lo cambió por última vez.';
$string['privacy:metadata:local_nexusai_course:timemodified'] = 'Cuándo se cambió la configuración por última vez.';
$string['privacy:metadata:local_nexusai_course:usermodified'] = 'El usuario que cambió la configuración por última vez.';
$string['privacy:metadata:nexusai_backend'] = 'Para brindar el asistente académico, NexusAI envía y almacena datos personales en su servicio backend externo (fuera de Moodle).';
$string['privacy:metadata:nexusai_backend:content'] = 'El contenido enviado: texto de los mensajes de chat, respuestas de quiz.';
$string['privacy:metadata:nexusai_backend:course_id'] = 'El ID del curso en el que se generó el dato.';
$string['privacy:metadata:nexusai_backend:created_at'] = 'La fecha y hora en la que se generó el dato.';
$string['privacy:metadata:nexusai_backend:user_id'] = 'El ID de usuario de Moodle, para identificar de quién es cada mensaje/intento.';
$string['section_backend'] = 'Conexión con el backend';
$string['section_backend_desc'] = 'Configurá cómo el plugin se autentica contra el backend Python de NexusAI. Ver ADR-005 en el repositorio.';
$string['section_courses'] = 'Cursos';
$string['section_courses_desc'] = 'Dónde está disponible NexusAI.';
$string['section_general'] = 'General';
$string['section_notifications'] = 'Notificaciones';
$string['section_notifications_desc'] = 'Email remitente de las alertas de calendario y notificaciones del plugin.';
$string['settings'] = 'Configuración de NexusAI';
$string['sharedsecret'] = 'Shared secret (HMAC)';
$string['sharedsecret_desc'] = 'Secreto que firma cada request con HMAC-SHA256. Generar con: openssl rand -hex 32. Tiene que coincidir con NEXUSAI_SHARED_SECRET en el backend.';
$string['show_outside_course'] = 'Mostrar fuera de un curso';
$string['show_outside_course_desc'] = 'Muestra el widget y el ícono de NexusAI en las páginas que no son un curso (tablero, página principal, pantalla de crear curso). Viene desactivado.';
$string['upload_prompt_body'] = '¿Querés indexar <strong>{$a}</strong> en los materiales de NexusAI para que los alumnos puedan consultarlo en el asistente?';
$string['upload_prompt_error'] = 'No se pudo indexar el archivo en NexusAI. Podés intentarlo desde la sección de materiales.';
$string['upload_prompt_no'] = 'No por ahora';
$string['upload_prompt_success'] = '"{$a}" fue agregado a NexusAI correctamente.';
$string['upload_prompt_title'] = 'NexusAI — nuevo material';
$string['upload_prompt_yes'] = 'Sí, agregar';
