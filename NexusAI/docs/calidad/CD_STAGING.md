# Despliegue continuo a staging y smoke test (TPC-08)

> Issue [#580](https://github.com/nexusai-ucc/nexusAI/issues/580) · Épica [#584](https://github.com/nexusai-ucc/nexusAI/issues/584) · Versión 1.2, 21/10/2026

Hasta TPC-08, el deploy del backend era 100 % manual: el admin de deploy entraba por SSH a la VM y traía el código a mano ([DEPLOY_ORACLE.md](../DEPLOY_ORACLE.md) §3). Nada verificaba después que el ambiente funcionara.

Desde ahora, **cada push a la rama `staging` se despliega solo y se prueba solo**:

```
development ──PR──▶ staging ──push──▶ deploy-staging.yml
                                        │
                                        ├─ 1. deploy   SSH a la VM con una clave que solo puede desplegar
                                        ├─ 2. verifica el commit que quedó en la VM == el commit pusheado
                                        └─ 3. smoke    health + chat firmado (HMAC → base → embeddings → LLM) + anti-replay
                                                       └─ si algo falla, el pipeline queda en ROJO
```

| Pieza | Archivo |
|---|---|
| Workflow | [`.github/workflows/deploy-staging.yml`](../../../.github/workflows/deploy-staging.yml) |
| Script de deploy en la VM | [`scripts/deploy_vm.sh`](../../scripts/deploy_vm.sh) |
| Smoke (el E2E de TPC-07) | [`scripts/e2e_deployed.py`](../../scripts/e2e_deployed.py) |

## 1. Qué valida cada paso

| Paso | Qué hace | Falla si… | Requisito del TP |
|---|---|---|---|
| **Deploy** | `deploy_vm.sh staging` en la VM: verifica la rama, `git merge --ff-only`, `docker compose … up -d --build` y espera el container `nexusai-api` *healthy* (hasta 5 min) | la VM no está en `staging`, tiene commits propios, el build falla o la API no queda sana | despliegue automatizado por el pipeline |
| **Verificación del commit** | compara el `DEPLOYED_SHA` que imprime la VM con el commit del push | la VM quedó en otro commit | "despliegue verificado en la instancia" |
| **Smoke: health** | `GET /health` con reintentos durante 2 min; exige `env=staging` | staging no responde, o la URL apunta a otro ambiente | **el smoke falla el pipeline si staging no responde** |
| **Smoke: chat firmado** | `POST /api/v1/chat/messages` firmado con HMAC, igual que `backend_client.php` | la firma, la base, los embeddings o el LLM fallan | "handshake con Moodle" + "una consulta al asistente" |
| **Smoke: anti-replay** | repite la misma request y espera **401** | Redis no registra el nonce | seguridad del handshake |

**Sobre el "handshake con Moodle".** Moodle no corre en la VM de staging, porque no entra en 1 GB de RAM ([DEPLOY_ORACLE.md](../DEPLOY_ORACLE.md)). Lo que el plugin hace contra el backend es exactamente la request firmada con HMAC, con la API key, el timestamp, el nonce y la firma. El smoke la reproduce con el mismo algoritmo, y los vectores de [`contracts/hmac_vectors.json`](../../contracts/README.md) garantizan que el plugin y el backend firman igual (TPC-07).

**Sobre la consulta.** El chat va con `visible_cmids: []` y `history: []`:
- el usuario de prueba no ve material, así que la respuesta es la de "no encontré". Igual se ejercita toda la cadena: retrieval con embeddings y llamada real al LLM;
- en modo stateless (DATA-04) el backend no guarda la conversación, así que **el smoke no ensucia la base de staging**.

**Nivel 3.** El smoke *es* el flujo E2E de la integración externa ([INTEGRACION_EXTERNA.md](INTEGRACION_EXTERNA.md) §6), así que corre en cada deploy, como pide el nivel 3. El proveedor LLM real se prueba además todos los días con `integration-external.yml`.

## 2. Seguridad de la clave de deploy

El pipeline entra a la VM con una clave SSH **dedicada**, que no es la de ninguna persona. En la VM está instalada como *forced command*:

```
command="~/nexusAI/NexusAI/scripts/deploy_vm.sh staging",no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding ssh-ed25519 AAAA… github-actions-staging
```

- **Solo puede desplegar `staging`.** Cualquier comando que mande el cliente se ignora, y el ambiente viene fijo de esa línea.
- **No da shell** (`no-pty`) **ni túneles** (`no-port-forwarding`).
- **El host key está fijado** (`STAGING_SSH_KNOWN_HOSTS`, `StrictHostKeyChecking=yes`): el pipeline no se conecta a una VM impostora.
- **La clave se borra** del runner al terminar, aunque el job falle.
- **Revocarla** es borrar esa línea de `authorized_keys`. No afecta el acceso de nadie más.

Las credenciales del smoke (`NEXUSAI_E2E_API_KEY` y `NEXUSAI_E2E_SHARED_SECRET`) son las del `.env` de staging, nunca las de producción. Además, `--expect-env staging` hace fallar el smoke si por error apunta a producción.

## 3. Configuración (la hace el admin de deploy)

Todo vive en GitHub → *Settings* → *Environments* → **`staging`**. Ahí también queda el historial de deploys.

| Tipo | Nombre | Valor |
|---|---|---|
| Secret | `STAGING_SSH_KEY` | clave privada ed25519 generada solo para el pipeline |
| Secret | `STAGING_SSH_KNOWN_HOSTS` | salida de `ssh-keyscan -t ed25519 146.181.62.67` |
| Secret | `NEXUSAI_E2E_API_KEY` | `NEXUSAI_API_KEY` del `.env` de staging |
| Secret | `NEXUSAI_E2E_SHARED_SECRET` | `NEXUSAI_SHARED_SECRET` del `.env` de staging |
| Variable | `STAGING_SSH_HOST` | `146.181.62.67` |
| Variable | `STAGING_URL` | `https://api-staging.146.181.62.67.nip.io` |

La URL es una **variable** y no está escrita en el workflow. En TPC-07 se reportó staging como caído porque la URL se había copiado de una documentación desactualizada.

**Primera vez (bootstrap).** El *forced command* apunta a `scripts/deploy_vm.sh`, que llega a la VM con el código. Por eso el primer deploy después de mergear este cambio en `staging` lo hace el admin a mano, con el procedimiento de siempre. Desde ahí, el workflow despliega solo. Para confirmarlo sin esperar un push: *Actions* → *Deploy staging + smoke* → *Run workflow* sobre `staging`.

## 4. Qué pasa si falla

- **Falla el deploy:** el smoke no corre y el pipeline queda en rojo. La VM se queda con el código nuevo pero con el stack viejo levantado, o sin levantar si falló el build. Se ve en el log del job, que muestra `docker ps` y las últimas 40 líneas del log de la API.
- **Falla el smoke:** el pipeline queda en rojo y **se frena la promoción a `main`**, según el criterio de suspensión del [plan de pruebas](PLAN_DE_PRUEBAS.md) §5.
- **No hay rollback automático.** Se revierte el merge en `staging` con un PR de revert, y ese push vuelve a desplegar y a probar la versión anterior. Es deliberado: un rollback automático sobre una base con migraciones (`alembic upgrade head` en el arranque) puede dejar el esquema adelante del código.

## 5. Corridas

| Fecha | Corrida | Qué se probó | Resultado |
|---|---|---|---|
| 19/10/2026 | [39322298675](https://github.com/nexusai-ucc/nexusAI/actions/runs/39322298675) | **Deploy + verificación del commit + smoke completo** sobre `staging` @ `6dc94a0` (primer `workflow_dispatch` después del bootstrap manual) | 🟢 Deploy: rama OK, fast-forward, `nexusai-api` healthy; **DEPLOYED_SHA = commit pusheado**. Smoke: health 0,48 s · chat firmado HTTP 200 con `gpt-4o-mini` en **11,61 s** · anti-replay HTTP 401 |
| 19/10/2026 | [39322438708](https://github.com/nexusai-ucc/nexusAI/actions/runs/39322438708) | **Smoke contra una URL que no responde**: `base_url=https://api.146.181.62.67.nip.io` (el dominio equivocado de la falsa alarma de TPC-07), sin deploy | 🔴 12 reintentos del health durante 2 min con `TLSV1_ALERT_INTERNAL_ERROR`, `FAIL` y **pipeline en rojo** (exit 1) |
| 21/10/2026 | [39665714741](https://github.com/nexusai-ucc/nexusAI/actions/runs/39665714741), intento 1 | **Deploy real** del merge `development` → `staging` (#647) @ `8a06089`, con DEF-09 y DEF-10 | 🔴 La imagen se construyó, pero compose no pudo recrear `nexusai-api`: el nombre temporal del recreate lo tenía un contenedor viejo de un recreate anterior que no había terminado (`Conflict. The container name ... is already in use`). `deploy_vm.sh` cortó sin imprimir `DEPLOYED_SHA`, la verificación del commit falló y el smoke no corrió. Staging siguió atendiendo con la versión anterior |
| 21/10/2026 | [39665714741](https://github.com/nexusai-ucc/nexusAI/actions/runs/39665714741), intento 2 | Re-ejecución del mismo commit después de que el admin borrara el contenedor viejo en la VM | 🟢 **DEPLOYED_SHA = `8a06089`** y smoke completo en verde |

**Con eso se cumplen los tres criterios de la issue:** el workflow de CD está en el repo, hay una ejecución con deploy y smoke en verde, y el smoke pone el pipeline en rojo si staging no responde.

**Observación de la primera corrida.** El chat firmado contra staging, con el LLM real, tardó **11,61 s**, por encima del SLA de 8 s de `TESTING.md` §6. Es una sola muestra: incluye la moderación por LLM, el embedding y la respuesta, y es la primera pregunta después del deploy, así que podría ser *cold start* (el SLA de *cold start* es < 15 s). El smoke no evalúa latencia a propósito, porque su trabajo es decir si el ambiente anda. La latencia con el proveedor real se mide en la corrida chica de [PRUEBAS_DE_CARGA.md](PRUEBAS_DE_CARGA.md) (TPC-09), con varias muestras y un umbral de p95.

**El primer rojo no provocado (21/10).** La corrida roja del 19/10 la provocamos a propósito; la del 21/10 fue real y de una clase que ningún test de código podía ver: estado sucio en el Docker de la VM. La atajó la verificación del commit, que compara lo que quedó en la VM con lo pusheado. Sin ese paso, el pipeline podría haber dado verde con el smoke corriendo contra la versión vieja, que seguía respondiendo. Se resolvió como dice §4: el admin limpió la VM y se re-ejecutó el mismo commit, sin revertir nada.

**Verificado en local antes del primer deploy** (19/10/2026):
- `deploy_vm.sh` contra un repo de prueba con `sudo` y `docker` simulados:
  - el caso feliz imprime el `DEPLOYED_SHA` correcto;
  - falla con mensaje claro ante un ambiente desconocido, sin argumento, la VM en otra rama, commits propios en la VM (sin fast-forward) o la API sin quedar *healthy*.
- `e2e_deployed.py --health-only --expect-env staging` contra staging: ✅ 0,46 s. Con `--expect-env production`: ❌, como se esperaba.
- `actionlint` y `shellcheck` sin observaciones.

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 19/10/2026 | Workflow de CD, script de deploy restringido, smoke con guarda de ambiente, configuración y plan de primeras corridas |
| 1.1 | 19/10/2026 | Primeras corridas reales: verde (deploy + commit verificado + smoke) y roja provocada; observación de latencia |
| 1.2 | 21/10/2026 | Primer rojo real (contenedor viejo en la VM) y su re-ejecución en verde |
