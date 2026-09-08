<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_chat_voice_transcribe`.
 *
 * Recibe un audio corto (pregunta hablada, grabada con MediaRecorder en el
 * navegador) en base64, mismo patrón que `document_upload.php`, y lo
 * reenvía al backend Python para transcribir (VOICE-01, #314).
 *
 * A diferencia de `document_upload`, la capability es `local/nexusai:use`
 * (no `manage`) — la voz es una forma más de hacerle una pregunta al chat,
 * disponible para alumnos, no solo docentes (misma capability que
 * `chat_send.php`). El texto transcripto NUNCA se envía como mensaje acá —
 * el frontend lo muestra en el composer para que el alumno confirme/edite
 * antes de mandarlo con el flujo normal de `chat_send`.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class chat_voice_transcribe extends \external_api {

    /** Tamaño máximo de base64 aceptado — audio corto, de sobra con 14 MB
     *  (~10 MB decodificado, inflate de base64 ~33%). */
    private const MAX_B64_BYTES = 14 * 1024 * 1024;

    /** Formatos que MediaRecorder produce típicamente según navegador. */
    private const ALLOWED_MIME_TYPES = [
        'audio/webm',
        'audio/ogg',
        'audio/mp4',
        'audio/mpeg',
        'audio/wav',
        'audio/x-m4a',
    ];

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'    => new \external_value(PARAM_INT, 'ID del curso (para validar capability)', VALUE_REQUIRED),
            'mimetype'    => new \external_value(PARAM_RAW, 'MIME type detectado por el browser', VALUE_REQUIRED),
            'content_b64' => new \external_value(PARAM_RAW, 'Audio en base64', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'text' => new \external_value(PARAM_RAW, 'Texto transcripto'),
        ]);
    }

    public static function execute(int $courseid, string $mimetype, string $contentb64): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'    => $courseid,
            'mimetype'    => $mimetype,
            'content_b64' => $contentb64,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        if (!in_array($params['mimetype'], self::ALLOWED_MIME_TYPES, true)) {
            throw new \invalid_parameter_exception(
                'Unsupported audio type. Allowed: ' . implode(', ', self::ALLOWED_MIME_TYPES)
                . '. Got: ' . $params['mimetype']
            );
        }

        if (strlen($params['content_b64']) > self::MAX_B64_BYTES) {
            throw new \invalid_parameter_exception('Audio too large (max 10MB)');
        }

        $audiobytes = base64_decode($params['content_b64'], true);
        if ($audiobytes === false || $audiobytes === '') {
            throw new \invalid_parameter_exception('Invalid base64 content');
        }

        $client = new backend_client();
        $response = $client->transcribe_audio($params['mimetype'], $audiobytes);

        return [
            'text' => (string) ($response['text'] ?? ''),
        ];
    }
}
