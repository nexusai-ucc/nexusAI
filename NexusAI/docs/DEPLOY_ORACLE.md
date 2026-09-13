# NexusAI — Deploy del backend en Oracle Cloud (guía para el equipo)

> **Última revisión:** 2026-09-07.
> Documenta el deploy **interino** (post-MVP) del backend en dos VMs de Oracle
> Cloud: una de staging y una de producción. Para la arquitectura objetivo a
> mediano/largo plazo (UCC con Moodle propio), ver
> [`docs/diagrams/deployment.md`](diagrams/deployment.md).
> Issue relacionado: **[DEPLOY-02] Deploy self-hosted en Oracle Cloud
> (Always Free) — reemplaza DEPLOY-01** (#318).
> Por qué ya no se despliega a Railway ni a Fly.io:
> [ADR-011](adr/011-deploy-self-hosted-oracle.md).

## TL;DR

- El **backend** (Postgres + Redis + FastAPI + Caddy) corre 24/7 en **dos VMs**
  de Oracle Cloud, una por ambiente. Cada VM sigue su propia rama de git.
- **Moodle NO corre ahí** — sigue local, en la máquina de cada uno, apuntando
  el plugin a la URL del ambiente que se quiera probar.
- El deploy es **100% manual por SSH**. No hay CI/CD: un `git push` no cambia
  nada solo en la VM. Hay que entrar y traer el código a mano.
- Las credenciales reales (SSH, API key, shared secret) **no están en este
  documento ni en el repo** — ver sección 6.

---

## 1. Los dos ambientes

| | **staging** | **producción** |
|---|---|---|
| Nombre de la instancia | `nexusai-staging` | `nexusai-prod` |
| IP pública | `146.181.62.67` | `159.112.139.166` |
| IP privada | `10.0.0.180` | `10.0.0.252` |
| Dominio | `api.146.181.62.67.nip.io` | `api.159.112.139.166.nip.io` |
| **Rama de git que sigue** | **`staging`** | **`main`** |
| Creada | 2026-08-08 | 2026-08-05 |
| Fault domain | FD-3 | FD-2 |

Ambas comparten: región **Chile Central (`sa-santiago-1`)**, compartment
`santiagotricherri (root)`, shape **`VM.Standard.E2.1.Micro`** (Always Free,
1 OCPU / 1 GB RAM) + **4 GB de swap**, usuario SSH `ubuntu`, y el proyecto
clonado en `~/nexusAI/NexusAI`.

Por la limitación de 1 GB de RAM, Moodle no entra en la misma VM junto con el
resto del stack — ver el porqué en
[`docs/diagrams/deployment.md`](diagrams/deployment.md).

### La regla de oro: una rama por ambiente

```
development ──PR──> staging ──PR──> main
                      │                │
                      ▼                ▼
              nexusai-staging     nexusai-prod
             146.181.62.67       159.112.139.166
```

Nunca hacer `git pull origin development` en una de las VMs "para probar algo
rápido": deja la VM en un estado que no corresponde a ninguna rama y el
siguiente deploy normal lo pisa sin aviso. Si hay que probar algo suelto, va
primero a `staging`.

> **Nota de migración:** hasta 2026-09-07 la VM de producción seguía la rama
> `development` (era el único ambiente que existía). Si es el primer deploy
> después de esta guía, verificar en qué rama está parada la VM **antes** de
> hacer pull — ver el paso 2 de la sección 3.

**Verificar que un ambiente está vivo** (no requiere acceso SSH):

```bash
curl https://api.146.181.62.67.nip.io/health    # staging
curl https://api.159.112.139.166.nip.io/health  # producción
# → {"status":"ok","version":"0.1.0","env":"...", "llm_model":"..."}
```

---

## 2. Acceso a las VMs — Santiago es el único deploy admin

La cuenta de Oracle Cloud (Always Free) es personal de Santiago — el resto del
equipo no pudo/no creó su propia cuenta. Por eso, por ahora, **Santiago es el
único que hace deploys**. No es un problema de seguridad artificial: es
simplemente cómo está armada la infraestructura hoy, y no hace falta
complicarlo repartiendo acceso SSH si nadie más va a usarlo.

Esto implica:

- **Nadie más necesita la clave SSH ni el `.env` real de las VMs.** No hay que
  distribuirlos.
- Si en algún momento otra persona consigue su propia cuenta de Oracle (o se
  decide migrar a otra infra) y va a deployar, ahí sí conviene que mande su
  clave pública SSH para agregarla a `~/.ssh/authorized_keys` en cada VM — así
  cada persona tiene su propia identidad y se puede revocar acceso individual
  sin tocar al resto. Evitar compartir la misma clave privada por chat/mail con
  todo el equipo: no se puede revocar el acceso de una sola persona después.

Una vez con acceso:

```bash
ssh -i <tu-clave-privada> ubuntu@146.181.62.67    # staging
ssh -i <tu-clave-privada> ubuntu@159.112.139.166  # producción
```

---

## 3. Cómo hacer un deploy manual (paso a paso)

El procedimiento es **idéntico en los dos ambientes**; lo único que cambia es a
qué IP te conectás y qué rama traés.

**1. Mergear a la rama del ambiente.** Para staging, la PR va de `development`
a `staging`. Para producción, de `staging` a `main`.

**2. Conectarse por SSH y confirmar en qué rama está la VM** (sección 2):

```bash
cd ~/nexusAI/NexusAI
git branch --show-current
```

Tiene que decir `staging` en la VM de staging y `main` en la de producción. Si
dice otra cosa, corregir antes de seguir con `git checkout <rama>`.

**3. Traer el código y levantar de nuevo:**

```bash
git pull origin staging   # o 'main' en producción
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

El `--build` hace falta cuando cambió algo del backend (`services/api/**`). Si
el cambio es solo del plugin de Moodle, la VM no se toca en absoluto.

**4. Confirmar que los 4 containers están `Up` y healthy:**

```bash
sudo docker ps
```

**5. Confirmar que el health check responde** (desde la VM o desde afuera):

```bash
curl https://api.146.181.62.67.nip.io/health   # ajustar según ambiente
```

**6. Si algo no levanta, mirar logs del servicio con problemas:**

```bash
sudo docker logs nexusai-api --tail 100 -f
sudo docker logs nexusai-caddy --tail 50 -f
```

Las migraciones de Alembic **corren solas**: `entrypoint.sh` ejecuta
`alembic upgrade head` antes de arrancar uvicorn. Si una migración falla, el
container de la API no llega a levantar y el error aparece en ese log.

### Checklist post-deploy

- [ ] `sudo docker ps` → los 4 containers (`nexusai-postgres`, `nexusai-redis`,
      `nexusai-api`, `nexusai-caddy`) en `Up` / `healthy`
- [ ] `curl .../health` → responde `{"status":"ok",...}` con el `env` correcto
- [ ] `sudo docker logs nexusai-api --tail 50` → sin errores de migración ni de DB
- [ ] Probar un endpoint real (login o chat) desde el Moodle local

### Reiniciar todo el stack (sin rebuild)

```bash
cd ~/nexusAI/NexusAI
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml down
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Ver uso de recursos (útil con 1 GB de RAM)

```bash
free -h
sudo docker stats --no-stream
```

---

## 4. Archivos relevantes en el repo

- `docker-compose.prod.yml` — overlay de producción/staging (sin hot-reload,
  sin puertos expuestos de Postgres/Redis, agrega Caddy). Se usa **junto con**
  `docker-compose.yml` (`-f docker-compose.yml -f docker-compose.prod.yml`),
  nunca solo. Es el mismo archivo para los dos ambientes.
- `Caddyfile` — config del reverse proxy. **El dominio no está hardcodeado**:
  sale de `NEXUSAI_DOMAIN`, que vive en el `.env` de cada VM. Por eso el mismo
  archivo commiteado sirve para staging y para producción.
- `.env.production.example` — plantilla de las variables de entorno, **sin
  valores reales**. El `.env` real vive solo en cada VM
  (`~/nexusAI/NexusAI/.env`, permisos 600), nunca en git.

### `NEXUSAI_DOMAIN`: el que diferencia un ambiente del otro

Cada VM tiene su propio valor en `~/nexusAI/NexusAI/.env`:

```bash
# en nexusai-staging
NEXUSAI_DOMAIN=api.146.181.62.67.nip.io

# en nexusai-prod
NEXUSAI_DOMAIN=api.159.112.139.166.nip.io
```

Caddy lo usa para saber a qué dominio pedirle el certificado TLS a Let's
Encrypt. **Si este valor no coincide con el dominio por el que se accede, Caddy
levanta igual pero no consigue certificado**, y el sitio responde por HTTP
(redirigiendo a HTTPS) mientras el HTTPS falla con un error de TLS. Síntoma
típico:

```bash
curl https://api.<ip>.nip.io/health    # falla / no conecta
curl -I http://api.<ip>.nip.io/health  # responde 308, servidor: Caddy
```

Si pasa eso: revisar `NEXUSAI_DOMAIN` en el `.env` de esa VM, levantar de nuevo
el stack y mirar `sudo docker logs nexusai-caddy` — ahí aparece el error
concreto de emisión del certificado.

---

## 5. Los dominios `nip.io` son temporales

`nip.io` es un servicio gratuito que resuelve `api.<IP>.nip.io` a esa misma IP,
sin registrar nada. Sirve para tener HTTPS real sin comprar un dominio, pero
tiene una consecuencia importante:

**si la IP pública de una VM cambia, el dominio cambia con ella** — y hay que
actualizar `NEXUSAI_DOMAIN` en el `.env` de esa VM, esta documentación, y la
config del plugin en cada Moodle local.

Si en algún momento se consigue un dominio propio o se configura DuckDNS, se
reemplaza en el `.env` de cada VM (no en el `Caddyfile`, que ya es genérico).

---

## 6. Credenciales — dónde están, dónde NO están

**Nunca commitear valores reales de `.env` al repo, ni subir un
`.env.production` con valores reales a ninguna rama.** Git guarda todo para
siempre en el historial, y este repo puede ser visto por más gente que el
equipo actual.

Hay dos grupos de credenciales, con necesidades distintas:

1. **El `.env` completo de cada VM** (password de Postgres, `LLM_API_KEY`,
   etc.) y la **clave SSH privada** — solo los necesita quien deploya. Como hoy
   es solo Santiago (única cuenta de Oracle Cloud del equipo), **nadie más
   necesita estos valores**.
2. **Los 3 valores para configurar el plugin de Moodle** (Backend URL, API key,
   shared secret) — estos sí los necesita cada compañero que quiera probar el
   flujo completo contra un backend público, porque van en la pantalla de
   configuración del plugin (`Site administration → Plugins → local_nexusai`),
   **no en un archivo**. Se pasan por un canal directo (mensaje privado,
   llamada) — nunca por git/issue/PR.

> Ojo: la API key y el shared secret **son distintos en staging y en
> producción**. Al cambiar el Backend URL del plugin de un ambiente al otro hay
> que cambiar también esos dos valores, o todas las llamadas van a fallar la
> validación HMAC.

Si el equipo crece o alguien más consigue su propia cuenta de Oracle y va a
empezar a deployar, ahí conviene pasar a un gestor de contraseñas compartido
(1Password, Bitwarden, etc.) en vez de mensajes sueltos.

---

## 7. Qué falta (pendientes conocidos)

- **Backups automáticos de Postgres** (`pg_dump` por cron) — hoy no hay
  ninguno, en ningún ambiente. Si se pierde una VM, se pierde su base entera.
  Es el pendiente más importante de esta lista.
- Dominio real o DuckDNS en vez de `nip.io` (opcional, ver sección 5).
- CI/CD para no depender de SSH manual (opcional). Implica cargar la clave SSH
  como secret de GitHub — ver la alternativa evaluada en
  [ADR-011](adr/011-deploy-self-hosted-oracle.md).
- Conectar el Moodle local + plugin a staging para probar el flujo completo
  antes de cada promoción a producción.
