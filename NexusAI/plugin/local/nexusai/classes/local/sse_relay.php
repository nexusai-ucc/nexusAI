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
 * Relays the backend's chat stream to the browser and stores the answer (DATA-05).
 *
 * The backend streams Server-Sent Events: `meta`, `token` (many), `answer_meta`,
 * `done` or `error`. Since the conversation now lives in Moodle, this relay:
 *
 * - adds the conversation id to `meta` (the frontend keeps it for the next question);
 * - joins the tokens into the answer text;
 * - on `done`, stores the answer, metrics, unanswered-question signal and token
 *   usage (local\chat_turn::finish) and adds the stored message id, so the
 *   frontend can enable the vote buttons.
 *
 * Chunks from curl can cut an event anywhere, so bytes are buffered until a
 * blank line closes each event. Output goes through a callback, which keeps the
 * class testable without a real stream.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Line-buffered SSE relay for one chat question.
 */
class sse_relay {
    /** @var chat_turn The question being answered. */
    private chat_turn $turn;

    /** @var callable fn(string $bytes): void, writes to the browser. */
    private $output;

    /** @var string Bytes of an event not closed yet. */
    private string $buffer = '';

    /** @var string[] Answer tokens received so far. */
    private array $tokens = [];

    /** @var bool Whether `done` was received and the answer stored. */
    private bool $finished = false;

    /**
     * Constructor.
     *
     * @param chat_turn $turn The question being answered.
     * @param callable $output fn(string $bytes): void.
     */
    public function __construct(chat_turn $turn, callable $output) {
        $this->turn = $turn;
        $this->output = $output;
    }

    /**
     * Takes bytes as curl delivers them.
     *
     * @param string $chunk Bytes.
     * @return int Bytes consumed (curl's WRITEFUNCTION contract).
     */
    public function write(string $chunk): int {
        $this->buffer .= str_replace("\r\n", "\n", $chunk);
        while (($end = strpos($this->buffer, "\n\n")) !== false) {
            $event = substr($this->buffer, 0, $end);
            $this->buffer = substr($this->buffer, $end + 2);
            $this->handle($event);
        }
        return strlen($chunk);
    }

    /**
     * Whether the answer was stored.
     *
     * @return bool
     */
    public function finished(): bool {
        return $this->finished;
    }

    /**
     * The answer received so far.
     *
     * @return string
     */
    public function answer(): string {
        return implode('', $this->tokens);
    }

    /**
     * Handles one SSE event: forwards it, changed where needed.
     *
     * @param string $event Event text without the closing blank line.
     */
    private function handle(string $event): void {
        $data = null;
        foreach (explode("\n", $event) as $line) {
            if (strpos($line, 'data:') === 0) {
                $data = ltrim(substr($line, 5));
            }
        }
        $payload = $data !== null ? json_decode($data, true) : null;
        if (!is_array($payload)) {
            // Not an event this relay understands: pass it on untouched.
            $this->emit($event);
            return;
        }

        switch ($payload['type'] ?? '') {
            case 'meta':
                $payload['session_id'] = $this->turn->session->uuid;
                break;
            case 'token':
                $this->tokens[] = (string) ($payload['content'] ?? '');
                break;
            case 'done':
                $message = $this->turn->finish($this->answer(), $payload, 'stream', true);
                $this->finished = true;
                $payload['assistant_message_id'] = $message->uuid;
                // What the frontend does not need stays on the server.
                unset($payload['usage'], $payload['gap']);
                break;
        }
        $this->emit('data: ' . json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    /**
     * Writes one event to the browser.
     *
     * @param string $event Event text.
     */
    private function emit(string $event): void {
        ($this->output)($event . "\n\n");
    }
}
