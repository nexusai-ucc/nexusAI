# local_nexusai — Plugin Moodle de NexusAI

Plugin tipo `local` que embebe el asistente NexusAI dentro del aula virtual de Moodle.
Inyecta un widget de chat React en el footer de cada página de curso, autenticado
con las capabilities de Moodle, y proxy-ea las consultas al backend Python con
HMAC SHA-256.

## Estado

**`v0.2.1`** — Sprint 1 cerrado, end-to-end funcional.

- ✅ Plugin instalable en Moodle 4.1 LTS hasta 4.5
- ✅ Hook API nuevo (Moodle 4.4+) + callback legacy (4.1-4.3)
- ✅ Widget de chat React montado vía bundle AMD
- ✅ External Function `local_nexusai_chat_send` con autenticación HMAC
- ✅ Backend client en PHP que firma cada request con HMAC SHA-256 (3 capas)
- ✅ Privacy API declarada (`null_provider` en MVP)
- ✅ Verificado end-to-end con Gemini 2.5 Flash el 4-5 May 2026

## Estructura

```
local/nexusai/
├── version.php                       # Metadata del plugin (versión, requires)
├── lib.php                           # Callback before_footer legacy (Moodle 4.1-4.3)
├── settings.php                      # Página de admin: API URL, API key, shared secret
├── db/
│   ├── access.php                    # Capabilities: nexusai:use, :manage, :viewanalytics
│   ├── hooks.php                     # Registro Hook API nuevo (Moodle 4.4+)
│   ├── services.php                  # External Function local_nexusai_chat_send
│   └── install.xml                   # Schema mínimo (placeholder, datos viven en backend)
├── lang/
│   ├── en/local_nexusai.php
│   └── es/local_nexusai.php
├── classes/
│   ├── hook/output/
│   │   └── before_footer_listener.php  # Inyección de chat en Moodle 4.4+
│   ├── external/
│   │   ├── chat_send.php             # External Function: validation + proxy
│   │   └── backend_client.php        # cURL + HMAC al backend FastAPI
│   └── privacy/
│       └── provider.php              # Privacy API (null_provider, ver ADR-006)
├── amd/
│   └── build/
│       └── chatwidget-lazy.min.js    # Bundle React compilado (~159 KB)
└── react/                            # Source React (NO se carga directo en Moodle)
    ├── package.json                  # React 18 + Webpack 5 + Babel
    ├── webpack.config.js             # Bundle único AMD, sin chunks lazy
    ├── .babelrc
    └── src/
        ├── index.jsx                 # Entrypoint con export init(params)
        ├── ChatApp.jsx               # Componente raíz del chat
        ├── api/chat.js               # Cliente: core/ajax + fallback mock
        ├── components/
        │   ├── MessageBubble.jsx     # Burbuja user/assistant con timestamp
        │   ├── ChatInput.jsx         # Input auto-grow con Enter para enviar
        │   └── TypingIndicator.jsx   # Animación 3 dots cuando carga
        └── styles.css                # Estilos prefijados .nexusai-*
```

## Setup local con moodle-docker

Asumimos que ya tenés `moodlehq/moodle-docker` clonado en
`~/Documents/NexusAI/moodle-docker/` con el código de Moodle en `moodle-docker/moodle/`.

> ⚠️ **Symlinks NO funcionan dentro de Docker.** El container monta `moodle/`
> como volumen, y un symlink que apunta fuera del mount queda colgando.
> Verificado en Sprint 1. Usar bind mount o copy directa.

### Opción A — Bind mount via `local.yml` (recomendada para dev) ⭐

`moodle-docker` carga automáticamente cualquier archivo `local.yml` en su raíz.
Crealo así:

```yaml
# ~/Documents/NexusAI/moodle-docker/local.yml
services:
  webserver:
    volumes:
      - /Users/delfisalinasmich/Documents/NexusAI/nexusAI/NexusAI/plugin/local/nexusai:/var/www/html/local/nexusai
```

Después: `bin/moodle-docker-compose down && bin/moodle-docker-compose up -d`.
Cualquier cambio en el repo NexusAI se refleja inmediatamente en Moodle (hace
falta purgar cachés para PHP, hard refresh para JS).

**Ventaja:** una única fuente de verdad — editás en el repo NexusAI, se ve en Moodle.

### Opción B — Copy manual (rápido para verificar)

```bash
rm -rf ~/Documents/NexusAI/moodle-docker/moodle/local/nexusai
cp -R ~/Documents/NexusAI/nexusAI/NexusAI/plugin/local/nexusai ~/Documents/NexusAI/moodle-docker/moodle/local/
```

Útil para una verificación rápida antes de configurar el bind mount.
**Desventaja:** cada cambio en el repo requiere repetir el `cp`.

## Instalar el plugin

Una vez montado:

```bash
cd ~/Documents/NexusAI/moodle-docker
bin/moodle-docker-compose up -d
bin/moodle-docker-wait-for-db
```

Entrá a `http://localhost:8000` con `admin` / `test` y Moodle detecta el plugin
nuevo automáticamente. Confirmá la instalación.

Verificá que aparece en:

- `Site administration → Plugins → Local plugins → NexusAI`
- `Site administration → Users → Permissions → Define roles` lista las 3 capabilities `local/nexusai:*`

## Configurar conexión con el backend

**Site administration → Plugins → Local plugins → NexusAI:**

| Campo | Valor MVP local |
|---|---|
| **Backend API URL** | `http://host.docker.internal:8001` |
| **API key** | El valor de `NEXUSAI_API_KEY` del `.env` del backend (32 bytes hex) |
| **Shared secret (HMAC)** | El valor de `NEXUSAI_SHARED_SECRET` del `.env` (32 bytes hex) |

> ⚠️ **No usar `localhost:8001`** desde Moodle. El container de Moodle resuelve
> `localhost` como sí mismo, no como tu Mac. `host.docker.internal` es el alias
> que Docker Desktop inyecta para que el container llegue al host.

Después de guardar:

1. **Site administration → Development → Purge all caches**
2. Hard refresh del navegador (`Ctrl+Shift+R`)

### Ajustes adicionales para dev local

Por defecto, Moodle bloquea las URLs internas (`localhost`, IPs privadas) por
seguridad anti-SSRF. Para dev hay que abrir esa restricción:

**Site administration → General → Security → HTTP security:**

- **cURL blocked hosts list** → vaciar (en producción se vuelve a llenar con la blacklist segura)
- **cURL allowed ports list** → agregar `8001`

## Ver el chat funcionando

1. Entrá como admin a un curso (creá uno de prueba si no hay)
2. **Burbuja morada flotante en bottom-right** → click
3. Escribí algo (ej. "Hola, qué podés hacer?")
4. La respuesta del LLM tiene que aparecer en la conversación

Mientras escribís el primer mensaje, mirá los logs del backend:

```bash
cd ~/Documents/NexusAI/nexusAI/NexusAI
docker compose logs api -f
```

Tenés que ver: `INFO ... POST /api/v1/chat/messages HTTP/1.1 200 OK`.

## Capabilities

| Capability                       | Default                     | Para qué                                     |
|----------------------------------|-----------------------------|----------------------------------------------|
| `local/nexusai:use`              | student, teacher, manager   | Ver y usar el chat en un curso               |
| `local/nexusai:manage`           | editingteacher, manager     | Subir PDFs, gestionar indexación             |
| `local/nexusai:viewanalytics`    | editingteacher, manager     | Dashboard de analytics (post-MVP)            |

## Buildear el bundle React

El bundle ya está commiteado en `amd/build/chatwidget-lazy.min.js` (~159 KB).
Solo hace falta rebuildearlo si tocaste código JSX.

```bash
cd plugin/local/nexusai/react
npm install              # solo la primera vez, ~2-3 min
npm run build            # produce ../amd/build/chatwidget-lazy.min.js
# Para watch mode mientras desarrollás:
npm run dev
```

Después de un build, en Moodle:

1. `Site administration → Development → Purge all caches`
2. Recargá con `Ctrl+Shift+R`

## Compatibilidad

- **Moodle:** 4.1 LTS (build 2022112800) → 4.5 — usa Hook API nuevo en 4.4+ y callback legacy en versiones anteriores, sin código condicional en cada caller
- **PHP:** 8.0+
- **DB:** PostgreSQL (recomendado), MariaDB, MySQL — el plugin no tiene tablas propias significativas en MVP

## Solución de problemas frecuentes

| Síntoma | Causa | Fix |
|---|---|---|
| Plugin no aparece tras instalación | Symlink dentro de Docker | Cambiar a bind mount (Opción A) o copy (Opción B) |
| Burbuja del chat no aparece en cursos | `before_footer` warning en Moodle 4.4+ pero no se inyecta | Confirmar que `db/hooks.php` está en el filesystem montado en el container; purgar cachés |
| `Cannot reach NexusAI backend: URL is blocked` | Moodle bloquea `localhost`/IPs privadas | Vaciar `cURL blocked hosts list` (ver "Ajustes adicionales para dev local") |
| `Failed to connect to localhost port 8001` | Configuraste la API URL como `localhost` | Cambiar a `http://host.docker.internal:8001` |
| `HTTP 503: El asistente no está disponible` | Backend Python OK pero LLM falla | Mirar logs: `docker compose logs api`. Suele ser API key de Gemini con cuota agotada o modelo sin acceso |
| `Invalid signature` | API key o shared secret no coinciden con el `.env` del backend | Volver a copiar exactamente desde `.env` del backend |
| `Replay detected: nonce already used` | Redis recicló un nonce, probablemente clock skew | Verificar reloj sincronizado en host y container, revisar `HMAC_REPLAY_WINDOW_SEC` |
| Bundle JS no carga (`ChunkLoadError`) | Webpack chunks lazy con `publicPath` mal | Ya resuelto en 0.2.0: bundle único, sin chunks lazy. Si volvés a meter `import()` dinámico, leer `investigacion/06-frontend-react/integracion-moodle-amd.md` |

## Próximos pasos (Sprint 2)

- ⏳ Vista docente para subir PDFs (`classes/external/document_upload.php` + UI React)
- ⏳ Endpoint upload que dispare el pipeline RAG del backend
- ⏳ Streaming SSE de respuestas (mejor UX, primer token a ~700 ms)
- ⏳ Mostrar fuentes citadas en cada respuesta del asistente
- ⏳ Historial de sesiones (cargar conversaciones anteriores)
- ⏳ Renderizado de Markdown en respuestas

## Licencia

GPL v3 — alineado con la licencia de Moodle.

---

*Última actualización: 5 May 2026 — Equipo NexusAI*
