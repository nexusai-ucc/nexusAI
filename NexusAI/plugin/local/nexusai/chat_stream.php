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
    http_response_code(400);
    echo json_encode(['error' => 'courseid required']);
    exit;
}

// Validate the capability in the course context.
$context = context_course::instance($courseid);
require_capability('local/nexusai:use', $context);

// Resolved server-side, same capability visibility_helper.php already uses
// to compute 'isteacher' for the frontend. Drives the backend's per-role
// token budget (app/shared/token_budget.py) — NEVER trust a role sent by
// the client.
$isteacher = has_capability('local/nexusai:manage', $context);

// Business validations.
$cleanquestion = trim($question);
if ($cleanquestion === '') {
    http_response_code(400);
    echo json_encode(['error' => 'question required']);
    exit;
}
if (mb_strlen($cleanquestion) > 2000) {
    http_response_code(400);
    echo json_encode(['error' => 'question too long']);
    exit;
}
$cleansessionid = trim($sessionid);
if ($cleansessionid !== '' && (strlen($cleansessionid) < 8 || strlen($cleansessionid) > 64)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid sessionid']);
    exit;
}

// Build the payload for the Python backend.
$bodyarray = [
    'question'   => $cleanquestion,
    'course_id'  => $courseid,
    'user_id'    => (int) $USER->id,
    'is_teacher' => $isteacher,
];
if ($cleansessionid !== '') {
    $bodyarray['session_id'] = $cleansessionid;
}

// Feature B: resolve the student's courses if multicourse=true.
if ($multicourse) {
    $enrolled = enrol_get_users_courses(
        (int) $USER->id,
        true,
        ['id', 'shortname', 'fullname']
    );
    $courseids   = [];
    $coursenames = [];
    foreach ($enrolled as $course) {
        $cid = (int) $course->id;
        $courseids[] = $cid;
        $coursenames[(string) $cid] = $course->fullname ?? $course->shortname ?? 'Course';
    }
    if (empty($courseids)) {
        $courseids   = [$courseid];
        $coursenames = [(string) $courseid => 'Current course'];
    }
    $bodyarray['course_id']    = (int) $courseids[0];
    $bodyarray['course_ids']   = $courseids;
    $bodyarray['course_names'] = $coursenames;
}

$body = json_encode($bodyarray, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($body === false) {
    http_response_code(500);
    echo json_encode(['error' => 'json encode failed']);
    exit;
}

// Backend config (same as backend_client).
$endpoint = rtrim(trim((string) get_config('local_nexusai', 'api_endpoint')), '/');
$apikey   = trim((string) get_config('local_nexusai', 'api_key'));
$secret   = trim((string) get_config('local_nexusai', 'shared_secret'));

if ($endpoint === '' || $apikey === '' || $secret === '') {
    http_response_code(500);
    echo json_encode(['error' => 'plugin not configured']);
    exit;
}

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

// A cURL call to the Python backend with WRITEFUNCTION.
// We use PHP's curl_* directly (not Moodle's \curl class) because we need
// CURLOPT_WRITEFUNCTION to forward chunks as they arrive.
//
// FEAT-06 (#481, daily limit): before this, a backend error that did NOT
// arrive in SSE format (e.g. a 429 rate limit, which FastAPI returns as
// plain JSON `{"detail":{...}}`, not as `data: {...}\n\n`) was forwarded
// as-is to the browser. React's SSE parser silently discards any line that
// doesn't start with "data:", so the student was left with the "typing"
// indicator stuck forever, with no visible error — the 429 never got
// shown. To avoid this, we inspect the response's real status with
// CURLOPT_HEADERFUNCTION BEFORE forwarding the body: if it's not 2xx, we
// buffer the body (it's a small JSON, not a real stream) and reformat it
// as a properly-built SSE error event instead of passing it through raw.
$httpstatus = null;
$errorbuffer = '';

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $endpoint . '/api/v1/chat/stream',
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $body,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apikey,
        'X-Timestamp: ' . $timestamp,
        'X-Nonce: '     . $nonce,
        'X-Signature: ' . $signature,
        'Accept: text/event-stream',
        'Accept-Language: ' . \local_nexusai\external\backend_client::interface_language(),
    ],
    CURLOPT_TIMEOUT        => 300,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_RETURNTRANSFER => false,
    // Runs for every incoming header line — we use the first
    // "HTTP/x.x <status>" to know whether the backend replied 2xx (a real
    // stream) or an error (plain JSON, needs buffering and reformatting).
    CURLOPT_HEADERFUNCTION => function ($curl, $headerline) use (&$httpstatus) {
        if ($httpstatus === null && preg_match('#^HTTP/\S+\s+(\d{3})#', $headerline, $m)) {
            $httpstatus = (int) $m[1];
        }
        return strlen($headerline);
    },
    // Callback that runs every time bytes arrive from the backend. If we
    // already know the response isn't 2xx, we accumulate instead of
    // forwarding (best effort: in case the error arrives across several chunks).
    CURLOPT_WRITEFUNCTION  => function ($curl, $chunk) use (&$httpstatus, &$errorbuffer) {
        if ($httpstatus !== null && $httpstatus >= 400) {
            $errorbuffer .= $chunk;
            return strlen($chunk);
        }
        echo $chunk;
        @flush();
        return strlen($chunk);
    },
]);

$ok = curl_exec($ch);

if ($ok === false) {
    $err = curl_error($ch);
    // If a first flush already happened, send an inline SSE error event.
    echo "data: " . json_encode([
        'type'   => 'error',
        'detail' => 'backend_unreachable: ' . substr($err, 0, 200),
    ]) . "\n\n";
    @flush();
} else if ($httpstatus !== null && $httpstatus >= 400 && $errorbuffer !== '') {
    echo "data: " . json_encode([
        'type'   => 'error',
        'detail' => \local_nexusai\external\backend_client::extract_stream_error_detail($errorbuffer, $httpstatus),
    ]) . "\n\n";
    @flush();
}

curl_close($ch);
exit;
