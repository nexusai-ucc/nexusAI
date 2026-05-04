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
$string['apiendpoint']             = 'Backend API URL';
$string['apiendpoint_desc']        = 'Base URL of the NexusAI Python backend (e.g. http://localhost:8001).';
$string['apienabled']              = 'Enable NexusAI';
$string['apienabled_desc']         = 'Master switch. Disable to hide the chat widget across the site.';

// UI strings (visibles al usuario).
$string['chatwidget_title']        = 'NexusAI Assistant';
$string['chatwidget_placeholder']  = 'Ask anything about this course...';
$string['chatwidget_send']         = 'Send';
$string['chatwidget_loading']      = 'Loading...';
$string['chatwidget_error']        = 'Something went wrong. Try again in a moment.';

// Privacy API.
$string['privacy:metadata'] = 'The NexusAI plugin does not store personal data in Moodle. All chat history lives in the external NexusAI backend service.';
