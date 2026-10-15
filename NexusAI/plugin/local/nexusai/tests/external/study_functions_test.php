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
 * Tests for the study plan, review, analytics and pending upload external
 * functions (TPC-05, #577).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/external_testcase.php');

/**
 * Tests for quiz_study_plan, quiz_review_suggestions, analytics_dashboard and
 * confirm_pending_upload.
 *
 * @covers \local_nexusai\external\quiz_study_plan
 * @covers \local_nexusai\external\quiz_review_suggestions
 * @covers \local_nexusai\external\analytics_dashboard
 * @covers \local_nexusai\external\confirm_pending_upload
 */
final class study_functions_test extends external_testcase {
    /**
     * Criterion: the study plan maps each topic, and the suggested quiz topic
     * falls back to the topic itself when the backend leaves it out.
     */
    public function test_study_plan_maps_the_topics(): void {
        // Arrange.
        $data = $this->setup_course();
        $this->mock_backend([
            'topics' => [
                ['topic' => 'Árboles', 'quiz_error_count' => 3, 'gap_count' => 1, 'quiz_error_ids' => [7, 8]],
            ],
        ]);

        // Act.
        $result = $this->call(quiz_study_plan::class, [(int) $data->course->id, 9999]);

        // Assert.
        $this->assertSame('Árboles', $result['topics'][0]['suggested_quiz_topic']);
        $this->assertSame(['7', '8'], $result['topics'][0]['quiz_error_ids']);
        $this->assertSame(3, $result['topics'][0]['quiz_error_count']);
    }

    /**
     * Criterion: the review suggestions keep the source document of each group.
     */
    public function test_review_suggestions_map_the_sources(): void {
        // Arrange.
        $data = $this->setup_course();
        $this->mock_backend([
            'total_errors' => 4,
            'suggestions' => [
                ['source_filename' => 'u3.pdf', 'source_document_id' => 'doc-3', 'error_count' => 4, 'topic' => 'Grafos'],
                ['error_count' => 1],
            ],
        ]);

        // Act.
        $result = $this->call(quiz_review_suggestions::class, [(int) $data->course->id, 0]);

        // Assert.
        $this->assertSame(4, $result['total_errors']);
        $this->assertSame('doc-3', $result['suggestions'][0]['source_document_id']);
        $this->assertNull($result['suggestions'][1]['source_filename']);
    }

    /**
     * Criterion: the analytics dashboard counts the course's quiz attempts and
     * returns every section even with no activity.
     */
    public function test_analytics_dashboard_counts_the_activity(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $courseid = (int) $data->course->id;
        \local_nexusai\local\quiz_store::save_attempt($courseid, (int) $data->user->id, 'multiple_choice', 'easy', null, 4, 2);

        // Act.
        $result = $this->call(analytics_dashboard::class, [$courseid, 0]);

        // Assert.
        $this->assertSame($courseid, $result['course_id']);
        $this->assertSame(1, $result['period_days']);
        $this->assertSame(1, $result['quiz_score_distribution']['total_attempts']);
        $this->assertSame(0, $result['gaps_ratio']['gaps_detected']);
    }

    /**
     * Criterion: a student cannot open the analytics dashboard.
     */
    public function test_student_cannot_open_the_analytics(): void {
        // Arrange.
        $data = $this->setup_course();

        // Act and assert.
        $this->assert_call_fails('nopermissions', analytics_dashboard::class, [(int) $data->course->id]);
    }

    /**
     * Criterion: confirming a pending upload sends the resource's file to the
     * backend and clears it from the pending list.
     */
    public function test_confirm_pending_upload_indexes_the_file(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $sink = $this->redirectMessages();
        $courseid = (int) $data->course->id;
        $resource = $this->getDataGenerator()->create_module('resource', ['course' => $courseid]);
        $pending = [(string) $resource->cmid => [
            'courseid' => $courseid,
            'context_id' => \context_module::instance($resource->cmid)->id,
            'mimetype' => 'text/plain',
            'filename' => 'resource1.txt',
        ]];
        set_user_preference(\local_nexusai\observer::PENDING_PREF, json_encode($pending));
        $this->mock_backend(['id' => 'doc-20', 'status' => 'pending']);

        // Act.
        $result = $this->call(confirm_pending_upload::class, [$courseid, (int) $resource->cmid]);

        // Assert.
        $this->assertTrue($result['success']);
        $this->assertSame('[]', get_user_preferences(\local_nexusai\observer::PENDING_PREF));
        $sink->close();
    }

    /**
     * Criterion: a cmid that is not pending for this course is refused.
     */
    public function test_confirm_pending_upload_refuses_an_unknown_cmid(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');

        // Act and assert.
        $this->assert_call_fails('errorbackend', confirm_pending_upload::class, [(int) $data->course->id, 12345]);
    }
}
