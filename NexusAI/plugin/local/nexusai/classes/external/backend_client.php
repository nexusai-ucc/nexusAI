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

    /**
     * Constructor that reads the plugin config from `local_nexusai/*`.
     *
     * @throws \moodle_exception If any of the 3 config values is missing.
     */
    public function __construct() {
        $endpoint = get_config('local_nexusai', 'api_endpoint');
        $apikey   = get_config('local_nexusai', 'api_key');
        $secret   = get_config('local_nexusai', 'shared_secret');

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
     * Sends a student's message to the backend's /api/v1/chat/messages endpoint.
     *
     * @param int         $courseid   Course ID (validated against context before reaching here).
     * @param int         $userid     Logged-in user ID (= $USER->id, not from the client).
     * @param string      $question   Student's question (1..2000 chars, validated by external_api).
     * @param string|null $sessionid  Existing session UUID, or null to create a new one.
     * @return array{session_id: string, answer: string, messages: array}
     *
     * @throws \moodle_exception If the backend returns non-200 or if the network fails.
     */
    public function send_message(int $courseid, int $userid, string $question, ?string $sessionid = null): array {
        // Body as JSON with a stable format. Keys use snake_case because
        // that's how the backend's Pydantic contract (ChatRequest) defines them.
        $payload = [
            'question'  => $question,
            'course_id' => $courseid,
            'user_id'   => $userid,
        ];
        if (!empty($sessionid)) {
            $payload['session_id'] = $sessionid;
        }

        // CRITICAL: the signed body must be EXACTLY the string sent as the
        // POST body. Any JSON reformatting between signing and sending
        // breaks the signature. That's why we build the string here and reuse it.
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }

        return $this->post('/api/v1/chat/messages', $body);
    }

    /**
     * Sends a student's message with multi-course context (Feature B).
     *
     * The backend will search for material across ALL courses in the list, not just the
     * "primary course". Course names let the LLM cite which course each
     * fragment came from.
     *
     * @param int[]       $courseids   Course IDs to query (>= 1).
     * @param array       $coursenames Map {string(courseid) => name}.
     * @param int         $userid      Student's real $USER->id.
     * @param string      $question    Student's question.
     * @param string|null $sessionid   Existing session UUID, or null to create one.
     * @return array{session_id:string, answer:string, messages:array}
     *
     * @throws \moodle_exception If the backend returns non-2xx or the network fails.
     */
    public function send_message_multicourse(
        array $courseids,
        array $coursenames,
        int $userid,
        string $question,
        ?string $sessionid = null
    ): array {
        // The primary course ID is the first one in the list (the schema
        // requires it to be > 0 for compat with single-course clients).
        $primarycourseid = !empty($courseids) ? (int) $courseids[0] : 0;

        $payload = [
            'question'     => $question,
            'course_id'    => $primarycourseid,
            'user_id'      => $userid,
            'course_ids'   => array_map('intval', $courseids),
            'course_names' => $coursenames,
        ];
        if (!empty($sessionid)) {
            $payload['session_id'] = $sessionid;
        }

        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }

        return $this->post('/api/v1/chat/messages', $body);
    }

    /**
     * Lists the user's previous sessions (history — Feature E).
     *
     * @param int      $userid   Real $USER->id.
     * @param int|null $courseid Filter by course, or null for all of the user's.
     * @param int      $limit    Maximum (1..100).
     * @return array{sessions: array}
     */
    public function list_sessions(int $userid, ?int $courseid = null, int $limit = 20): array {
        $payload = [
            'user_id' => $userid,
            'limit'   => $limit,
        ];
        if ($courseid !== null && $courseid > 0) {
            $payload['course_id'] = $courseid;
        }
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/chat/sessions/list', $body);
    }

    /**
     * Returns the full messages of a session.
     *
     * @param int    $userid    Real $USER->id (the backend validates ownership).
     * @param string $sessionid Session UUID.
     * @return array{session_id:string, messages: array}
     */
    public function get_session_messages(int $userid, string $sessionid): array {
        $payload = [
            'user_id'    => $userid,
            'session_id' => $sessionid,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/chat/sessions/messages', $body);
    }

    /**
     * Deletes a single chat session (ASIST-02, #350). The backend validates
     * ownership (userid) before deleting; the cascade over the session's
     * messages is already resolved at the FK level in Postgres.
     *
     * POST instead of a real DELETE verb — same convention as the rest of
     * the chat module's endpoints, so the body can be HMAC-signed.
     *
     * @param int    $userid    Real $USER->id (the backend validates ownership).
     * @param string $sessionid UUID of the session to delete.
     * @return array{success: bool}
     */
    public function delete_chat_session(int $userid, string $sessionid): array {
        $payload = [
            'user_id'    => $userid,
            'session_id' => $sessionid,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/chat/sessions/delete', $body);
    }

    /**
     * Lists the teacher's gaps — questions the material couldn't answer (Feature G).
     *
     * @param int $courseid ID del curso.
     * @param int $days     Days back (1..365).
     * @param int $limit    Max items (1..100).
     * @param bool $includearchived Include already-archived gaps (DOC-D08, #383).
     * @return array{course_id:int, days:int, total:int, items:array}
     */
    public function list_gaps(
        int $courseid,
        int $days = 30,
        int $limit = 20,
        bool $includearchived = false,
        int $offset = 0
    ): array {
        $payload = [
            'course_id'        => $courseid,
            'days'             => $days,
            'limit'            => $limit,
            'offset'           => $offset,
            'include_archived' => $includearchived,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/gaps/list', $body);
    }

    /**
     * Archives or unarchives a detected gap (DOC-D08, issue #383).
     *
     * @param int $courseid    Course ID.
     * @param array $questionids IDs (UUID string) of the rows to flag.
     * @param bool $archived   true to archive, false to unarchive.
     * @return array{course_id:int, archived:bool, affected:int}
     */
    public function archive_gap(int $courseid, array $questionids, bool $archived): array {
        $payload = [
            'course_id'    => $courseid,
            'question_ids' => $questionids,
            'archived'     => $archived,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/gaps/archive', $body);
    }

    /**
     * Students' most frequent questions, grouped by topic by an LLM (DOC-D02).
     *
     * @param int $courseid Course ID.
     * @param int $days     Time window (1..365).
     * @return array{course_id:int, days:int, total_questions:int, topics:array}
     */
    public function faq_topics(int $courseid, int $days = 30): array {
        $payload = [
            'course_id' => $courseid,
            'days'      => $days,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/analytics/faq-topics', $body);
    }

    /**
     * Aggregated metrics dashboard of a course for the teacher (ANALYTICS-01/02):
     * top queries, daily usage, quiz score distribution and gaps ratio.
     *
     * @param int $courseid Course ID.
     * @param int $days     Time window (1..365).
     * @return array{course_id:int, period_days:int, top_queries:array,
     *               daily_message_counts:array, quiz_score_distribution:array,
     *               gaps_ratio:array}
     */
    public function analytics_dashboard(int $courseid, int $days = 30): array {
        return $this->get('/api/v1/admin/analytics?course_id=' . $courseid . '&days=' . $days);
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
        ];
        if ($topic !== null && trim($topic) !== '') {
            $payload['topic'] = trim($topic);
        }
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/generate', $body);
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
     * Persists the questions a student got wrong in a quiz (SP-10).
     *
     * @param int   $courseid Course ID.
     * @param int   $userid   Real $USER->id.
     * @param array $errors   List of errors (QuizErrorItem shape from the backend).
     * @return array{stored:int}
     */
    public function record_quiz_errors(int $courseid, int $userid, array $errors): array {
        $payload = [
            'course_id' => $courseid,
            'user_id'   => $userid,
            'errors'    => $errors,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/errors', $body);
    }

    /**
     * Lists the student's quiz error history in a course (SP-10).
     *
     * @param int $courseid Course ID.
     * @param int $userid   Real $USER->id.
     * @param int $days     Days back (1..365).
     * @param int $limit    Max items (1..200).
     * @param int $offset   Number of items to skip (pagination, UX-19 #389).
     * @return array{course_id:int, total:int, items:array}
     */
    public function list_quiz_errors(int $courseid, int $userid, int $days = 90, int $limit = 100, int $offset = 0): array {
        $payload = [
            'course_id' => $courseid,
            'user_id'   => $userid,
            'days'      => $days,
            'limit'     => $limit,
            'offset'    => $offset,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/errors/list', $body);
    }

    /**
     * Clears the student's quiz error history in a course (SP-10).
     *
     * @param int $courseid Course ID.
     * @param int $userid   Real $USER->id.
     * @return array{deleted:int}
     */
    public function clear_quiz_errors(int $courseid, int $userid): array {
        $payload = [
            'course_id' => $courseid,
            'user_id'   => $userid,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/errors/clear', $body);
    }

    /**
     * Persists the result of a quiz completed by the student (SP-09).
     *
     * @param int         $courseid       Course ID.
     * @param int         $userid         Real $USER->id.
     * @param string      $questiontype   Quiz type (multiple_choice|flashcard|fill_blank|…).
     * @param string      $difficulty     Difficulty (easy|medium|hard).
     * @param string|null $topic          Optional topic.
     * @param int         $totalquestions Total number of questions.
     * @param int         $correctcount   Number of correct answers.
     * @return array{id:string, created_at:string}
     */
    public function save_quiz_attempt(
        int $courseid,
        int $userid,
        string $questiontype,
        string $difficulty,
        ?string $topic,
        int $totalquestions,
        int $correctcount
    ): array {
        $payload = [
            'course_id'       => $courseid,
            'user_id'         => $userid,
            'question_type'   => $questiontype,
            'difficulty'      => $difficulty,
            'total_questions' => $totalquestions,
            'correct_answers'   => $correctcount,
        ];
        if ($topic !== null && trim($topic) !== '') {
            $payload['topic'] = trim($topic);
        }
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/attempts', $body);
    }

    /**
     * Lists the quizzes the student completed in a course (SP-09).
     *
     * @param int $courseid Course ID.
     * @param int $userid   Real $USER->id.
     * @param int $days     Days back (1..365).
     * @param int $limit    Max items (1..100).
     * @return array{course_id:int, total:int, items:array}
     */
    public function list_quiz_attempts(int $courseid, int $userid, int $days = 90, int $limit = 20): array {
        $payload = [
            'course_id' => $courseid,
            'user_id'   => $userid,
            'days'      => $days,
            'limit'     => $limit,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/attempts/list', $body);
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
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/study-plan', $body);
    }

    /**
     * SP-12 (#322): suggests a starting difficulty for the quiz generator,
     * based on the student's `quiz_attempts` history.
     *
     * @param int         $courseid Course ID.
     * @param int         $userid   Student's real $USER->id.
     * @param string|null $topic    Chosen topic, or null for general history.
     * @return array{difficulty:?string, reason:?string, based_on_attempts:int, accuracy_pct:?int}
     */
    public function suggest_difficulty(int $courseid, int $userid, ?string $topic): array {
        $payload = [
            'course_id' => $courseid,
            'user_id'   => $userid,
            'topic'     => $topic,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/suggest-difficulty', $body);
    }

    /**
     * SP-16 (#354): student's consecutive-day activity streak in the
     * course (quiz_attempts + chat messages, no new table).
     *
     * @param int $courseid Course ID.
     * @param int $userid   Student's real $USER->id.
     * @return array{current_streak:int, practiced_today:bool}
     */
    public function get_streak(int $courseid, int $userid): array {
        $payload = [
            'course_id' => $courseid,
            'user_id'   => $userid,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/streak', $body);
    }

    /**
     * SP-13 (#323): dismisses a specific topic from the student's study plan
     * (operates on real row IDs, not on the topic text).
     *
     * @param int      $courseid       Course ID.
     * @param int      $userid         Student's real $USER->id.
     * @param string[] $quizerrorids   quiz_errors IDs to dismiss.
     * @param string[] $gapquestionids unanswered_questions IDs to dismiss.
     * @return array{affected:int}
     */
    public function dismiss_study_plan_topic(
        int $courseid,
        int $userid,
        array $quizerrorids,
        array $gapquestionids
    ): array {
        $payload = [
            'course_id'        => $courseid,
            'user_id'          => $userid,
            'quiz_error_ids'   => $quizerrorids,
            'gap_question_ids' => $gapquestionids,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/study-plan/dismiss', $body);
    }

    /**
     * SP-11 (#315): how many already-generated flashcards are "due today" vs. the total.
     *
     * @param int         $courseid Course ID.
     * @param int         $userid   Student's real $USER->id.
     * @param string|null $topic    Topic (optional).
     * @return array{due_count:int, total_count:int}
     */
    public function flashcards_summary(int $courseid, int $userid, ?string $topic): array {
        $payload = [
            'course_id' => $courseid,
            'user_id'   => $userid,
            'topic'     => $topic,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/flashcards/summary', $body);
    }

    /**
     * SP-11 (#315): already-generated flashcards that are "due today" (most
     * overdue first) — doesn't call the LLM, serves from the persisted bank.
     *
     * @param int         $courseid Course ID.
     * @param int         $userid   Student's real $USER->id.
     * @param string|null $topic    Topic (optional).
     * @param int         $limit    Maximum amount.
     * @return array{course_id:int, questions:array}
     */
    public function flashcards_due(int $courseid, int $userid, ?string $topic, int $limit): array {
        $payload = [
            'course_id' => $courseid,
            'user_id'   => $userid,
            'topic'     => $topic,
            'limit'     => $limit,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/flashcards/due', $body);
    }

    /**
     * SP-11 (#315): applies spaced repetition (SM-2) over the self-assessment
     * result of a flashcards session. Called once at the end of the session
     * (same pattern as save_quiz_attempt/record_quiz_errors).
     *
     * @param int   $courseid Course ID.
     * @param int   $userid   Student's real $USER->id.
     * @param array $reviews  [{flashcard_id: string, knew_it: bool}, ...]
     * @return array{updated:int}
     */
    public function flashcards_review_batch(int $courseid, int $userid, array $reviews): array {
        $payload = [
            'course_id' => $courseid,
            'user_id'   => $userid,
            'reviews'   => $reviews,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/flashcards/review-batch', $body);
    }

    /**
     * ASIST-01 (#321): saves the student's 👍/👎 vote on a specific chat
     * answer.
     *
     * @param string      $messageid Message ID (UUID from `messages`).
     * @param int         $courseid  Course ID.
     * @param int         $userid    Student's real $USER->id.
     * @param bool        $ishelpful true = 👍, false = 👎.
     * @param string|null $comment   Optional short comment (only with 👎).
     * @return array{ok:bool}
     */
    public function submit_message_feedback(
        string $messageid,
        int $courseid,
        int $userid,
        bool $ishelpful,
        ?string $comment
    ): array {
        $payload = [
            'message_id'  => $messageid,
            'course_id'   => $courseid,
            'user_id'     => $userid,
            'is_helpful'  => $ishelpful,
            'comment'     => $comment,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/chat/messages/feedback', $body);
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
        ?int $section = null
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
     * @return array{post_id:int, status:string}  status = 'indexed' | 'skipped'
     *
     * @throws \moodle_exception If the backend returns non-2xx or the network fails.
     */
    public function index_forum_post(int $postid, int $discussionid, int $courseid, string $content): array {
        $payload = [
            'post_id'       => $postid,
            'discussion_id' => $discussionid,
            'course_id'     => $courseid,
            'content'       => $content,
        ];
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
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/forums/weekly-digest', $body);
    }

    /**
     * Saves (or deletes, with $url = '') the course's webhook URL for the
     * weekly forum digest (FOR-07, #378).
     *
     * @return array {webhook_url}
     */
    public function save_forum_webhook(int $courseid, string $url): array {
        $payload = ['course_id' => $courseid, 'webhook_url' => $url];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/forums/webhook-config/save', $body);
    }

    /**
     * Reads the webhook URL configured for the course (FOR-07, #378).
     *
     * @return array {webhook_url}
     */
    public function get_forum_webhook(int $courseid): array {
        $body = json_encode(['course_id' => $courseid], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/forums/webhook-config/get', $body);
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
    public function list_documents(int $courseid, ?int $limit = null, int $offset = 0): array {
        $query = 'course_id=' . $courseid . '&offset=' . $offset;
        if ($limit !== null) {
            $query .= '&limit=' . $limit;
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

    /**
     * Upsert of a calendar alert. days_before=0 removes the alert.
     *
     * @param int    $userid         Real $USER->id.
     * @param int    $courseid       Course ID.
     * @param int    $eventid        Event ID in Moodle.
     * @param string $eventname      Event name (stored for the cron).
     * @param int    $eventtimestamp Event's unix timestamp.
     * @param int    $daysbefore     0 = no alert, 1, 3 or 7 days before.
     * @return array{id:string|null, days_before:int}
     */
    public function save_calendar_alert(
        int $userid,
        int $courseid,
        int $eventid,
        string $eventname,
        int $eventtimestamp,
        int $daysbefore
    ): array {
        $payload = [
            'user_id'         => $userid,
            'course_id'       => $courseid,
            'event_id'        => $eventid,
            'event_name'      => $eventname,
            'event_timestamp' => $eventtimestamp,
            'days_before'     => $daysbefore,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/calendar/alerts/save', $body);
    }

    /**
     * Lists the student's active alerts in the course.
     *
     * @param int $userid   Real $USER->id.
     * @param int $courseid Course ID.
     * @return array{alerts:array}
     */
    public function list_calendar_alerts(int $userid, int $courseid): array {
        $payload = [
            'user_id'   => $userid,
            'course_id' => $courseid,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/calendar/alerts/list', $body);
    }

    /**
     * Gets all alerts due globally (called by the cron).
     *
     * @return array{alerts:array}
     */
    public function get_due_calendar_alerts(): array {
        $body = '{}';
        return $this->post('/api/v1/calendar/alerts/due', $body);
    }

    /**
     * Marks an alert as already notified so the cron doesn't resend it.
     *
     * @param string $alertid Alert UUID.
     * @return array{ok:bool}
     */
    public function mark_calendar_alert_notified(string $alertid): array {
        $payload = ['alert_id' => $alertid];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/calendar/alerts/mark-notified', $body);
    }

    // PRIV-01 — Export and deletion of personal data (issue #310).

    /**
     * Exports the student's entire personal history in a course (chat
     * messages, active quiz attempts, quiz errors).
     *
     * @param int $userid   Real $USER->id — never a parameter editable by the student.
     * @param int $courseid Course ID.
     * @return array{user_id:int, course_id:int, messages:array, quiz_attempts:array, quiz_errors:array}
     */
    public function privacy_export(int $userid, int $courseid): array {
        return $this->get('/api/v1/privacy/export?user_id=' . $userid . '&course_id=' . $courseid);
    }

    /**
     * Deletes the student's personal history in a course. Quiz attempts are
     * anonymized (not deleted) so as not to break the teacher's Analytics
     * dashboard — see the docstring in app/privacy/router.py.
     *
     * @param int $userid   Real $USER->id — never a parameter editable by the student.
     * @param int $courseid Course ID.
     * @return array{messages_deleted:int, quiz_errors_deleted:int, quiz_attempts_anonymized:int}
     */
    public function privacy_delete(int $userid, int $courseid): array {
        // We don't use the delete() helper below: that one assumes 204 No
        // Content (expectjson: false). This endpoint DOES return JSON with
        // the counts of what was deleted/anonymized, so we call request()
        // directly with expectjson at its default (true).
        return $this->request(
            'DELETE',
            '/api/v1/privacy/data?user_id=' . $userid . '&course_id=' . $courseid,
            ''
        );
    }

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
        return $this->request('POST', $path, $body);
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
        $curl->setHeader([
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apikey,
            'X-Timestamp: ' . $timestamp,
            'X-Nonce: '     . $nonce,
            'X-Signature: ' . $signature,
        ]);
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
     * We don't use `\core\uuid::generate()` because it only exists from
     * Moodle 3.10 onward with a namespace, and we want maximum compat with
     * the 4.1-4.5 range. `random_bytes()` has been available since PHP 7.0
     * — more than enough.
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
