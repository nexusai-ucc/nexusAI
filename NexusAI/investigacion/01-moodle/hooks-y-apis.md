# Hooks, APIs internas y acceso a datos de Moodle

> **Resumen:** Cómo inyectamos el widget (`before_footer()`), cómo accedemos a datos del curso desde el plugin (`$DB`, `$COURSE`, file storage), y cómo el backend Python puede opcionalmente consumir datos de Moodle vía Web Services REST.

---

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

## 2. Variables globales y acceso a la base de datos

Moodle expone datos vía globals declaradas explícitamente:

```php
global $DB, $USER, $COURSE, $PAGE, $CFG;
```

`$DB` provee la API de manipulación de datos. **Las tablas nunca llevan el prefijo `mdl_` en las llamadas API** — se usan llaves `{}`:

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

## 3. Obtener PDFs de un curso para indexar en ChromaDB

Moodle almacena archivos de forma deduplicada por hash SHA-1 en `$CFG->dataroot/filedir/`. La tabla `{files}` contiene los metadatos.

```php
$modinfo   = get_fast_modinfo($COURSE);   // Cacheado, es la forma eficiente
$resources = $modinfo->get_instances_of('resource');
$fs        = get_file_storage();

foreach ($resources as $cm) {
    $context = context_module::instance($cm->id);
    $files = $fs->get_area_files(
        $context->id, 'mod_resource', 'content', 0, 'sortorder', false
    );
    foreach ($files as $file) {
        if ($file->get_mimetype() === 'application/pdf') {
            $content  = $file->get_content();  // Binario del PDF
            $filename = $file->get_filename();
            // Enviar al backend Python para indexar en ChromaDB
        }
    }
}
```

Cada archivo se identifica por `contextid + component + filearea + itemid`.

## 4. External functions — endpoint AJAX seguro

`db/services.php` registra la función:

```php
<?php
defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_nexusai_send_message' => [
        'classname'     => 'local_nexusai\external\send_message',
        'description'   => 'Enviar mensaje al asistente IA',
        'type'          => 'write',
        'ajax'          => true,          // Habilita llamadas desde core/ajax
        'loginrequired' => true,
    ],
];
```

El flag `'ajax' => true` es clave: permite que el JavaScript del frontend llame a esta función vía `core/ajax` sin gestionar tokens manualmente, usando la sesión autenticada del usuario.

## 5. Web Services REST para acceso externo (opcional)

Si quisiéramos que el backend Python consulte Moodle directamente (por ejemplo, para traer el listado de materiales de un curso), se habilita REST en **Admin → Funciones avanzadas → Habilitar servicios web** y se genera un token:

```python
import requests

MOODLE_URL = "https://moodle.universidad.edu"
TOKEN = "token_generado_en_moodle"

def moodle_api(function, **kwargs):
    params = {
        'wstoken': TOKEN,
        'wsfunction': function,
        'moodlewsrestformat': 'json',
        **kwargs,
    }
    return requests.post(
        f"{MOODLE_URL}/webservice/rest/server.php",
        data=params,
    ).json()

contents = moodle_api('core_course_get_contents', courseid=5)
for section in contents:
    for module in section.get('modules', []):
        for content in module.get('contents', []):
            if content['filename'].endswith('.pdf'):
                url = f"{content['fileurl']}&token={TOKEN}"
                pdf_data = requests.get(url).content
```

## Decisiones tomadas para NexusAI

- **Inyección vía `before_footer()`** con validación de `isloggedin()`, `isguestuser()` y capability `local/nexusai:use`.
- **Acceso a archivos del curso desde PHP** (no desde Python) para respetar el framework de seguridad de Moodle. PHP extrae el PDF y lo envía al backend por HMAC.
- **No habilitar Web Services REST** en el MVP: simplifica el despliegue en la facu (menos permisos admin que pedir) y evita manejar tokens de larga vida.

## Abierto / pendiente

- [ ] Definir esquema de tablas propias (`local_nexusai_messages`, `local_nexusai_indexed_files`, etc.) en `db/install.xml`.
- [ ] Evaluar si usamos `get_fast_modinfo()` o `core_course_get_contents()` para el listado inicial de materiales.

## Referencias

- [Moodle Developer Resources — Callbacks](https://moodledev.io/docs/apis/plugintypes/local#callbacks)
- [Moodle Developer Resources — Data manipulation API (`$DB`)](https://moodledev.io/docs/apis/core/dml)
- [Moodle Developer Resources — File API](https://moodledev.io/docs/apis/subsystems/file)
- [Moodle Developer Resources — Web services / External functions](https://moodledev.io/docs/apis/subsystems/external)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
