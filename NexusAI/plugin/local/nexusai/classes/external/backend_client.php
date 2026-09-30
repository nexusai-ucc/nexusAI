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
 * Authenticated HTTP client against the NexusAI Python backend (FastAPI).
 *
 * Implements the PHP side of the HMAC authentication scheme documented in
 * ADR-005 and in `services/api/app/auth/hmac.py`. Every request carries 4
 * headers:
 *
 *   Authorization: Bearer <NEXUSAI_API_KEY>
 *   X-Timestamp:   <unix epoch>
 *   X-Nonce:       <UUID v4>
 *   X-Signature:   <hex_hmac_sha256(NEXUSAI_SHARED_SECRET, timestamp || nonce || body)>
 *
 * The signature's concatenation order MUST be exactly the same as on the
 * Python backend side — any desync breaks ALL requests.
 *
 * Uses Moodle's `\curl` (lib/filelib.php), which automatically respects:
 *   - $CFG->proxyhost / $CFG->proxyport (university proxies)
 *   - $CFG->curlsecurityblockedhosts (blacklist)
 *   - $CFG->curlsecurityallowedport (port whitelist)
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

/**
 * HTTP client to the Python backend: signs every request with 3-layer HMAC (ADR-005) and
 * exposes one method per endpoint (chat, documents, quiz, forums, calendar, analytics, privacy, etc.).
 */
class backend_client {
    /** @var string Backend base endpoint (e.g. http://localhost:8001) */
    private string $endpoint;

    /** @var string Backend bearer API key */
    private string $apikey;

    /** @var string Shared secret for HMAC (32-byte hex) */
    private string $secret;

    /** @var string|null Role forced by the caller (e.g. 'system' from tasks and observers) */
    private ?string $role = null;

    /** @var string[] Roles the backend usage ledger understands */
    private const ROLES = ['student', 'teacher', 'system'];

    /**
     * @var string[] Endpoints that read course material. Their body gets
     * `visible_cmids` (see local\visible_material) and the backend answers
     * only from documents of those activities. Add here any new endpoint that
     * reads indexed material; chat_stream.php does the same for the stream.
     */
    private const VISIBILITY_PATHS = [
        '/api/v1/chat/messages',
        '/api/v1/search',
        '/api/v1/quiz/generate',
        '/api/v1/documents/summarize',
        '/api/v1/documents/pre-exam-summary',
        '/api/v1/forums/suggest-reply',
        '/api/v1/forums/similar-posts',
    ];

    /** @var string[] Endpoints that read forum posts: they also get the user's groups (VIS-06). */
    private const GROUP_PATHS = ['/api/v1/forums/similar-posts'];

    /**
     * Forces the role reported to the backend for every request of this client.
     *
     * Scheduled tasks and event observers call this with 'system': their backend
     * calls are automatic, not something the current user asked for.
     *
     * @param string $role One of 'student', 'teacher' or 'system'.
     * @return void
     */
    public function set_role(string $role): void {
        if (!in_array($role, self::ROLES, true)) {
            throw new \coding_exception('Unknown NexusAI role: ' . $role);
        }
        $this->role = $role;
    }

    /**
     * Role of the current user in a course, as the backend usage ledger records it.
     *
     * Computed server-side with the same capability the widget uses to detect
     * teachers, never taken from the browser. Without a logged-in user the call
     * is attributed to the system; tasks and observers force 'system' with
     * set_role() because cron runs them as the admin.
     *
     * @param int $courseid Course the request belongs to.
     * @return string 'teacher', 'student' or 'system'.
     */
    public static function role_for_course(int $courseid): string {
        if (!isloggedin() || isguestuser()) {
            return 'system';
        }
        $context = \context_course::instance($courseid, IGNORE_MISSING);
        if (!$context) {
            return 'student';
        }
        return has_capability('local/nexusai:manage', $context) ? 'teacher' : 'student';
    }

    /**
     * Role to report for a request: the forced one, or the user's role in the
     * course the request is about (read from the JSON body or the query string).
     *
     * @param string $path Relative path, possibly with a query string.
     * @param string $body JSON body (empty for GET/DELETE).
     * @return string|null Null when the request has no course to derive it from.
     */
    private function request_role(string $path, string $body): ?string {
        if ($this->role !== null) {
            return $this->role;
        }
        $courseid = 0;
        if ($body !== '') {
            $data = json_decode($body, true);
            if (is_array($data) && isset($data['course_id']) && is_numeric($data['course_id'])) {
                $courseid = (int) $data['course_id'];
            }
        }
        if ($courseid <= 0) {
            $query = (string) parse_url($path, PHP_URL_QUERY);
            parse_str($query, $params);
            if (isset($params['course_id']) && is_numeric($params['course_id'])) {
                $courseid = (int) $params['course_id'];
            }
        }
        return $courseid > 0 ? self::role_for_course($courseid) : null;
    }

    /**
     * Language of the Moodle user's interface as the backend understands it.
     *
     * Sent in the Accept-Language header so the backend can word the fixed messages
     * it returns (for example "this course has no indexed material yet") in the
     * language the user sees. Only "es" and "en" are supported, like the widget:
     * Spanish when the interface is Spanish (es, es_ar, es_mx...), English otherwise.
     *
     * @param string|null $current Moodle language code; defaults to the current one.
     * @return string "es" or "en".
     */
    public static function interface_language(?string $current = null): string {
        $primary = strtolower(explode('_', (string) ($current ?? current_language()))[0]);
        return $primary === 'es' ? 'es' : 'en';
    }

    /**
     * Constructor that reads the plugin config from `local_nexusai/*`.
     *
     * @throws \moodle_exception If any of the 3 config values is missing.
     */
    public function __construct() {
        // Trimmed on read too: a value saved with a stray space before the
        // settings page started trimming would otherwise keep failing the signature.
        $endpoint = trim((string) get_config('local_nexusai', 'api_endpoint'));
        $apikey   = trim((string) get_config('local_nexusai', 'api_key'));
        $secret   = trim((string) get_config('local_nexusai', 'shared_secret'));

        // Defensive checks: if the admin didn't fill in the config, fail
        // with a clear error instead of sending broken requests to the backend.
        if (empty($endpoint)) {
            throw new \moodle_exception(
                'errorconfigmissing',
                'local_nexusai',
                '',
                'API endpoint'
            );
        }
        if (empty($apikey)) {
            throw new \moodle_exception(
                'errorconfigmissing',
                'local_nexusai',
                '',
                'API key'
            );
        }
        if (empty($secret)) {
            throw new \moodle_exception(
                'errorconfigmissing',
                'local_nexusai',
                '',
                'Shared secret'
            );
        }

        // Normalize endpoint: no trailing slash, to avoid `//api/v1/...`.
        $this->endpoint = rtrim($endpoint, '/');
        $this->apikey   = $apikey;
        $this->secret   = $secret;
    }

    /**
     * Asks the backend's non-streaming chat (DATA-05).
     *
     * The conversation lives in Moodle: the payload carries the history and
     * the backend stores nothing (see local\chat_turn). Material visibility is
     * added by post() and the usage comes back in the X-NexusAI-Usage header.
     *
     * @param array $payload Body built by local\chat_turn::payload().
     * @return array The backend's answer, with metrics, gap, budget and usage.
     * @throws \moodle_exception If the backend returns non-2xx or the network fails.
     */
    public function chat(array $payload): array {
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/chat/messages', $body);
    }

    /**
     * Students' most frequent questions, grouped by topic by an LLM (DOC-D02).
     *
     * @param int $courseid Course ID.
     * @param int $days     Time window (1..365).
     * @return array{course_id:int, days:int, total_questions:int, topics:array}
     */
    public function faq_topics(int $courseid, int $days = 30): array {
        // The questions live in Moodle (DATA-05): send them grouped, the backend only groups them by topic.
        $since = time() - $days * DAYSECS;
        $questions = array_slice(\local_nexusai\local\course_analytics::question_counts($courseid, $since), 0, 500);
        $payload = [
            'course_id' => $courseid,
            'days'      => $days,
            'questions' => array_map(static fn($q) => [
                'question' => \core_text::substr($q['question'], 0, 2000),
                'count' => $q['count'],
            ], $questions),
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/analytics/faq-topics', $body);
    }

    /**
     * Generates a practice quiz from the course's indexed material (Feature F).
     *
     * @param int         $courseid     Course ID.
     * @param int         $userid       Real $USER->id.
     * @param string|null $topic        Optional topic. If empty, random variety.
     * @param int         $numquestions Number of questions (1..10).
     * @param string      $questiontype Type (multiple_choice|true_false|open|mix|flashcard).
     * @param string      $difficulty   Difficulty (easy|medium|hard).
     * @return array{course_id:int, topic:?string, questions:array}
     */
    public function generate_quiz(
        int $courseid,
        int $userid,
        ?string $topic,
        int $numquestions,
        string $questiontype = 'multiple_choice',
        string $difficulty = 'medium'
    ): array {
        $payload = [
            'course_id'     => $courseid,
            'user_id'       => $userid,
            'num_questions' => $numquestions,
            'question_type' => $questiontype,
            'difficulty'    => $difficulty,
            // DATA-05: flashcards are stored in Moodle, not in the backend.
            'persist_flashcards' => false,
        ];
        if ($topic !== null && trim($topic) !== '') {
            $payload['topic'] = trim($topic);
        }
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        $response = $this->post('/api/v1/quiz/generate', $body);
        if ($questiontype === 'flashcard' && !empty($response['questions']) && is_array($response['questions'])) {
            $response['questions'] = \local_nexusai\local\flashcard_store::save_generated(
                $courseid,
                $topic,
                $response['questions']
            );
        }
        return $response;
    }

    /**
     * Generates an exam question bank for the teacher (EVAL-01 / issue #235).
     *
     * Unlike generate_quiz (student, free topic or random material),
     * here the teacher explicitly chooses the source files.
     *
     * @param int         $courseid     Course ID.
     * @param int         $userid       Teacher's real $USER->id.
     * @param string[]    $documentids  UUIDs of the chosen documents (at least 1).
     * @param string|null $topic        Optional topic to focus the questions.
     * @param int         $numquestions Number of questions (1..20).
     * @param string      $questiontype Type (multiple_choice|true_false|open|mix).
     * @param string      $difficulty   Difficulty (easy|medium|hard).
     * @return array{course_id:int, topic:?string, questions:array}
     */
    public function generate_exam(
        int $courseid,
        int $userid,
        array $documentids,
        ?string $topic,
        int $numquestions,
        string $questiontype = 'multiple_choice',
        string $difficulty = 'medium',
        array $focustopics = []
    ): array {
        $payload = [
            'course_id'     => $courseid,
            'user_id'       => $userid,
            'document_ids'  => array_values($documentids),
            'num_questions' => $numquestions,
            'question_type' => $questiontype,
            'difficulty'    => $difficulty,
        ];
        if ($topic !== null && trim($topic) !== '') {
            $payload['topic'] = trim($topic);
        }
        if (!empty($focustopics)) {
            // DOC-D09 (#390): topics with detected difficulty (Gaps/FAQ).
            $payload['focus_topics'] = array_values($focustopics);
        }
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/generate-exam', $body);
    }

    /**
     * Evaluates a student's free-text answer to an open question (SP-05).
     *
     * @param int    $courseid    Course ID.
     * @param int    $userid      Real $USER->id.
     * @param string $question    Question text.
     * @param string $modelanswer Model answer / quiz explanation.
     * @param string $useranswer  Answer written by the student.
     * @return array{correct:bool, score:float, feedback:string}
     */
    public function evaluate_quiz_answer(
        int $courseid,
        int $userid,
        string $question,
        string $modelanswer,
        string $useranswer
    ): array {
        $payload = [
            'course_id'   => $courseid,
            'user_id'     => $userid,
            'question'    => $question,
            'model_answer' => $modelanswer,
            'user_answer'  => $useranswer,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/evaluate', $body);
    }

    /**
     * Review suggestions based on the student's most frequent errors (SP-10).
     *
     * @param int $courseid Course ID.
     * @param int $userid   Real $USER->id.
     * @param int $days     Days back (1..365).
     * @return array{course_id:int, total_errors:int, suggestions:array}
     */
    public function quiz_review_suggestions(int $courseid, int $userid, int $days = 90): array {
        $payload = [
            'course_id' => $courseid,
            'user_id'   => $userid,
            'days'      => $days,
            // DATA-05: the errors live in Moodle.
            'errors'    => \local_nexusai\local\quiz_store::errors_for_backend($courseid, $userid, $days, false),
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/review-suggestions', $body);
    }

    /**
     * Personalized study plan: combines quiz errors + chat gaps.
     *
     * @param int $courseid Course ID.
     * @param int $userid   Student's real $USER->id.
     * @param int $days     Days-back window (1..365).
     * @return array{course_id:int, topics:array}
     */
    public function quiz_study_plan(int $courseid, int $userid, int $days = 30): array {
        $payload = [
            'course_id' => $courseid,
            'user_id'   => $userid,
            'days'      => $days,
            // DATA-05: errors and unanswered questions live in Moodle, without what the student dismissed.
            'errors'    => \local_nexusai\local\quiz_store::errors_for_backend($courseid, $userid, $days, true),
            'gaps'      => \local_nexusai\local\quiz_store::gaps_for_backend($courseid, $userid, $days),
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/study-plan', $body);
    }

    /**
     * Semantic search over the course material (Feature A — no LLM).
     *
     * @param int $courseid Moodle course ID.
     * @param int $userid User's real $USER->id.
     * @param string $query Query (1..500 chars).
     * @param int $topk Max results (1..10).
     * @param int[] $courseids When not empty, replaces course_id for multi-course search.
     * @param string $materialtype Filters by the document's mime type (BUS-02). Empty = no filter.
     * @param int|null $section Filters by course section. Null = no filter.
     * @param bool $sectionunassigned If true, filters only material with no section assigned.
     * @return array{query:string, results:array, total:int}
     *
     * @throws \moodle_exception If the backend returns non-2xx or the network fails.
     */
    public function search(
        int $courseid,
        int $userid,
        string $query,
        int $topk = 5,
        array $courseids = [],
        string $materialtype = '',
        ?int $section = null,
        bool $sectionunassigned = false
    ): array {
        $payload = [
            'query'     => $query,
            'course_id' => $courseid,
            'user_id'   => $userid,
            'top_k'     => $topk,
        ];
        if (!empty($courseids)) {
            $payload['course_ids'] = array_map('intval', $courseids);
        }
        if ($materialtype !== '') {
            $payload['material_type'] = $materialtype;
        }
        if ($section !== null) {
            $payload['section'] = $section;
        }
        if ($sectionunassigned) {
            $payload['section_unassigned'] = true;
        }
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/search', $body);
    }

    /**
     * Uploads a document to the backend for RAG indexing.
     *
     * The file travels as base64 inside a JSON (not multipart) so the HMAC
     * is predictable. See the architectural decision in
     * services/api/app/documents/router.py.
     *
     * @param int    $courseid     Course ID (validated by the external function).
     * @param int    $uploaderid   Teacher's real $USER->id (not from the client).
     * @param string $filename     File name.
     * @param string $mimetype     MIME type (only 'application/pdf' accepted in the MVP).
     * @param string $filebytes    File binary content (raw, NOT base64).
     * @param int|null $section    Course section the activity is in.
     * @param int|null $cmid       Course module id of the activity the file comes from (VIS-01).
     * @return array{id:string, course_id:int, uploader_id:int, filename:string, mime_type:string,
     *     status:string, error_message:?string}
     *
     * @throws \moodle_exception If the backend rejects it or the network fails.
     */
    public function upload_document(
        int $courseid,
        int $uploaderid,
        string $filename,
        string $mimetype,
        string $filebytes,
        ?int $section = null,
        ?int $cmid = null
    ): array {
        $payload = [
            'course_id'   => $courseid,
            'uploader_id' => $uploaderid,
            'filename'    => $filename,
            'mime_type'   => $mimetype,
            'content_b64' => base64_encode($filebytes),
        ];
        if ($section !== null) {
            $payload['section'] = $section;
        }
        if ($cmid !== null) {
            // The activity the document comes from: it decides who can see it.
            $payload['cmid'] = $cmid;
        }

        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }

        return $this->post('/api/v1/documents', $body);
    }

    /**
     * Transcribes a short audio clip (spoken question) to text (VOICE-01, #314).
     *
     * @return array {text}
     */
    public function transcribe_audio(string $mimetype, string $audiobytes): array {
        $payload = [
            'mime_type'   => $mimetype,
            'content_b64' => base64_encode($audiobytes),
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/voice/transcribe', $body);
    }

    /**
     * CONT-07 (#356): replaces the file of an existing document without
     * changing its document_id (old chat citations keep pointing to the
     * same id).
     *
     * @param string $documentid UUID of the document to replace.
     * @param string $filename   New file's name.
     * @param string $mimetype   New file's MIME type.
     * @param string $filebytes  New file's binary content (raw, NOT base64).
     * @return array Document state after the replacement.
     */
    public function replace_document(
        string $documentid,
        string $filename,
        string $mimetype,
        string $filebytes
    ): array {
        $payload = [
            'filename'    => $filename,
            'mime_type'   => $mimetype,
            'content_b64' => base64_encode($filebytes),
        ];

        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }

        return $this->post('/api/v1/documents/' . $documentid . '/replace', $body);
    }

    // Forums — Epic 06.

    /**
     * Indexes (or re-indexes) the embedding of a forum post.
     *
     * The backend computes the content_hash and skips it if the content hasn't
     * changed since the last indexing (avoids re-embedding on trivial edits).
     *
     * @param int    $postid       mdl_forum_posts ID.
     * @param int    $discussionid mdl_forum_discussions ID.
     * @param int    $courseid     Moodle course ID.
     * @param string $content      Plain text of the post (no HTML).
     * @param int|null $cmid       Forum activity the post is in (VIS-06).
     * @param int|null $groupid    Group the discussion is restricted to, if any (VIS-06).
     * @return array{post_id:int, status:string}  status = 'indexed' | 'skipped'
     *
     * @throws \moodle_exception If the backend returns non-2xx or the network fails.
     */
    public function index_forum_post(
        int $postid,
        int $discussionid,
        int $courseid,
        string $content,
        ?int $cmid = null,
        ?int $groupid = null
    ): array {
        $payload = [
            'post_id'       => $postid,
            'discussion_id' => $discussionid,
            'course_id'     => $courseid,
            'content'       => $content,
        ];
        if ($cmid !== null) {
            // The forum and, if any, the group of the discussion decide who can see the post (VIS-06).
            $payload['cmid'] = $cmid;
        }
        if ($groupid !== null) {
            $payload['group_id'] = $groupid;
        }
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/forums/index-post', $body);
    }

    /**
     * Removes the embedding of a post deleted from Moodle.
     *
     * The endpoint is idempotent: if the post had no embedding, it's a no-op.
     *
     * @param int $postid mdl_forum_posts ID.
     *
     * @throws \moodle_exception If the backend returns non-2xx or the network fails.
     */
    public function delete_forum_post(int $postid): void {
        $this->delete('/api/v1/forums/index-post/' . $postid);
    }

    /**
     * Searches for forum posts similar to the text the student is writing.
     *
     * Uses cosine similarity over the embeddings stored in forum_post_embeddings.
     * Only searches within the same course. Returns an empty list if nothing
     * beats the threshold.
     *
     * @param int        $courseid      Course ID.
     * @param string     $text          Post text being drafted (min 10 chars).
     * @param int|null   $excludepostid Post to exclude (when editing an existing post).
     * @param float      $threshold     Minimum similarity 0.0-1.0 (default 0.75).
     * @param int        $topk          Max results 1-10 (default 5).
     * @return array{similar_posts:array, threshold_used:float}
     *
     * @throws \moodle_exception If the backend returns non-2xx or the network fails.
     */
    public function search_similar_posts(
        int $courseid,
        string $text,
        ?int $excludepostid = null,
        float $threshold = 0.75,
        int $topk = 5
    ): array {
        $payload = [
            'course_id' => $courseid,
            'text'      => $text,
            'threshold' => $threshold,
            'top_k'     => $topk,
        ];
        if ($excludepostid !== null) {
            $payload['exclude_post_id'] = $excludepostid;
        }
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/forums/similar-posts', $body);
    }

    /**
     * Calls /api/v1/forums/summarize-thread to summarize a discussion.
     *
     * @param int   $discussionid Discussion ID.
     * @param int   $courseid     Course ID.
     * @param array $posts        Array of ['post_id','author','content'].
     * @return array {summary, key_points, resolved, posts_used, posts_truncated}
     */
    public function summarize_thread(int $discussionid, int $courseid, array $posts): array {
        $payload = [
            'discussion_id' => $discussionid,
            'course_id'     => $courseid,
            'posts'         => $posts,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/forums/summarize-thread', $body);
    }

    /**
     * Weekly forum digest (FOR-06, #367) + per-thread urgency signal
     * (FOR-05, #366) — a single combined endpoint, see the router's docstring.
     *
     * @param int   $courseid    Course ID.
     * @param int   $days        Days-back window.
     * @param array $discussions Array of ['discussion_id', 'discussion_name', 'forum_name', 'posts' => [...]].
     * @return array {course_id, period_days, discussion_count, discussions, summary}
     */
    public function weekly_digest(int $courseid, int $days, array $discussions): array {
        $payload = [
            'course_id'   => $courseid,
            'days'        => $days,
            'discussions' => $discussions,
            // DATA-05: the course's webhook lives in Moodle ("" = none).
            'webhook_url' => (string) \local_nexusai\local\calendar_store::webhook($courseid),
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/forums/weekly-digest', $body);
    }

    /**
     * Generates a reply suggestion for a forum post (F-05).
     *
     * @param int    $discussionid   Discussion ID.
     * @param int    $courseid       Course ID.
     * @param array  $posts          Array of ['post_id', 'author', 'content'].
     * @param string $question       Text of the post being replied to (for RAG).
     * @return array {suggested_reply, has_course_material, sources_used}
     */
    public function suggest_reply(int $discussionid, int $courseid, array $posts, string $question): array {
        $payload = [
            'discussion_id' => $discussionid,
            'course_id'     => $courseid,
            'posts'         => $posts,
            'question'      => $question,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/forums/suggest-reply', $body);
    }

    /**
     * Generates a document summary using the LLM (BUS-03).
     *
     * @param string $documentid UUID of the document to summarize.
     * @param int    $courseid   Course ID (isolation validation on the backend).
     * @param int    $userid     Student's real $USER->id.
     * @return array{document_id:string, document_filename:string, summary:string, chunks_used:int, total_chunks:int}
     *
     * @throws \moodle_exception If the backend returns non-2xx or the network fails.
     */
    public function summarize_document(string $documentid, int $courseid, int $userid): array {
        $payload = [
            'document_id' => $documentid,
            'course_id'   => $courseid,
            'user_id'     => $userid,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/documents/summarize', $body);
    }

    /**
     * Review summary combining all relevant indexed material for an upcoming
     * exam, optionally scoped to a unit/section (BUS-04).
     *
     * @param int      $courseid Course ID.
     * @param int      $userid   Real $USER->id.
     * @param int|null $section  Optional unit/section (BUS-05).
     * @return array{summary:string, documents_used:array, total_documents:int}
     */
    public function pre_exam_summary(int $courseid, int $userid, ?int $section = null): array {
        $payload = [
            'course_id' => $courseid,
            'user_id'   => $userid,
            'section'   => $section,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/documents/pre-exam-summary', $body);
    }

    // Documents.

    /**
     * Lists the indexed documents of a course.
     *
     * @param int $courseid Moodle course ID.
     * @return array List of documents with their current status.
     */
    public function list_documents(int $courseid, ?int $limit = null, int $offset = 0, ?int $cmid = null): array {
        $query = 'course_id=' . $courseid . '&offset=' . $offset;
        if ($limit !== null) {
            $query .= '&limit=' . $limit;
        }
        if ($cmid !== null) {
            // Only the documents of that activity (VIS-04).
            $query .= '&cmid=' . $cmid;
        }
        return $this->get('/api/v1/documents?' . $query);
    }

    /**
     * Status of a single document (polling during indexing).
     *
     * @param string $documentid Document UUID.
     * @return array Document's current status.
     */
    public function get_document(string $documentid): array {
        return $this->get('/api/v1/documents/' . $documentid);
    }

    /**
     * Preview of the text extracted from a document (CONT-08 / #357).
     *
     * @param string $documentid Document UUID.
     * @return array { document_id, filename, course_id, status, preview, char_count, truncated }
     */
    public function get_document_preview(string $documentid): array {
        return $this->get('/api/v1/documents/' . $documentid . '/preview');
    }

    /**
     * Deletes a document. The backend CASCADEs over the associated chunks.
     *
     * @param string $documentid Document UUID.
     */
    public function delete_document(string $documentid): void {
        $this->delete('/api/v1/documents/' . $documentid);
    }

    /**
     * Re-runs indexing on an already-uploaded document, without receiving
     * new content — the backend reads the file it already has saved on disk
     * from the original upload (CONT-09, #358).
     *
     * @param string $documentid Document UUID.
     * @return array Document state (same shape as upload/replace).
     */
    public function reindex_document(string $documentid): array {
        return $this->post('/api/v1/documents/' . $documentid . '/reindex', '{}');
    }

    // CAL-02 — Calendar alerts configurable by the student.

    // PRIV-01 — Export and deletion of personal data (issue #310).

    // ONB-02 — Course setup status (issue #425).

    /**
     * Stats on material indexed in NexusAI for a course (BACK-13).
     *
     * This is the only "setup status" signal that doesn't live in Moodle: how
     * many documents reached `status='indexed'`. The caller (course_setup_state)
     * degrades this signal to "unknown" if the backend doesn't respond.
     *
     * @param int $courseid Moodle course ID.
     * @return array{course_id:int, document_count:int, chunk_count:int, last_indexed_at:?string, has_indexed_content:bool}
     */
    public function get_course_stats(int $courseid): array {
        return $this->get('/api/v1/courses/' . $courseid . '/stats');
    }

    /**
     * HMAC-authenticated GET. Signed body = empty string.
     *
     * @param string $path Relative path (e.g. '/api/v1/documents?course_id=1').
     * @return array Decoded response.
     */
    private function get(string $path): array {
        return $this->request('GET', $path, '');
    }

    /**
     * HMAC-authenticated DELETE. Signed body = empty string.
     *
     * @param string $path Relative path.
     */
    private function delete(string $path): void {
        $this->request('DELETE', $path, '', expectjson: false);
    }

    /**
     * Authenticated POST to the backend with HMAC + Bearer.
     *
     * @param string $path  Relative path (e.g. '/api/v1/chat/messages').
     * @param string $body  Raw body as a JSON string.
     * @return array Decoded response (backend's Python keys).
     *
     * @throws \moodle_exception If the HTTP status isn't 200, or the JSON is broken.
     */
    private function post(string $path, string $body): array {
        if (in_array($path, self::VISIBILITY_PATHS, true)) {
            $body = \local_nexusai\local\visible_material::add_to_body(
                $body,
                in_array($path, self::GROUP_PATHS, true)
            );
        }
        return $this->request('POST', $path, $body);
    }

    /**
     * Stores the AI calls the backend reports in the X-NexusAI-Usage header (DATA-05).
     *
     * The user is the one in the request body, or the logged-in user; calls made
     * by tasks and observers (role system) have no user. Never breaks the request.
     *
     * @param \curl $curl Finished request.
     * @param string $path Relative path.
     * @param string $body Signed body.
     * @param string|null $role Role sent to the backend.
     */
    private function store_usage(\curl $curl, string $path, string $body, ?string $role): void {
        global $USER;
        $headers = array_change_key_case((array) $curl->getResponse(), CASE_LOWER);
        $value = $headers['x-nexusai-usage'] ?? '';
        if (!is_string($value) || $value === '') {
            return;
        }
        $calls = \local_nexusai\local\usage_store::parse_header($value);
        if (!$calls) {
            return;
        }
        $data = $body !== '' ? json_decode($body, true) : null;
        $data = is_array($data) ? $data : [];
        $query = [];
        parse_str((string) parse_url($path, PHP_URL_QUERY), $query);
        $courseid = (int) ($data['course_id'] ?? $query['course_id'] ?? 0);
        $role = $role ?? 'system';
        $userid = null;
        if ($role !== 'system') {
            $userid = (int) ($data['user_id'] ?? $data['uploader_id'] ?? 0) ?: (isloggedin() ? (int) $USER->id : null);
        }
        $requestid = isset($headers['x-request-id']) && is_string($headers['x-request-id']) ? $headers['x-request-id'] : null;
        \local_nexusai\local\usage_store::record_calls($userid, $courseid, $role, $calls, $requestid);
    }

    /**
     * HMAC + Bearer authenticated HTTP request. Supports GET/POST/DELETE.
     *
     * Accepts any 2xx code as success (not just 200): 202 Accepted for
     * async uploads, 204 No Content for deletes.
     *
     * @param string $method     'GET' | 'POST' | 'DELETE'
     * @param string $path       Relative path (e.g. '/api/v1/chat/messages')
     * @param string $body       Signed body (empty for GET/DELETE)
     * @param bool   $expectjson Whether the response should be parseable JSON.
     *                           false for 204 No Content.
     * @return array Decoded response (empty if expectjson=false).
     *
     * @throws \moodle_exception If the HTTP status isn't 2xx or the JSON is broken.
     */
    private function request(string $method, string $path, string $body, bool $expectjson = true): array {
        $timestamp = (string) time();
        $nonce     = self::generate_nonce();
        $signature = self::compute_signature($this->secret, $timestamp, $nonce, $body);

        // We use Moodle's \curl class (not PHP's `curl_*`), which automatically
        // applies the site's proxy / blocked hosts config.
        // ignoresecurity=true is needed so the internal backend (localhost /
        // host.docker.internal) isn't rejected by Moodle's anti-SSRF protection.
        // global $CFG is needed so filelib.php can find it in scope when
        // included inside this method.
        global $CFG;
        require_once($CFG->libdir . '/filelib.php');
        $curl = new \curl(['ignoresecurity' => true]);
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apikey,
            'X-Timestamp: ' . $timestamp,
            'X-Nonce: '     . $nonce,
            'X-Signature: ' . $signature,
            'Accept-Language: ' . self::interface_language(),
        ];
        // Who originated the call, for the backend usage ledger (tokens by role).
        $role = $this->request_role($path, $body);
        if ($role !== null) {
            $headers[] = 'X-NexusAI-Role: ' . $role;
        }
        $curl->setHeader($headers);
        $curl->setopt([
            // 120 seconds for chat (the LLM can take a while). For PDF
            // upload, the backend returns 202 immediately and indexing runs
            // in the background, so 120s is plenty for uploads up to ~20MB
            // on slow networks.
            'CURLOPT_TIMEOUT'        => 120,
            'CURLOPT_CONNECTTIMEOUT' => 10,
            'CURLOPT_RETURNTRANSFER' => true,
        ]);

        $url = $this->endpoint . $path;

        switch (strtoupper($method)) {
            case 'POST':
                $response = $curl->post($url, $body);
                break;
            case 'GET':
                $response = $curl->get($url);
                break;
            case 'DELETE':
                $response = $curl->delete($url);
                break;
            default:
                throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'Unsupported HTTP method: ' . $method);
        }

        $info  = $curl->get_info();
        $errno = $curl->get_errno();

        if ($errno || empty($info['http_code'])) {
            throw new \moodle_exception(
                'errorbackendunreachable',
                'local_nexusai',
                '',
                $curl->error ?? 'curl error #' . $errno
            );
        }

        $httpcode = (int) $info['http_code'];
        // Accept any 2xx — useful for 202 Accepted (async upload) and 204
        // No Content (delete).
        if ($httpcode < 200 || $httpcode >= 300) {
            $detail = $response ?: ('HTTP ' . $httpcode);
            if (strlen($detail) > 500) {
                $detail = substr($detail, 0, 500) . '...';
            }
            throw new \moodle_exception(
                'errorbackend',
                'local_nexusai',
                '',
                'HTTP ' . $httpcode . ': ' . $detail
            );
        }

        $this->store_usage($curl, $path, $body, $role);

        // 204 No Content has an empty body — never attempt json_decode on it.
        if ($httpcode === 204) {
            return [];
        }

        if (!$expectjson) {
            return [];
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            throw new \moodle_exception(
                'errorbackend',
                'local_nexusai',
                '',
                'Invalid JSON in response'
            );
        }

        return $decoded;
    }

    /**
     * Generates a UUIDv4-compatible nonce (32 hex chars, no dashes).
     *
     * A plain `random_bytes()` hex string is all the backend needs (it only
     * checks that the nonce was not seen before), so `\core\uuid` is not used.
     *
     * @return string 32 hex chars
     */
    private static function generate_nonce(): string {
        return bin2hex(random_bytes(16));
    }

    /**
     * Computes the HMAC SHA-256 signature.
     *
     * IMPORTANT: the concatenation order must be EXACTLY the same as
     * `services/api/app/auth/hmac.py` (line: `signed_string = (x_timestamp + x_nonce).encode("utf-8") + body`).
     *
     * @param string $secret     32-byte hex
     * @param string $timestamp  Unix epoch as a string
     * @param string $nonce      UUID v4 as a string
     * @param string $body       Raw JSON body
     * @return string Hex signature (64 chars)
     */
    private static function compute_signature(string $secret, string $timestamp, string $nonce, string $body): string {
        $signedstring = $timestamp . $nonce . $body;
        return hash_hmac('sha256', $signedstring, $secret);
    }

    /**
     * FEAT-06 (#481, daily limit): extracts a message suitable to show the
     * student from the raw body of an HTTP error from the backend.
     *
     * Used by chat_stream.php (SSE proxy) — unlike the non-streaming path
     * (`request()` above, which lets the raw JSON pass through inside the
     * `moodle_exception` message and trusts the frontend to parse it with
     * `errors.js`), the SSE proxy has to emit an already-built
     * `data: {...}\n\n` event — there's no browser-side parsing layer for a
     * body that didn't arrive in SSE format.
     *
     * Our own backend (`services/api/app/shared/rate_limit.py`) sends a
     * STRUCTURED `detail` (an object, not a string) with a `message`
     * already written for the student — we prefer it over the raw JSON
     * when present.
     *
     * @param string $rawbody Response body exactly as received (JSON is
     *                        expected, but not assumed — it can arrive
     *                        empty or broken if the backend dropped mid-response).
     * @param int    $httpstatus HTTP status of the response (used only for
     *                        the final fallback, if nothing is parseable).
     * @return string Message ready to show the student.
     */
    public static function extract_stream_error_detail(string $rawbody, int $httpstatus): string {
        $decoded = json_decode($rawbody, true);
        $rawdetail = is_array($decoded) ? ($decoded['detail'] ?? null) : null;

        if (is_array($rawdetail) && isset($rawdetail['message']) && is_string($rawdetail['message'])) {
            return $rawdetail['message'];
        }
        if (is_string($rawdetail) && $rawdetail !== '') {
            return $rawdetail;
        }
        return 'HTTP ' . $httpstatus;
    }
}
