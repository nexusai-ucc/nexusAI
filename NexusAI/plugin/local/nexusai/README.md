# local_nexusai — Plugin Moodle de NexusAI

Plugin tipo `local` que embebe el asistente NexusAI dentro del aula virtual de Moodle.
Inyecta un widget de chat React en el footer de cada página de curso, autenticado con
las capabilities de Moodle.

## Estado

`v0.1.0-skeleton` — Sprint 1. Solo hello world. Todavía no hay backend conectado;
el bundle muestra el `courseid`/`userid`/`sesskey` que recibe desde Moodle como
verificación end-to-end.

## Estructura

```
local/nexusai/
├── version.php                       # Metadata del plugin (versión, requires)
├── lib.php                           # Hook before_footer → inyecta el div + carga JS
├── settings.php                      # Página de admin (URL del backend, switch on/off)
├── db/
│   └── access.php                    # Capabilities: nexusai:use, :manage, :viewanalytics
├── lang/
│   ├── en/local_nexusai.php
│   └── es/local_nexusai.php
├── classes/
│   └── privacy/
│       └── provider.php              # Privacy API (null_provider por ahora)
├── amd/
│   └── build/
│       └── chatwidget-lazy.min.js    # Bundle AMD (placeholder o React buildeado)
└── react/                            # Source de React + Webpack (NO se carga en Moodle)
    ├── package.json
    ├── webpack.config.js
    ├── .babelrc
    └── src/
        ├── index.jsx                 # Entrypoint con export init()
        ├── ChatApp.jsx               # Componente principal
        └── styles.css
```

## Setup local con moodle-docker

Asumimos que ya tenés `moodlehq/moodle-docker` clonado en
`~/Documents/NexusAI/moodle-docker/` con el código de Moodle en `moodle-docker/moodle/`.

### Opción A — Symlink (recomendada para dev)

Más limpio: el plugin vive en el repo NexusAI, Moodle lo "ve" via symlink.

```bash
cd ~/Documents/NexusAI/moodle-docker/moodle/local
ln -s ~/Documents/NexusAI/nexusAI/NexusAI/plugin/local/nexusai nexusai
```

Verificá que el link funciona:

```bash
ls -la ~/Documents/NexusAI/moodle-docker/moodle/local/nexusai
# Debe mostrar: nexusai -> /Users/.../NexusAI/plugin/local/nexusai
```

### Opción B — Volumen Docker

Editá `moodle-docker/base.yml` (o creá un override) para montar el plugin:

```yaml
services:
  webserver:
    volumes:
      - ~/Documents/NexusAI/nexusAI/NexusAI/plugin/local/nexusai:/var/www/html/local/nexusai
```

## Instalar el plugin

Una vez montado:

```bash
cd ~/Documents/NexusAI/moodle-docker
export MOODLE_DOCKER_WWWROOT=$(pwd)/moodle
export MOODLE_DOCKER_DB=pgsql

bin/moodle-docker-compose up -d
bin/moodle-docker-wait-for-db
```

Entrá a `http://localhost:8000` con admin / test (las creds default de moodle-docker)
y Moodle debería detectar el plugin nuevo automáticamente. Confirmá la instalación.

Verificá que aparece en:

- `Site administration → Plugins → Local plugins → NexusAI`
- `Site administration → Users → Permissions → Define roles` debería listar las 3 capabilities `local/nexusai:*`

## Ver el chat

1. Entrá como admin
2. Creá (o entrá a) un curso cualquiera
3. Tenés que ver una **burbuja morada flotante en el bottom-right** de la página
4. Click → se abre el panel con `courseid`, `userid`, `sesskey`, `wwwroot`

Si **NO** ves la burbuja:

- Revisá la consola del navegador (errores JS)
- Verificá que el archivo `amd/build/chatwidget-lazy.min.js` existe
- En Moodle, andá a `Site administration → Development → Purge all caches`
- Si decís "Cache definitions check" tirá error, hace falta correr `php admin/cli/upgrade.php` desde dentro del container

## Buildear el bundle React real

El placeholder vanilla JS es solo para verificar que el plugin carga. Para tener
React funcionando con todas sus features:

```bash
cd plugin/local/nexusai/react
npm install              # ~2-3 min, instala React + Webpack + babel
npm run build            # genera ../amd/build/chatwidget-lazy.min.js (~150KB)

# Para desarrollo activo (rebuilda en cada cambio):
npm run dev
```

Después de buildear, en Moodle:

1. `Site administration → Development → Purge all caches` (Moodle cachea los AMD modules)
2. Recargar el navegador con Ctrl+Shift+R

## Capabilities

| Capability                       | Quién por defecto                | Para qué                                     |
|----------------------------------|----------------------------------|----------------------------------------------|
| `local/nexusai:use`              | student, teacher, manager        | Ver y usar el chat en un curso               |
| `local/nexusai:manage`           | editingteacher, manager          | Subir PDFs, gestionar indexación             |
| `local/nexusai:viewanalytics`    | editingteacher, manager          | Dashboard de analytics (post-MVP)            |

## Compatibilidad

- Moodle 4.1 LTS (build 2022112800) hasta 4.5
- PHP 8.0+
- DB: PostgreSQL (recomendado), MariaDB, MySQL

## Próximos pasos (Sprint 2)

- Conectar el chat a `POST /api/v1/chat` del backend Python (HMAC firmado por PHP)
- Streaming de respuestas con SSE
- Historial de mensajes en sessionStorage / IndexedDB
- Loader y manejo de errores

## Licencia

GPL v3 — alineado con la licencia de Moodle.
