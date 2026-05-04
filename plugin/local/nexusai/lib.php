<?php
defined('MOODLE_INTERNAL') || die();

function local_nexusai_before_footer() {
    global $PAGE, $USER, $COURSE;

    if (!isloggedin() || isguestuser()) {
        return '';
    }
    if ($COURSE->id <= 1) {
        return '';
    }

    $context = context_course::instance($COURSE->id);
    if (!has_capability('local/nexusai:use', $context)) {
        return '';
    }

    return '<div id="local-nexusai-container" data-courseid="' .
        $COURSE->id . '" data-userid="' . $USER->id . '"></div>';
}
