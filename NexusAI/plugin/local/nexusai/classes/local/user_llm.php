<?php
// This file is part of Moodle - https://moodle.org/
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
 * The user's own AI provider API key ("My API key", BYOK).
 *
 * A student or teacher can save the API key of their own account with an AI
 * provider. The backend uses it as the last link of its model chain: only when
 * the institution's models do not answer (quota exhausted, provider down) or
 * when the user reached their token limit in the chat.
 *
 * The key is stored encrypted (\core\encryption) in a user preference and is
 * never shown again in full. It travels inside the signed body of each request
 * that uses the LLM (`user_llm`), and only when the site switch is on, every
 * course of the request allows it and the request was made by the logged-in
 * user (never from tasks or observers).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Stores the user's key and decides when it goes to the backend.
 */
class user_llm {
    /** @var string User preference holding the key (JSON, key encrypted). */
    const PREFERENCE = 'local_nexusai_userllm';

    /**
     * @var string[] Providers the backend accepts, id => name shown to the user.
     *
     * Closed list on purpose: the backend maps each id to its URL, so a user can
     * never make the server call an address of their choice. Keep in sync with
     * PROVIDERS in services/api/app/providers/user_llm.py.
     */
    const PROVIDERS = [
        'openai' => 'OpenAI',
        'anthropic' => 'Anthropic',
        'gemini' => 'Google Gemini',
        'groq' => 'Groq',
        'openrouter' => 'OpenRouter',
        'mistral' => 'Mistral',
        'deepseek' => 'DeepSeek',
    ];

    /** @var string Model names as providers write them: "gpt-x-mini", "org/model:free". */
    const MODEL_PATTERN = '/^[A-Za-z0-9][A-Za-z0-9._:\/@+-]{0,119}$/';

    /**
     * @var string[] Why a key failed, as the backend reports it (HTTP 424, reason).
     * Each one has its language string userllm_failed_<reason>.
     */
    const REASONS = ['rejected', 'quota', 'model', 'request', 'unavailable'];

    /** @var int Shortest and longest key accepted. */
    const KEY_MIN = 8;
    /** @var int Longest key accepted. */
    const KEY_MAX = 512;

    /**
     * Whether the site-wide switch is on. Off until an administrator turns it
     * on: the request then also reaches a provider the user chose, so the site
     * has to opt in (a site that never saved the setting counts as off).
     *
     * @return bool
     */
    public static function site_enabled(): bool {
        return !empty(get_config('local_nexusai', 'user_llm_enabled'));
    }

    /**
     * Whether a course lets its users use their own key. Allowed unless the
     * teacher turned it off (stored in local_nexusai_course.features).
     *
     * @param int $courseid Course id.
     * @return bool
     */
    public static function course_allowed(int $courseid): bool {
        global $DB;
        if ($courseid <= SITEID) {
            return false;
        }
        $features = $DB->get_field(course_guard::TABLE, 'features', ['courseid' => $courseid]);
        $data = is_string($features) && $features !== '' ? json_decode($features, true) : null;
        if (!is_array($data) || !array_key_exists('userllm', $data)) {
            return true;
        }
        return !empty($data['userllm']);
    }

    /**
     * Turns the course permission on or off.
     *
     * @param int $courseid Course id.
     * @param bool $allowed New value.
     */
    public static function set_course_allowed(int $courseid, bool $allowed): void {
        global $DB, $USER;
        $now = time();
        $record = $DB->get_record(course_guard::TABLE, ['courseid' => $courseid]);
        if ($record) {
            $data = $record->features ? json_decode($record->features, true) : [];
            $data = is_array($data) ? $data : [];
            $data['userllm'] = $allowed ? 1 : 0;
            $record->features = json_encode($data);
            $record->usermodified = (int) $USER->id;
            $record->timemodified = $now;
            $DB->update_record(course_guard::TABLE, $record);
            return;
        }
        $DB->insert_record(course_guard::TABLE, (object) [
            'courseid' => $courseid,
            'enabled' => course_guard::course_setting($courseid) ? 1 : 0,
            'features' => json_encode(['userllm' => $allowed ? 1 : 0]),
            'usermodified' => (int) $USER->id,
            'timemodified' => $now,
        ]);
    }

    /**
     * Checks the values the user typed. Returns the cleaned values.
     *
     * @param string $provider Provider id.
     * @param string $model Model name.
     * @param string $apikey API key.
     * @return array{provider:string, model:string, apikey:string}
     * @throws \invalid_parameter_exception With the name of the wrong field.
     */
    public static function validate(string $provider, string $model, string $apikey): array {
        $model = trim($model);
        $apikey = trim($apikey);
        if (!array_key_exists($provider, self::PROVIDERS)) {
            throw new \invalid_parameter_exception('provider');
        }
        if (!preg_match(self::MODEL_PATTERN, $model)) {
            throw new \invalid_parameter_exception('model');
        }
        // Provider keys are printable ASCII without spaces; anything else is a typo
        // (and would not fit in the user preference once encrypted).
        $length = strlen($apikey);
        if ($length < self::KEY_MIN || $length > self::KEY_MAX || !preg_match('/^[\x21-\x7E]+$/', $apikey)) {
            throw new \invalid_parameter_exception('apikey');
        }
        return ['provider' => $provider, 'model' => $model, 'apikey' => $apikey];
    }

    /**
     * Saves the user's key, encrypted.
     *
     * @param int $userid User.
     * @param string $provider Provider id (already validated).
     * @param string $model Model name (already validated).
     * @param string $apikey API key (already validated).
     * @param int $timetested When the provider last answered with this key.
     */
    public static function save(int $userid, string $provider, string $model, string $apikey, int $timetested): void {
        set_user_preference(self::PREFERENCE, json_encode([
            'provider' => $provider,
            'model' => $model,
            'key' => \core\encryption::encrypt($apikey),
            'hint' => self::hint($apikey),
            'timetested' => $timetested,
            'timemodified' => time(),
        ]), $userid);
    }

    /**
     * Records that the stored key was tested again and answered.
     *
     * @param int $userid User.
     * @param int $time When.
     */
    public static function mark_tested(int $userid, int $time): void {
        $data = self::read($userid);
        if ($data === null) {
            return;
        }
        $data['timetested'] = $time;
        set_user_preference(self::PREFERENCE, json_encode($data), $userid);
    }

    /**
     * Deletes the user's key.
     *
     * @param int $userid User.
     */
    public static function delete(int $userid): void {
        unset_user_preference(self::PREFERENCE, $userid);
    }

    /**
     * What the user's screen shows about their key, never the key itself.
     *
     * @param int $userid User.
     * @return array|null {provider, model, hint, timetested, timemodified}; null without a key.
     */
    public static function status(int $userid): ?array {
        $data = self::read($userid);
        if ($data === null) {
            return null;
        }
        return [
            'provider' => (string) $data['provider'],
            'model' => (string) $data['model'],
            'hint' => (string) ($data['hint'] ?? ''),
            'timetested' => (int) ($data['timetested'] ?? 0),
            'timemodified' => (int) ($data['timemodified'] ?? 0),
        ];
    }

    /**
     * The decrypted key for a backend request, or null.
     *
     * @param int $userid User.
     * @return array|null {provider, model, api_key} in the backend's format.
     */
    public static function credentials(int $userid): ?array {
        $data = self::read($userid);
        if ($data === null) {
            return null;
        }
        try {
            $apikey = \core\encryption::decrypt((string) $data['key']);
        } catch (\Throwable $e) {
            // The site encryption key changed (for example a restored copy): the
            // stored key cannot be read anymore. The user has to save it again.
            debugging('[NexusAI] Could not decrypt the user API key: ' . $e->getMessage(), DEBUG_DEVELOPER);
            return null;
        }
        if ($apikey === '') {
            return null;
        }
        return ['provider' => (string) $data['provider'], 'model' => (string) $data['model'], 'api_key' => $apikey];
    }

    /**
     * Whether the user's key can be used in these courses right now.
     *
     * The key has to be readable too: after the site encryption key changes (a
     * restored copy, for example) the stored key cannot be decrypted, and the
     * screen must not say "connected" while nothing would be sent.
     *
     * @param int $userid User.
     * @param int[] $courseids Courses whose material the request reads.
     * @return bool
     */
    public static function active_for(int $userid, array $courseids): bool {
        if (!self::site_enabled() || empty($courseids)) {
            return false;
        }
        foreach ($courseids as $courseid) {
            if (!self::course_allowed((int) $courseid)) {
                return false;
            }
        }
        return self::credentials($userid) !== null;
    }

    /**
     * Adds `user_llm` to a request body when the logged-in user's key applies.
     *
     * Only for requests the logged-in user made: tasks and observers report the
     * role 'system' and never carry anybody's key. The courses are the ones in
     * the body (`course_ids` for a multi-course chat, otherwise `course_id`): the
     * key goes only if every one of them allows it, because the material of all
     * of them would reach the user's provider.
     *
     * @param array $body Decoded request body.
     * @param string|null $role Role reported to the backend.
     * @return array The body, with `user_llm` when it applies.
     */
    public static function add_to_body(array $body, ?string $role): array {
        global $USER;
        unset($body['user_llm']);
        if ($role === 'system' || !isloggedin() || isguestuser()) {
            return $body;
        }
        $courseids = !empty($body['course_ids']) && is_array($body['course_ids'])
            ? array_map('intval', $body['course_ids'])
            : [(int) ($body['course_id'] ?? 0)];
        $userid = (int) $USER->id;
        if (!self::active_for($userid, $courseids)) {
            return $body;
        }
        $credentials = self::credentials($userid);
        if ($credentials !== null) {
            $body['user_llm'] = $credentials;
        }
        return $body;
    }

    /**
     * Tokens and answers made with the user's key since the start of the month.
     *
     * Each successful call answered by the key counts as one answer: the
     * streamed chat stores its usage without a request id, so counting distinct
     * requests would miss it. The test calls of the "My API key" screen do not
     * count.
     *
     * @param int $userid User.
     * @return array{requests:int, tokens:int}
     */
    public static function month_usage(int $userid): array {
        global $DB;
        $today = usergetdate(time());
        $start = make_timestamp((int) $today['year'], (int) $today['mon'], 1);
        $nottest = $DB->sql_like('feature', ':testfeature', true, true, true);
        $row = $DB->get_record_sql(
            "SELECT COUNT(1) AS requests,
                    COALESCE(SUM(prompttokens + completiontokens), 0) AS tokens
               FROM {local_nexusai_usage}
              WHERE userid = :userid AND byok = 1 AND status = :status AND completiontokens > 0
                    AND timecreated >= :since AND $nottest",
            ['userid' => $userid, 'status' => 'ok', 'since' => $start, 'testfeature' => 'user-llm.%']
        );
        return ['requests' => (int) ($row->requests ?? 0), 'tokens' => (int) ($row->tokens ?? 0)];
    }

    /**
     * The message for the user when their key failed, from this plugin's strings.
     *
     * The backend reports the reason (HTTP 424); the text shown is always a
     * Moodle language string, in the user's language.
     *
     * @param string $reason Reason reported by the backend; unknown ones count as 'unavailable'.
     * @param string $provider Provider id.
     * @param string $model Model name.
     * @return array{reason:string, message:string}
     */
    public static function failure(string $reason, string $provider, string $model): array {
        $reason = in_array($reason, self::REASONS, true) ? $reason : 'unavailable';
        $message = get_string('userllm_failed_' . $reason, 'local_nexusai', (object) [
            'provider' => self::PROVIDERS[$provider] ?? $provider,
            'model' => $model,
        ]);
        return ['reason' => $reason, 'message' => $message];
    }

    /**
     * Shows the start and the end of a key, enough to recognise it.
     *
     * @param string $apikey API key.
     * @return string For example "sk-ant…4f2a".
     */
    public static function hint(string $apikey): string {
        $length = \core_text::strlen($apikey);
        if ($length < 16) {
            return '…' . \core_text::substr($apikey, -2);
        }
        return \core_text::substr($apikey, 0, 6) . '…' . \core_text::substr($apikey, -4);
    }

    /**
     * The stored preference, decoded, or null when there is none or it is broken.
     *
     * @param int $userid User.
     * @return array|null
     */
    private static function read(int $userid): ?array {
        $value = get_user_preferences(self::PREFERENCE, null, $userid);
        if (!is_string($value) || $value === '') {
            return null;
        }
        $data = json_decode($value, true);
        $valid = is_array($data) && !empty($data['key']) && isset($data['provider'], $data['model'])
            && array_key_exists((string) $data['provider'], self::PROVIDERS);
        if (!$valid) {
            return null;
        }
        return $data;
    }
}
