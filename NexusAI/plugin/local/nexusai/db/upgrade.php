<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Upgrade steps para local_nexusai.
 *
 * Primer upgrade.php del plugin — hasta CAL-07 el schema solo tenía la tabla
 * placeholder original y nunca hizo falta un paso de upgrade real.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

function xmldb_local_nexusai_upgrade(int $oldversion): bool {
    global $DB;

    $dbman = $DB->get_manager();

    if ($oldversion < 2026090601) {
        // CAL-07 (#377): tabla de tokens revocables para el feed .ics suscribible.
        $table = new xmldb_table('local_nexusai_calendar_feed');

        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE);
        $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null);
        $table->add_field('token', XMLDB_TYPE_CHAR, '40', null, XMLDB_NOTNULL, null);
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null);

        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_key('userid_unique', XMLDB_KEY_UNIQUE, ['userid']);
        $table->add_index('token', XMLDB_INDEX_UNIQUE, ['token']);

        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        upgrade_plugin_savepoint(true, 2026090601, 'local', 'nexusai');
    }

    return true;
}
