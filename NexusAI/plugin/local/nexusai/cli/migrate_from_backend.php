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
 * CLI: bring the student data the NexusAI backend kept into Moodle (DATA-06).
 *
 * Run once, during the cut, with MIGRATION_EXPORT_ENABLED on in the backend.
 * It can be interrupted and run again: it resumes where it stopped. At the end
 * it compares row counts and token sums per course and month with the backend.
 *
 * Usage:
 *   php local/nexusai/cli/migrate_from_backend.php [--limit=500] [--force]
 *   php local/nexusai/cli/migrate_from_backend.php --verify
 *   php local/nexusai/cli/migrate_from_backend.php --status
 *   php local/nexusai/cli/migrate_from_backend.php --reset
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('CLI_SCRIPT', true);

require(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/clilib.php');

use local_nexusai\external\backend_client;
use local_nexusai\local\migration_importer;

[$options, $unrecognised] = cli_get_params(
    ['limit' => 500, 'force' => false, 'verify' => false, 'status' => false, 'reset' => false, 'help' => false],
    ['h' => 'help']
);

if ($unrecognised || $options['help']) {
    cli_writeln("Bring the student data of the NexusAI backend into Moodle.\n");
    cli_writeln("Options:");
    cli_writeln("  --limit=N   Rows per request to the backend (1..1000, default 500).");
    cli_writeln("  --force     Start even if the plugin's tables already have rows.");
    cli_writeln("  --verify    Only compare counts and token sums with the backend.");
    cli_writeln("  --status    Show the saved progress.");
    cli_writeln("  --reset     Forget the progress (the imported rows stay).");
    exit($unrecognised ? 1 : 0);
}

/**
 * Prints the progress of every table.
 *
 * @param array $state Migration progress.
 */
function local_nexusai_print_state(array $state): void {
    foreach ($state['tables'] as $table => $p) {
        $skipped = [];
        foreach ($p['skipped'] as $reason => $count) {
            $skipped[] = "{$reason} {$count}";
        }
        cli_writeln(sprintf(
            '  %-22s %-8s read %d, imported %d, already there %d, skipped %d%s, %.1f s',
            $table,
            $p['done'] ? 'done' : 'pending',
            $p['read'],
            $p['imported'],
            $p['existing'],
            array_sum($p['skipped']),
            $skipped ? ' (' . implode(', ', $skipped) . ')' : '',
            $p['seconds']
        ));
    }
}

if ($options['reset']) {
    migration_importer::reset();
    cli_writeln('Progress forgotten. The rows already imported stay in the tables.');
    exit(0);
}

if ($options['status']) {
    local_nexusai_print_state(migration_importer::state());
    exit(0);
}

$client = new backend_client();
$client->set_role('system');

if (!$options['verify']) {
    $limit = max(1, min(1000, (int) $options['limit']));
    $state = migration_importer::state();
    $started = array_filter(array_column($state['tables'], 'read'));
    $nonempty = migration_importer::non_empty_tables();
    if (!$started && $nonempty && !$options['force']) {
        cli_error("These tables already have rows: " . implode(', ', $nonempty) .
            ".\nThe verification assumes they start empty. Use --force to go on anyway.");
    }

    $start = microtime(true);
    $importer = new migration_importer(
        static function (string $table, ?string $after, int $limit) use ($client): array {
            return $client->migration_export($table, $after, $limit);
        },
        static function (string $line): void {
            cli_writeln($line);
        }
    );
    $state = $importer->run($limit);
    cli_writeln(sprintf("\nImport finished in %.1f s:", microtime(true) - $start));
    local_nexusai_print_state($state);
}

cli_writeln("\nComparing with the backend...");
$differences = migration_importer::compare(
    $client->migration_summary(),
    migration_importer::local_summary(),
    migration_importer::state()
);
if ($differences) {
    cli_writeln("The data does NOT match:");
    foreach ($differences as $difference) {
        cli_writeln("  - {$difference}");
    }
    exit(1);
}
cli_writeln('Row counts and token sums per course and month match (skipped rows included).');

$off = [];
foreach ($DB->get_fieldset_sql('SELECT DISTINCT courseid FROM {local_nexusai_chat_sessions}') as $courseid) {
    if (!\local_nexusai\local\course_guard::is_enabled((int) $courseid)) {
        $off[] = (int) $courseid;
    }
}
if ($off) {
    cli_writeln("\nCourses with chats where NexusAI is off: " . implode(', ', $off) .
        ".\nTurn them on with cli/enable_course.php when their teachers ask for it.");
}
exit(0);
