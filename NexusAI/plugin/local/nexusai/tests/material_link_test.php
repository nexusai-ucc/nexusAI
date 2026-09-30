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
 * Tests for opening cited material through its activity (VIS-05, issue #540).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\external\backend_client;
use local_nexusai\local\material_activity;
use local_nexusai\local\material_link;

/**
 * Covers material_link and the file replacement inside an activity.
 *
 * @covers \local_nexusai\local\material_link
 * @covers \local_nexusai\local\material_activity
 */
final class material_link_test extends \advanced_testcase {
    /**
     * Creates a course with a teacher, a student and one visible and one hidden activity.
     *
     * @return array{0:\stdClass,1:\stdClass,2:\stdClass,3:int,4:int} Course, teacher, student, shown cmid, hidden cmid.
     */
    private function setup_course(): array {
        $this->setAdminUser();
        $gen = $this->getDataGenerator();
        $course = $gen->create_course();
        $teacher = $gen->create_and_enrol($course, 'editingteacher');
        $student = $gen->create_and_enrol($course, 'student');
        $shown = material_activity::create($course, 0, 'visible.pdf', '%PDF-1.4 a', true);
        $hidden = material_activity::create($course, 0, 'oculto.pdf', '%PDF-1.4 b', false);
        return [$course, $teacher, $student, $shown, $hidden];
    }

    /**
     * A backend client double that returns one document.
     *
     * @param array $document Document as the backend returns it.
     * @return backend_client|\PHPUnit\Framework\MockObject\MockObject
     */
    private function client(array $document) {
        $client = $this->createMock(backend_client::class);
        $client->method('get_document')->willReturn($document);
        return $client;
    }

    /**
     * A student gets the link of a visible activity and false for a hidden one; a teacher gets both.
     */
    public function test_a_hidden_activity_is_refused_to_students_only(): void {
        $this->resetAfterTest();
        [$course, $teacher, $student, $shown, $hidden] = $this->setup_course();

        $this->setUser($student);
        $url = material_link::url_for_cmid((int) $course->id, $shown);
        $this->assertInstanceOf(\moodle_url::class, $url);
        $this->assertStringEndsWith('/mod/resource/view.php', $url->get_path());
        $this->assertSame((string) $shown, $url->get_param('id'));
        $this->assertFalse(material_link::url_for_cmid((int) $course->id, $hidden));

        $this->setUser($teacher);
        $this->assertInstanceOf(\moodle_url::class, material_link::url_for_cmid((int) $course->id, $hidden));
    }

    /**
     * An activity that is not in the course, is not a File or was deleted gives null.
     */
    public function test_an_unknown_or_deleted_activity_gives_null(): void {
        $this->resetAfterTest();
        [$course, , $student, $shown] = $this->setup_course();
        $page = $this->getDataGenerator()->create_module('page', ['course' => $course->id]);
        $other = $this->getDataGenerator()->create_course();
        $foreign = material_activity::create($other, 0, 'ajeno.pdf', '%PDF-1.4 c', true);

        $this->setUser($student);
        $this->assertNull(material_link::url_for_cmid((int) $course->id, 999999));
        $this->assertNull(material_link::url_for_cmid((int) $course->id, (int) $page->cmid));
        $this->assertNull(material_link::url_for_cmid((int) $course->id, $foreign));

        $this->setAdminUser();
        material_activity::remove($shown);
        rebuild_course_cache($course->id, true);
        $this->setUser($student);
        $this->assertNull(material_link::url_for_cmid((int) $course->id, $shown));
    }

    /**
     * A document resolves to its activity; another course's document, or one without an activity, gives null.
     */
    public function test_a_document_resolves_only_within_its_own_course_and_activity(): void {
        $this->resetAfterTest();
        [$course, , $student, $shown, $hidden] = $this->setup_course();
        $this->setUser($student);
        $id = (int) $course->id;

        $ok = material_link::url_for_document($id, 'doc-1', $this->client(['course_id' => $id, 'cmid' => $shown]));
        $this->assertInstanceOf(\moodle_url::class, $ok);
        $this->assertFalse(material_link::url_for_document($id, 'doc-2', $this->client(['course_id' => $id, 'cmid' => $hidden])));
        $this->assertNull(material_link::url_for_document($id, 'doc-3', $this->client(['course_id' => $id + 1, 'cmid' => $shown])));
        $this->assertNull(material_link::url_for_document($id, 'doc-4', $this->client(['course_id' => $id, 'cmid' => null])));

        $failing = $this->createMock(backend_client::class);
        $failing->method('get_document')->willThrowException(new \moodle_exception('errorbackend', 'local_nexusai'));
        $this->assertNull(material_link::url_for_document($id, 'doc-5', $failing));
    }

    /**
     * Replacing the file puts the new one in the activity, keeping a single file.
     */
    public function test_replace_file_swaps_the_activity_file(): void {
        global $DB;
        $this->resetAfterTest();
        [$course, , , $shown] = $this->setup_course();
        $instance = get_coursemodule_from_id('resource', $shown, 0, false, MUST_EXIST)->instance;
        $before = (int) $DB->get_field('resource', 'revision', ['id' => $instance]);

        material_activity::replace_file($shown, 'nuevo.pdf', '%PDF-1.4 nuevo');

        $files = get_file_storage()->get_area_files(
            \context_module::instance($shown)->id,
            'mod_resource',
            'content',
            false,
            'filename',
            false
        );
        $this->assertCount(1, $files);
        $file = reset($files);
        $this->assertSame('nuevo.pdf', $file->get_filename());
        $this->assertSame('%PDF-1.4 nuevo', $file->get_content());
        $this->assertSame($before + 1, (int) $DB->get_field('resource', 'revision', ['id' => $instance]));
    }
}
