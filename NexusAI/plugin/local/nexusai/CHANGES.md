# Changelog

All notable changes to the NexusAI Moodle plugin are documented in this
file. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.18.1] — 2026-09-20

Initial submission to the Moodle Plugins directory. Maturity: beta.

- Fixed: the Materials page failed on a fresh install with "Call to undefined
  function local_nexusai_frontend_lang()" because `lib.php` was not loaded.
- Document downloads read their parameters through `optional_param()`
  instead of `$_GET`.
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
