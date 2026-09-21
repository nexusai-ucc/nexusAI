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
$string['cal_alert_body'] = 'Your event "{$a}" is coming up soon. Check the course calendar in NexusAI.';
$string['cal_alert_subject'] = 'Reminder: {$a}';
$string['chatwidget_error'] = 'Something went wrong. Try again in a moment.';
$string['chatwidget_loading'] = 'Loading...';
$string['chatwidget_navtrigger'] = 'NexusAI Assistant';
$string['chatwidget_placeholder'] = 'Ask anything about this course...';
$string['chatwidget_send'] = 'Send';
$string['chatwidget_title'] = 'NexusAI Assistant';
$string['documents_page_noscript'] = 'This page requires JavaScript to manage materials indexed by the NexusAI assistant.';
$string['documents_page_title'] = 'NexusAI · Materials';
$string['erroraccessdenied'] = 'Access denied';
$string['errorbackend'] = 'NexusAI backend error: {$a}';
$string['errorbackendunreachable'] = 'Cannot reach NexusAI backend: {$a}. Check API endpoint, network, and that the backend container is running.';
$string['errorconfigmissing'] = 'NexusAI configuration is incomplete. Missing: {$a}. Set it in Site administration → Plugins → Local plugins → NexusAI.';
$string['errorcourseidrequired'] = 'Course ID required';
$string['errorcoursenotfound'] = 'Course not found.';
$string['errorfeednotfound'] = 'Feed not found. The subscription may have been revoked.';
$string['errorfilenotavailable'] = 'The file is not available. To restore it, delete and re-upload the document from the plugin\'s Documents section.';
$string['errorinvalidfilename'] = 'Invalid filename';
$string['errorinvalidparams'] = 'Invalid parameters.';
$string['errorusernotenrolled'] = 'This feed\'s student is not enrolled in the course.';
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
$string['privacy:metadata:nexusai_backend'] = 'To provide the academic assistant, NexusAI sends and stores personal data in its external backend service (outside Moodle).';
$string['privacy:metadata:nexusai_backend:content'] = 'The content sent: chat message text, quiz answers.';
$string['privacy:metadata:nexusai_backend:course_id'] = 'The ID of the course the data was generated in.';
$string['privacy:metadata:nexusai_backend:created_at'] = 'The date and time the data was generated.';
$string['privacy:metadata:nexusai_backend:user_id'] = 'The Moodle user ID, to identify who each message/attempt belongs to.';
$string['section_backend'] = 'Backend connection';
$string['section_backend_desc'] = 'Configure how the plugin authenticates against the NexusAI Python backend. See ADR-005 in the project repository.';
$string['section_general'] = 'General';
$string['section_notifications'] = 'Notifications';
$string['section_notifications_desc'] = 'Sender email for calendar alerts and plugin notifications.';
$string['settings'] = 'NexusAI settings';
$string['sharedsecret'] = 'Shared secret (HMAC)';
$string['sharedsecret_desc'] = 'Secret used to sign each request with HMAC-SHA256. Generate with: openssl rand -hex 32. Must match NEXUSAI_SHARED_SECRET on the backend.';
$string['upload_prompt_body'] = 'Do you want to index <strong>{$a}</strong> into NexusAI so students can ask the assistant about it?';
$string['upload_prompt_error'] = 'Could not index the file in NexusAI. You can try again from the materials section.';
$string['upload_prompt_no'] = 'Not now';
$string['upload_prompt_success'] = '"{$a}" was successfully added to NexusAI.';
$string['upload_prompt_title'] = 'NexusAI — new material';
$string['upload_prompt_yes'] = 'Yes, add it';
