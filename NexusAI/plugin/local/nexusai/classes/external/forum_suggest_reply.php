<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_forum_suggest_reply`.
 *
 * Lee el hilo de foro desde Moodle DB y le pide al backend que genere
 * una sugerencia de respuesta usando RAG + LLM (F-05 / F-11).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class forum_suggest_reply extends \external_api {

    const MAX_POSTS         = 30;
    const MAX_CHARS_PER_POST = 1000;

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'discussionid'  => new \external_value(PARAM_INT, 'ID de la discusión de foro', VALUE_REQUIRED),
            'courseid'      => new \external_value(PARAM_INT, 'ID del curso de Moodle',      VALUE_REQUIRED),
            'replytopostid' => new \external_value(PARAM_INT, 'ID del post al que se responde', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'suggested_reply'     => new \external_value(PARAM_RAW,  'Texto sugerido por el LLM'),
            'has_course_material' => new \external_value(PARAM_BOOL, 'Si el RAG encontró material relevante del curso'),
            'sources_used'        => new \external_value(PARAM_INT,  'Cantidad de chunks del curso usados'),
        ]);
    }

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

        // Verificar que la discusión pertenece al curso.
        $DB->get_record('forum_discussions', [
            'id'     => (int) $params['discussionid'],
            'course' => (int) $params['courseid'],
        ], 'id', MUST_EXIST);

        // Leer todos los posts del hilo en orden cronológico.
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

            // Identificar el post al que se responde para usarlo como "pregunta" en el RAG.
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

        // Si no encontramos el post de destino, usamos el primero del hilo.
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
            'suggested_reply'     => (string) ($response['suggested_reply']     ?? ''),
            'has_course_material' => (bool)   ($response['has_course_material'] ?? false),
            'sources_used'        => (int)    ($response['sources_used']        ?? 0),
        ];
    }
}
