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
 * External function `local_nexusai_document_preview`.
 *
 * Returns the first characters of an indexed document's extracted text
 * (CONT-08 / #357). The teacher view shows it on demand so the teacher can
 * confirm the extraction captured real content.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Returns the first characters of an indexed document's extracted text (CONT-08 / #357).
 */
class document_preview extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'   => new \external_value(PARAM_INT, 'Course ID (to validate the capability)', VALUE_REQUIRED),
            'documentid' => new \external_value(PARAM_ALPHANUMEXT, 'Document UUID', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'document_id' => new \external_value(PARAM_ALPHANUMEXT, 'Document UUID'),
            'filename'    => new \external_value(PARAM_RAW, 'File name'),
            'status'      => new \external_value(PARAM_ALPHA, 'pending | indexing | indexed | error'),
            'preview'     => new \external_value(PARAM_RAW, 'Trimmed extracted text, or null if not available yet', VALUE_OPTIONAL),
            'char_count'  => new \external_value(PARAM_INT, 'Number of characters in the preview'),
            'truncated'   => new \external_value(PARAM_BOOL, 'True if the extracted text is longer than the preview'),
        ]);
    }

    /**
     * Returns the first characters of an indexed document's extracted text (CONT-08 / #357).
     *
     * @param int $courseid Course ID (to validate the capability)
     * @param string $documentid Document UUID
     * @return array
     */
    public static function execute(int $courseid, string $documentid): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'   => $courseid,
            'documentid' => $documentid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        $client   = new backend_client();
        $response = $client->get_document_preview($params['documentid']);

        // Defense: the document has to belong to the requested course, so a
        // teacher can't read material from another course by passing a
        // different courseid alongside the UUID.
        if (((int) ($response['course_id'] ?? 0)) !== (int) $params['courseid']) {
            throw new \moodle_exception(
                'errorbackend',
                'local_nexusai',
                '',
                'Document does not belong to the requested course'
            );
        }

        return [
            'document_id' => (string) ($response['document_id'] ?? ''),
            'filename'    => (string) ($response['filename'] ?? ''),
            'status'      => (string) ($response['status'] ?? ''),
            'preview'     => $response['preview'] ?? null,
            'char_count'  => (int) ($response['char_count'] ?? 0),
            'truncated'   => (bool) ($response['truncated'] ?? false),
        ];
    }
}
