# Changelog

All notable changes to the NexusAI Moodle plugin are documented in this
file. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.17.10] — 2026-09-17

Initial submission to the Moodle Plugins directory.

- Full feature set: RAG-powered chat, semantic search, practice quizzes and
  flashcards, course calendar with `.ics` export, AI-assisted forums,
  teacher analytics dashboard, exam generator, weekly forum digest.
- Privacy API support (`plugin\provider` and `core_userlist_provider`) for
  admin-driven GDPR data requests, in addition to student self-service
  export/delete.
- Cross-database CI coverage (PostgreSQL and MySQL) against Moodle 4.1 LTS
  and 4.5.
