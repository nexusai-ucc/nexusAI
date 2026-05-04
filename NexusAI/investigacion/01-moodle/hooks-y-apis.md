# Hooks, APIs internas y acceso a datos de Moodle

Resumen: Cómo inyectamos el widget (`before_footer()`), cómo accedemos a datos del curso desde el plugin (`$DB`, `$COURSE`, file storage), y cómo el backend Python puede opcionalmente consumir datos de Moodle vía Web Services REST.

## Contexto

El plugin necesita: (1) inyectarse en cada página, (2) leer material del curso (PDFs) para indexarlos, (3) exponer un endpoint AJAX que React pueda llamar, (4) opcionalmente permitir al backend Python consultar datos de Moodle.

## 1. Inyección del widget — dos sistemas según versión de Moodle

Moodle 4.4 introdujo un **Hook API tipado** (PSR-14) que **reemplaza** el sistema viejo de callbacks por convención de nombres. El callback viejo `<plugin>_before_footer()` sigue ejecutándose en 4.4+ por compatibilidad, **pero su valor de retorno ya no se imprime**: solo emite un debugging warning como `"Callback before_footer in local_nexusai component should be migrated to new hook callback"`. Verificado en Moodle 4.5 (build 2024042200) durante el Sprint 1.

Para soportar el rango completo Moodle 4.1–4.5, NexusAI implementa **ambos sistemas**:

| Versión Moodle | Sistema usado | Archivo |
|---|---|---|
| 4.1, 4.2, 4.3 | Legacy callback | `lib.php → local_nexusai_before_footer()` |
| 4.4, 4.5+ | Hook API nuevo | `db/hooks.php` + `classes/hook/output/before_footer_listener.php` |

### 1.a. Hook API nuevo (Moodle 4.4+)

`db/hooks.php` registra qué clases listener responden a qué hooks de core:

```php
<?php
defined('MOODLE_INTERNAL') || die();

$callbacks = [
    [
        'hook'     => \core\hook\output\before_footer_html_generation::class,
        'callback' => [\local_nexusai\hook\output\before_footer_listener::class, 'callback'],
        'priority' => 0,
    ],
];
```

`classes/hook/output/before_footer_listener.php` implementa el listener:

```php
<?php
namespace local_nexusai\hook\output;

defined('MOODLE_INTERNAL') || die();

use core\hook\output\before_footer_html_generation;

class before_footer_listener {
    public static function callback(before_footer_html_generation $hook): void {
        global $PAGE, $USER, $COURSE;

        if (!isloggedin() || isguestuser()) return;
        if (empty($COURSE->id) || $COURSE->id <= 1) return;

        $context = \context_course::instance($COURSE->id);
        if (!has_capability('local/nexusai:use', $context)) return;

        $PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init', [[
            'courseid' => (int) $COURSE->id,
            'userid'   => (int) $USER->id,
            'sesskey'  => sesskey(),
            'wwwroot'  => (string) (new \moodle_url('/'))->out(false),
            'lang'     => current_language(),
        ]]);

        // En el sistema nuevo se usa $hook->add_html() en lugar de retornar string.
        $hook->add_html('<div id="local-nexusai-container" data-plugin="nexusai"></div>');
    }
}
```

Diferencias clave vs el callback viejo:

- **Clase listener** en lugar de función global.
- **`$hook->add_html(...)`** en lugar de `return '<div>...';`.
- **Tipado** con la clase concreta del hook → IDE autocomplete, mejor refactor.
- **Registrado explícitamente** en `db/hooks.php` (ya no por convención de nombre).

### 1.b. Callback legacy (Moodle 4.1–4.3)

Para versiones anteriores al Hook API, mantenemos el callback viejo en `lib.php` con una guarda de versión que lo desactiva en 4.4+:

```php
<?php
defined('MOODLE_INTERNAL') || die();

function local_nexusai_before_footer(): string {
    global $CFG, $PAGE, $USER, $COURSE;

    // En Moodle 4.4+ usa el Hook API (db/hooks.php). Skip acá para no duplicar.
    if ((int)$CFG->version >= 2024041600) {
        return '';
    }

    // ---- Lógica para Moodle 4.1-4.3 ----
    if (!isloggedin() || isguestuser()) return '';
    if (empty($COURSE->id) || $COURSE->id <= 1) return '';

    $context = context_course::instance($COURSE->id);
    if (!has_capability('local/nexusai:use', $context)) return '';

    $PAGE->requires->js_call_amd('local_nexusai/chatwidget-lazy', 'init', [[
        'courseid' => (int) $COURSE->id,
        'userid'   => (int) $USER->id,
        'sesskey'  => sesskey(),
        'wwwroot'  => (string) (new moodle_url('/'))->out(false),
        'lang'     => current_language(),
    ]]);

    return '<div id="local-nexusai-container" data-plugin="nexusai"></div>';
}
```

Sin la guarda `$CFG->version >= 2024041600`, en Moodle 4.4+ se ejecutaría DOBLE inyección (una desde el listener y otra desde el callback legacy con warning de deprecación).

### Tabla resumen — qué hace cada versión

| Acción | Moodle 4.1-4.3 | Moodle 4.4+ |
|---|---|---|
| Lee `db/hooks.php` | ❌ ignorado | ✅ ejecuta listener |
| Llama `local_nexusai_before_footer()` | ✅ y usa el retorno | ✅ pero ignora el retorno + warning |
| HTML inyectado en footer | desde `return` de `lib.php` | desde `$hook->add_html()` del listener |

## 2. Variables globales y acceso a la base de datos

Moodle expone datos vía globals declaradas explícitamente:

```php
global $DB, $USER, $COURSE, $PAGE, $CFG;
```

`$DB` provee la API de manipulación de datos. Las tablas nunca llevan el prefijo `mdl_` en las llamadas API — se usan llaves `{}`:

```php
// Obtener un registro
$user = $DB->get_record('user', ['id' => 1], '*', MUST_EXIST);

// SQL con placeholders nombrados
$records = $DB->get_records_sql(
    'SELECT * FROM {local_nexusai_messages}
     WHERE userid = :uid AND courseid = :cid',
    ['uid' => $USER->id, 'cid' => $COURSE->id]
);

// Insertar (retorna el ID del nuevo registro)
$id = $DB->insert_record('local_nexusai_messages', (object)[
    'userid'      => $USER->id,
    'courseid'    => $COURSE->id,
    'message'     => $text,
    'timecreated' => time(),
]);
```

## 3. Obtener PDFs de un curso para indexar

Moodle almacena archivos de forma deduplicada por hash SHA-1 en `$CFG->dataroot/filedir/`. El método más eficiente para recorrer el árbol del curso es `get_fast_modinfo()` — está cacheado y minimiza el impacto en la base de datos.

El flujo de indexación es: PHP extrae el PDF → lo envía al backend FastAPI vía HMAC → FastAPI genera los chunks y embeddings → los almacena en ChromaDB.

> Implementación completa del cron de sincronización, con metadata para RAG y envío a la Data Ingestion API, en [`arquitectura-plugin-detallada.md`](arquitectura-plugin-detallada.md).

## 4. External functions — endpoint AJAX seguro

`db/services.php` registra las funciones externas del plugin con `'ajax' => true`, lo que permite al frontend llamarlas vía `core/ajax` usando la sesión autenticada del usuario — sin tokens estáticos en el navegador.

> Esquema completo de `db/services.php`, la clase `chat_api` que implementa el endpoint y el esquema XMLDB de las tablas en [`arquitectura-plugin-detallada.md`](arquitectura-plugin-detallada.md).

## 5. Consumo de Web Services REST desde Python (opcional)

Para que el backend Python consulte Moodle directamente (ej. traer la lista de materiales de un curso para indexación RAG), se habilita REST en Admin → Funciones avanzadas y se genera un token de servicio dedicado.

> Teoría completa del framework de Web Services, modelo de seguridad de tokens y ejemplo de código Python con `core_course_get_contents` en [`webservices-teoria.md`](webservices-teoria.md).

## Decisiones tomadas para NexusAI

- **Inyección dual** según versión: Hook API nuevo en Moodle 4.4+, callback legacy en 4.1–4.3, con detección automática vía `$CFG->version`. Validamos en ambos: `isloggedin()`, `!isguestuser()`, `$COURSE->id > 1`, capability `local/nexusai:use`.
- **Decisión actualizada (2026-05-04):** sí adoptamos Hook API nuevo. La decisión original de Marcos era usar solo el callback legacy, pero verificamos durante Sprint 1 que en Moodle 4.4+ el retorno del callback **no se imprime** (solo emite warning de deprecación) → la inyección no funciona sin Hook API.
- Acceso a archivos del curso desde PHP (no desde Python) para respetar el framework de seguridad de Moodle. PHP extrae el PDF y lo envía al backend vía HMAC para su procesamiento e indexación en pgvector. Ver `arquitectura-plugin-detallada.md`.
- No habilitar Web Services REST en el MVP para la comunicación Moodle → FastAPI: el plugin actúa como proxy interno y no requiere tokens externos.

## Abierto / pendiente

- [ ] Evaluar si `get_fast_modinfo()` (desde PHP) o `core_course_get_contents()` (desde Python) es el método preferido para el listado inicial de materiales.

## Referencias

- [Moodle Developer — Hook callbacks (4.4+)](https://moodledev.io/docs/4.4/apis/core/hooks)
- [Moodle Developer — Hook API migration guide](https://moodledev.io/docs/4.4/apis/core/hooks/migration)
- [Moodle Developer — Data manipulation API ($DB)](https://moodledev.io/docs/apis/core/dml)
- [Moodle Developer — File API](https://moodledev.io/docs/apis/subsystems/files)
- [Moodle Developer — Web services / External functions](https://moodledev.io/docs/apis/subsystems/external)
- Issue #126 — verificación end-to-end del skeleton (Sprint 1, 2026-05-04)

---

*Última actualización: 2026-05-04 — Delfina Salinas (revisado tras verificación end-to-end en Moodle 4.5)*
