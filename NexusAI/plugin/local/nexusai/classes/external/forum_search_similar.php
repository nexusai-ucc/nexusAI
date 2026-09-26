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
 * External function `local_nexusai_forum_search_similar`.
 *
 * Receives the text the student is writing in the forum editor and returns
 * existing posts in the same course that are semantically similar.
 * The frontend uses it to warn the student before posting if a similar
 * discussion already exists.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Receives the text the student is writing in the forum editor and returns existing posts in the
 * same course that are semantically similar.
 */
class forum_search_similar extends \external_api {
    /**
     * @var float Similarity threshold hardcoded in PHP to avoid float conversion issues
     *     in Moodle 5.x (PARAM_FLOAT converts 0.75 to 1 via clean_param).
     */
    const SIMILARITY_THRESHOLD = 0.65;

    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'text'          => new \external_value(PARAM_RAW, 'Text of the post being drafted (min 10 chars)', VALUE_REQUIRED),
            'courseid'      => new \external_value(PARAM_INT, 'Moodle course ID', VALUE_REQUIRED),
            'excludepostid' => new \external_value(PARAM_INT, 'Post to exclude (when editing)', VALUE_DEFAULT, 0),
            'topk'          => new \external_value(PARAM_INT, 'Max results (1-10)', VALUE_DEFAULT, 3),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'similar_posts' => new \external_multiple_structure(
                new \external_single_structure([
                    'forum_post_id' => new \external_value(PARAM_INT, 'mdl_forum_posts ID'),
                    'discussion_id' => new \external_value(PARAM_INT, 'mdl_forum_discussions ID'),
                    'similarity'    => new \external_value(PARAM_FLOAT, 'Similarity score 0.0-1.0'),
                    'preview'       => new \external_value(PARAM_RAW, 'First 200 chars of the post'),
                ])
            ),
            'threshold_used' => new \external_value(PARAM_FLOAT, 'Threshold used in the search'),
        ]);
    }

    /**
     * Receives the text the student is writing in the forum editor and returns existing posts in
     * the same course that are semantically similar.
     *
     * @param string $text Text of the post being drafted (min 10 chars)
     * @param int $courseid Moodle course ID
     * @param int $excludepostid Post to exclude (when editing)
     * @param int $topk Max results (1-10)
     * @return array
     */
    public static function execute(string $text, int $courseid, int $excludepostid = 0, int $topk = 3): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'text'          => $text,
            'courseid'      => $courseid,
            'excludepostid' => $excludepostid,
            'topk'          => $topk,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        $cleantext = trim($params['text']);
        if (mb_strlen($cleantext) < 10) {
            return ['similar_posts' => [], 'threshold_used' => self::SIMILARITY_THRESHOLD];
        }
        if (mb_strlen($cleantext) > 5000) {
            $cleantext = mb_substr($cleantext, 0, 5000);
        }

        $excludeid = ($params['excludepostid'] > 0) ? (int) $params['excludepostid'] : null;
        $topk      = max(1, min(10, (int) $params['topk']));

        $client   = new backend_client();
        $response = $client->search_similar_posts(
            (int) $params['courseid'],
            $cleantext,
            $excludeid,
            self::SIMILARITY_THRESHOLD,
            $topk
        );

        $posts = [];
        foreach (($response['similar_posts'] ?? []) as $p) {
            $posts[] = [
                'forum_post_id' => (int)   ($p['forum_post_id'] ?? 0),
                'discussion_id' => (int)   ($p['discussion_id'] ?? 0),
                'similarity'    => (float) ($p['similarity'] ?? 0.0),
                'preview'       => (string)($p['preview'] ?? ''),
            ];
        }

        return [
            'similar_posts'  => $posts,
            'threshold_used' => (float) ($response['threshold_used'] ?? self::SIMILARITY_THRESHOLD),
        ];
    }
}
