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
$string['budget_exhausted'] = 'Llegaste al límite de hoy. Se renueva a las {$a}.';
$string['budget_left'] = 'Te quedan unas {$a} preguntas hoy';
$string['budget_title'] = 'Tu límite del asistente';
$string['budget_warning'] = 'Usaste el {$a}% del límite de hoy.';
$string['cachedef_budget'] = 'Último presupuesto de tokens informado por el backend para cada usuario';
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
$string['errorfilenotavailable'] = 'Este documento no está vinculado a una actividad del curso. Quitalo de NexusAI y subilo de nuevo desde Materiales.';
$string['errorinvalidfilename'] = 'filename inválido';
$string['errorinvalidparams'] = 'Parámetros inválidos.';
$string['errormaterialhidden'] = 'Este material no está disponible para vos.';
$string['errorsessionnotfound'] = 'No se encontró la conversación.';
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
$string['materialsectioninvalid'] = 'La unidad elegida no existe en este curso.';
$string['materialtoolarge'] = 'El archivo supera el tamaño máximo de subida ({$a}).';
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
$string['privacy:metadata:local_nexusai_cal_alerts'] = 'Recordatorios que el usuario pidió antes de eventos del calendario.';
$string['privacy:metadata:local_nexusai_cal_alerts:courseid'] = 'El curso del evento.';
$string['privacy:metadata:local_nexusai_cal_alerts:daysbefore'] = 'Cuántos días antes del evento avisar.';
$string['privacy:metadata:local_nexusai_cal_alerts:eventname'] = 'El nombre del evento.';
$string['privacy:metadata:local_nexusai_cal_alerts:timecreated'] = 'Cuándo se creó el recordatorio.';
$string['privacy:metadata:local_nexusai_cal_alerts:userid'] = 'El usuario que pidió el recordatorio.';
$string['privacy:metadata:local_nexusai_chat_sessions'] = 'Conversaciones con el asistente NexusAI.';
$string['privacy:metadata:local_nexusai_chat_sessions:courseid'] = 'El curso donde se abrió la conversación.';
$string['privacy:metadata:local_nexusai_chat_sessions:courseids'] = 'Los cursos consultados, cuando la conversación abarcó varios cursos.';
$string['privacy:metadata:local_nexusai_chat_sessions:timecreated'] = 'Cuándo empezó la conversación.';
$string['privacy:metadata:local_nexusai_chat_sessions:userid'] = 'El usuario dueño de la conversación.';
$string['privacy:metadata:local_nexusai_course'] = 'Si cada curso usa NexusAI y quién lo cambió por última vez.';
$string['privacy:metadata:local_nexusai_course:timemodified'] = 'Cuándo se cambió la configuración por última vez.';
$string['privacy:metadata:local_nexusai_course:usermodified'] = 'El usuario que cambió la configuración por última vez.';
$string['privacy:metadata:local_nexusai_exams'] = 'Exámenes generados por docentes.';
$string['privacy:metadata:local_nexusai_exams:courseid'] = 'El curso del examen.';
$string['privacy:metadata:local_nexusai_exams:examdate'] = 'La fecha del examen.';
$string['privacy:metadata:local_nexusai_exams:params'] = 'Los documentos, temas y opciones elegidos para el examen.';
$string['privacy:metadata:local_nexusai_exams:timecreated'] = 'Cuándo se generó el examen.';
$string['privacy:metadata:local_nexusai_exams:userid'] = 'El docente que generó el examen.';
$string['privacy:metadata:local_nexusai_fc_reviews'] = 'Avance de repetición espaciada de cada flashcard.';
$string['privacy:metadata:local_nexusai_fc_reviews:easefactor'] = 'Qué tan fácil le resulta la flashcard al usuario.';
$string['privacy:metadata:local_nexusai_fc_reviews:timelastreviewed'] = 'Cuándo se repasó la flashcard por última vez.';
$string['privacy:metadata:local_nexusai_fc_reviews:timenextreview'] = 'Cuándo toca repasarla de nuevo.';
$string['privacy:metadata:local_nexusai_fc_reviews:userid'] = 'El usuario que repasa la flashcard.';
$string['privacy:metadata:local_nexusai_gaps'] = 'Preguntas que el material del curso no pudo responder, que se muestran a los docentes para mejorar el material.';
$string['privacy:metadata:local_nexusai_gaps:courseid'] = 'El curso de la pregunta.';
$string['privacy:metadata:local_nexusai_gaps:question'] = 'El texto de la pregunta.';
$string['privacy:metadata:local_nexusai_gaps:timecreated'] = 'Cuándo se hizo la pregunta.';
$string['privacy:metadata:local_nexusai_gaps:userid'] = 'El usuario que hizo la pregunta.';
$string['privacy:metadata:local_nexusai_interactions'] = 'Métricas de cada pregunta al asistente, sin su texto. Se conservan sin el usuario cuando se borran sus datos.';
$string['privacy:metadata:local_nexusai_interactions:courseid'] = 'El curso donde se hizo la pregunta.';
$string['privacy:metadata:local_nexusai_interactions:latencyms'] = 'Cuánto tardó la respuesta.';
$string['privacy:metadata:local_nexusai_interactions:questionchars'] = 'Largo de la pregunta.';
$string['privacy:metadata:local_nexusai_interactions:timecreated'] = 'Cuándo se hizo la pregunta.';
$string['privacy:metadata:local_nexusai_interactions:tokenscompletion'] = 'Tokens que escribió el proveedor de IA.';
$string['privacy:metadata:local_nexusai_interactions:tokensprompt'] = 'Tokens que leyó el proveedor de IA.';
$string['privacy:metadata:local_nexusai_interactions:userid'] = 'El usuario que preguntó.';
$string['privacy:metadata:local_nexusai_messages'] = 'Preguntas y respuestas de cada conversación.';
$string['privacy:metadata:local_nexusai_messages:content'] = 'El texto del mensaje.';
$string['privacy:metadata:local_nexusai_messages:role'] = 'Si el mensaje es una pregunta del usuario o una respuesta del asistente.';
$string['privacy:metadata:local_nexusai_messages:timecreated'] = 'Cuándo se envió el mensaje.';
$string['privacy:metadata:local_nexusai_messages:tokenscompletion'] = 'Tokens que escribió el proveedor de IA en la respuesta.';
$string['privacy:metadata:local_nexusai_messages:tokensprompt'] = 'Tokens que leyó el proveedor de IA para escribir la respuesta.';
$string['privacy:metadata:local_nexusai_msg_feedback'] = 'Votos sobre si una respuesta del asistente fue útil.';
$string['privacy:metadata:local_nexusai_msg_feedback:comment'] = 'Un comentario opcional junto al voto.';
$string['privacy:metadata:local_nexusai_msg_feedback:ishelpful'] = 'Si la respuesta fue útil.';
$string['privacy:metadata:local_nexusai_msg_feedback:timecreated'] = 'Cuándo se votó.';
$string['privacy:metadata:local_nexusai_msg_feedback:userid'] = 'El usuario que votó.';
$string['privacy:metadata:local_nexusai_qbank_use'] = 'Qué preguntas del banco ya recibió el usuario, para no repetírselas.';
$string['privacy:metadata:local_nexusai_qbank_use:purpose'] = 'Si la pregunta se usó en un quiz de práctica o en un examen.';
$string['privacy:metadata:local_nexusai_qbank_use:timecreated'] = 'Cuándo se usó la pregunta.';
$string['privacy:metadata:local_nexusai_qbank_use:userid'] = 'El usuario que recibió la pregunta.';
$string['privacy:metadata:local_nexusai_quiz_attempts'] = 'Intentos de quiz de práctica.';
$string['privacy:metadata:local_nexusai_quiz_attempts:courseid'] = 'El curso del quiz.';
$string['privacy:metadata:local_nexusai_quiz_attempts:score'] = 'El puntaje obtenido.';
$string['privacy:metadata:local_nexusai_quiz_attempts:timecreated'] = 'Cuándo se hizo el quiz.';
$string['privacy:metadata:local_nexusai_quiz_attempts:topic'] = 'El tema del quiz.';
$string['privacy:metadata:local_nexusai_quiz_attempts:userid'] = 'El usuario que hizo el quiz.';
$string['privacy:metadata:local_nexusai_quiz_errors'] = 'Preguntas de quiz que el usuario respondió mal, guardadas para repasar.';
$string['privacy:metadata:local_nexusai_quiz_errors:aifeedback'] = 'La devolución del asistente sobre la respuesta.';
$string['privacy:metadata:local_nexusai_quiz_errors:courseid'] = 'El curso del quiz.';
$string['privacy:metadata:local_nexusai_quiz_errors:question'] = 'La pregunta.';
$string['privacy:metadata:local_nexusai_quiz_errors:timecreated'] = 'Cuándo se respondió la pregunta.';
$string['privacy:metadata:local_nexusai_quiz_errors:useranswer'] = 'La respuesta que dio el usuario.';
$string['privacy:metadata:local_nexusai_quiz_errors:userid'] = 'El usuario que respondió.';
$string['privacy:metadata:local_nexusai_usage'] = 'Tokens y costo de cada llamada a la IA hecha para el usuario. Se conservan sin el usuario cuando se borran sus datos.';
$string['privacy:metadata:local_nexusai_usage:completiontokens'] = 'Tokens que escribió el proveedor de IA.';
$string['privacy:metadata:local_nexusai_usage:costusd'] = 'Costo estimado de la llamada, en dólares.';
$string['privacy:metadata:local_nexusai_usage:courseid'] = 'El curso de la llamada.';
$string['privacy:metadata:local_nexusai_usage:feature'] = 'La función de NexusAI que hizo la llamada.';
$string['privacy:metadata:local_nexusai_usage:prompttokens'] = 'Tokens que leyó el proveedor de IA.';
$string['privacy:metadata:local_nexusai_usage:role'] = 'Si el usuario actuó como alumno o como docente.';
$string['privacy:metadata:local_nexusai_usage:timecreated'] = 'Cuándo se hizo la llamada.';
$string['privacy:metadata:local_nexusai_usage:userid'] = 'El usuario para el que se hizo la llamada.';
$string['privacy:metadata:nexusai_backend'] = 'Para responder, NexusAI envía la pregunta, la conversación reciente y el material del curso que el usuario puede ver a su servicio backend (fuera de Moodle). El backend no guarda la conversación; registra los tokens de cada llamada para controlar costos.';
$string['privacy:metadata:nexusai_backend:content'] = 'El texto enviado: la pregunta, la conversación reciente y las respuestas de quiz a evaluar.';
$string['privacy:metadata:nexusai_backend:course_id'] = 'El ID del curso en el que se generó el dato.';
$string['privacy:metadata:nexusai_backend:created_at'] = 'La fecha y hora en la que se generó el dato.';
$string['privacy:metadata:nexusai_backend:user_id'] = 'El ID de usuario de Moodle, enviado en cada pedido para el límite de uso y, hasta que el administrador lo apague, el registro de consumo.';
$string['privacy:metadata:preference:calfeedtoken'] = 'Token secreto del feed de calendario del usuario.';
$string['privacy:metadata:preference:onboarding'] = 'Avance de la guía de configuración del curso que se muestra a los docentes.';
$string['privacy:metadata:preference:pending_uploads'] = 'Archivos que el docente agregó al curso y sobre los que NexusAI todavía tiene que preguntar si indexarlos.';
$string['privacy:preference:secret'] = 'Configurado (el valor es secreto y no se exporta).';
$string['section_backend'] = 'Conexión con el backend';
$string['section_backend_desc'] = 'Configurá cómo el plugin se autentica contra el backend Python de NexusAI. Ver ADR-005 en el repositorio.';
$string['section_courses'] = 'Cursos';
$string['section_courses_desc'] = 'Dónde está disponible NexusAI.';
$string['section_general'] = 'General';
$string['section_limits'] = 'Límites de tokens';
$string['section_limits_desc'] = 'Cuántos tokens puede gastar cada usuario con el asistente por hora y por día. Los alumnos ven cuánto les queda.';
$string['section_notifications'] = 'Notificaciones';
$string['section_notifications_desc'] = 'Email remitente de las alertas de calendario y notificaciones del plugin.';
$string['settings'] = 'Configuración de NexusAI';
$string['sharedsecret'] = 'Shared secret (HMAC)';
$string['sharedsecret_desc'] = 'Secreto que firma cada request con HMAC-SHA256. Generar con: openssl rand -hex 32. Tiene que coincidir con NEXUSAI_SHARED_SECRET en el backend.';
$string['show_outside_course'] = 'Mostrar fuera de un curso';
$string['show_outside_course_desc'] = 'Muestra el widget y el ícono de NexusAI en las páginas que no son un curso (tablero, página principal, pantalla de crear curso). Viene desactivado.';
$string['token_limit_desc'] = 'Tokens. Quien lo alcanza espera a que se renueve la ventana.';
$string['token_limit_student_daily'] = 'Límite por día de alumnos';
$string['token_limit_student_hourly'] = 'Límite por hora de alumnos';
$string['token_limit_teacher_daily'] = 'Límite por día de docentes';
$string['token_limit_teacher_hourly'] = 'Límite por hora de docentes';
$string['upload_prompt_body'] = '¿Querés indexar <strong>{$a}</strong> en los materiales de NexusAI para que los alumnos puedan consultarlo en el asistente?';
$string['upload_prompt_error'] = 'No se pudo indexar el archivo en NexusAI. Podés intentarlo desde la sección de materiales.';
$string['upload_prompt_no'] = 'No por ahora';
$string['upload_prompt_success'] = '"{$a}" fue agregado a NexusAI correctamente.';
$string['upload_prompt_title'] = 'NexusAI — nuevo material';
$string['upload_prompt_yes'] = 'Sí, agregar';
