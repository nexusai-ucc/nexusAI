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
 * English language strings for local_nexusai.
 *
 * Moodle requires EVERY capability and EVERY setting to have its string here. If
 * one is missing, Moodle shows "[[key]]" in the UI, which looks quite bad. Keep
 * this in sync with lang/es/local_nexusai.php.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['admin_active_config'] = 'Active configuration';
$string['admin_backend_status'] = 'Backend status';
$string['admin_check_again'] = 'Check again';
$string['admin_edit_config'] = 'Edit configuration';
$string['admin_health_configure_prompt'] = 'Configure the endpoint in <a href="{$a}">Plugin configuration</a>';
$string['admin_health_invalid_response'] = 'Invalid response (not JSON)';
$string['admin_health_latency'] = 'latency <strong>{$a} ms</strong>';
$string['admin_health_version'] = 'backend version <code>{$a}</code>';
$string['admin_page_title'] = 'NexusAI · Admin panel';
$string['admin_plugin_enabled'] = 'Plugin enabled';
$string['admin_status_connected'] = 'Connected';
$string['admin_status_error'] = 'Connection error';
$string['admin_status_unconfigured'] = 'Not configured';
$string['admin_value_masked'] = '●●●●●●●● (configured)';
$string['alert_from_email'] = 'Alert sender email';
$string['alert_from_email_desc'] = 'Address shown as sender in NexusAI calendar alert emails. Leave empty to use Moodle\'s global noreply address (Site administration → Server → Email).';
$string['apienabled'] = 'Enable NexusAI';
$string['apienabled_desc'] = 'Master switch. Disable to hide the chat widget across the site.';
$string['apiendpoint'] = 'Backend API URL';
$string['apiendpoint_desc'] = 'Base URL of the NexusAI Python backend (e.g. http://localhost:8001).';
$string['apikey'] = 'API key';
$string['apikey_desc'] = 'Bearer API key sent in the Authorization header. Generate with: openssl rand -hex 32. Must match NEXUSAI_API_KEY on the backend.';
$string['budget_exhausted'] = 'You reached today\'s limit. It renews at {$a}.';
$string['budget_left'] = 'About {$a} questions left today';
$string['budget_title'] = 'Your assistant limit';
$string['budget_warning'] = 'You have used {$a}% of today\'s limit.';
$string['cachedef_budget'] = 'Latest token budget reported by the backend for each user';
$string['cal_alert_body'] = 'Your event "{$a}" is coming up soon. Check the course calendar in NexusAI.';
$string['cal_alert_subject'] = 'Reminder: {$a}';
$string['chatwidget_error'] = 'Something went wrong. Try again in a moment.';
$string['chatwidget_loading'] = 'Loading...';
$string['chatwidget_navtrigger'] = 'NexusAI Assistant';
$string['chatwidget_placeholder'] = 'Ask anything about this course...';
$string['chatwidget_send'] = 'Send';
$string['chatwidget_title'] = 'NexusAI Assistant';
$string['course_enabled'] = 'Use NexusAI in this course';
$string['course_enabled_help'] = 'When on, students of this course can use the NexusAI assistant, quizzes, flashcards and the other tools. When off, NexusAI disappears for every student of the course and no requests are made on its behalf. Nothing is deleted: chat history, questions and documents come back when you turn it on again.';
$string['course_enabled_saved_off'] = 'NexusAI is now off for this course.';
$string['course_enabled_saved_on'] = 'NexusAI is now on for this course.';
$string['course_settings_intro'] = 'Choose whether NexusAI is available in this course. It applies to all students of the course.';
$string['course_settings_title'] = 'NexusAI in this course';
$string['course_site_disabled'] = 'NexusAI is turned off for the whole site by the administrator, so it will not work in this course even if you turn it on here.';
$string['coursedisabled'] = 'NexusAI is turned off in this course.';
$string['default_course_enabled'] = 'On by default in courses';
$string['default_course_enabled_desc'] = 'Whether courses without their own setting use NexusAI. Off by default, so courses can be turned on one at a time (teachers from the course settings, or the CLI script cli/enable_course.php).';
$string['documents_page_noscript'] = 'This page requires JavaScript to manage materials indexed by the NexusAI assistant.';
$string['documents_page_title'] = 'NexusAI · Materials';
$string['erroraccessdenied'] = 'Access denied';
$string['errorbackend'] = 'NexusAI backend error: {$a}';
$string['errorbackendunreachable'] = 'Cannot reach NexusAI backend: {$a}. Check API endpoint, network, and that the backend container is running.';
$string['errorconfigmissing'] = 'NexusAI configuration is incomplete. Missing: {$a}. Set it in Site administration → Plugins → Local plugins → NexusAI.';
$string['errorcourseidrequired'] = 'Course ID required';
$string['errorcoursenotfound'] = 'Course not found.';
$string['errorfeednotfound'] = 'Feed not found. The subscription may have been revoked.';
$string['errorfilenotavailable'] = 'This document is not linked to an activity of the course. Delete it from NexusAI and upload it again from Materials.';
$string['errorinvalidfilename'] = 'Invalid filename';
$string['errorinvalidparams'] = 'Invalid parameters.';
$string['errormaterialhidden'] = 'This material is not available to you.';
$string['errorsessionnotfound'] = 'Conversation not found.';
$string['errorusernotenrolled'] = 'This feed\'s student is not enrolled in the course.';
$string['event_course_settings_updated'] = 'NexusAI course setting updated';
$string['forum_similar_close'] = 'Close notice';
$string['forum_similar_found'] = 'A similar discussion already exists ({$a}% similarity):';
$string['forum_similar_more'] = 'and {$a} more';
$string['forum_similar_view'] = 'View discussion';
$string['forum_suggest_button'] = 'Suggest reply';
$string['forum_suggest_close'] = 'Close suggestion';
$string['forum_suggest_empty'] = 'NexusAI: could not generate a suggestion.';
$string['forum_suggest_error'] = 'NexusAI: error generating the suggestion. Try again.';
$string['forum_suggest_material'] = 'With course material';
$string['forum_suggest_title'] = 'NexusAI suggests:';
$string['forum_suggest_use'] = 'Use this reply';
$string['forum_suggest_working'] = 'Generating…';
$string['forum_summary_button'] = 'Summarize thread';
$string['forum_summary_close'] = 'Close summary';
$string['forum_summary_error'] = 'NexusAI: could not summarize the thread. Try again.';
$string['forum_summary_keypoints'] = 'Key points';
$string['forum_summary_loading'] = 'Summarizing thread';
$string['forum_summary_resolved'] = 'Discussion resolved';
$string['forum_summary_title'] = 'NexusAI — Thread summary';
$string['forum_summary_truncated'] = 'The thread is long — the first {$a} posts were summarized.';
$string['forum_summary_unresolved'] = 'No definitive answer';
$string['forum_summary_working'] = 'Summarizing…';
$string['materialsectioninvalid'] = 'The unit you chose does not exist in this course.';
$string['materialtoolarge'] = 'The file is larger than the maximum upload size ({$a}).';
$string['messageprovider:cal_alert'] = 'NexusAI calendar alerts';
$string['messageprovider:newmaterial'] = 'New material uploaded to a course';
$string['newmaterial_body'] = 'A new file "{$a->filename}" was uploaded to {$a->course}. You can already ask the NexusAI assistant about it.';
$string['newmaterial_body_html'] = 'A new file <strong>{$a->filename}</strong> was uploaded to <strong>{$a->course}</strong>. You can already ask the NexusAI assistant about it.';
$string['newmaterial_small'] = 'New material: {$a}';
$string['newmaterial_subject'] = 'New material in {$a}';
$string['nexusai:manage'] = 'Manage course materials for NexusAI indexing';
$string['nexusai:use'] = 'Use the NexusAI assistant in a course';
$string['nexusai:viewanalytics'] = 'View NexusAI analytics dashboard';
$string['pluginname'] = 'NexusAI';
$string['privacy:metadata:local_nexusai_cal_alerts'] = 'Reminders the user asked for before calendar events.';
$string['privacy:metadata:local_nexusai_cal_alerts:courseid'] = 'The course of the event.';
$string['privacy:metadata:local_nexusai_cal_alerts:daysbefore'] = 'How many days before the event to remind.';
$string['privacy:metadata:local_nexusai_cal_alerts:eventname'] = 'The name of the event.';
$string['privacy:metadata:local_nexusai_cal_alerts:timecreated'] = 'When the reminder was set.';
$string['privacy:metadata:local_nexusai_cal_alerts:userid'] = 'The user who asked for the reminder.';
$string['privacy:metadata:local_nexusai_chat_sessions'] = 'Chat conversations with the NexusAI assistant.';
$string['privacy:metadata:local_nexusai_chat_sessions:courseid'] = 'The course where the conversation was opened.';
$string['privacy:metadata:local_nexusai_chat_sessions:courseids'] = 'The courses searched, when the conversation covered several courses.';
$string['privacy:metadata:local_nexusai_chat_sessions:timecreated'] = 'When the conversation started.';
$string['privacy:metadata:local_nexusai_chat_sessions:userid'] = 'The user who owns the conversation.';
$string['privacy:metadata:local_nexusai_course'] = 'Whether each course uses NexusAI, and who last changed it.';
$string['privacy:metadata:local_nexusai_course:timemodified'] = 'When the setting was last changed.';
$string['privacy:metadata:local_nexusai_course:usermodified'] = 'The user who last changed the setting.';
$string['privacy:metadata:local_nexusai_exams'] = 'Exams generated by teachers.';
$string['privacy:metadata:local_nexusai_exams:courseid'] = 'The course of the exam.';
$string['privacy:metadata:local_nexusai_exams:examdate'] = 'The date of the exam.';
$string['privacy:metadata:local_nexusai_exams:params'] = 'The documents, topics and settings chosen for the exam.';
$string['privacy:metadata:local_nexusai_exams:timecreated'] = 'When the exam was generated.';
$string['privacy:metadata:local_nexusai_exams:userid'] = 'The teacher who generated the exam.';
$string['privacy:metadata:local_nexusai_fc_reviews'] = 'Spaced repetition progress of each flashcard.';
$string['privacy:metadata:local_nexusai_fc_reviews:easefactor'] = 'How easy the flashcard is for the user.';
$string['privacy:metadata:local_nexusai_fc_reviews:timelastreviewed'] = 'When the flashcard was last reviewed.';
$string['privacy:metadata:local_nexusai_fc_reviews:timenextreview'] = 'When the flashcard is due again.';
$string['privacy:metadata:local_nexusai_fc_reviews:userid'] = 'The user who reviews the flashcard.';
$string['privacy:metadata:local_nexusai_gaps'] = 'Questions the course material could not answer, shown to teachers to improve the material.';
$string['privacy:metadata:local_nexusai_gaps:courseid'] = 'The course of the question.';
$string['privacy:metadata:local_nexusai_gaps:question'] = 'The text of the question.';
$string['privacy:metadata:local_nexusai_gaps:timecreated'] = 'When the question was asked.';
$string['privacy:metadata:local_nexusai_gaps:userid'] = 'The user who asked the question.';
$string['privacy:metadata:local_nexusai_interactions'] = 'Metrics of each question asked to the assistant, without its text. Kept without the user when their data is deleted.';
$string['privacy:metadata:local_nexusai_interactions:courseid'] = 'The course the question was asked in.';
$string['privacy:metadata:local_nexusai_interactions:latencyms'] = 'How long the answer took.';
$string['privacy:metadata:local_nexusai_interactions:questionchars'] = 'Length of the question.';
$string['privacy:metadata:local_nexusai_interactions:timecreated'] = 'When the question was asked.';
$string['privacy:metadata:local_nexusai_interactions:tokenscompletion'] = 'Tokens the AI provider wrote.';
$string['privacy:metadata:local_nexusai_interactions:tokensprompt'] = 'Tokens the AI provider read.';
$string['privacy:metadata:local_nexusai_interactions:userid'] = 'The user who asked.';
$string['privacy:metadata:local_nexusai_messages'] = 'Questions and answers of each conversation.';
$string['privacy:metadata:local_nexusai_messages:content'] = 'The text of the message.';
$string['privacy:metadata:local_nexusai_messages:role'] = 'Whether the message is a question from the user or an answer from the assistant.';
$string['privacy:metadata:local_nexusai_messages:timecreated'] = 'When the message was sent.';
$string['privacy:metadata:local_nexusai_messages:tokenscompletion'] = 'Tokens the AI provider wrote in the answer.';
$string['privacy:metadata:local_nexusai_messages:tokensprompt'] = 'Tokens the AI provider read to write the answer.';
$string['privacy:metadata:local_nexusai_msg_feedback'] = 'Votes on whether an answer of the assistant was helpful.';
$string['privacy:metadata:local_nexusai_msg_feedback:comment'] = 'An optional comment with the vote.';
$string['privacy:metadata:local_nexusai_msg_feedback:ishelpful'] = 'Whether the answer was helpful.';
$string['privacy:metadata:local_nexusai_msg_feedback:timecreated'] = 'When the vote was given.';
$string['privacy:metadata:local_nexusai_msg_feedback:userid'] = 'The user who voted.';
$string['privacy:metadata:local_nexusai_qbank_use'] = 'Which bank questions the user already got, so they are not repeated.';
$string['privacy:metadata:local_nexusai_qbank_use:purpose'] = 'Whether the question was used in a practice quiz or in an exam.';
$string['privacy:metadata:local_nexusai_qbank_use:timecreated'] = 'When the question was used.';
$string['privacy:metadata:local_nexusai_qbank_use:userid'] = 'The user who got the question.';
$string['privacy:metadata:local_nexusai_quiz_attempts'] = 'Practice quiz attempts.';
$string['privacy:metadata:local_nexusai_quiz_attempts:courseid'] = 'The course of the quiz.';
$string['privacy:metadata:local_nexusai_quiz_attempts:score'] = 'The score obtained.';
$string['privacy:metadata:local_nexusai_quiz_attempts:timecreated'] = 'When the quiz was taken.';
$string['privacy:metadata:local_nexusai_quiz_attempts:topic'] = 'The topic of the quiz.';
$string['privacy:metadata:local_nexusai_quiz_attempts:userid'] = 'The user who took the quiz.';
$string['privacy:metadata:local_nexusai_quiz_errors'] = 'Quiz questions the user answered wrong, kept for review.';
$string['privacy:metadata:local_nexusai_quiz_errors:aifeedback'] = 'The feedback the assistant gave on the answer.';
$string['privacy:metadata:local_nexusai_quiz_errors:courseid'] = 'The course of the quiz.';
$string['privacy:metadata:local_nexusai_quiz_errors:question'] = 'The question.';
$string['privacy:metadata:local_nexusai_quiz_errors:timecreated'] = 'When the question was answered.';
$string['privacy:metadata:local_nexusai_quiz_errors:useranswer'] = 'The answer the user gave.';
$string['privacy:metadata:local_nexusai_quiz_errors:userid'] = 'The user who answered.';
$string['privacy:metadata:local_nexusai_usage'] = 'Tokens and cost of each AI call made on behalf of the user. Kept without the user when their data is deleted.';
$string['privacy:metadata:local_nexusai_usage:completiontokens'] = 'Tokens the AI provider wrote.';
$string['privacy:metadata:local_nexusai_usage:costusd'] = 'Estimated cost of the call, in US dollars.';
$string['privacy:metadata:local_nexusai_usage:courseid'] = 'The course of the call.';
$string['privacy:metadata:local_nexusai_usage:feature'] = 'The NexusAI feature that made the call.';
$string['privacy:metadata:local_nexusai_usage:prompttokens'] = 'Tokens the AI provider read.';
$string['privacy:metadata:local_nexusai_usage:role'] = 'Whether the user acted as a student or a teacher.';
$string['privacy:metadata:local_nexusai_usage:timecreated'] = 'When the call was made.';
$string['privacy:metadata:local_nexusai_usage:userid'] = 'The user the call was made for.';
$string['privacy:metadata:nexusai_backend'] = 'To answer, NexusAI sends the question, the recent conversation and the course material the user can see to its backend service (outside Moodle). The backend does not keep the conversation; it records the tokens of each call for cost control.';
$string['privacy:metadata:nexusai_backend:content'] = 'The text sent: the question, the recent conversation and quiz answers to evaluate.';
$string['privacy:metadata:nexusai_backend:course_id'] = 'The ID of the course the data was generated in.';
$string['privacy:metadata:nexusai_backend:created_at'] = 'The date and time the data was generated.';
$string['privacy:metadata:nexusai_backend:user_id'] = 'The Moodle user ID, sent with each request for rate limiting and, until the administrator turns it off, the usage record.';
$string['privacy:metadata:preference:calfeedtoken'] = 'Secret token of the user\'s calendar feed.';
$string['privacy:metadata:preference:onboarding'] = 'Progress of the course setup guide shown to teachers.';
$string['privacy:metadata:preference:pending_uploads'] = 'Files the teacher added to the course that NexusAI still has to ask about indexing.';
$string['privacy:preference:secret'] = 'Set (the value is a secret and is not exported).';
$string['section_backend'] = 'Backend connection';
$string['section_backend_desc'] = 'Configure how the plugin authenticates against the NexusAI Python backend. See ADR-005 in the project repository.';
$string['section_courses'] = 'Courses';
$string['section_courses_desc'] = 'Where NexusAI is available.';
$string['section_general'] = 'General';
$string['section_limits'] = 'Token limits';
$string['section_limits_desc'] = 'How many tokens each user can spend with the assistant per hour and per day. Students see how much they have left.';
$string['section_notifications'] = 'Notifications';
$string['section_notifications_desc'] = 'Sender email for calendar alerts and plugin notifications.';
$string['settings'] = 'NexusAI settings';
$string['sharedsecret'] = 'Shared secret (HMAC)';
$string['sharedsecret_desc'] = 'Secret used to sign each request with HMAC-SHA256. Generate with: openssl rand -hex 32. Must match NEXUSAI_SHARED_SECRET on the backend.';
$string['show_outside_course'] = 'Show outside of a course';
$string['show_outside_course_desc'] = 'Show the NexusAI widget and navigation icon on pages that are not a course (dashboard, site home, course creation screen). Off by default.';
$string['token_limit_desc'] = 'Tokens. A user who reaches it waits until the window renews.';
$string['token_limit_student_daily'] = 'Student limit per day';
$string['token_limit_student_hourly'] = 'Student limit per hour';
$string['token_limit_teacher_daily'] = 'Teacher limit per day';
$string['token_limit_teacher_hourly'] = 'Teacher limit per hour';
$string['upload_prompt_body'] = 'Do you want to index <strong>{$a}</strong> into NexusAI so students can ask the assistant about it?';
$string['upload_prompt_error'] = 'Could not index the file in NexusAI. You can try again from the materials section.';
$string['upload_prompt_no'] = 'Not now';
$string['upload_prompt_success'] = '"{$a}" was successfully added to NexusAI.';
$string['upload_prompt_title'] = 'NexusAI — new material';
$string['upload_prompt_yes'] = 'Yes, add it';
