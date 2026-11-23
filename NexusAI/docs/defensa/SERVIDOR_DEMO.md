# Cuentas y servidor de la demo: paso a paso

> v1.0, 05/11/2026. Lo que tenemos que crear y pagar nosotros, en orden. El entorno técnico (Moodle, plugin, backend, cuentas del público y tarjetas) está automatizado en `NexusAI/deploy/demo/` (ver su `README.md`).

**Regla:** las keys y contraseñas no se pegan en chats, issues ni PRs. Van directo al `.env` del servidor, que no se commitea.

## 1. DigitalOcean (servidor)

1. **Crédito para estudiantes.** Entrar a [GitHub Education](https://education.github.com/pack) con la cuenta de la facultad y ver si la oferta de DigitalOcean sigue activa. Si está, se activa desde ahí, antes de cargar una tarjeta.
2. **Cuenta y equipo.** Crear la cuenta y un *Team* "NexusAI" e invitar a Santiago y Marcos, para que no dependa de una sola persona (lo que hoy pasa con Oracle).
3. **Alertas de gasto.** *Billing → Billing alerts*: aviso a los US$ 20 y a los US$ 60.
4. **Clave SSH.** Cada uno sube su clave pública en *Settings → Security*. Nada de contraseñas de root.
5. **Droplet** (recién a partir del 14/12, para no pagar de más):
   - Ubuntu 24.04 LTS, región la más cercana disponible (NYC o SFO; la latencia que más pesa es la del LLM, no la del servidor);
   - **2 vCPU / 4 GB** para armarlo; se **redimensiona a 4 vCPU / 8 GB** en enero, para la prueba de carga y la defensa (*Resize*, con el droplet apagado unos minutos);
   - con las claves SSH de los tres y backups semanales activados;
   - *Cloud Firewall* con 22, 80 y 443 abiertos (además del `ufw` que configura `provision.sh`).
6. Anotar la IP pública para el paso 3.

## 2. OpenAI (modelo)

1. **Organización y proyecto.** En [platform.openai.com](https://platform.openai.com), un proyecto propio "nexusai-demo-defensa", separado de cualquier otro uso. Si la cuenta de staging es del equipo, se crea el proyecto adentro de esa misma organización.
2. **Tope de gasto.** *Project → Limits*: tope mensual de US$ 50 y alerta a los US$ 20. Si se llega al tope, la demo deja de responder: por eso la alerta.
3. **Crédito.** Cargar crédito prepago. **El tier sube con lo gastado**: confirmar en *Limits* el tier y los límites de `gpt-4o-mini` (tokens por minuto). Con 60 personas a la vez estimamos ~200 k tokens por minuto, el límite de Tier 1 según la documentación. Si el panel muestra ese tier, hay que subir de tier **antes de la prueba de carga de enero**.
4. **Una API key del proyecto**, con permisos para chat, embeddings y moderación. Se usa en `LLM_API_KEY`, `EMBEDDING_API_KEY` y `MODERATION_API_KEY` del `.env`.
5. **Modelos que usa la demo:** `gpt-4o-mini` (chat) y `text-embedding-3-small` pedido en **768 dimensiones** (ver `.env.example`).

## 3. Dominio

1. Elegir un nombre corto y fácil de dictar, para el QR: por ejemplo un subdominio `demo.` de un dominio del equipo.
2. Comprarlo en un registrador con DNS incluido (unos US$ 12 por año para un `.com`).
3. Registro **A** del dominio (o del subdominio) → IP del droplet. Con TTL bajo (300 s) mientras armamos.
4. Caddy saca el certificado HTTPS solo la primera vez que se levanta, si el DNS ya apunta bien.

## 4. Levantar el entorno (cuando estén 1, 2 y 3)

En el droplet, como root:

```bash
# Prepara el servidor: Docker, firewall, swap, actualizaciones y el repo en /opt/nexusai
bash provision.sh            # copiado con scp, o desde la rama del repo

cd /opt/nexusai/NexusAI/deploy/demo
cp .env.example .env && nano .env          # dominio, contraseñas (openssl rand -hex 32) y la key de OpenAI
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python generar_cuentas.py --url https://TU-DOMINIO --cantidad 70
MATERIAL=outputs/informe-ipi.pdf ./setup.sh    # el informe, copiado antes a outputs/
```

`outputs/tarjetas.pdf` se baja con `scp` y se imprime: 10 tarjetas por hoja A4.

## 5. Después de la defensa

Ver `NexusAI/deploy/demo/README.md` → "Después de la defensa": borrar las cuentas del público, revocar la key de OpenAI, destruir el droplet y dar de baja el dominio si no se usa más.

## Quién hace qué (propuesta)

| Paso | Responsable |
|---|---|
| DigitalOcean y dominio | Delfina crea las cuentas; Santiago arma el droplet |
| OpenAI | Delfina crea el proyecto y la key; la key la carga en el `.env` quien levante el servidor |
| `setup.sh`, cuentas y tarjetas | Marcos |
