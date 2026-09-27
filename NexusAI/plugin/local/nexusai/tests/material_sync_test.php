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
 * Tests for keeping the index in step with the activity (VIS-04, issue #539).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\external\backend_client;
use local_nexusai\local\material_activity;
use local_nexusai\local\material_sync;

/**
 * Covers material_sync and the two observers that use it.
 *
 * Runs in a separate process because backend_client is loaded from the external classes,
 * which require externallib.php.
 *
 * @runTestsInSeparateProcesses
 * @covers \local_nexusai\local\material_sync
 * @covers \local_nexusai\observer
 */
final class material_sync_test extends \advanced_testcase {
    /**
     * Creates a course, a teacher and one activity holding the given file.
     *
     * @param string $bytes File content.
     * @param string $filename File name.
     * @return array{0:\stdClass,1:int} Course and cmid.
     */
    private function activity(string $bytes = '%PDF-1.4 uno', string $filename = 'apunte.pdf'): array {
        $this->setAdminUser();
        $course = $this->getDataGenerator()->create_course();
        $cmid = material_activity::create($course, 0, $filename, $bytes, true);
        return [$course, $cmid];
    }

    /**
     * A backend client double that returns the given documents for any activity.
     *
     * @param array[] $docs Documents.
     * @return backend_client|\PHPUnit\Framework\MockObject\MockObject
     */
    private function client(array $docs) {
        $client = $this->createMock(backend_client::class);
        $client->method('list_documents')->willReturn(['total' => count($docs), 'items' => $docs]);
        return $client;
    }

    /**
     * Content hash the backend stores for a file.
     *
     * @param string $bytes File content.
     * @return string
     */
    private function hash(string $bytes): string {
        return hash('sha256', base64_encode($bytes));
    }

    /**
     * Deleting the activity removes each of its documents from the backend.
     */
    public function test_remove_activity_deletes_its_documents(): void {
        $this->resetAfterTest();
        [$course, $cmid] = $this->activity();
        $client = $this->client([['id' => 'doc-1'], ['id' => 'doc-2']]);
        $client->expects($this->exactly(2))->method('delete_document')
            ->with($this->logicalOr($this->equalTo('doc-1'), $this->equalTo('doc-2')));
        $client->expects($this->once())->method('list_documents')
            ->with((int) $course->id, null, 0, $cmid)
            ->willReturn(['items' => [['id' => 'doc-1'], ['id' => 'doc-2']]]);

        $this->assertSame(2, (new material_sync($client))->remove_activity((int) $course->id, $cmid));
    }

    /**
     * An activity NexusAI never indexed changes nothing in the backend.
     */
    public function test_an_activity_without_documents_is_left_alone(): void {
        $this->resetAfterTest();
        [$course, $cmid] = $this->activity();
        $client = $this->client([]);
        $client->expects($this->never())->method('delete_document');
        $client->expects($this->never())->method('replace_document');

        $sync = new material_sync($client);
        $this->assertSame(0, $sync->remove_activity((int) $course->id, $cmid));
        $this->assertSame(material_sync::NONE, $sync->sync_activity((int) $course->id, $cmid));
    }

    /**
     * When the file did not change, nothing is sent: renaming or hiding costs nothing.
     */
    public function test_an_unchanged_file_is_not_reindexed(): void {
        $this->resetAfterTest();
        [$course, $cmid] = $this->activity('%PDF-1.4 uno');
        $client = $this->client([['id' => 'doc-1', 'file_hash' => $this->hash('%PDF-1.4 uno')]]);
        $client->expects($this->never())->method('replace_document');
        $client->expects($this->never())->method('delete_document');

        $this->assertSame(material_sync::UNCHANGED, (new material_sync($client))->sync_activity((int) $course->id, $cmid));
    }

    /**
     * A different file is sent to the backend with its new name and type.
     */
    public function test_a_changed_file_is_reindexed(): void {
        $this->resetAfterTest();
        [$course, $cmid] = $this->activity('%PDF-1.4 nuevo', 'v2.pdf');
        $client = $this->client([['id' => 'doc-1', 'file_hash' => $this->hash('%PDF-1.4 viejo')]]);
        $client->expects($this->once())->method('replace_document')
            ->with('doc-1', 'v2.pdf', 'application/pdf', '%PDF-1.4 nuevo')
            ->willReturn(['id' => 'doc-1', 'status' => 'pending']);

        $this->assertSame(material_sync::REINDEXED, (new material_sync($client))->sync_activity((int) $course->id, $cmid));
    }

    /**
     * If the activity ends up with a file NexusAI cannot read, the document leaves the index.
     */
    public function test_a_file_of_an_unsupported_type_removes_the_document(): void {
        $this->resetAfterTest();
        [$course, $cmid] = $this->activity('GIF89a....', 'imagen.gif');
        $client = $this->client([['id' => 'doc-1', 'file_hash' => 'x']]);
        $client->expects($this->once())->method('delete_document')->with('doc-1');
        $client->expects($this->never())->method('replace_document');

        $this->assertSame(material_sync::REMOVED, (new material_sync($client))->sync_activity((int) $course->id, $cmid));
    }

    /**
     * An activity that no longer exists has no file, so its document is removed.
     */
    public function test_an_activity_without_a_file_removes_the_document(): void {
        $this->resetAfterTest();
        [$course, $cmid] = $this->activity();
        material_activity::remove($cmid);
        $client = $this->client([['id' => 'doc-1', 'file_hash' => 'x']]);
        $client->expects($this->once())->method('delete_document')->with('doc-1');

        $this->assertSame(material_sync::REMOVED, (new material_sync($client))->sync_activity((int) $course->id, $cmid));
    }

    /**
     * Both events are registered for the plugin.
     */
    public function test_the_observers_are_registered(): void {
        $found = [];
        foreach (\core\event\manager::get_all_observers() as $eventname => $observers) {
            foreach ($observers as $observer) {
                $observer = (array) $observer;
                $callback = (string) ($observer['callable'] ?? $observer['callback'] ?? '');
                if (str_contains($callback, 'local_nexusai\\observer::')) {
                    $found[] = trim($eventname, '\\') . ' => ' . trim($callback, '\\');
                }
            }
        }
        $this->assertContains(
            'core\event\course_module_deleted => local_nexusai\observer::course_module_deleted',
            $found
        );
        $this->assertContains(
            'core\event\course_module_updated => local_nexusai\observer::course_module_updated',
            $found
        );
    }

    /**
     * Where NexusAI is off, or for an activity that is not a File, the observers do nothing.
     */
    public function test_observers_ignore_courses_that_are_off_and_other_activities(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        set_config('enabled', 1, 'local_nexusai');
        $course = $this->getDataGenerator()->create_course();
        $page = $this->getDataGenerator()->create_module('page', ['course' => $course->id]);
        $event = \core\event\course_module_deleted::create([
            'courseid' => $course->id,
            'context' => \context_module::instance($page->cmid),
            'objectid' => $page->cmid,
            'other' => ['modulename' => 'page', 'instanceid' => $page->id],
        ]);

        // NexusAI is off in the course (the default): nothing is called and nothing is logged.
        observer::course_module_deleted($event);
        // On, but not a File activity: also ignored.
        set_config('default_course_enabled', 1, 'local_nexusai');
        observer::course_module_deleted($event);
        $this->assertDebuggingNotCalled();
    }
}
