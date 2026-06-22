<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_confirm_pending_upload`.
 *
 * El docente confirmó que quiere indexar un archivo en NexusAI.
 * Lee el archivo del filestore de Moodle y lo envía al backend para indexación RAG.
 * Elimina la entrada de la user preference al finalizar (éxito o error).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class confirm_pending_upload extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'cmid'     => new \external_value(PARAM_INT, 'Course module ID del recurso a indexar', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'success' => new \external_value(PARAM_BOOL, 'true si se indexó correctamente'),
        ]);
    }

    public static function execute(int $courseid, int $cmid): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'cmid'     => $cmid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        // Leer y validar la preference del usuario actual.
        $raw     = get_user_preferences(\local_nexusai\observer::PENDING_PREF, '{}');
        $pending = json_decode($raw, true);
        if (!is_array($pending)) {
            $pending = [];
        }

        $key   = (string) $params['cmid'];
        $entry = $pending[$key] ?? null;

        if (!$entry || ((int) ($entry['courseid'] ?? 0)) !== (int) $params['courseid']) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'Pending upload not found for this course/cmid');
        }

        // Siempre limpiar la preference antes de cualquier operación que pueda fallar,
        // para no dejar entradas "zombie" si el archivo ya no existe.
        unset($pending[$key]);
        set_user_preference(\local_nexusai\observer::PENDING_PREF, json_encode($pending));

        $context_id = (int) $entry['context_id'];
        $mimetype   = (string) $entry['mimetype'];
        $filename   = (string) $entry['filename'];

        // Leer el archivo del filestore de Moodle.
        $fs    = get_file_storage();
        $files = $fs->get_area_files($context_id, 'mod_resource', 'content', false, 'itemid, filepath, filename', false);

        if (empty($files)) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'File no longer exists in Moodle filestore');
        }

        $file      = reset($files);
        $filebytes = $file->get_content();

        if (empty($filebytes)) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'File content is empty');
        }

        $client = new backend_client();
        $client->upload_document($params['courseid'], (int) $USER->id, $filename, $mimetype, $filebytes);

        return ['success' => true];
    }
}
