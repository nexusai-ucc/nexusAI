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
 * External Functions registry for local_nexusai.
 *
 * Each entry in `$functions` declares a function exposed to JavaScript through
 * the `core/ajax` AMD module. Moodle takes care of:
 *   - Automatically validating the sesskey (CSRF).
 *   - Applying require_login() before execute.
 *   - Checking the capabilities declared here.
 *   - Converting params and returns with the declared external_value/structure.
 *
 * Naming convention: `<plugin>_<action>` — the JS client uses it as
 * `methodname: 'local_nexusai_chat_send'` in `core/ajax::call()`.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [

    // Student.

    // Send a student message to the assistant and get the LLM's response.
    // This is the function React calls via core/ajax.
    'local_nexusai_chat_send' => [
        'classname'     => '\local_nexusai\external\chat_send',
        'methodname'    => 'execute',
        'description'   => 'Send a message to the NexusAI assistant and get the LLM response.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // VOICE-01 (#314): transcribes a short audio clip to text for the chat composer.
    'local_nexusai_chat_voice_transcribe' => [
        'classname'     => '\local_nexusai\external\chat_voice_transcribe',
        'methodname'    => 'execute',
        'description'   => 'Transcribe a short recorded question to text for the chat composer.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Student 👍/👎 feedback on a specific chat response (ASIST-01).
    'local_nexusai_chat_message_feedback' => [
        'classname'     => '\local_nexusai\external\chat_message_feedback',
        'methodname'    => 'execute',
        'description'   => 'Record a student 👍/👎 vote on a specific assistant chat response.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Automatic summary of an indexed document using the LLM (BUS-03).
    'local_nexusai_document_summarize' => [
        'classname'     => '\local_nexusai\external\document_summarize',
        'methodname'    => 'execute',
        'description'   => 'Generate an AI summary of an indexed course document (BUS-03).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Pre-exam review summary combining all relevant indexed material,
    // optionally scoped to a unit/section (BUS-04).
    'local_nexusai_document_pre_exam_summary' => [
        'classname'     => '\local_nexusai\external\document_pre_exam_summary',
        'methodname'    => 'execute',
        'description'   => 'Generate a combined pre-exam review summary across indexed documents (BUS-04).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Semantic search over the course material (retrieval without LLM — Feature A).
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
        'description'   => 'List a course\'s sections (number + display name) — used by the upload section '
            . 'picker and the search section filter (BUS-05).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // ONB-02 (#425): course setup state for the teacher tutorial/onboarding
    // — sections, groups, students, forums, calendar and material.
    'local_nexusai_course_setup_state' => [
        'classname'     => '\local_nexusai\external\course_setup_state',
        'methodname'    => 'execute',
        'description'   => 'Aggregate a course\'s setup state (sections, groups, students, forums, calendar, '
            . 'NexusAI material) for the teacher onboarding tutorial (ONB-02).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // ONB-05 (#428): onboarding tutorial dismissal/progress state
    // (persisted in core's user_preferences, not in the plugin's own tables).
    'local_nexusai_onboarding_state_get' => [
        'classname'     => '\local_nexusai\external\onboarding_state_get',
        'methodname'    => 'execute',
        'description'   => 'Read the current user\'s onboarding dismissal/skip state for a course (ONB-05).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],
    'local_nexusai_onboarding_state_set' => [
        'classname'     => '\local_nexusai\external\onboarding_state_set',
        'methodname'    => 'execute',
        'description'   => 'Save the current user\'s onboarding dismissal/skip state for a course (ONB-05).',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Conversation history — list of the student's previous sessions (Feature E).
    'local_nexusai_chat_sessions_list' => [
        'classname'     => '\local_nexusai\external\chat_sessions_list',
        'methodname'    => 'execute',
        'description'   => 'List previous NexusAI chat sessions for the student.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Messages of a specific session to resume the conversation (Feature E).
    'local_nexusai_chat_session_messages' => [
        'classname'     => '\local_nexusai\external\chat_session_messages',
        'methodname'    => 'execute',
        'description'   => 'Fetch the full message list of an existing chat session.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Delete a single session from the student's history (ASIST-02, #350).
    'local_nexusai_chat_session_delete' => [
        'classname'     => '\local_nexusai\external\chat_session_delete',
        'methodname'    => 'execute',
        'description'   => 'Delete a single NexusAI chat session (and its messages via cascade).',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Quiz generator — practice questions from the material (Feature F / SP-03).
    'local_nexusai_quiz_generate' => [
        'classname'     => '\local_nexusai\external\quiz_generate',
        'methodname'    => 'execute',
        'description'   => 'Generate a practice quiz (multiple choice, true/false, open or mix) from the course material.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Suggests a starting difficulty based on the student's history (SP-12).
    'local_nexusai_quiz_suggest_difficulty' => [
        'classname'     => '\local_nexusai\external\quiz_suggest_difficulty',
        'methodname'    => 'execute',
        'description'   => 'Suggest a starting difficulty for the practice quiz based on the student\'s attempt history.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Student's consecutive-day activity streak in the course (SP-16).
    'local_nexusai_quiz_streak' => [
        'classname'     => '\local_nexusai\external\quiz_streak',
        'methodname'    => 'execute',
        'description'   => 'Get the student\'s current study streak (consecutive days with quiz or chat activity) in a course.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Quiz evaluator — evaluates open answers with AI (SP-05).
    'local_nexusai_quiz_evaluate' => [
        'classname'     => '\local_nexusai\external\quiz_evaluate',
        'methodname'    => 'execute',
        'description'   => 'Evaluate a student open answer against the course material using LLM.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Exam generator — question bank from files chosen by the teacher
    // (EVAL-01 / issue #235, DOC-D04). Teachers only (capability :manage).
    'local_nexusai_exam_generate' => [
        'classname'     => '\local_nexusai\external\exam_generate',
        'methodname'    => 'execute',
        'description'   => 'Generate an exam question bank from teacher-selected course files.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Error review — persists questions answered wrong in a quiz (SP-10).
    'local_nexusai_quiz_errors_record' => [
        'classname'     => '\local_nexusai\external\quiz_errors_record',
        'methodname'    => 'execute',
        'description'   => 'Persist the questions a student answered wrong in a quiz.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Error review — student's history in a course (SP-10).
    'local_nexusai_quiz_errors_list' => [
        'classname'     => '\local_nexusai\external\quiz_errors_list',
        'methodname'    => 'execute',
        'description'   => 'List the quiz-error history of the current student in a course.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Error review — clears the student's history (SP-10).
    'local_nexusai_quiz_errors_clear' => [
        'classname'     => '\local_nexusai\external\quiz_errors_clear',
        'methodname'    => 'execute',
        'description'   => 'Clear the quiz-error history of the current student in a course.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Error review — review suggestions based on frequent errors (SP-10).
    'local_nexusai_quiz_review_suggestions' => [
        'classname'     => '\local_nexusai\external\quiz_review_suggestions',
        'methodname'    => 'execute',
        'description'   => 'Get AI-generated review suggestions based on the student quiz-error history.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Quiz history — saves the result of a completed quiz (SP-09).
    'local_nexusai_quiz_attempt_save' => [
        'classname'     => '\local_nexusai\external\quiz_attempt_save',
        'methodname'    => 'execute',
        'description'   => 'Persist the result of a completed quiz attempt for the current student.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Quiz history — lists the student's history in a course (SP-09).
    'local_nexusai_quiz_attempt_list' => [
        'classname'     => '\local_nexusai\external\quiz_attempt_list',
        'methodname'    => 'execute',
        'description'   => 'List the quiz history of the current student in a course.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Personalized study plan — combines quiz errors and chat gaps (STUDY-01).
    'local_nexusai_quiz_study_plan' => [
        'classname'     => '\local_nexusai\external\quiz_study_plan',
        'methodname'    => 'execute',
        'description'   => 'Get a personalized study plan combining quiz-error history and unanswered chat questions.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Dismiss a specific study-plan topic, without deleting the history (SP-13).
    'local_nexusai_quiz_study_plan_dismiss' => [
        'classname'     => '\local_nexusai\external\quiz_study_plan_dismiss',
        'methodname'    => 'execute',
        'description'   => 'Dismiss a specific study-plan topic for the current student without deleting the underlying history.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Flashcards spaced repetition — how many are due today vs. the total (SP-11).
    'local_nexusai_quiz_flashcards_summary' => [
        'classname'     => '\local_nexusai\external\quiz_flashcards_summary',
        'methodname'    => 'execute',
        'description'   => 'Get how many generated flashcards are due today vs. the total generated so far.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Flashcards spaced repetition — the ones due today, from the already-generated bank (SP-11).
    'local_nexusai_quiz_flashcards_due' => [
        'classname'     => '\local_nexusai\external\quiz_flashcards_due',
        'methodname'    => 'execute',
        'description'   => 'Get already-generated flashcards due today (spaced repetition), no LLM call.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Flashcards spaced repetition — applies SM-2 at the end of a session (SP-11).
    'local_nexusai_quiz_flashcards_review_batch' => [
        'classname'     => '\local_nexusai\external\quiz_flashcards_review_batch',
        'methodname'    => 'execute',
        'description'   => 'Apply SM-2 spaced repetition scheduling for a batch of self-rated flashcards.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Gap detection — questions the material didn't answer (Feature G).
    // Only teachers see their gaps (capability :manage).
    'local_nexusai_gaps_list' => [
        'classname'     => '\local_nexusai\external\gaps_list',
        'methodname'    => 'execute',
        'description'   => 'List questions the course material could not answer (teacher view).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Archive/unarchive a detected gap (DOC-D08, issue #383).
    'local_nexusai_gaps_archive' => [
        'classname'     => '\local_nexusai\external\gaps_archive',
        'methodname'    => 'execute',
        'description'   => 'Archive or unarchive a detected content gap (teacher view).',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Frequent-questions dashboard grouped by topic (DOC-D02).
    // Teachers/admins only (capability :manage).
    'local_nexusai_analytics_faq_topics' => [
        'classname'     => '\local_nexusai\external\analytics_faq_topics',
        'methodname'    => 'execute',
        'description'   => 'Most frequent student questions grouped by topic via LLM (teacher view).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Aggregated dashboard: top queries, daily usage, quiz score
    // distribution and gaps ratio (ANALYTICS-01/02). Teachers/admins only.
    'local_nexusai_analytics_dashboard' => [
        'classname'     => '\local_nexusai\external\analytics_dashboard',
        'methodname'    => 'execute',
        'description'   => 'Aggregated course analytics dashboard (teacher view).',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Calendar — CAL-02.

    // Saves / updates the alert on a calendar event for the student.
    'local_nexusai_calendar_alert_save' => [
        'classname'     => '\local_nexusai\external\calendar_alert_save',
        'methodname'    => 'execute',
        'description'   => 'Save or update a calendar event alert for the current student.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Lists the student's active alerts in the course.
    'local_nexusai_calendar_alerts_list' => [
        'classname'     => '\local_nexusai\external\calendar_alerts_list',
        'methodname'    => 'execute',
        'description'   => 'List active calendar event alerts for the current student in a course.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // URL of the student's subscribable .ics feed for a course (CAL-07).
    'local_nexusai_calendar_feed_url' => [
        'classname'     => '\local_nexusai\external\calendar_feed_url',
        'methodname'    => 'execute',
        'description'   => 'Get the subscribable .ics feed URL for the current student in a course.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Rotates the student's .ics feed token (revokes the previous URL).
    'local_nexusai_calendar_feed_revoke' => [
        'classname'     => '\local_nexusai\external\calendar_feed_revoke',
        'methodname'    => 'execute',
        'description'   => 'Rotate the student\'s calendar feed token, invalidating the previous URL.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Forums — Epic 06.

    // Detects posts similar to the text the student is writing (F-07).
    // Used by the forum-duplicate-checker AMD module before posting.
    'local_nexusai_forum_search_similar' => [
        'classname'     => '\local_nexusai\external\forum_search_similar',
        'methodname'    => 'execute',
        'description'   => 'Find semantically similar forum posts in the same course.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Summarizes a forum discussion with the LLM (F-04/F-10).
    // Used by the forum-thread-summarizer AMD module in mod-forum-discuss.
    'local_nexusai_forum_summarize_thread' => [
        'classname'     => '\local_nexusai\external\forum_summarize_thread',
        'methodname'    => 'execute',
        'description'   => 'Summarize a forum discussion thread using the LLM.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Generates a reply suggestion for a forum post with RAG + LLM (F-05/F-11).
    // Used by the forum-reply-suggester AMD module when the user opens the reply form.
    'local_nexusai_forum_suggest_reply' => [
        'classname'     => '\local_nexusai\external\forum_suggest_reply',
        'methodname'    => 'execute',
        'description'   => 'Generate an AI-powered reply suggestion for a forum post using RAG.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:use',
        'loginrequired' => true,
    ],

    // Weekly forum digest + per-thread urgency signal, for the teacher
    // (FOR-06 / #367, FOR-05 / #366). Part of the React widget panel
    // (teacherOnly), not a native AMD module like the other 3 forum functions.
    'local_nexusai_forum_weekly_digest' => [
        'classname'     => '\local_nexusai\external\forum_weekly_digest',
        'methodname'    => 'execute',
        'description'   => 'Get a weekly digest of forum activity across the course, with per-thread urgency flags.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    'local_nexusai_forum_webhook_save' => [
        'classname'     => '\local_nexusai\external\forum_webhook_save',
        'methodname'    => 'execute',
        'description'   => 'Save (or clear, with an empty URL) the course webhook URL for the weekly forum digest.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    'local_nexusai_forum_webhook_get' => [
        'classname'     => '\local_nexusai\external\forum_webhook_get',
        'methodname'    => 'execute',
        'description'   => 'Get the currently configured course webhook URL for the weekly forum digest.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Teacher.

    // Uploads a course document (PDF) to index it in the RAG backend.
    // Receives a `draftitemid` from Moodle's file picker, reads the file
    // from the file API, base64-encodes it and POSTs it to the backend.
    'local_nexusai_document_upload' => [
        'classname'     => '\local_nexusai\external\document_upload',
        'methodname'    => 'execute',
        'description'   => 'Upload a course document (PDF) to NexusAI for indexing.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Lists all indexed documents of a course (for the teacher table).
    'local_nexusai_document_list' => [
        'classname'     => '\local_nexusai\external\document_list',
        'methodname'    => 'execute',
        'description'   => 'List all NexusAI-indexed documents for a course.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Status of a single document (for polling during indexing).
    'local_nexusai_document_status' => [
        'classname'     => '\local_nexusai\external\document_status',
        'methodname'    => 'execute',
        'description'   => 'Get the current status of an indexing job.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Deletes a document (cascade deletes the associated chunks).
    'local_nexusai_document_delete' => [
        'classname'     => '\local_nexusai\external\document_delete',
        'methodname'    => 'execute',
        'description'   => 'Delete a NexusAI-indexed document and all its chunks.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Reindexes an already-uploaded document, without requesting a new file (CONT-09).
    'local_nexusai_document_reindex' => [
        'classname'     => '\local_nexusai\external\document_reindex',
        'methodname'    => 'execute',
        'description'   => 'Re-run indexing for an already-uploaded document, reusing the stored file.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Preview of the text extracted from a document (CONT-08).
    'local_nexusai_document_preview' => [
        'classname'     => '\local_nexusai\external\document_preview',
        'methodname'    => 'execute',
        'description'   => 'Return the first characters of a document\'s extracted text.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Replaces the file of an existing document without changing its id (CONT-07).
    'local_nexusai_document_replace' => [
        'classname'     => '\local_nexusai\external\document_replace',
        'methodname'    => 'execute',
        'description'   => 'Replace a NexusAI document\'s file while keeping its document_id.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // Upload confirmation from a course section.

    // Lists files uploaded to the course (general tab) pending confirmation.
    'local_nexusai_get_pending_uploads' => [
        'classname'     => '\local_nexusai\external\get_pending_uploads',
        'methodname'    => 'execute',
        'description'   => 'Get files uploaded to a course section that are pending NexusAI indexing confirmation.',
        'type'          => 'read',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // The teacher confirmed they want to index the file in NexusAI.
    'local_nexusai_confirm_pending_upload' => [
        'classname'     => '\local_nexusai\external\confirm_pending_upload',
        'methodname'    => 'execute',
        'description'   => 'Confirm indexing of a pending course file into NexusAI.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'local/nexusai:manage',
        'loginrequired' => true,
    ],

    // The teacher chose not to index the file in NexusAI.
    'local_nexusai_dismiss_pending_upload' => [
        'classname'     => '\local_nexusai\external\dismiss_pending_upload',
        'methodname'    => 'execute',
        'description'   => 'Dismiss a pending course file without indexing it into NexusAI.',
        'type'          => 'write',
        'ajax'          => true,
        'loginrequired' => true,
    ],

    // PRIV-01 — Export and deletion of personal data (issue #310).
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

// The $services array stays empty: we don't expose a preconfigured service yet. The
// function is only callable from within the plugin (via core/ajax). If in the future
// we want to allow external token-based calls, add a service here.
$services = [];
