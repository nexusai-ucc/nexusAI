# Changelog

All notable changes to the NexusAI Moodle plugin are documented in this
file. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.19.0] — Unreleased

- New: teachers turn NexusAI on or off for their course from "NexusAI in this
  course" (course navigation, needs `local/nexusai:manage`). When it is off,
  students see no widget or icon, every NexusAI web service and script refuses
  the course, observers and scheduled tasks skip it, and no request is made to
  the backend. Nothing is deleted: history, questions and documents come back
  when it is turned on again. The change is logged as a
  `course_settings_updated` event.
- Changed: NexusAI now ships **off in every course**, including existing ones
  after the upgrade, so it can be turned on one course at a time. Admins can
  change that with "On by default in courses", or turn courses on from the
  command line: `php local/nexusai/cli/enable_course.php --courseid=N`
  (`--list` shows the state of every course).
- Changed: the widget, the navigation icon and the course-creation tutorial no
  longer show outside a course unless the admin turns on "Show outside of a
  course".
- Fixed: the site-wide "enabled" switch only stopped observers and
  notifications. It now also hides the widget and blocks the web services and
  scripts.
- New table `local_nexusai_course` and the plugin's first `db/upgrade.php`;
  the empty placeholder table is removed. The Privacy API declares who last
  changed a course setting and detaches a deleted user from it.
- Calendar alerts of a course that is off stay pending and go out when it is
  turned on again.

## [0.18.1] — 2026-09-20

Initial submission to the Moodle Plugins directory. Maturity: beta.

- Fixed: the Materials page failed on a fresh install with "Call to undefined
  function local_nexusai_frontend_lang()" because `lib.php` was not loaded.
- Document downloads read their parameters through `optional_param()`
  instead of `$_GET`.
- The backend URL, API key and shared secret settings strip leading and
  trailing spaces when saved (and when read), so a value pasted with a stray
  space no longer breaks the request signature.
- Every text of the AI forum features (summarize thread, suggest reply,
  similar-discussion notice), the chat paste marker and the exported GIFT
  (question titles, model-answer comment, file name) comes from the language
  pack and follows the language of the Moodle user.
- All code comments, web service descriptions and tests are in English; the
  calendar feed download is named `course-<id>.ics`.
- Requests to the backend carry the language of the Moodle interface in the
  `Accept-Language` header, so its fixed messages (no indexed material, reindex
  errors) match the language the user sees.
- Full feature set: RAG-powered chat, semantic search, practice quizzes and
  flashcards, course calendar with `.ics` export, AI-assisted forums,
  teacher analytics dashboard, exam generator, weekly forum digest.
- Privacy API support (`plugin\provider` and `core_userlist_provider`) for
  admin-driven GDPR data requests, in addition to student self-service
  export/delete.
- Cross-database CI coverage (PostgreSQL and MySQL) against Moodle 4.1 LTS
  and 4.5.
