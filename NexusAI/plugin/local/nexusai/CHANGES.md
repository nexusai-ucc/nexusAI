# Changelog

All notable changes to the NexusAI Moodle plugin are documented in this
file. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.19.0] — Unreleased

- New: the plugin's own tables for the student data (DATA-03). Fifteen
  `local_nexusai_*` tables are created on install and upgrade: the eleven that
  will receive the data the NexusAI backend keeps today (chat, interaction
  metrics, votes, unanswered questions, quiz attempts and errors, flashcards and
  their reviews, calendar reminders, forum webhooks) and four new ones (usage
  per user, question bank, bank use and teacher exams); `local_nexusai_course`
  gains an unused `features` column. They stay empty for now: nothing changes
  for users until the plugin starts using them and the data is migrated.
- Changed: the Privacy API provider covers the new tables (contexts and users
  found with SQL, export and deletion; usage and interaction metrics are
  anonymised instead of deleted, including rows that only carry the backend's
  hash of the user id) and the three user preferences, and keeps exporting and
  deleting what is still in the backend. The calendar feed token is never
  exported.
- Changed: the minimum is now **Moodle 4.5 LTS** (build 2024100700), and 4.5
  to 5.2 are supported (the UCC runs 5.0). The external functions use the
  `core_external` classes instead of the legacy aliases from `externallib.php`,
  and the old `local_nexusai_before_footer()` callback for Moodle 4.1-4.3 is
  gone (the widget uses the hooks API). CI runs on 4.5 (PostgreSQL and MySQL),
  5.0 and 5.2. No visible change for users.
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
- New: every request that reads course material (chat, stream, search, quiz,
  summaries, forum reply suggestions) now carries `visible_cmids`, the list of
  activities the logged-in user can see, worked out on the server from Moodle
  visibility (eye icon, hidden section, availability restrictions, role). The
  backend answers only from material of those activities. Teachers see hidden
  ones; a teacher who switches role to student sees what a student sees.
  Needs the backend from the same release: it rejects requests without the
  list.
- Changed: everything uploaded from NexusAI now becomes a real "File"
  activity in the unit the teacher chooses (there is no "unassigned" any more),
  so Moodle decides who sees it. The upload dialog has a "Visible to students"
  switch, on by default, that maps to the activity's eye icon; hidden material
  is not announced to students. It checks `moodle/course:manageactivities`,
  `mod/resource:addinstance` and Moodle's maximum file size first, and if the
  backend refuses the file the activity is removed. The Materials table shows
  each document's unit, a link to its activity and whether it is visible,
  hidden or deleted. "Delete" became "Remove from NexusAI": it takes the
  document out of the index and leaves the activity in the course. Files added
  the native way still ask for confirmation, now indexed with their activity.
- New: the index follows the activity. Deleting a "File" activity in Moodle
  takes its document out of NexusAI (with its chunks and stored summaries), and
  replacing its file indexes it again. Renaming the activity or changing its
  visibility does not touch the index. Both respect the per-course switch and
  never interrupt Moodle if the backend fails. New observers for
  `course_module_deleted` and `course_module_updated`; the plugin version was
  bumped so they are picked up on upgrade.
- Changed: a source cited by NexusAI (chat, search, error review) now opens
  through the "File" activity it comes from (`document_download.php` takes the
  document id and redirects to `mod/resource/view.php`), so Moodle applies its
  own rules: a student who opens a hidden source gets Moodle's error, not the
  file. The plugin no longer keeps its own copy of uploaded files, and
  `pluginfile.php` serves nothing from the plugin (copies left by older versions
  were reachable by any student of the course). Replacing a document from
  NexusAI also replaces the file of its activity, so the classroom and the index
  show the same one.
- New: forum posts respect visibility too. Each indexed post stores its forum
  and, in separate-groups forums, the group of its discussion, and "similar
  posts" shows only posts from forums the user can see and from discussions
  without a group or of one of the user's groups (whoever can access all groups
  sees all). Posts indexed before this release are not shown until they are
  indexed again.

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
