<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * English language strings for local_nexusai.
 *
 * Moodle requiere que CADA capability y CADA setting tenga su string acá. Si falta,
 * Moodle muestra "[[clave]]" en la UI, lo cual queda feísimo. Mantener sincronizado
 * con lang/es/local_nexusai.php.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'NexusAI';

// Capabilities. Patrón: nexusai:<accion>  →  $string['nexusai:<accion>']
$string['nexusai:use']           = 'Use the NexusAI assistant in a course';
$string['nexusai:manage']        = 'Manage course materials for NexusAI indexing';
$string['nexusai:viewanalytics'] = 'View NexusAI analytics dashboard';

// Settings page (admin).
$string['settings']                = 'NexusAI settings';
$string['section_general']         = 'General';
$string['section_backend']         = 'Backend connection';
$string['section_backend_desc']    = 'Configure how the plugin authenticates against the NexusAI Python backend. See ADR-005 in the project repository.';
$string['apiendpoint']             = 'Backend API URL';
$string['apiendpoint_desc']        = 'Base URL of the NexusAI Python backend (e.g. http://localhost:8001).';
$string['apienabled']              = 'Enable NexusAI';
$string['apienabled_desc']         = 'Master switch. Disable to hide the chat widget across the site.';
$string['apikey']                  = 'API key';
$string['apikey_desc']             = 'Bearer API key sent in the Authorization header. Generate with: openssl rand -hex 32. Must match NEXUSAI_API_KEY on the backend.';
$string['sharedsecret']            = 'Shared secret (HMAC)';
$string['sharedsecret_desc']       = 'Secret used to sign each request with HMAC-SHA256. Generate with: openssl rand -hex 32. Must match NEXUSAI_SHARED_SECRET on the backend.';

// External function errors (used by backend_client + chat_send).
$string['errorconfigmissing']      = 'NexusAI configuration is incomplete. Missing: {$a}. Set it in Site administration → Plugins → Local plugins → NexusAI.';
$string['errorbackend']            = 'NexusAI backend error: {$a}';
$string['errorbackendunreachable'] = 'Cannot reach NexusAI backend: {$a}. Check API endpoint, network, and that the backend container is running.';

// UI strings (visibles al usuario).
$string['chatwidget_title']        = 'NexusAI Assistant';
$string['chatwidget_placeholder']  = 'Ask anything about this course...';
$string['chatwidget_send']         = 'Send';
$string['chatwidget_loading']      = 'Loading...';
$string['chatwidget_error']        = 'Something went wrong. Try again in a moment.';

// Teacher view — document management.
$string['documents_page_title']    = 'NexusAI · Materials';
$string['documents_page_noscript'] = 'This page requires JavaScript to manage materials indexed by the NexusAI assistant.';

// Privacy API.
$string['privacy:metadata'] = 'The NexusAI plugin does not store personal data in Moodle. All chat history lives in the external NexusAI backend service.';
