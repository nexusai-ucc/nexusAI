<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External Functions registry for local_nexusai.
 *
 * Cada entrada de `$functions` declara una función expuesta a JavaScript a través
 * del módulo AMD `core/ajax`. Moodle se encarga de:
 *   - Validar la sesskey automáticamente (CSRF).
 *   - Aplicar require_login() antes del execute.
 *   - Verificar capabilities declaradas acá.
 *   - Convertir parámetros y returns con los external_value/structure declarados.
 *
 * Convención de nombres: `<plugin>_<accion>` — el cliente JS lo usa como
 * `methodname: 'local_nexusai_chat_send'` en `core/ajax::call()`.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [

    // ----- ALUMNO -----

    // Enviar un mensaje del alumno al asistente y recibir la respuesta del LLM.
    // Esta es la función que invoca React vía core/ajax.
    'local_nexusai_chat_send' => [
        'classname'     => '\local_nexusai\external\chat_send',
        'methodname'    => 'execute',
        'description'   => 'Send a message to the NexusAI assistant and get the LLM response.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Resumen automático de un documento indexado usando el LLM (BUS-03).
    'local_nexusai_document_summarize' => [
        'classname'     => '\local_nexusai\external\document_summarize',
        'methodname'    => 'execute',
        'description'   => 'Generate an AI summary of an indexed course document (BUS-03).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Resumen de repaso pre-parcial combinando todo el material indexado
    // relevante, opcionalmente acotado a una unidad/sección (BUS-04).
    'local_nexusai_document_pre_exam_summary' => [
        'classname'     => '\local_nexusai\external\document_pre_exam_summary',
        'methodname'    => 'execute',
        'description'   => 'Generate a combined pre-exam review summary across indexed documents (BUS-04).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Búsqueda semántica en el material del curso (retrieval sin LLM — Feature A).
    'local_nexusai_search_query' => [
        'classname'     => '\local_nexusai\external\search_query',
        'methodname'    => 'execute',
        'description'   => 'Semantic search over the indexed course material (no LLM).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    'local_nexusai_course_sections_list' => [
        'classname'     => '\local_nexusai\external\course_sections_list',
        'methodname'    => 'execute',
        'description'   => 'List a course\'s sections (number + display name) — used by the upload section picker and the search section filter (BUS-05).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Historial de conversaciones — lista de sesiones previas del alumno (Feature E).
    'local_nexusai_chat_sessions_list' => [
        'classname'     => '\local_nexusai\external\chat_sessions_list',
        'methodname'    => 'execute',
        'description'   => 'List previous NexusAI chat sessions for the student.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Mensajes de una sesión específica para retomar conversación (Feature E).
    'local_nexusai_chat_session_messages' => [
        'classname'     => '\local_nexusai\external\chat_session_messages',
        'methodname'    => 'execute',
        'description'   => 'Fetch the full message list of an existing chat session.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Quiz generator — preguntas de práctica desde el material (Feature F / SP-03).
    'local_nexusai_quiz_generate' => [
        'classname'     => '\local_nexusai\external\quiz_generate',
        'methodname'    => 'execute',
        'description'   => 'Generate a practice quiz (multiple choice, true/false, open or mix) from the course material.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Quiz evaluator — evalúa respuestas abiertas con IA (SP-05).
    'local_nexusai_quiz_evaluate' => [
        'classname'     => '\local_nexusai\external\quiz_evaluate',
        'methodname'    => 'execute',
        'description'   => 'Evaluate a student open answer against the course material using LLM.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Generador de exámenes — banco de preguntas desde archivos elegidos por el
    // docente (EVAL-01 / issue #235, DOC-D04). Solo docentes (capability :manage).
    'local_nexusai_exam_generate' => [
        'classname'     => '\local_nexusai\external\exam_generate',
        'methodname'    => 'execute',
        'description'   => 'Generate an exam question bank from teacher-selected course files.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Repaso de errores — persiste preguntas mal respondidas en un quiz (SP-10).
    'local_nexusai_quiz_errors_record' => [
        'classname'     => '\local_nexusai\external\quiz_errors_record',
        'methodname'    => 'execute',
        'description'   => 'Persist the questions a student answered wrong in a quiz.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Repaso de errores — historial del alumno en un curso (SP-10).
    'local_nexusai_quiz_errors_list' => [
        'classname'     => '\local_nexusai\external\quiz_errors_list',
        'methodname'    => 'execute',
        'description'   => 'List the quiz-error history of the current student in a course.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Repaso de errores — borra el historial del alumno (SP-10).
    'local_nexusai_quiz_errors_clear' => [
        'classname'     => '\local_nexusai\external\quiz_errors_clear',
        'methodname'    => 'execute',
        'description'   => 'Clear the quiz-error history of the current student in a course.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Repaso de errores — sugerencias de repaso basadas en errores frecuentes (SP-10).
    'local_nexusai_quiz_review_suggestions' => [
        'classname'     => '\local_nexusai\external\quiz_review_suggestions',
        'methodname'    => 'execute',
        'description'   => 'Get AI-generated review suggestions based on the student quiz-error history.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Historial de quizzes — guarda el resultado de un quiz completado (SP-09).
    'local_nexusai_quiz_attempt_save' => [
        'classname'     => '\local_nexusai\external\quiz_attempt_save',
        'methodname'    => 'execute',
        'description'   => 'Persist the result of a completed quiz attempt for the current student.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Historial de quizzes — lista el historial del alumno en un curso (SP-09).
    'local_nexusai_quiz_attempt_list' => [
        'classname'     => '\local_nexusai\external\quiz_attempt_list',
        'methodname'    => 'execute',
        'description'   => 'List the quiz history of the current student in a course.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Plan de estudio personalizado — combina errores de quiz y gaps del chat (STUDY-01).
    'local_nexusai_quiz_study_plan' => [
        'classname'     => '\local_nexusai\external\quiz_study_plan',
        'methodname'    => 'execute',
        'description'   => 'Get a personalized study plan combining quiz-error history and unanswered chat questions.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Detección de gaps — preguntas que el material no respondió (Feature G).
    // Solo docentes ven sus gaps (capability :manage).
    'local_nexusai_gaps_list' => [
        'classname'     => '\local_nexusai\external\gaps_list',
        'methodname'    => 'execute',
        'description'   => 'List questions the course material could not answer (teacher view).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Archivar/desarchivar un gap detectado (DOC-D08, issue #383).
    'local_nexusai_gaps_archive' => [
        'classname'     => '\local_nexusai\external\gaps_archive',
        'methodname'    => 'execute',
        'description'   => 'Archive or unarchive a detected content gap (teacher view).',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Dashboard de preguntas frecuentes agrupadas por tema (DOC-D02).
    // Solo docentes/admins (capability :manage).
    'local_nexusai_analytics_faq_topics' => [
        'classname'     => '\local_nexusai\external\analytics_faq_topics',
        'methodname'    => 'execute',
        'description'   => 'Most frequent student questions grouped by topic via LLM (teacher view).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Dashboard agregado: top queries, uso diario, distribución de puntajes
    // de quiz y ratio de gaps (ANALYTICS-01/02). Solo docentes/admins.
    'local_nexusai_analytics_dashboard' => [
        'classname'     => '\local_nexusai\external\analytics_dashboard',
        'methodname'    => 'execute',
        'description'   => 'Aggregated course analytics dashboard (teacher view).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // ----- CALENDARIO — CAL-02 -----

    // Guarda / actualiza la alerta de un evento de calendario para el alumno.
    'local_nexusai_calendar_alert_save' => [
        'classname'     => '\local_nexusai\external\calendar_alert_save',
        'methodname'    => 'execute',
        'description'   => 'Save or update a calendar event alert for the current student.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Lista las alertas activas del alumno en el curso.
    'local_nexusai_calendar_alerts_list' => [
        'classname'     => '\local_nexusai\external\calendar_alerts_list',
        'methodname'    => 'execute',
        'description'   => 'List active calendar event alerts for the current student in a course.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // ----- FOROS — Épica 06 -----

    // Detecta posts similares al texto que el alumno está escribiendo (F-07).
    // Usado por el forum-duplicate-checker AMD module antes de publicar.
    'local_nexusai_forum_search_similar' => [
        'classname'     => '\local_nexusai\external\forum_search_similar',
        'methodname'    => 'execute',
        'description'   => 'Find semantically similar forum posts in the same course.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Resume una discusión de foro con el LLM (F-04/F-10).
    // Usado por el forum-thread-summarizer AMD module en mod-forum-discuss.
    'local_nexusai_forum_summarize_thread' => [
        'classname'     => '\local_nexusai\external\forum_summarize_thread',
        'methodname'    => 'execute',
        'description'   => 'Summarize a forum discussion thread using the LLM.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Genera una sugerencia de respuesta para un post de foro con RAG + LLM (F-05/F-11).
    // Usado por el forum-reply-suggester AMD module cuando el usuario abre el formulario de reply.
    'local_nexusai_forum_suggest_reply' => [
        'classname'     => '\local_nexusai\external\forum_suggest_reply',
        'methodname'    => 'execute',
        'description'   => 'Generate an AI-powered reply suggestion for a forum post using RAG.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // ----- DOCENTE -----

    // Subir un documento (PDF) del curso para indexarlo en el backend RAG.
    // Recibe un `draftitemid` del file picker de Moodle, lee el archivo del
    // file API, lo encodea en base64 y POSTea al backend.
    'local_nexusai_document_upload' => [
        'classname'     => '\local_nexusai\external\document_upload',
        'methodname'    => 'execute',
        'description'   => 'Upload a course document (PDF) to NexusAI for indexing.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Listar todos los documentos indexados de un curso (para la tabla docente).
    'local_nexusai_document_list' => [
        'classname'     => '\local_nexusai\external\document_list',
        'methodname'    => 'execute',
        'description'   => 'List all NexusAI-indexed documents for a course.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Estado de un documento individual (para polling durante indexación).
    'local_nexusai_document_status' => [
        'classname'     => '\local_nexusai\external\document_status',
        'methodname'    => 'execute',
        'description'   => 'Get the current status of an indexing job.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Borrar un documento (cascada borra los chunks asociados).
    'local_nexusai_document_delete' => [
        'classname'     => '\local_nexusai\external\document_delete',
        'methodname'    => 'execute',
        'description'   => 'Delete a NexusAI-indexed document and all its chunks.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Preview del texto extraído de un documento (CONT-08).
    'local_nexusai_document_preview' => [
        'classname'     => '\local_nexusai\external\document_preview',
        'methodname'    => 'execute',
        'description'   => 'Return the first characters of a document\'s extracted text.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // ----- CONFIRMACIÓN DE CARGA DESDE SECCIÓN DEL CURSO -----

    // Lista los archivos subidos al curso (tab general) pendientes de confirmación.
    'local_nexusai_get_pending_uploads' => [
        'classname'     => '\local_nexusai\external\get_pending_uploads',
        'methodname'    => 'execute',
        'description'   => 'Get files uploaded to a course section that are pending NexusAI indexing confirmation.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // El docente confirmó que quiere indexar el archivo en NexusAI.
    'local_nexusai_confirm_pending_upload' => [
        'classname'     => '\local_nexusai\external\confirm_pending_upload',
        'methodname'    => 'execute',
        'description'   => 'Confirm indexing of a pending course file into NexusAI.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // El docente eligió no indexar el archivo en NexusAI.
    'local_nexusai_dismiss_pending_upload' => [
        'classname'     => '\local_nexusai\external\dismiss_pending_upload',
        'methodname'    => 'execute',
        'description'   => 'Dismiss a pending course file without indexing it into NexusAI.',
        'type'          => 'write',
        'ajax'          => true,
        'loginrequired' => true,
    ],

    // PRIV-01 — Exportación y eliminación de datos personales (issue #310).
    'local_nexusai_privacy_export' => [
        'classname'     => '\local_nexusai\external\privacy_export',
        'methodname'    => 'execute',
        'description'   => "Export the current student's personal history (chat messages, quiz attempts, quiz errors) in a course.",
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    'local_nexusai_privacy_delete' => [
        'classname'     => '\local_nexusai\external\privacy_delete',
        'methodname'    => 'execute',
        'description'   => "Delete the current student's personal history in a course (quiz attempts are anonymized, not deleted).",
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

];

// $services queda vacío: no exponemos un service preconfigurado todavía. La
// función es invocable solo desde el plugin (vía core/ajax). Si en el futuro
// queremos permitir llamadas externas con token, agregar acá un service.
$services = [];
