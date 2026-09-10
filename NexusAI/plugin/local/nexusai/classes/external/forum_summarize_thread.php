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
 * External function `local_nexusai_forum_summarize_thread`.
 *
 * Lee los posts de una discusión desde Moodle DB y los manda al backend
 * para que el LLM genere un resumen estructurado (summary + key_points + resolved).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Lee los posts de una discusión desde Moodle DB y los manda al backend para que el LLM genere un resumen
 * estructurado (summary + key_points + resolved).
 */
class forum_summarize_thread extends \external_api {
    /**
     * @var int Máximo de posts que se envían al backend (el backend trunca igual, pero limitamos
     *     en PHP para no construir payloads enormes).
     */
    const MAX_POSTS = 30;

    /** @var int Máximo de chars por post antes de truncar. */
    const MAX_CHARS_PER_POST = 1000;

    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'discussionid' => new \external_value(PARAM_INT, 'ID de la discusión de foro', VALUE_REQUIRED),
            'courseid'     => new \external_value(PARAM_INT, 'ID del curso de Moodle', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'summary'         => new \external_value(PARAM_RAW, 'Resumen del hilo generado por el LLM'),
            'key_points'      => new \external_multiple_structure(
                new \external_value(PARAM_RAW, 'Punto clave')
            ),
            'resolved'        => new \external_value(PARAM_BOOL, 'Si la pregunta principal quedó respondida'),
            'posts_used'      => new \external_value(PARAM_INT, 'Cantidad de posts procesados'),
            'posts_truncated' => new \external_value(PARAM_BOOL, 'Si se truncaron posts por longitud'),
        ]);
    }

    /**
     * Lee los posts de una discusión desde Moodle DB y los manda al backend para que el LLM genere un resumen
     * estructurado (summary + key_points + resolved).
     *
     * @param int $discussionid ID de la discusión de foro
     * @param int $courseid ID del curso de Moodle
     * @return array
     */
    public static function execute(int $discussionid, int $courseid): array {
        global $DB;

        $params = self::validate_parameters(self::execute_parameters(), [
            'discussionid' => $discussionid,
            'courseid'     => $courseid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        // Verificar que la discusión pertenece al curso.
        $discussion = $DB->get_record('forum_discussions', [
            'id'     => (int) $params['discussionid'],
            'course' => (int) $params['courseid'],
        ], 'id', MUST_EXIST);

        // Leer posts de la discusión con el nombre del autor.
        // Ordenamos por created ASC para que el LLM los lea en orden cronológico.
        $sql = "SELECT fp.id, fp.message, fp.created,
                       " . $DB->sql_fullname('u.firstname', 'u.lastname') . " AS author
                  FROM {forum_posts} fp
                  JOIN {user} u ON u.id = fp.userid
                 WHERE fp.discussion = :discussionid
              ORDER BY fp.created ASC";

        $rows = $DB->get_records_sql($sql, ['discussionid' => (int) $params['discussionid']]);

        if (empty($rows)) {
            return [
                'summary'         => '',
                'key_points'      => [],
                'resolved'        => false,
                'posts_used'      => 0,
                'posts_truncated' => false,
            ];
        }

        // Construir el array de posts para el backend, truncando si es necesario.
        $posts         = [];
        $poststruncated = false;
        $count         = 0;

        foreach ($rows as $row) {
            if ($count >= self::MAX_POSTS) {
                $poststruncated = true;
                break;
            }
            // Limpiar HTML de Moodle (los posts pueden tener formato HTML).
            $content = strip_tags($row->message);
            $content = html_entity_decode($content, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $content = trim($content);

            if (mb_strlen($content) > self::MAX_CHARS_PER_POST) {
                $content        = mb_substr($content, 0, self::MAX_CHARS_PER_POST) . '…';
                $poststruncated = true;
            }

            if (empty($content)) {
                continue;
            }

            $posts[] = [
                'post_id' => (int) $row->id,
                'author'  => (string) $row->author,
                'content' => $content,
            ];
            $count++;
        }

        if (empty($posts)) {
            return [
                'summary'         => '',
                'key_points'      => [],
                'resolved'        => false,
                'posts_used'      => 0,
                'posts_truncated' => false,
            ];
        }

        $client   = new backend_client();
        $response = $client->summarize_thread(
            (int) $params['discussionid'],
            (int) $params['courseid'],
            $posts
        );

        return [
            'summary'         => (string)  ($response['summary'] ?? ''),
            'key_points'      => (array)   ($response['key_points'] ?? []),
            'resolved'        => (bool)    ($response['resolved'] ?? false),
            'posts_used'      => (int)     ($response['posts_used'] ?? count($posts)),
            'posts_truncated' => (bool)    ($response['posts_truncated'] ?? $poststruncated),
        ];
    }
}
