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

];

// $services queda vacío: no exponemos un service preconfigurado todavía. La
// función es invocable solo desde el plugin (vía core/ajax). Si en el futuro
// queremos permitir llamadas externas con token, agregar acá un service.
$services = [];
