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
 * External function `local_nexusai_forum_weekly_digest`.
 *
 * Resumen semanal del foro para el docente (FOR-06, #367): junta todas las
 * discusiones con actividad nueva en los últimos N días de TODOS los foros
 * del curso y las manda al backend, que arma un único resumen sintetizado
 * y además marca por hilo si parece "urgente" (FOR-05, #366, heurística sin
 * LLM) — un solo endpoint combinado, ver docstring del router Python.
 *
 * El backend NexusAI no tiene copia de foros/discusiones/posts — solo
 * embeddings para duplicados. Moodle sí tiene los timestamps
 * (`timemodified`), así que "qué tuvo actividad esta semana" se resuelve
 * acá con SQL directo contra las tablas nativas, igual que
 * `forum_summarize_thread.php` ya hace para un único hilo.
 *
 * Solo docentes (`local/nexusai:manage`) — es un resumen para EL DOCENTE,
 * no una función de alumno.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Resumen semanal del foro para el docente (FOR-06, #367): junta todas las discusiones con actividad nueva en
 * los últimos N días de TODOS los foros del curso y las manda al backend, que arma un único resumen
 * sintetizado y además marca por hilo si parece "urgente" (FOR-05, #366, heurística sin LLM) — un solo
 * endpoint combinado, ver docstring del router Python.
 */
class forum_weekly_digest extends \external_api {
    /**
     * @var int Máximo de discusiones que se envían al backend en un solo digest — mismo tope
     *     que el backend declara (WeeklyDigestRequest.discussions).
     */
    const MAX_DISCUSSIONS = 15;

    /** @var int Máximo de posts por discusión (solo los de la ventana de días). */
    const MAX_POSTS_PER_DISCUSSION = 20;

    /** @var int Truncado por post para no inflar el contexto del LLM. */
    const MAX_CHARS_PER_POST = 1000;

    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso de Moodle', VALUE_REQUIRED),
            'days'     => new \external_value(PARAM_INT, 'Ventana de días hacia atrás (1..30)', VALUE_DEFAULT, 7),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'course_id'         => new \external_value(PARAM_INT, 'ID del curso'),
            'period_days'       => new \external_value(PARAM_INT, 'Ventana de días usada'),
            'discussion_count'  => new \external_value(PARAM_INT, 'Cantidad de discusiones con actividad'),
            'discussions'       => new \external_multiple_structure(
                new \external_single_structure([
                    'discussion_id'   => new \external_value(PARAM_INT, 'ID de la discusión'),
                    'discussion_name' => new \external_value(PARAM_RAW, 'Título de la discusión'),
                    'forum_name'      => new \external_value(PARAM_RAW, 'Nombre del foro'),
                    'post_count'      => new \external_value(PARAM_INT, 'Posts nuevos en la ventana'),
                    'urgent'          => new \external_value(PARAM_BOOL, 'Si algún post del hilo parece urgente/frustrado'),
                ])
            ),
            'summary'           => new \external_value(
                PARAM_RAW,
                'Resumen de la semana generado por el LLM',
                VALUE_OPTIONAL,
                null,
                NULL_ALLOWED
            ),
        ]);
    }

    /**
     * Resumen semanal del foro para el docente (FOR-06, #367): junta todas las discusiones con actividad
     * nueva en los últimos N días de TODOS los foros del curso y las manda al backend, que arma un único
     * resumen sintetizado y además marca por hilo si parece "urgente" (FOR-05, #366, heurística sin LLM) — un
     * solo endpoint combinado, ver docstring del router Python.
     *
     * @param int $courseid ID del curso de Moodle
     * @param int $days Ventana de días hacia atrás (1..30)
     * @return array
     */
    public static function execute(int $courseid, int $days = 7): array {
        global $DB;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'days'     => $days,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        $days = max(1, min(30, (int) $params['days']));
        $since = time() - ($days * DAYSECS);

        // Discusiones con actividad reciente en CUALQUIER foro del curso,
        // más recientes primero, tope defensivo antes de armar el payload.
        $discussionrows = $DB->get_records_sql(
            "SELECT fd.id AS discussionid, fd.name AS discussionname, f.name AS forumname
               FROM {forum_discussions} fd
               JOIN {forum} f ON f.id = fd.forum
              WHERE f.course = :courseid
                AND fd.timemodified >= :since
           ORDER BY fd.timemodified DESC",
            ['courseid' => (int) $params['courseid'], 'since' => $since],
            0,
            self::MAX_DISCUSSIONS
        );

        if (empty($discussionrows)) {
            return [
                'course_id'        => (int) $params['courseid'],
                'period_days'      => $days,
                'discussion_count' => 0,
                'discussions'      => [],
                'summary'          => null,
            ];
        }

        $discussions = [];
        foreach ($discussionrows as $drow) {
            $postrows = $DB->get_records_sql(
                "SELECT fp.id, fp.message,
                        " . $DB->sql_fullname('u.firstname', 'u.lastname') . " AS author
                   FROM {forum_posts} fp
                   JOIN {user} u ON u.id = fp.userid
                  WHERE fp.discussion = :discussionid
                    AND fp.created >= :since
               ORDER BY fp.created ASC",
                ['discussionid' => (int) $drow->discussionid, 'since' => $since],
                0,
                self::MAX_POSTS_PER_DISCUSSION
            );

            $posts = [];
            foreach ($postrows as $prow) {
                $content = strip_tags($prow->message);
                $content = html_entity_decode($content, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $content = trim($content);
                if ($content === '') {
                    continue;
                }
                if (mb_strlen($content) > self::MAX_CHARS_PER_POST) {
                    $content = mb_substr($content, 0, self::MAX_CHARS_PER_POST) . '…';
                }
                $posts[] = [
                    'post_id' => (int) $prow->id,
                    'author'  => (string) $prow->author,
                    'content' => $content,
                ];
            }

            // Discusión con actividad "nueva" en Moodle (timemodified) pero
            // cuyos posts individuales quedaron vacíos tras limpiar HTML —
            // no tiene sentido mandarla al backend (min_length=1 en el schema).
            if (empty($posts)) {
                continue;
            }

            $discussions[] = [
                'discussion_id'   => (int) $drow->discussionid,
                'discussion_name' => (string) $drow->discussionname,
                'forum_name'      => (string) $drow->forumname,
                'posts'           => $posts,
            ];
        }

        if (empty($discussions)) {
            return [
                'course_id'        => (int) $params['courseid'],
                'period_days'      => $days,
                'discussion_count' => 0,
                'discussions'      => [],
                'summary'          => null,
            ];
        }

        $client   = new backend_client();
        $response = $client->weekly_digest((int) $params['courseid'], $days, $discussions);

        $resultdiscussions = is_array($response['discussions'] ?? null) ? $response['discussions'] : [];

        return [
            'course_id'        => (int) ($response['course_id'] ?? $params['courseid']),
            'period_days'      => (int) ($response['period_days'] ?? $days),
            'discussion_count' => (int) ($response['discussion_count'] ?? count($discussions)),
            'discussions'      => array_map(
                static fn(array $d): array => [
                    'discussion_id'   => (int) ($d['discussion_id'] ?? 0),
                    'discussion_name' => (string) ($d['discussion_name'] ?? ''),
                    'forum_name'      => (string) ($d['forum_name'] ?? ''),
                    'post_count'      => (int) ($d['post_count'] ?? 0),
                    'urgent'          => (bool) ($d['urgent'] ?? false),
                ],
                $resultdiscussions
            ),
            'summary'          => isset($response['summary']) ? (string) $response['summary'] : null,
        ];
    }
}
