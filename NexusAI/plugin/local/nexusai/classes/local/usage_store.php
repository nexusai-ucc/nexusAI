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
 * Tokens each user spends, and how much of their limit is left (DATA-05).
 *
 * The backend reports every call to an AI provider it makes for a request: in
 * the `X-NexusAI-Usage` header of JSON responses and in the `done` event of
 * the chat stream (DATA-04). One row per call is stored here, with the real
 * user, so each institution sees its own consumption; the backend keeps the
 * same calls without the user in `llm_usage`.
 *
 * The backend also tells, after each chat answer, how much of the user's token
 * budget is left. The latest value is cached; if there is none (for example the
 * backend is down), it is estimated from the rows stored here.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Stores usage rows and works out the remaining budget.
 */
class usage_store {
    /** @var string[] Roles as the backend records them. */
    const ROLES = ['student', 'teacher', 'system'];

    /** @var array Default token limits per role, the same as the backend's. */
    const DEFAULT_LIMITS = [
        'student' => ['hourly' => 8000, 'daily' => 40000],
        'teacher' => ['hourly' => 20000, 'daily' => 100000],
    ];

    /** @var array Window length of each budget, in seconds. */
    const WINDOWS = ['hourly' => HOURSECS, 'daily' => DAYSECS];

    /**
     * Stores the calls the backend reported for one request.
     *
     * Never breaks the request: a failure is logged with debugging().
     *
     * @param int|null $userid User the calls were made for, if any.
     * @param int $courseid Course.
     * @param string $role student, teacher or system.
     * @param array[] $calls Calls as the backend reports them.
     * @param string|null $requestid Backend request id.
     * @return int Rows stored.
     */
    public static function record_calls(?int $userid, int $courseid, string $role, array $calls, ?string $requestid = null): int {
        global $DB;
        if ($courseid <= 0 || empty($calls)) {
            return 0;
        }
        $role = in_array($role, self::ROLES, true) ? $role : 'system';
        $now = time();
        $stored = 0;
        try {
            foreach ($calls as $call) {
                if (!is_array($call)) {
                    continue;
                }
                $DB->insert_record('local_nexusai_usage', (object) [
                    'userid' => $userid ?: null,
                    'courseid' => $courseid,
                    'role' => $role,
                    'feature' => \core_text::substr((string) ($call['feature'] ?? 'unknown'), 0, 80),
                    'provider' => isset($call['provider']) ? \core_text::substr((string) $call['provider'], 0, 40) : null,
                    'model' => isset($call['model']) ? \core_text::substr((string) $call['model'], 0, 120) : null,
                    'fallback' => !empty($call['fallback']) ? 1 : 0,
                    'prompttokens' => (int) ($call['prompt_tokens'] ?? 0),
                    'completiontokens' => (int) ($call['completion_tokens'] ?? 0),
                    'cachedprompttokens' => (int) ($call['cached_prompt_tokens'] ?? 0),
                    'embeddingtokens' => (int) ($call['embedding_tokens'] ?? 0),
                    'audioseconds' => isset($call['audio_seconds']) ? (float) $call['audio_seconds'] : null,
                    'costusd' => isset($call['cost_usd']) && is_numeric($call['cost_usd']) ? $call['cost_usd'] : null,
                    'cachehit' => !empty($call['cache_hit']) ? 1 : 0,
                    'savedtokens' => (int) ($call['saved_tokens'] ?? 0),
                    'latencyms' => isset($call['latency_ms']) ? (float) $call['latency_ms'] : null,
                    'status' => \core_text::substr((string) ($call['status'] ?? 'ok'), 0, 20),
                    'requestid' => $requestid !== null ? \core_text::substr($requestid, 0, 64) : null,
                    'timecreated' => $now,
                ]);
                $stored++;
            }
        } catch (\Throwable $e) {
            debugging('[NexusAI] Could not store usage: ' . $e->getMessage(), DEBUG_DEVELOPER);
        }
        return $stored;
    }

    /**
     * Reads the X-NexusAI-Usage header value.
     *
     * @param string $value Header value.
     * @return array[] Calls; empty if the value is not valid.
     */
    public static function parse_header(string $value): array {
        $data = json_decode($value, true);
        return is_array($data) && isset($data['calls']) && is_array($data['calls']) ? $data['calls'] : [];
    }

    /**
     * Token limits for a role, from the plugin settings.
     *
     * @param string $role student or teacher.
     * @return array{hourly:int, daily:int}
     */
    public static function limits(string $role): array {
        $role = $role === 'teacher' ? 'teacher' : 'student';
        $out = [];
        foreach (['hourly', 'daily'] as $window) {
            $value = (int) get_config('local_nexusai', "token_limit_{$role}_{$window}");
            $out[$window] = $value > 0 ? $value : self::DEFAULT_LIMITS[$role][$window];
        }
        return $out;
    }

    /**
     * Keeps the budget the backend reported after a chat answer.
     *
     * @param int $userid User.
     * @param string $role student or teacher.
     * @param array $budget {hourly:{limit,used,remaining,resets_in_sec}, daily:{...}}.
     */
    public static function remember_budget(int $userid, string $role, array $budget): void {
        $cache = \cache::make('local_nexusai', 'budget');
        $cache->set(self::budget_key($userid, $role), ['time' => time(), 'budget' => $budget]);
    }

    /**
     * How much of the user's token budget is left in each window.
     *
     * Uses the latest value the backend reported while its window lasts;
     * otherwise estimates it from the chat usage stored here in the current
     * window (the backend counts only the chat against the budget).
     *
     * @param int $userid User.
     * @param string $role student or teacher.
     * @return array{source:string, hourly:array, daily:array}
     */
    public static function budget(int $userid, string $role): array {
        $role = $role === 'teacher' ? 'teacher' : 'student';
        $limits = self::limits($role);
        $now = time();
        $cached = \cache::make('local_nexusai', 'budget')->get(self::budget_key($userid, $role));

        $out = ['source' => 'backend'];
        foreach (self::WINDOWS as $window => $length) {
            $start = $now - ($now % $length);
            $fresh = is_array($cached) && isset($cached['budget'][$window]) && (int) $cached['time'] >= $start;
            if ($fresh) {
                $used = (int) ($cached['budget'][$window]['used'] ?? 0);
            } else {
                $used = self::chat_tokens_since($userid, $role, $start);
                $out['source'] = 'estimate';
            }
            $limit = $limits[$window];
            $out[$window] = [
                'limit' => $limit,
                'used' => $used,
                'remaining' => max($limit - $used, 0),
                'percent_used' => $limit > 0 ? min(100, (int) floor($used * 100 / $limit)) : 0,
                'resets_in_sec' => $length - ($now % $length),
            ];
        }
        return $out;
    }

    /**
     * Chat tokens stored for a user and role since a time.
     *
     * @param int $userid User.
     * @param string $role Role.
     * @param int $since Unix time.
     * @return int
     */
    public static function chat_tokens_since(int $userid, string $role, int $since): int {
        global $DB;
        $like = $DB->sql_like('feature', ':feature');
        return (int) $DB->get_field_sql(
            "SELECT COALESCE(SUM(prompttokens + completiontokens), 0)
               FROM {local_nexusai_usage}
              WHERE userid = :userid AND role = :role AND timecreated >= :since AND $like",
            ['userid' => $userid, 'role' => $role, 'since' => $since, 'feature' => 'chat.%']
        );
    }

    /**
     * Average tokens of one chat question for a user, to turn tokens into questions.
     *
     * @param int $userid User.
     * @return int Tokens; a default when there is no history.
     */
    public static function average_question_tokens(int $userid): int {
        global $DB;
        $row = $DB->get_record_sql(
            "SELECT COUNT(DISTINCT requestid) AS questions, COALESCE(SUM(prompttokens + completiontokens), 0) AS tokens
               FROM {local_nexusai_usage}
              WHERE userid = :userid AND timecreated >= :since AND " . $DB->sql_like('feature', ':feature'),
            ['userid' => $userid, 'since' => time() - 30 * DAYSECS, 'feature' => 'chat.%']
        );
        if (!$row || (int) $row->questions === 0 || (int) $row->tokens === 0) {
            return 1500;
        }
        return max(1, (int) round($row->tokens / $row->questions));
    }

    /**
     * Cache key for a user's budget in a role.
     *
     * @param int $userid User.
     * @param string $role Role.
     * @return string
     */
    private static function budget_key(int $userid, string $role): string {
        return $role . '_' . $userid;
    }
}
