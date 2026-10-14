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
 * Server-Sent Events streaming proxy between the browser and the FastAPI backend.
 *
 * Why this is NOT an External Function:
 *   Moodle's `core/ajax` and External Functions system don't support
 *   streaming — they're request/response JSON-RPC. To forward SSE chunk
 *   by chunk to the browser we need a plain PHP endpoint with
 *   `CURLOPT_WRITEFUNCTION` that writes straight to the client's output buffer.
 *
 * Auth:
 *   - sesskey (Moodle's CSRF protection, validated with confirm_sesskey).
 *   - require_login() to guarantee a valid session.
 *   - require_capability local/nexusai:use in the course context.
 *   - Server-to-server HMAC stays intact: it's signed with the shared_secret
 *     and never exposed to the browser. We keep the Hybrid PHP Proxy pattern
 *     (ADR-001).
 *
 * Input: form-urlencoded or JSON with the same fields as chat_send:
 *   - question (string, required)
 *   - courseid (int, required)
 *   - sessionid (string|empty) — existing session UUID
 *   - multicourse (bool|0/1) — Feature B
 *
 * Output: Server-Sent Events stream. Each event is a line of
 *   `data: {"type":"token|meta|done|error",...}\n\n`.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Streaming requires disabling output buffering from the start.
// Constants must be defined BEFORE loading config.php to prevent
// Moodle from initializing its own buffering.
define('NO_DEBUG_DISPLAY', true);
define('NO_OUTPUT_BUFFERING', true);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/filelib.php');

global $USER, $DB, $CFG;

require_login();
if (isguestuser()) {
    http_response_code(403);
    exit;
}
require_sesskey();

// Errors before the stream starts go out as JSON with a translated `detail`:
// the widget shows that text as is (react/src/components/errors.js).
$fail = static function (int $status, string $message): void {
    http_response_code($status);
    echo json_encode(['detail' => $message], JSON_UNESCAPED_UNICODE);
    exit;
};

// Parse input.
// Supports both a JSON body and form-urlencoded (more flexibility for
// fetch() from React).
$rawbody = file_get_contents('php://input');
$payload = json_decode($rawbody, true);
if (!is_array($payload)) {
    // Fallback to $_POST if it's not JSON.
    $payload = $_POST;
}

$question    = isset($payload['question']) ? (string) $payload['question'] : '';
$courseid    = isset($payload['courseid']) ? (int)    $payload['courseid'] : 0;
$sessionid   = isset($payload['sessionid']) ? (string) $payload['sessionid'] : '';
$multicourse = !empty($payload['multicourse']);

if ($courseid <= 0) {
    $fail(400, get_string('errorcourseidrequired', 'local_nexusai'));
}

// Validate the capability in the course context.
$context = context_course::instance($courseid);
require_capability('local/nexusai:use', $context);
if (!\local_nexusai\local\course_guard::is_enabled($courseid)) {
    $fail(403, get_string('coursedisabled', 'local_nexusai'));
}

// Business validations.
$cleanquestion = trim($question);
if ($cleanquestion === '') {
    $fail(400, get_string('errorquestionempty', 'local_nexusai'));
}
if (mb_strlen($cleanquestion) > 2000) {
    $fail(400, get_string('errorquestiontoolong', 'local_nexusai', 2000));
}
$cleansessionid = trim($sessionid);
if ($cleansessionid !== '' && (strlen($cleansessionid) < 8 || strlen($cleansessionid) > 64)) {
    $fail(400, get_string('errorinvalidparams', 'local_nexusai'));
}

// The answer is stored when the backend finishes, even if the student closes
// the tab halfway: keep running after the browser goes away (DATA-05).
ignore_user_abort(true);

// Store the question and build the request (DATA-05): the conversation lives in
// Moodle and the backend gets the history. userid is always the session's.
try {
    $turn = new \local_nexusai\local\chat_turn(
        (int) $USER->id,
        $courseid,
        $cleanquestion,
        $cleansessionid !== '' ? $cleansessionid : null,
        $multicourse
    );
} catch (\moodle_exception $e) {
    $fail(404, get_string('errorsessionnotfound', 'local_nexusai'));
}
$bodyarray = $turn->payload();

// Only material from activities this user can see (VIS-02). Computed here, on
// the server, for the courses in the body: never taken from the browser.
$bodyarray['visible_cmids'] = \local_nexusai\local\visible_material::for_courses(
    $bodyarray['course_ids'] ?? [$bodyarray['course_id']]
);

$body = json_encode($bodyarray, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($body === false) {
    $fail(500, get_string('errorbackend', 'local_nexusai', 'JSON encode failed'));
}

// Backend config (same as backend_client).
$endpoint = rtrim(trim((string) get_config('local_nexusai', 'api_endpoint')), '/');
$apikey   = trim((string) get_config('local_nexusai', 'api_key'));
$secret   = trim((string) get_config('local_nexusai', 'shared_secret'));

$missing = array_keys(array_filter(
    ['api_endpoint' => $endpoint, 'api_key' => $apikey, 'shared_secret' => $secret],
    static fn($value) => $value === ''
));
if ($missing) {
    $fail(500, get_string('errorconfigmissing', 'local_nexusai', implode(', ', $missing)));
}

$streamurl = $endpoint . '/api/v1/chat/stream';

// HMAC, same ordering as backend_client::compute_signature.
$timestamp = (string) time();
$nonce     = bin2hex(random_bytes(16));
$signature = hash_hmac('sha256', $timestamp . $nonce . $body, $secret);

// SSE headers to the browser BEFORE starting cURL.
// CRITICAL: these must come before the first echo/flush, and there must be
// NO output buffering ahead of them.
@header('Content-Type: text/event-stream');
@header('Cache-Control: no-cache');
@header('X-Accel-Buffering: no');  // In case nginx is in front.

// Flush any pending Moodle/PHP output buffer. Without this the chunks pile
// up in memory and the browser receives them all at once at the end.
while (ob_get_level() > 0) {
    @ob_end_flush();
}
@ob_implicit_flush(true);

// The call to the Python backend uses Moodle's \curl class, with
// CURLOPT_WRITEFUNCTION to forward the chunks as they arrive (MMR-301 item 6).
// Like backend_client, it passes ignoresecurity: the endpoint is set by the
// administrator, not by users, and Moodle's default blocked hosts list covers
// localhost, private networks and ports other than 80/443, where the backend
// usually runs.
//
// FEAT-06 (#481, daily limit): a backend error that does NOT arrive in SSE
// format (e.g. a 429 rate limit, which FastAPI returns as plain JSON
// `{"detail":{...}}`, not as `data: {...}\n\n`) cannot be forwarded as-is:
// React's SSE parser silently discards any line that doesn't start with
// "data:", and the student would be left with the "typing" indicator stuck.
// So the response's status is checked BEFORE forwarding the body: the
// headers are in by the time the first body bytes reach WRITEFUNCTION, so
// curl_getinfo() already has the status there. If it's not 2xx, the body is
// buffered (a small JSON, not a real stream) and turned into a proper SSE
// error event instead of being passed through raw.
$httpstatus = null;
$errorbuffer = '';
$relay = new \local_nexusai\local\sse_relay($turn, function (string $bytes): void {
    echo $bytes;
    @flush();
});

$curl = new \curl(['ignoresecurity' => true]);
$curl->setHeader([
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apikey,
    'X-Timestamp: ' . $timestamp,
    'X-Nonce: '     . $nonce,
    'X-Signature: ' . $signature,
    'Accept: text/event-stream',
    'Accept-Language: ' . \local_nexusai\external\backend_client::interface_language(),
    // Who originated the call, for the backend usage ledger (tokens by role).
    'X-NexusAI-Role: ' . $turn->role(),
]);
$curl->setopt(\local_nexusai\external\backend_client::curl_hardening() + [
    'CURLOPT_TIMEOUT'        => 300,
    'CURLOPT_CONNECTTIMEOUT' => 10,
    // Moodle's \curl returns the body as a string by default; the callback forwards it instead.
    'CURLOPT_RETURNTRANSFER' => 0,
    // Compressed responses arrive in blocks, which would batch the tokens.
    'CURLOPT_ENCODING'       => 'identity',
    // Runs every time bytes arrive from the backend. Once the status says the
    // response isn't 2xx, the bytes are kept instead of forwarded.
    'CURLOPT_WRITEFUNCTION'  => function ($ch, $chunk) use (&$httpstatus, &$errorbuffer, $relay) {
        if ($httpstatus === null) {
            $httpstatus = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        }
        if ($httpstatus < 200 || $httpstatus >= 300) {
            $errorbuffer .= $chunk;
            return strlen($chunk);
        }
        // The relay forwards the events and stores the answer on `done`.
        return $relay->write($chunk);
    },
]);

$curl->post($streamurl, $body);
// A response without a body never reaches the callback (e.g. a 502 from a proxy in front).
$finalstatus = $httpstatus ?? (int) ($curl->get_info()['http_code'] ?? 0);

if ($relay->ended()) {
    // The backend already closed the stream with `done` (answer stored) or with its own
    // `error`: nothing to add, even if the connection dropped right after.
    exit;
}
if ($curl->get_errno() || ($finalstatus >= 200 && $finalstatus < 300) || $errorbuffer === '') {
    // Unreachable, cut mid-stream or an error without a body. The technical reason
    // goes to the debugging log; the student gets a message in their language.
    debugging('[NexusAI] Chat stream failed: HTTP ' . $finalstatus . ' ' . $curl->error, DEBUG_NORMAL);
    echo "data: " . json_encode([
        'type'   => 'error',
        'detail' => get_string('errorchatunavailable', 'local_nexusai'),
    ], JSON_UNESCAPED_UNICODE) . "\n\n";
    @flush();
} else {
    echo "data: " . json_encode([
        'type'   => 'error',
        'detail' => \local_nexusai\external\backend_client::extract_stream_error_detail($errorbuffer, $finalstatus),
    ]) . "\n\n";
    @flush();
}

exit;
