# Desarrollo de plugins Moodle — elección del tipo `local`

Resumen: Moodle tiene más de 40 tipos de plugins. Para un asistente de chat IA embebido, evaluamos `local`, `block`, `mod`, `filter` y `auth`. Decidimos usar un plugin tipo `local` porque permite inyectar el widget en todas las páginas sin intervención del docente.

## Contexto

NexusAI necesita aparecer en todas las páginas del aula virtual, disponible para cualquier alumno autenticado, sin que el docente tenga que configurar nada por curso. La elección del tipo de plugin define lo que es posible arquitectónicamente.

## Convención Frankenstyle

Moodle identifica sus plugins con la convención `plugintype_pluginname`. Para NexusAI:

- `local_nexusai` — plugin principal tipo local
- `block_nexusai` (opcional, post-MVP) — si llegamos a necesitar configuración por curso

## Comparativa de tipos de plugin

| Tipo | Pros | Contras | Uso típico |
|---|---|---|---|
| `local` | Máxima flexibilidad. `before_footer()` inyecta HTML/JS en todas las páginas. Acceso a `$COURSE`, `$USER`, `$PAGE`. Puede definir web services, tareas programadas, observadores y settings admin. | No ofrece contenedor visual nativo como bloques. | Funcionalidad global, integraciones, chat flotante. |
| `block` | Contenedor visual listo en la barra lateral. Popular entre plugins de chat (`block_openai_chat`). | En Moodle 4.x con tema Boost, los bloques se ocultan en un drawer que el usuario abre manualmente. Cada docente lo agrega curso por curso. | Widgets de curso específico. |
| `mod` (activity module) | Integrado al curso como actividad. | Excesivo: requiere `mod_form.php`, registro en `course_modules`, el alumno navega explícitamente hasta la actividad. | Foros, tareas, quizzes evaluables. |
| `filter` | Transforma texto al vuelo. | No sirve para UI interactiva. | Conversión de fórmulas, multimedia. |
| `auth` | Gestión de login. | Fuera del alcance de un chat. | SSO, LDAP. |

## Decisión final: plugin `local` con widget flotante vía `before_footer()`

La función `local_nexusai_before_footer()` declarada en `lib.php` se ejecuta en cada carga de página del sitio después de la instalación, sin intervención del docente. Moodle la invoca automáticamente.

Este patrón es exactamente el que usan los proyectos más maduros del ecosistema (`local_ai_course_assistant` de Saylor, `block_ai_chat` + `local_ai_manager` de BYCS).

## Estructura de archivos estándar de un plugin local

```
local/nexusai/
├── version.php                       # Metadatos del plugin (obligatorio)
├── lib.php                           # Callbacks: before_footer(), extend_navigation()
├── settings.php                      # Configuración admin (URL backend, shared secret)
├── db/
│   ├── access.php                    # Capabilities (permisos)
│   ├── services.php                  # Web services para AJAX
│   ├── install.xml                   # Esquema de tablas (XMLDB)
│   ├── upgrade.php                   # Migraciones entre versiones
│   └── events.php                    # Observadores de eventos
├── classes/
│   ├── external/send_message.php     # External function (AJAX endpoint)
│   └── privacy/provider.php          # Privacy API (GDPR)
├── lang/en/local_nexusai.php         # Strings (inglés por defecto)
├── lang/es/local_nexusai.php         # Strings en español
├── amd/
│   ├── src/chatwidget.js             # Entry AMD (compilado por Webpack)
│   └── build/chatwidget.min.js       # Bundle de producción
├── styles.css                        # Estilos del widget
└── thirdpartylibs.xml                # React, Webpack deps declaradas
```

## `version.php` — metadatos obligatorios

```php
<?php
defined('MOODLE_INTERNAL') || die();

$plugin->version   = 2026041000;      // YYYYMMDDXX, incrementar cada cambio
$plugin->requires  = 2022112800;      // Moodle 4.1 mínimo
$plugin->supported = [401, 405];      // Compatible 4.1 a 4.5
$plugin->component = 'local_nexusai'; // Debe coincidir con la ruta
$plugin->maturity  = MATURITY_ALPHA;  // Durante desarrollo
$plugin->release   = '0.1.0';
$plugin->dependencies = [];
```

| Versión Moodle | `requires` |
|---|---|
| 4.1 LTS | 2022112800 |
| 4.2 | 2023042400 |
| 4.3 | 2023100900 |
| 4.4 | 2024042200 |
| 4.5 LTS | 2024100700 |

## Instalación

Cuando el admin visita Administración del sitio → Notificaciones (`/admin/index.php`), Moodle detecta el nuevo `version.php`, ejecuta `install.xml`, registra capacidades, servicios web y tareas programadas.

## Decisiones tomadas para NexusAI

- **Tipo de plugin:** `local_nexusai`. El widget flotante en todas las páginas cubre el MVP sin pedirle nada al docente.
- **Compatibilidad:** `supported = [401, 405]`, cubriendo 4.1 LTS y 4.5 LTS (versiones que la mayoría de universidades tienen en producción). Ver `compatibilidad-4.1-4.5.md` para el detalle completo.
- **Inyección de UI:** `before_footer()` legacy, compatible con todo el rango 4.1–4.5. No se usa la Hooks API (PSR-14) en el MVP — simplifica el desarrollo y cubre el rango completo sin detección de versión.
- **Post-MVP:** Si aparece la necesidad de configuración por curso (ej. habilitar/deshabilitar para materias puntuales), agregamos un `block_nexusai` que dependa de `local_nexusai`.

## Abierto / pendiente

- [ ] Confirmar qué versión exacta de Moodle corre la UCC (Leandro / técnico Moodle).
- [ ] Definir política de actualización: ¿semver estándar o calendar versioning?

## Referencias

- [Moodle Developer Resources — Plugin types](https://moodledev.io/docs/apis/plugintypes)
- [Moodle Developer Resources — Local plugins](https://moodledev.io/docs/apis/plugintypes/local)
- [Moodle Developer Resources — version.php](https://moodledev.io/docs/apis/commonfiles/version.php)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
