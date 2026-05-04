<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Capability definitions for local_nexusai.
 *
 * Cada capability define QUIÉN puede hacer QUÉ dentro del plugin.
 * Moodle las usa con `has_capability()` en PHP y permite a los admins ajustarlas
 * por rol desde Site administration → Users → Permissions → Define roles.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$capabilities = [

    // Permite ver y usar el chat de NexusAI dentro de un curso.
    // Por defecto: estudiantes, profesores y administradores.
    'local/nexusai:use' => [
        'captype'      => 'read',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes'   => [
            'student'        => CAP_ALLOW,
            'teacher'        => CAP_ALLOW,
            'editingteacher' => CAP_ALLOW,
            'manager'        => CAP_ALLOW,
        ],
    ],

    // Permite gestionar materiales del curso para indexación (subir PDFs,
    // re-indexar, ver el estado del pipeline RAG).
    // Por defecto: solo profesores y admins.
    'local/nexusai:manage' => [
        'captype'      => 'write',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes'   => [
            'editingteacher' => CAP_ALLOW,
            'manager'        => CAP_ALLOW,
        ],
    ],

    // Permite ver el dashboard de analytics agregado de un curso (lagunas
    // de aprendizaje, preguntas frecuentes, etc.).
    // Post-MVP, pero la dejamos definida para no migrar después.
    'local/nexusai:viewanalytics' => [
        'captype'      => 'read',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes'   => [
            'editingteacher' => CAP_ALLOW,
            'manager'        => CAP_ALLOW,
        ],
    ],
];
