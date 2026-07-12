<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Event observer registration for local_nexusai.
 *
 * Registra los observadores de eventos de Moodle. Cuando un docente sube un
 * recurso compatible (PDF, DOCX, PPTX, XLSX, CSV, MD, HTML, TXT) a un módulo
 * del curso, el observer lo detecta y lo envía al backend NexusAI para
 * indexación automática.
 *
 * Esto complementa la carga manual desde la vista docente (/documents.php):
 * con este observer, cualquier recurso que el docente suba desde la interfaz
 * estándar de Moodle (Agregar actividad → Archivo) también se indexa.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$observers = [
    [
        'eventname'    => '\core\event\course_module_created',
        'callback'     => '\local_nexusai\observer::course_module_created',
        'includefile'  => null,
        'internal'     => false,
        'priority'     => 0,
    ],

    // Foros — Épica 06: indexar posts al crear/editar/borrar.
    // En Moodle 5.x crear una nueva discusión dispara discussion_created (NO post_created).
    // post_created solo dispara para respuestas a discusiones existentes.
    [
        'eventname'   => '\mod_forum\event\discussion_created',
        'callback'    => '\local_nexusai\observer::forum_discussion_created',
        'includefile' => null,
        'internal'    => false,
        'priority'    => 200,
    ],
    [
        'eventname'   => '\mod_forum\event\post_created',
        'callback'    => '\local_nexusai\observer::forum_post_created',
        'includefile' => null,
        'internal'    => false,
        'priority'    => 200,
    ],
    [
        'eventname'   => '\mod_forum\event\post_updated',
        'callback'    => '\local_nexusai\observer::forum_post_updated',
        'includefile' => null,
        'internal'    => false,
        'priority'    => 200,
    ],
    [
        'eventname'   => '\mod_forum\event\post_deleted',
        'callback'    => '\local_nexusai\observer::forum_post_deleted',
        'includefile' => null,
        'internal'    => false,
        'priority'    => 200,
    ],
];
