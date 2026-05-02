# Hooks, APIs internas y acceso a datos de Moodle

Resumen: Cómo inyectamos el widget (`before_footer()`), cómo accedemos a datos del curso desde el plugin (`$DB`, `$COURSE`, file storage), y cómo el backend Python puede opcionalmente consumir datos de Moodle vía Web Services REST.

## Contexto

El plugin necesita: (1) inyectarse en cada página, (2) leer material del curso (PDFs) para indexarlos, (3) exponer un endpoint AJAX que React pueda llamar, (4) opcionalmente permitir al backend Python consultar datos de Moodle.

## 1. Inyección del widget con `before_footer()`

`lib.php` declara el callback que Moodle invoca en cada request:

```php
<?php
defined('MOODLE_INTERNAL') || die();

function local_nexusai_before_footer() {
    global $PAGE, $USER, $COURSE;

    if (!isloggedin() || isguestuser()) {
        return '';
    }
    if ($COURSE->id <= 1) {
        return ''; // No mostrar en la página principal del sitio
    }

    $context = context_course::instance($COURSE->id);
    if (!has_capability('local/nexusai:use', $context)) {
        return '';
    }

    $PAGE->requires->js_call_amd('local_nexusai/chatwidget', 'init', [
        'courseid' => $COURSE->id,
        'userid'   => $USER->id,
        'sesskey'  => sesskey(),
    ]);

    return '<div id="local-nexusai-container"></div>';
}
```

Puntos clave:

- Moodle llama automáticamente a todas las funciones `local_*_before_footer()` registradas.
- Desde Moodle 3.10, debe retornar HTML como string.
- Pasa `courseid` + `userid` + `sesskey` al bundle React como parámetros de inicialización.
- Este callback es compatible con todo el rango Moodle 4.1–4.5. Para 4.3+ existe la Hooks API (PSR-14), pero no la adoptamos en el MVP — ver `compatibilidad-4.1-4.5.md`.

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

- Inyección vía `before_footer()` con validación de `isloggedin()`, `isguestuser()` y capability `local/nexusai:usechat`. Compatible con Moodle 4.1–4.5 sin detección de versión.
- Acceso a archivos del curso desde PHP (no desde Python) para respetar el framework de seguridad de Moodle. PHP extrae el PDF y lo envía al backend vía HMAC para su procesamiento e indexación en ChromaDB. Ver `arquitectura-plugin-detallada.md`.
- No habilitar Web Services REST en el MVP para la comunicación Moodle → FastAPI: el plugin actúa como proxy interno y no requiere tokens externos.

## Abierto / pendiente

- [ ] Evaluar si `get_fast_modinfo()` (desde PHP) o `core_course_get_contents()` (desde Python) es el método preferido para el listado inicial de materiales.

## Referencias

- [Moodle Developer Resources — Callbacks](https://moodledev.io/docs/apis/core/hooks)
- [Moodle Developer Resources — Data manipulation API ($DB)](https://moodledev.io/docs/apis/core/dml)
- [Moodle Developer Resources — File API](https://moodledev.io/docs/apis/subsystems/files)
- [Moodle Developer Resources — Web services / External functions](https://moodledev.io/docs/apis/subsystems/external)

---

*Última actualización: 2026-05-02 — Marcos Bugliotti*
