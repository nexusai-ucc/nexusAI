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
 * Recibe el texto que el alumno está escribiendo en el editor de foro y devuelve
 * los posts existentes en el mismo curso que sean semánticamente similares.
 * El frontend lo usa para avisar al alumno antes de publicar si ya existe una
 * discusión similar.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Recibe el texto que el alumno está escribiendo en el editor de foro y devuelve los posts existentes en el
 * mismo curso que sean semánticamente similares.
 */
class forum_search_similar extends \external_api {
    // Umbral de similitud hardcodeado en PHP para evitar problemas de conversión
    // de float en Moodle 5.x (PARAM_FLOAT convierte 0.75 a 1 via clean_param).
    const SIMILARITY_THRESHOLD = 0.65;

    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'text'          => new \external_value(PARAM_RAW, 'Texto del post en redacción (mín 10 chars)', VALUE_REQUIRED),
            'courseid'      => new \external_value(PARAM_INT, 'ID del curso de Moodle', VALUE_REQUIRED),
            'excludepostid' => new \external_value(PARAM_INT, 'Post a excluir (al editar)', VALUE_OPTIONAL, 0),
            'topk'          => new \external_value(PARAM_INT, 'Resultados máximos (1–10)', VALUE_OPTIONAL, 3),
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
                    'forum_post_id' => new \external_value(PARAM_INT, 'ID de mdl_forum_posts'),
                    'discussion_id' => new \external_value(PARAM_INT, 'ID de mdl_forum_discussions'),
                    'similarity'    => new \external_value(PARAM_FLOAT, 'Score de similitud 0.0–1.0'),
                    'preview'       => new \external_value(PARAM_RAW, 'Primeros 200 chars del post'),
                ])
            ),
            'threshold_used' => new \external_value(PARAM_FLOAT, 'Umbral usado en la búsqueda'),
        ]);
    }

    /**
     * Recibe el texto que el alumno está escribiendo en el editor de foro y devuelve los posts existentes en
     * el mismo curso que sean semánticamente similares.
     *
     * @param string $text Texto del post en redacción (mín 10 chars)
     * @param int $courseid ID del curso de Moodle
     * @param int $excludepostid Post a excluir (al editar)
     * @param int $topk Resultados máximos (1–10)
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
