# Seguridad, capabilities y Privacy API

Resumen: Cómo NexusAI controla accesos (`require_login`, `has_capability`), qué capabilities define, cómo cumple con la Privacy API de Moodle, y las 8 buenas prácticas obligatorias al publicar un plugin en producción.

## Contexto

Un plugin de IA que envía mensajes de alumnos a un LLM externo procesa datos personales. Moodle obliga a declarar esto explícitamente vía la Privacy API, además de usar el sistema de capabilities nativo para los permisos.

## 1. Capabilities — `db/access.php`

```php
<?php
defined('MOODLE_INTERNAL') || die();

$capabilities = [
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
    'local/nexusai:manage' => [
        'riskbitmask'  => RISK_CONFIG,
        'captype'      => 'write',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes'   => [
            'editingteacher' => CAP_ALLOW,
            'manager'        => CAP_ALLOW,
        ],
    ],
    'local/nexusai:reindex' => [
        'riskbitmask'  => RISK_DATALOSS,
        'captype'      => 'write',
        'contextlevel' => CONTEXT_COURSE,
        'archetypes'   => [
            'editingteacher' => CAP_ALLOW,
            'manager'        => CAP_ALLOW,
        ],
    ],
];
```

Uso desde PHP:

```php
require_login($course);
$context = context_course::instance($COURSE->id);
require_capability('local/nexusai:use', $context);
```

## 2. Settings administrativos — `settings.php`

```php
<?php
defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_nexusai',
        get_string('pluginname', 'local_nexusai'));
    $ADMIN->add('localplugins', $settings);

    $settings->add(new admin_setting_configtext(
        'local_nexusai/backendurl',
        get_string('setting_backendurl', 'local_nexusai'),
        get_string('setting_backendurl_desc', 'local_nexusai'),
        'https://api.nexusai.example.com'
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_nexusai/shared_secret',
        get_string('setting_secret', 'local_nexusai'),
        get_string('setting_secret_desc', 'local_nexusai'),
        ''
    ));
}
```

Los valores se almacenan en `{config_plugins}` y se recuperan con:

```php
$secret = get_config('local_nexusai', 'shared_secret');
```

## 3. Privacy API — obligatoria

`classes/privacy/provider.php` declara todos los datos personales que el plugin maneja. Sin esto, el plugin no pasa code review en Moodle.org.

```php
<?php
namespace local_nexusai\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\writer;

class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\plugin\provider {

    public static function get_metadata(collection $collection): collection {
        $collection->add_database_table('local_nexusai_messages', [
            'userid'      => 'privacy:metadata:messages:userid',
            'courseid'    => 'privacy:metadata:messages:courseid',
            'message'     => 'privacy:metadata:messages:message',
            'response'    => 'privacy:metadata:messages:response',
            'timecreated' => 'privacy:metadata:messages:timecreated',
        ], 'privacy:metadata:messages');

        // Declarar el proveedor de LLM como ubicación externa de datos personales.
        // En el MVP usamos Gemini 2.5 Flash (tier gratuito). En producción se escala
        // a un proveedor pago (GPT-4o-mini u equivalente). El proveedor activo se
        // configura vía variable de entorno en el backend — el plugin PHP no lo hardcodea.
        $collection->add_external_location_link('llm_provider', [
            'query'   => 'privacy:metadata:llm:query',
            'context' => 'privacy:metadata:llm:context',
        ], 'privacy:metadata:llm');

        return $collection;
    }

    // + get_contexts_for_userid, export_user_data, delete_data_for_all_users_in_context, etc.
}
```

Importante: Los mensajes enviados al proveedor de LLM son una ubicación externa de datos personales. Hay que declararla explícitamente con `add_external_location_link()`. El nombre `llm_provider` es genérico a propósito — no atamos la Privacy API a un proveedor específico.

## 4. Las 8 buenas prácticas imprescindibles

Extraído de la guía técnica base y validado con plugins en producción:

1. **Privacy API obligatoria** — implementar `\core_privacy\local\metadata\provider` declarando todos los datos personales (historial, consultas, IDs).
2. **Nunca `$_GET` / `$_POST` directos** — siempre `required_param($name, PARAM_INT)` u `optional_param()` con constantes `PARAM_*` (`PARAM_TEXT`, `PARAM_INT`, `PARAM_ALPHANUM`, etc.).
3. **Estilo de código Moodle estricto** — 4 espacios (nunca tabs), variables en minúsculas, comillas simples para strings sin variables, llaves siempre requeridas. Validar con `local_codechecker`.
4. **Rate limiting por usuario** — tabla `{local_nexusai_usage}` con consultas diarias por alumno. Protege costos del proveedor de LLM y previene abuso.
5. **Manejo de errores graceful** — cuando el backend Python no responde, mensaje amigable. Nunca `die()` o `exit()` — siempre `throw new moodle_exception('backenderror', 'local_nexusai');`.
6. **Logging con Events API** — eventos custom por cada interacción con la IA para auditoría.
7. **Testing automatizado** — PHPUnit para lógica de negocio, Behat para flujos de usuario. Mockear el proveedor de LLM para tests determinísticos.
8. **`thirdpartylibs.xml` obligatorio** — declarar React, Webpack y cualquier otra lib incluida con nombre, versión y licencia.

## 5. Riesgos y mitigaciones (para la defensa del jurado)

| Riesgo | Mitigación |
|---|---|
| API key del proveedor de LLM expuesta al navegador | Patrón Hybrid PHP Proxy: la key vive solo en FastAPI como variable de entorno. Ver `05-backend-fastapi/autenticacion-hmac.md`. |
| Acceso cruzado entre cursos | Filtrado por `course_id` en PostgreSQL (pgvector) + `has_capability` por contexto de curso. |
| Alumnos ven respuestas de otros | Campo `userid` en `{local_nexusai_messages}` + filtrado en el External function. |
| Prompt injection vía material del curso | Estructurar el prompt con delimitadores explícitos y system prompt firme. |
| Alumno intenta saltearse `require_login` | `require_login($course)` como primera línea de toda external function. |
| Cambio de proveedor de LLM | El backend abstrae el proveedor detrás de una interfaz `LLMProvider`. Cambiar de Gemini a GPT-4o-mini es solo cambio de configuración (variable de entorno), sin tocar código. |

## Decisiones tomadas para NexusAI

- Tres capabilities: `use` (alumnos), `manage` (docentes — settings del curso), `reindex` (docentes — dispara reindexación).
- Shared secret PHP↔Python guardado en settings con `admin_setting_configpasswordunmask`.
- Privacy API desde el Sprint 1, no al final. Es obligatoria y dejarla para el cierre genera deuda.
- Rate limiting en el MVP: 50 consultas/día por alumno, configurable por el docente.
- La Privacy API declara el proveedor de LLM de forma genérica (`llm_provider`), no atada a OpenAI ni a ningún proveedor específico. En el MVP es Gemini 2.5 Flash; en producción puede ser cualquier proveedor compatible.

## Abierto / pendiente

- [ ] Definir el límite exacto de rate limiting con Leandro.
- [ ] Revisar si necesitamos una capability extra para ver analytics (post-MVP).
- [ ] Armar la matriz de threats completa para el informe MVP.

## Referencias

- [Moodle Developer Resources — Capabilities](https://moodledev.io/docs/apis/subsystems/access)
- [Moodle Developer Resources — Privacy API](https://moodledev.io/docs/apis/subsystems/privacy)
- [Moodle Coding style](https://moodledev.io/general/development/policies/codingstyle)
- [local_codechecker](https://moodle.org/plugins/local_codechecker)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
