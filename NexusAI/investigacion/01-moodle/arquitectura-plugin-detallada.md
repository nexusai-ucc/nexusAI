# Arquitectura interna detallada del plugin local_nexusai

> **Resumen (3 líneas):** Documento de referencia de implementación del plugin `local_nexusai`: esquemas XMLDB, capacidades RBAC, registro de web services, patrón de renderizado con Mustache, la clase proxy PHP que firma HMAC y envía a FastAPI, y la tarea programada de sincronización de materiales. Complementa `plugin-development.md` (elección del tipo) y `hooks-y-apis.md` (patrones de acceso a datos).

---

## Contexto

Con el tipo de plugin elegido (`local_`) y los patrones de acceso definidos, este documento cierra el ciclo implementando cada artefacto de código concreto. Cubre la capa de datos, seguridad, comunicación con el backend y la ingesta de materiales del curso para RAG.

---

## Esquema de base de datos (`db/install.xml`)

El motor XMLDB genera DDL independiente del gestor subyacente (PostgreSQL, MariaDB, MySQL). No persiste el historial de chat —eso lo delega a la API de sesiones de Nexus AI— pero sí necesita dos tablas locales:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<XMLDB PATH="local/nexusai/db" VERSION="20260502"
       COMMENT="Esquema para local_nexusai">
  <TABLES>

    <!-- Rate limiting y auditoría por usuario/curso -->
    <TABLE NAME="local_nexusai_logs" COMMENT="Telemetría y consumo de tokens">
      <FIELDS>
        <FIELD NAME="id"         TYPE="int"  LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
        <FIELD NAME="userid"     TYPE="int"  LENGTH="10" NOTNULL="true" DEFAULT="0"
               COMMENT="FK a mdl_user"/>
        <FIELD NAME="courseid"   TYPE="int"  LENGTH="10" NOTNULL="true" DEFAULT="0"
               COMMENT="Contexto del curso"/>
        <FIELD NAME="session_id" TYPE="char" LENGTH="255" NOTNULL="true"
               COMMENT="ID de sesión en la API de Nexus AI"/>
        <FIELD NAME="token_usage" TYPE="int" LENGTH="10" NOTNULL="false" DEFAULT="0"
               COMMENT="Tokens consumidos (para rate limiting)"/>
        <FIELD NAME="timecreated" TYPE="int" LENGTH="10" NOTNULL="true"
               COMMENT="Marca de tiempo UNIX"/>
      </FIELDS>
      <KEYS>
        <KEY NAME="primary"  TYPE="primary" FIELDS="id"/>
        <KEY NAME="userid_fk" TYPE="foreign" FIELDS="userid" REFTABLE="user" REFFIELDS="id"/>
      </KEYS>
      <INDEXES>
        <INDEX NAME="course_user_idx" UNIQUE="false" FIELDS="courseid, userid"/>
      </INDEXES>
    </TABLE>

    <!-- Historial local (opcional, si no se delega 100% a Nexus AI sessions) -->
    <TABLE NAME="local_nexusai_chats" COMMENT="Historial de conversaciones RAG">
      <FIELDS>
        <FIELD NAME="id"          TYPE="int"  LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
        <FIELD NAME="userid"      TYPE="int"  LENGTH="10" NOTNULL="true" COMMENT="FK a mdl_user"/>
        <FIELD NAME="courseid"    TYPE="int"  LENGTH="10" NOTNULL="true" COMMENT="FK a mdl_course"/>
        <FIELD NAME="query"       TYPE="text" NOTNULL="true"  COMMENT="Pregunta del estudiante"/>
        <FIELD NAME="response"    TYPE="text" NOTNULL="false" COMMENT="Respuesta del LLM"/>
        <FIELD NAME="timecreated" TYPE="int"  LENGTH="10" NOTNULL="true"/>
      </FIELDS>
      <KEYS>
        <KEY NAME="primary"   TYPE="primary" FIELDS="id"/>
        <KEY NAME="fk_user"   TYPE="foreign" FIELDS="userid"   REFTABLE="user"   REFFIELDS="id"/>
        <KEY NAME="fk_course" TYPE="foreign" FIELDS="courseid" REFTABLE="course" REFFIELDS="id"/>
      </KEYS>
      <INDEXES>
        <INDEX NAME="idx_time" UNIQUE="false" FIELDS="timecreated"/>
      </INDEXES>
    </TABLE>

  </TABLES>
</XMLDB>
```

---

## Capacidades RBAC (`db/access.php`)

La gestión de permisos opera a través de contextos topológicos (Sistema → Categoría → Curso → Módulo). El asistente debe ser accesible a estudiantes a nivel de curso, pero su configuración restringida a administradores a nivel sistema.

```php
<?php
defined('MOODLE_INTERNAL') || die();

$capabilities = [
    // Estudiantes: habilitar la interfaz de chat
    'local/nexusai:usechat' => [
        'riskbitmask'  => 0,
        'captype'      => 'read',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes'   => [
            'student' => CAP_ALLOW,
            'teacher' => CAP_ALLOW,
        ],
    ],

    // Admins: definir URL del backend, clave HMAC, parámetros RAG
    'local/nexusai:manageconfig' => [
        'riskbitmask'  => RISK_CONFIG,  // Previene escalada de privilegios
        'captype'      => 'write',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes'   => [
            'manager' => CAP_ALLOW,
        ],
    ],
];
```

---

## Registro de web services (`db/services.php`)

El flag `'ajax' => true` instruye a Moodle a aceptar solicitudes XHR autenticadas vía la cookie de sesión (`sesskey`), sin requerir tokens estáticos en el navegador.

```php
<?php
defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_nexusai_send_message' => [
        'classname'   => 'local_nexusai\external\chat_api',
        'methodname'  => 'send_message',
        'description' => 'Enviar mensaje al asistente IA y obtener respuesta',
        'type'        => 'write',
        'ajax'        => true,           // Llamadas desde core/ajax con sesión activa
        'loginrequired' => true,
    ],
];
```

---

## Hooks API PSR-14 (`db/hooks.php`) — alternativa para Moodle 4.3+

Moodle 4.3+ introduce la API de Hooks basada en el estándar PSR-14, implementando el patrón Dispatcher-Listener con inyección de dependencias. Es el sucesor del callback `before_footer()` (que sigue funcionando pero se considera legado desde 4.3).

```php
<?php
defined('MOODLE_INTERNAL') || die();

$callbacks = [
    [
        'hook'     => \core\hook\output\before_footer_html_generation::class,
        'callback' => \local_nexusai\hook_callbacks::class . '::inject_widget',
    ],
];
```

```php
<?php
// classes/hook_callbacks.php
namespace local_nexusai;

class hook_callbacks {
    public static function inject_widget(
        \core\hook\output\before_footer_html_generation $hook
    ): void {
        global $PAGE, $USER, $COURSE;

        if (!isloggedin() || isguestuser() || $COURSE->id <= 1) {
            return;
        }
        $context = \context_course::instance($COURSE->id);
        if (!has_capability('local/nexusai:usechat', $context)) {
            return;
        }

        // Renderizar widget vía Mustache (ver sección siguiente)
        $renderer = $PAGE->get_renderer('local_nexusai');
        $hook->add_html($renderer->render_from_template(
            'local_nexusai/widget',
            ['courseid' => $COURSE->id, 'userid' => $USER->id, 'uniqid' => uniqid()]
        ));
    }
}
```

> **Nota MVP:** En el MVP se usa `before_footer()` en `lib.php` por compatibilidad con el rango 4.1–4.5. La Hooks API se activa en versiones 4.3+. Ver `compatibilidad-4.1-4.5.md`.

---

## Inyección de UI con Mustache (`lib.php` + `templates/widget.mustache`)

La plantilla Mustache desacopla presentación de lógica de backend. Las etiquetas `{{#js}}` garantizan que el JavaScript se ejecute después de que RequireJS esté completamente inicializado.

**`lib.php`** — función legado, compatible 4.1–4.5:

```php
<?php
defined('MOODLE_INTERNAL') || die();

function local_nexusai_before_footer() {
    global $PAGE, $USER, $COURSE;

    // 1. Verificación de sesión y contexto
    if (!isloggedin() || isguestuser() || $COURSE->id <= 1) {
        return '';
    }

    // 2. RBAC: verificar capacidad en el contexto del curso
    $context = context_course::instance($COURSE->id);
    if (!has_capability('local/nexusai:usechat', $context)) {
        return '';
    }

    // 3. Preparar variables para la plantilla
    $templatecontext = [
        'uniqid'   => uniqid(),
        'courseid' => $COURSE->id,
        'userid'   => $USER->id,
    ];

    // 4. Renderizar la plantilla Mustache
    $renderer = $PAGE->get_renderer('local_nexusai');
    return $renderer->render_from_template('local_nexusai/widget', $templatecontext);
}
```

**`templates/widget.mustache`** — contenedor DOM y carga asíncrona del bundle AMD:

```html
<div id="nexusai-container-{{uniqid}}" class="nexusai-floating-widget"></div>

{{#js}}
// Llamada asíncrona al módulo compilado por Webpack
require(['local_nexusai/chatwidget-lazy'], function(Widget) {
    Widget.init({
        uniqid:   '{{uniqid}}',
        courseid: {{courseid}},
        userId:   {{userid}}
    });
});
{{/js}}
```

El sufijo `-lazy` en el nombre del script instruye al optimizador de Moodle a **no** incluirlo en el primer volcado de JS (`first.js`), mejorando el tiempo de carga inicial de la página.

---

## Clase proxy PHP — `classes/external/chat_api.php`

Implementa el endpoint AJAX que actúa como intermediario seguro hacia FastAPI. Extiende `external_api` para validar parámetros con tipos estrictos y firmar la petición con HMAC-SHA256.

```php
<?php
namespace local_nexusai\external;

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;
use curl;

class chat_api extends external_api {

    /**
     * Define el contrato de entrada (tipos estrictos, sin superglobales).
     */
    public static function send_message_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT,  'ID del curso'),
            'prompt'   => new external_value(PARAM_TEXT, 'Mensaje del estudiante'),
            'session'  => new external_value(PARAM_ALPHANUMEXT, 'ID de sesión', VALUE_DEFAULT, ''),
        ]);
    }

    /**
     * Lógica de negocio: validar, firmar con HMAC y enrutar a FastAPI.
     */
    public static function send_message(int $courseid, string $prompt, string $session): array {
        global $USER;

        // 1. Validación exhaustiva de parámetros
        $params = self::validate_parameters(self::send_message_parameters(), [
            'courseid' => $courseid,
            'prompt'   => $prompt,
            'session'  => $session,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:usechat', $context);

        // 2. Recuperar credenciales desde mdl_config_plugins (nunca hardcoded)
        $apikey   = get_config('local_nexusai', 'nexus_api_key');
        $secret   = get_config('local_nexusai', 'shared_secret');
        $endpoint = get_config('local_nexusai', 'backendurl') . '/api/v1/chat/infer';

        // 3. Construir payload
        $payload = json_encode([
            'course_id' => $params['courseid'],
            'user_id'   => $USER->id,
            'content'   => $params['prompt'],
            'session'   => $params['session'],
        ]);

        // 4. Firma criptográfica HMAC-SHA256 con nonce (anti-replay)
        $timestamp        = time();
        $nonce            = bin2hex(random_bytes(16));
        $canonical        = "POST\n/api/v1/chat/infer\n{$timestamp}\n{$nonce}\n{$payload}";
        $signature        = base64_encode(hash_hmac('sha256', $canonical, $secret, true));

        // 5. Wrapper cURL nativo de Moodle — respeta $CFG->proxyhost y curlsecurityblockedhosts
        $curl = new curl();
        $curl->setHeader([
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apikey,
            'X-Nexus-Timestamp: ' . $timestamp,
            'X-Nexus-Nonce: ' . $nonce,
            'X-Nexus-Signature: ' . $signature,
        ]);
        $curl->setopt([
            'CURLOPT_CONNECTTIMEOUT' => 10,
            'CURLOPT_TIMEOUT'        => 120,
            'CURLOPT_RETURNTRANSFER' => true,
        ]);

        $response = $curl->post($endpoint, $payload);
        $info     = $curl->get_info();

        if ($info['http_code'] !== 200) {
            throw new \moodle_exception('nexusai_error', 'local_nexusai', '', $info['http_code']);
        }

        $decoded = json_decode($response, true);

        return [
            'status'     => 'success',
            'reply'      => $decoded['answer']     ?? '',
            'session_id' => $decoded['session_id'] ?? '',
        ];
    }

    /**
     * Define el contrato de salida.
     */
    public static function send_message_returns(): external_single_structure {
        return new external_single_structure([
            'status'     => new external_value(PARAM_TEXT, 'Estado de la respuesta'),
            'reply'      => new external_value(PARAM_RAW,  'Respuesta del LLM'),
            'session_id' => new external_value(PARAM_TEXT, 'ID de sesión para continuación'),
        ]);
    }
}
```

---

## Tarea programada de sincronización de materiales

Cron que escanea el árbol del curso con `get_fast_modinfo()` (cacheado, mínimo impacto en DB), extrae PDFs de módulos tipo `resource` y los envía a la Data Ingestion API para indexación RAG.

```php
<?php
/**
 * Tarea programada: sincronizar documentos del curso con el índice RAG.
 */
function local_nexusai_sync_materials(int $courseid): void {
    $modinfo   = get_fast_modinfo($courseid);
    $instances = $modinfo->get_instances_of('resource');
    $fs        = get_file_storage();

    foreach ($instances as $cm) {
        $context = \context_module::instance($cm->id);
        $files   = $fs->get_area_files(
            $context->id, 'mod_resource', 'content', 0, 'sortorder', false
        );

        foreach ($files as $file) {
            if ($file->get_mimetype() !== 'application/pdf') {
                continue;
            }

            $content_binary = $file->get_content();

            $metadata = [
                'source_system'   => 'moodle',
                'course_id'       => $courseid,
                'module_id'       => $cm->id,
                'document_name'   => $file->get_filename(),
                'last_modified'   => $file->get_timemodified(),
            ];

            // Envío a la Data Ingestion API (endpoint diferente al de chat)
            $ingest_url = get_config('local_nexusai', 'backendurl') . '/api/v1/ingest';
            // curl_post($ingest_url, $content_binary, $metadata); — implementación completa en sprint 3
        }
    }
}
```

---

## Privacy API (`classes/privacy/provider.php`)

Obligatoria para cumplimiento GDPR/FERPA: registra las entidades externas donde fluyen datos de usuarios y permite la purga total del historial.

```php
<?php
namespace local_nexusai\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;

class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\plugin\provider
{
    public static function get_metadata(collection $collection): collection {
        // Tabla local de logs
        $collection->add_database_table('local_nexusai_logs', [
            'userid'     => 'privacy:metadata:logs:userid',
            'courseid'   => 'privacy:metadata:logs:courseid',
            'session_id' => 'privacy:metadata:logs:session_id',
        ], 'privacy:metadata:logs');

        // API externa (Nexus AI / FastAPI)
        $collection->add_external_location_link('nexusai_backend', [
            'userid'   => 'privacy:metadata:backend:userid',
            'courseid' => 'privacy:metadata:backend:courseid',
            'content'  => 'privacy:metadata:backend:content',
        ], 'privacy:metadata:backend');

        return $collection;
    }

    public static function delete_data_for_user(approved_contextlist $contextlist): void {
        global $DB;
        foreach ($contextlist->get_contexts() as $context) {
            $DB->delete_records('local_nexusai_logs', ['userid' => $contextlist->get_user()->id]);
        }
        // También invocar la API de borrado de Nexus AI para eliminar vectores del usuario
    }
}
```

---

## Decisiones tomadas para NexusAI

- **XMLDB con dos tablas:** `local_nexusai_logs` para rate limiting y auditoría; `local_nexusai_chats` opcional si decidimos persistir historial localmente.
- **PSR-14 Hooks documentado** pero `before_footer()` en MVP por compatibilidad 4.1–4.5 completa.
- **Mustache + AMD lazy** para desacoplar presentación y optimizar el tiempo de carga.
- **`class curl` de Moodle** sin excepciones — respeta proxies y firewalls universitarios.
- **Nonce en firma HMAC** (anti-replay de peticiones duplicadas), además del timestamp.
- **Privacy API implementada desde el inicio** — requisito no negociable para aprobación institucional.

## Abierto / pendiente

- [ ] Definir si `local_nexusai_chats` se activa o se delega 100% a las sesiones de Nexus AI.
- [ ] Completar `local_nexusai_sync_materials()` con la llamada cURL real a la Data Ingestion API.
- [ ] Registrar la tarea programada en `db/tasks.php` con frecuencia diaria.
- [ ] Internacionalización: completar `lang/es/local_nexusai.php` con todas las claves privacy.

## Referencias

- [Moodle — XMLDB editor](https://moodledev.io/docs/apis/core/dml/ddl)
- [Moodle — Hooks API PSR-14](https://moodledev.io/docs/5.0/apis/core/hooks)
- [Moodle — External functions](https://moodledev.io/docs/apis/subsystems/external/functions)
- [Moodle — Privacy API](https://moodledev.io/docs/4.5/apis/subsystems/privacy)
- [Moodle — Mustache templates](https://moodledev.io/docs/guides/templates)

---

*Última actualización: 2026-05-02 — Marcos Bugliotti*
