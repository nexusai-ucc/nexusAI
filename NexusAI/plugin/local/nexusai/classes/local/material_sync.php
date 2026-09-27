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
 * Keeps the NexusAI index in step with the activity a document comes from (VIS-04).
 *
 * When the teacher deletes the "File" activity in Moodle, the document stops
 * being used; when they replace its file, the document is indexed again. A
 * change that does not touch the file (a new name, the eye icon, a restriction)
 * costs nothing: visibility is asked to Moodle on every request (visible_material).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

use local_nexusai\external\backend_client;

/**
 * Deletes or reindexes the documents of an activity.
 */
class material_sync {
    /** @var string Outcome: the activity has no document in NexusAI. */
    const NONE = 'none';

    /** @var string Outcome: the file did not change. */
    const UNCHANGED = 'unchanged';

    /** @var string Outcome: the file changed and was indexed again. */
    const REINDEXED = 'reindexed';

    /** @var string Outcome: the document was taken out of the index. */
    const REMOVED = 'removed';

    /** @var int Largest file the backend accepts, in bytes. */
    const MAX_BYTES = 20 * 1024 * 1024;

    /** @var backend_client */
    private backend_client $client;

    /**
     * Constructor.
     *
     * @param backend_client $client Backend client, already set to the 'system' role.
     */
    public function __construct(backend_client $client) {
        $this->client = $client;
    }

    /**
     * Takes every document of a deleted activity out of the index.
     *
     * The backend also deletes its chunks and stored summaries.
     *
     * @param int $courseid Course id.
     * @param int $cmid Course module id.
     * @return int Number of documents removed.
     */
    public function remove_activity(int $courseid, int $cmid): int {
        $removed = 0;
        foreach ($this->documents($courseid, $cmid) as $doc) {
            $this->client->delete_document((string) $doc['id']);
            $removed++;
        }
        return $removed;
    }

    /**
     * Brings the index up to date with the file of an updated activity.
     *
     * @param int $courseid Course id.
     * @param int $cmid Course module id.
     * @return string One of the outcome constants.
     */
    public function sync_activity(int $courseid, int $cmid): string {
        $docs = $this->documents($courseid, $cmid);
        if (empty($docs)) {
            return self::NONE;
        }

        $file = $this->current_file($cmid);
        $unsupported = $file === null
            || !in_array($file->get_mimetype(), \local_nexusai\observer::SUPPORTED_MIME_TYPES, true)
            || $file->get_filesize() > self::MAX_BYTES
            || $file->get_filesize() === 0;
        if ($unsupported) {
            // The activity no longer holds a file NexusAI can read: stop answering from the old one.
            foreach ($docs as $doc) {
                $this->client->delete_document((string) $doc['id']);
            }
            return self::REMOVED;
        }

        $bytes = $file->get_content();
        $hash = hash('sha256', base64_encode($bytes));
        $outcome = self::UNCHANGED;
        foreach ($docs as $doc) {
            if (($doc['file_hash'] ?? '') === $hash) {
                continue;
            }
            $this->client->replace_document(
                (string) $doc['id'],
                $file->get_filename(),
                $file->get_mimetype(),
                $bytes
            );
            $outcome = self::REINDEXED;
        }
        return $outcome;
    }

    /**
     * Documents NexusAI holds for an activity.
     *
     * @param int $courseid Course id.
     * @param int $cmid Course module id.
     * @return array[] Documents as the backend returns them.
     */
    private function documents(int $courseid, int $cmid): array {
        $response = $this->client->list_documents($courseid, null, 0, $cmid);
        return $response['items'] ?? [];
    }

    /**
     * The file the "File" activity holds right now.
     *
     * @param int $cmid Course module id.
     * @return \stored_file|null Null when the activity has no file.
     */
    private function current_file(int $cmid): ?\stored_file {
        $context = \context_module::instance($cmid, IGNORE_MISSING);
        if (!$context) {
            return null;
        }
        $files = get_file_storage()->get_area_files(
            $context->id,
            'mod_resource',
            'content',
            false,
            'itemid, filepath, filename',
            false
        );
        return empty($files) ? null : reset($files);
    }
}
