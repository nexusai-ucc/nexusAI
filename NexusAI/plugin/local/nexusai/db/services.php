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

    // Enviar un mensaje del alumno al asistente y recibir la respuesta del LLM.
    // Esta es la función que invoca React vía core/ajax.
    'local_nexusai_chat_send' => [
        'classname'     => '\local_nexusai\external\chat_send',
        'methodname'    => 'execute',
        'description'   => 'Send a message to the NexusAI assistant and get the LLM response.',
        // 'write' porque el backend persiste la sesión y el mensaje en la DB.
        // Usar 'read' acá daría falso negativo a sistemas de auditoría.
        'type'          => 'write',
        // Habilitar invocación desde core/ajax (requerido para nuestro frontend).
        'ajax'          => true,
        // Capabilities exigidas. La external function igual va a re-chequear
        // contra el contexto del curso adentro del execute() — esto es una
        // primera línea de defensa.
        'capabilities'  => 'local/nexusai:use',
        // Logging de uso. Sirve para debugging y futura analytics.
        'loginrequired' => true,
    ],

];

// $services queda vacío: no exponemos un service preconfigurado todavía. La
// función es invocable solo desde el plugin (vía core/ajax). Si en el futuro
// queremos permitir llamadas externas con token, agregar acá un service.
$services = [];
