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
 * External function `local_nexusai_forum_suggest_reply`.
 *
 * Reads the forum thread from the Moodle DB and asks the backend to generate
 * a reply suggestion using RAG + LLM (F-05 / F-11).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Reads the forum thread from the Moodle DB and asks the backend to generate a reply
 * suggestion using RAG + LLM (F-05 / F-11).
 */
class forum_suggest_reply extends \external_api {
    /** @var int Max thread posts sent to the backend as context. */
    const MAX_POSTS = 30;

    /** @var int Per-post truncation so as not to inflate the LLM's context. */
    const MAX_CHARS_PER_POST = 1000;

    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'discussionid'  => new \external_value(PARAM_INT, 'Forum discussion ID', VALUE_REQUIRED),
            'courseid'      => new \external_value(PARAM_INT, 'Moodle course ID', VALUE_REQUIRED),
            'replytopostid' => new \external_value(PARAM_INT, 'ID of the post being replied to', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'suggested_reply'     => new \external_value(PARAM_RAW, 'Text suggested by the LLM'),
            'has_course_material' => new \external_value(PARAM_BOOL, 'Whether RAG found relevant course material'),
            'sources_used'        => new \external_value(PARAM_INT, 'Number of course chunks used'),
        ]);
    }

    /**
     * Reads the forum thread from the Moodle DB and asks the backend to generate a reply
     * suggestion using RAG + LLM (F-05 / F-11).
     *
     * @param int $discussionid Forum discussion ID
     * @param int $courseid Moodle course ID
     * @param int $replytopostid ID of the post being replied to
     * @return array
     */
    public static function execute(int $discussionid, int $courseid, int $replytopostid): array {
        global $DB;

        $params = self::validate_parameters(self::execute_parameters(), [
            'discussionid'  => $discussionid,
            'courseid'      => $courseid,
            'replytopostid' => $replytopostid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        // Verify the discussion belongs to the course.
        $DB->get_record('forum_discussions', [
            'id'     => (int) $params['discussionid'],
            'course' => (int) $params['courseid'],
        ], 'id', MUST_EXIST);

        // Read all the thread's posts in chronological order.
        $sql = "SELECT fp.id, fp.message, fp.created,
                       " . $DB->sql_fullname('u.firstname', 'u.lastname') . " AS author
                  FROM {forum_posts} fp
                  JOIN {user} u ON u.id = fp.userid
                 WHERE fp.discussion = :discussionid
              ORDER BY fp.created ASC";

        $rows = $DB->get_records_sql($sql, ['discussionid' => (int) $params['discussionid']]);

        if (empty($rows)) {
            return [
                'suggested_reply'     => '',
                'has_course_material' => false,
                'sources_used'        => 0,
            ];
        }

        $posts    = [];
        $question = '';
        $count    = 0;

        foreach ($rows as $row) {
            if ($count >= self::MAX_POSTS) {
                break;
            }

            $content = strip_tags($row->message);
            $content = html_entity_decode($content, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $content = trim($content);

            if (empty($content)) {
                continue;
            }

            // Identify the post being replied to, to use it as the "question" in the RAG.
            if ((int)$row->id === (int)$params['replytopostid']) {
                $question = mb_substr($content, 0, 2000);
            }

            if (mb_strlen($content) > self::MAX_CHARS_PER_POST) {
                $content = mb_substr($content, 0, self::MAX_CHARS_PER_POST) . '…';
            }

            $posts[] = [
                'post_id' => (int) $row->id,
                'author'  => (string) $row->author,
                'content' => $content,
            ];
            $count++;
        }

        // If we didn't find the target post, use the first one in the thread.
        if (empty($question) && !empty($posts)) {
            $question = $posts[0]['content'];
        }

        if (empty($posts) || empty($question)) {
            return [
                'suggested_reply'     => '',
                'has_course_material' => false,
                'sources_used'        => 0,
            ];
        }

        $client   = new backend_client();
        $response = $client->suggest_reply(
            (int) $params['discussionid'],
            (int) $params['courseid'],
            $posts,
            $question
        );

        return [
            'suggested_reply'     => (string) ($response['suggested_reply'] ?? ''),
            'has_course_material' => (bool)   ($response['has_course_material'] ?? false),
            'sources_used'        => (int)    ($response['sources_used'] ?? 0),
        ];
    }
}
