# NexusAI — Deploy del backend en Oracle Cloud (guía para el equipo)

> **Última revisión:** 2026-08-05.
> Esto documenta el deploy **interino** (post-MVP) del backend en una VM de
> Oracle Cloud. Para la arquitectura objetivo a mediano/largo plazo (UCC con
> Moodle propio), ver [`docs/diagrams/deployment.md`](diagrams/deployment.md).
> Issue relacionado: **[DEPLOY-02] Deploy self-hosted en Oracle Cloud
> (Always Free) — reemplaza DEPLOY-01** (#318).

## TL;DR

- El **backend** (Postgres + Redis + FastAPI) corre 24/7 en una VM de Oracle
  Cloud, con HTTPS real: `https://api.159.112.139.166.nip.io`
- **Moodle NO corre ahí** — sigue local, en la máquina de cada uno, apuntando
  el plugin a esa URL.
- El deploy es **100% manual por SSH**. No hay CI/CD: un `git push` no
  cambia nada solo en la VM.
- Las credenciales reales (SSH, API key, shared secret) **no están en este
  documento ni en el repo** — quien necesite deployar las tiene que pedir por
  un canal seguro (ver sección 5).

---

## 1. Qué está deployado hoy

| Componente | Dónde corre |
|---|---|
| PostgreSQL + pgvector | VM Oracle (container `nexusai-postgres`) |
| Redis | VM Oracle (container `nexusai-redis`) |
| FastAPI (backend) | VM Oracle (container `nexusai-api`) |
| Caddy (reverse proxy + TLS) | VM Oracle (container `nexusai-caddy`) |
| Moodle + plugin `local_nexusai` | Local, en la máquina de cada dev |

La VM es Always Free Tier de Oracle (shape `VM.Standard.E2.1.Micro`, 1 OCPU /
1GB RAM + 4GB de swap). Por esa limitación de RAM, Moodle no entra en la
misma VM junto con el resto del stack — ver el porqué en
[`docs/diagrams/deployment.md`](diagrams/deployment.md) o preguntar a
Santiago/Delfina si hace falta más contexto.

**Verificar que está viva** (no requiere acceso SSH):
```bash
curl https://api.159.112.139.166.nip.io/health
# → {"status":"ok","version":"0.1.0","env":"production",...}
```

---

## 2. Acceso a la VM — Santiago es el único deploy admin

La cuenta de Oracle Cloud (Always Free) es personal de Santiago — el resto
del equipo no pudo/no creó su propia cuenta. Por eso, por ahora, **Santiago
es el único que hace deploys** de este backend. No es un problema de
seguridad artificial: es simplemente cómo está armada la infraestructura
hoy, y no hace falta complicarlo repartiendo acceso SSH si nadie más va a
usarlo.

Esto implica:
- **Nadie más necesita la clave SSH ni el `.env` real de la VM.** No hay que
  distribuirlos.
- Si en algún momento otra persona consigue su propia cuenta de Oracle (o se
  decide migrar a otra infra) y va a deployar, ahí sí conviene que mande su
  clave pública SSH para agregarla a `~/.ssh/authorized_keys` en la VM — así
  cada persona tiene su propia identidad y se puede revocar acceso
  individual sin tocar al resto. Evitar compartir la misma clave privada por
  chat/mail con todo el equipo —
  no se puede revocar el acceso de una sola persona después.

Una vez con acceso:
```bash
ssh -i <tu-clave-privada> ubuntu@159.112.139.166
```

---

## 3. Cómo hacer un deploy manual (paso a paso)

1. Mergear lo que se quiera deployar a `development` (o la rama que
   corresponda en la VM — hoy es `development`).
2. Conectarse por SSH (sección 2).
3. Actualizar el código y levantar de nuevo:
   ```bash
   cd ~/nexusAI/NexusAI
   git pull origin development
   sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```
4. Confirmar que los 4 containers están `Up` y healthy:
   ```bash
   sudo docker ps
   ```
5. Confirmar que el health check responde:
   ```bash
   curl https://api.159.112.139.166.nip.io/health
   ```
6. Si algo no levanta, mirar logs del servicio con problemas:
   ```bash
   sudo docker logs nexusai-api --tail 100 -f
   ```

### Reiniciar todo el stack (sin rebuild)
```bash
cd ~/nexusAI/NexusAI
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml down
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 4. Archivos relevantes en el repo

- `docker-compose.prod.yml` — overlay de producción (sin hot-reload, sin
  puertos expuestos de Postgres/Redis, agrega Caddy). Se usa **junto con**
  `docker-compose.yml` (`-f docker-compose.yml -f docker-compose.prod.yml`),
  nunca solo.
- `Caddyfile` — config del reverse proxy. El dominio actual es temporal
  (`nip.io`, gratis, sin registro). Si se consigue un dominio propio o se
  configura DuckDNS, se reemplaza acá.
- `.env.production.example` — plantilla de las variables de entorno de
  producción, **sin valores reales**. El `.env` real vive solo en la VM
  (`~/nexusAI/NexusAI/.env`, permisos 600), nunca en git.

---

## 5. Credenciales — dónde están, dónde NO están

**Esto es importante: nunca commitear valores reales de `.env` al repo, ni
subir un `.env.production` con valores reales a ninguna rama.** Git guarda
todo para siempre en el historial, y este repo puede ser visto por más gente
que el equipo actual.

Hay dos grupos de credenciales, con necesidades distintas:

1. **El `.env` completo de la VM** (password de Postgres, `LLM_API_KEY`,
   etc.) y la **clave SSH privada** — solo los necesita quien deploya. Como
   hoy es solo Santiago (única cuenta de Oracle Cloud del equipo), **nadie
   más necesita estos valores**. No hace falta un `.env` compartido ni
   repartir la clave SSH.
2. **Los 3 valores para configurar el plugin de Moodle** (Backend URL, API
   key, shared secret) — estos sí los necesita cada compañero que quiera
   probar el flujo completo contra el backend público, porque van en la
   pantalla de configuración del plugin (`Site administration → Plugins →
   local_nexusai`), **no en un archivo**. Se pasan por un canal directo
   (mensaje privado, llamada) — nunca por git/issue/PR — a quien los tenga.

Si el equipo crece o alguien más consigue su propia cuenta de Oracle y va a
empezar a deployar, ahí sí conviene pasar a un gestor de contraseñas
compartido (1Password, Bitwarden, etc.) en vez de mensajes sueltos.

---

## 6. Qué falta (post-deploy)

- Conectar Moodle local + plugin al backend público (configurar Backend URL
  + API key + shared secret en el plugin).
- Backups automáticos de Postgres (`pg_dump` por cron) — hoy no hay ninguno.
- Dominio real o DuckDNS en vez de `nip.io` (opcional).
- CI/CD para no depender de SSH manual (opcional, post-MVP).
