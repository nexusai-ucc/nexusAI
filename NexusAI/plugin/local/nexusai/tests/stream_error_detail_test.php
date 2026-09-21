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
 * Tests for backend_client::extract_stream_error_detail().
 *
 * FEAT-06 (#481, daily limit): the SSE proxy (chat_stream.php) has to emit
 * a well-formed `data: {...}\n\n` event when the backend returns an error
 * (e.g. 429 rate limit) instead of forwarding the raw JSON, which React's
 * SSE parser silently discards for not starting with "data:" — before this
 * fix, the student was left staring at the "typing" indicator hung forever
 * with no visible error.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\external\backend_client;

/**
 * Tests for backend_client::extract_stream_error_detail().
 *
 * @covers \local_nexusai\external\backend_client::extract_stream_error_detail
 */
final class stream_error_detail_test extends \advanced_testcase {
    /**
     * Our own rate limiter sends a structured `detail` — an object, not a
     * string — with a `message` already written for the student. It has
     * to be preferred over anything else.
     */
    public function test_prefers_the_structured_message_from_the_rate_limiter(): void {
        $body = json_encode([
            'detail' => [
                'error'      => 'rate_limit_exceeded',
                'scope'      => 'daily',
                'message'    => 'You reached your limit of 50 queries today. Try again tomorrow.',
                'limit'      => 50,
                'window_sec' => 86400,
            ],
        ]);

        $result = backend_client::extract_stream_error_detail($body, 429);

        $this->assertEquals(
            'You reached your limit of 50 queries today. Try again tomorrow.',
            $result
        );
    }

    /**
     * The per-minute limit has to give a DIFFERENT message than the daily
     * one — that's this PR's whole reason to exist: so the frontend can
     * tell them apart.
     */
    public function test_distinguishes_the_minute_message_from_the_daily_one(): void {
        $bodyminute = json_encode([
            'detail' => [
                'error'   => 'rate_limit_exceeded',
                'scope'   => 'minute',
                'message' => 'You exceeded the limit of 20 queries per minute. Wait a moment and try again.',
            ],
        ]);
        $bodydaily = json_encode([
            'detail' => [
                'error'   => 'rate_limit_exceeded',
                'scope'   => 'daily',
                'message' => 'You reached your limit of 50 queries today. Try again tomorrow.',
            ],
        ]);

        $minutemsg = backend_client::extract_stream_error_detail($bodyminute, 429);
        $dailymsg  = backend_client::extract_stream_error_detail($bodydaily, 429);

        $this->assertNotEquals($minutemsg, $dailymsg);
        $this->assertStringContainsString('minute', $minutemsg);
        $this->assertStringContainsString('tomorrow', $dailymsg);
    }

    /**
     * A plain string `detail` (not structured — e.g. a generic 503 from
     * the backend) also has to be shown, not lost.
     */
    public function test_uses_the_plain_string_detail_when_not_structured(): void {
        $body = json_encode(['detail' => 'The LLM is temporarily unavailable']);

        $result = backend_client::extract_stream_error_detail($body, 503);

        $this->assertEquals('The LLM is temporarily unavailable', $result);
    }

    /**
     * An empty body or broken JSON (connection cut off mid error-response)
     * shouldn't break anything — it falls back to a readable message with the status.
     */
    public function test_falls_back_with_empty_body_or_broken_json(): void {
        $this->assertEquals('HTTP 500', backend_client::extract_stream_error_detail('', 500));
        $this->assertEquals(
            'HTTP 502',
            backend_client::extract_stream_error_detail('{this is not json', 502)
        );
    }

    /**
     * A structured `detail` with no `message` (unexpected shape) also
     * falls back instead of failing or showing something empty.
     */
    public function test_falls_back_if_the_structured_detail_has_no_message(): void {
        $body = json_encode(['detail' => ['error' => 'something_else']]);

        $result = backend_client::extract_stream_error_detail($body, 500);

        $this->assertEquals('HTTP 500', $result);
    }
}
