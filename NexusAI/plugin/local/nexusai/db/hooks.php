<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Hook callbacks registration for local_nexusai.
 *
 * Moodle 4.4 introdujo un nuevo sistema de hooks tipado (en lugar de los callbacks
 * basados en convención de nombres como `<plugin>_before_footer`). Este archivo
 * mapea hooks de core a clases listener nuestras.
 *
 * Sin esto, en Moodle 4.4+, el HTML que retorna `local_nexusai_before_footer()`
 * NO se imprime (solo se muestra un warning de deprecación).
 *
 * En Moodle 4.1-4.3 este archivo es ignorado y se usa el callback viejo de lib.php.
 *
 * Ref: https://moodledev.io/docs/4.4/apis/core/hooks
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$callbacks = [
    [
        'hook'     => \core\hook\output\before_footer_html_generation::class,
        'callback' => [\local_nexusai\hook\output\before_footer_listener::class, 'callback'],
        'priority' => 0,
    ],
];
