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
 * Tests for the MIME type check of the voice transcription external function (VOICE-01, issue #314).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\external\chat_voice_transcribe;
use local_nexusai\local\course_guard;

/**
 * The MIME type a browser's MediaRecorder reports is accepted.
 *
 * @covers \local_nexusai\external\chat_voice_transcribe
 */
final class chat_voice_transcribe_test extends \advanced_testcase {
    /**
     * Runs the external function as an enrolled student and returns the error code it stops with.
     *
     * @param string $mimetype MIME type as the browser reports it
     * @return string
     */
    private function error_for(string $mimetype): string {
        $this->resetAfterTest();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $student = $generator->create_user();
        $generator->enrol_user($student->id, $course->id, 'student');
        course_guard::set_enabled((int) $course->id, true);
        $this->setUser($student);

        try {
            chat_voice_transcribe::execute((int) $course->id, $mimetype, base64_encode('fake-audio'));
        } catch (\moodle_exception $e) {
            return $e->errorcode;
        }
        $this->fail('The backend is not configured here, so an exception was expected.');
    }

    /**
     * MIME types real browsers report while recording.
     *
     * @return array
     */
    public static function browser_mimetypes(): array {
        return [
            'Chrome and Edge' => ['audio/webm;codecs=opus'],
            'Firefox' => ['audio/ogg; codecs=opus'],
            'Safari' => ['audio/mp4;codecs=mp4a.40.2'],
            'no parameters' => ['audio/webm'],
            'upper case' => ['Audio/WebM'],
        ];
    }

    /**
     * A recording passes the MIME check and goes on to the backend.
     *
     * @dataProvider browser_mimetypes
     * @param string $mimetype MIME type as the browser reports it
     */
    public function test_browser_recording_passes_the_mimetype_check(string $mimetype): void {
        // Past the check it reaches the backend, which is not configured here.
        $this->assertSame('errorconfigmissing', $this->error_for($mimetype));
    }

    /**
     * A type that is not audio is still refused, parameters or not.
     */
    public function test_unsupported_type_is_refused(): void {
        $this->assertSame('erroraudiotype', $this->error_for('video/webm;codecs=vp8'));
    }
}
