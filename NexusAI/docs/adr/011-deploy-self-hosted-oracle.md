# ADR-011: Deploy self-hosted en Oracle Cloud — retiro de Railway y Fly.io

| | |
|---|---|
| **Estado** | ✅ Aceptada |
| **Fecha** | 2026-09-07 |
| **Autor/es** | Santiago Tricherri |
| **Decididores** | Equipo NexusAI |

---

## Contexto

El backend de NexusAI pasó por **tres destinos de deploy** a lo largo del proyecto. Los dos primeros dejaron archivos de configuración en el repositorio que sobrevivieron a la migración:

| Etapa | Destino | Cuándo | Por qué se dejó |
|---|---|---|---|
| 1 | **Railway** (Hobby, $5/mes) | MVP / defensa ante jurado | Costo mensual recurrente; el free tier no alcanzaba |
| 2 | **Fly.io** (`nexusai-api-ucc`, región `gru`) | Post-MVP temprano | 512 MB y `auto_stop_machines`; sin volumen persistente confiable para Postgres |
| 3 | **Oracle Cloud Always Free** | Desde 2026-08-05 | Actual — ver [`docs/DEPLOY_ORACLE.md`](../DEPLOY_ORACLE.md) e issue #318 (DEPLOY-02) |

Al 2026-09-07, **ninguno de los dos primeros existe ya**:

- `https://nexusai-production-e414.up.railway.app/health` → `404` (la aplicación fue dada de baja).
- `https://nexusai-api-ucc.fly.dev/health` → el dominio ni siquiera resuelve.

El problema no era solo de prolijidad. El workflow `.github/workflows/deploy.yml` seguía **activo y ejecutándose** en cada push a `main`, intentando desplegar a un Fly.io inexistente. Los últimos ocho runs terminaron en `failure` (~12 s cada uno, sin `FLY_API_TOKEN` configurado). Es decir: el repositorio mostraba una CI en rojo de forma permanente por una infraestructura abandonada, y esa señal ruidosa competía con las fallas reales.

Peor aún, existían **dos copias divergentes** del mismo workflow:

- `.github/workflows/deploy.yml` (raíz) — sí se ejecutaba, con paths `NexusAI/services/api/**`.
- `NexusAI/.github/workflows/deploy.yml` — nunca se ejecutó, porque GitHub Actions solo lee workflows desde `.github/workflows/` en la **raíz** del repositorio. Tenía paths `services/api/**` y un step extra de migraciones que la copia viva no tenía.

## Decisión

**Se elimina del repositorio toda la configuración de deploy que no sea Oracle Cloud**, y se registra acá lo que existió para no perder la trazabilidad.

Archivos eliminados en esta decisión:

| Archivo | Qué era |
|---|---|
| `.github/workflows/deploy.yml` | GitHub Action que desplegaba a Fly.io en push a `main`. Fallaba en cada ejecución. |
| `NexusAI/.github/workflows/deploy.yml` | Copia divergente del anterior, en una ruta donde GitHub Actions no la lee. Nunca se ejecutó. |
| `NexusAI/services/api/fly.toml` | Configuración de la app Fly.io `nexusai-api-ucc` (región `gru`, `shared-cpu-1x`, 512 MB). |
| `NexusAI/railway.json` | Configuración de build/deploy de Railway (builder Dockerfile, healthcheck en `/health`). |

Referencias textuales corregidas: `docs/CORRER_PROYECTO.md` y `PLAN_NUEVAS_FEATURES.md` describían Fly.io/Railway como el entorno de producción vigente.

**Queda explícitamente fuera de alcance** la documentación histórica: `entrega-final/`, `informe-ipi/`, `investigacion/` y `CHANGELOG.md` **no se modifican**. Esos documentos describen Railway y Fly.io porque era cierto en el momento en que se escribieron; varios ya fueron entregados formalmente. Reescribirlos sería falsificar el registro del proyecto, no limpiarlo. La evolución Railway → Fly.io → Oracle es parte de la historia técnica y este ADR es su índice.

## Alternativas evaluadas

**Conservar los archivos "por las dudas".** Descartada. Ninguna de las dos plataformas tiene una cuenta activa detrás, así que los archivos no son reutilizables tal cual: reactivar cualquiera de las dos exigiría crear la app de nuevo y regenerar credenciales, momento en el cual `fly launch` o el dashboard de Railway generan su propia configuración. El costo de conservarlos era concreto (CI en rojo permanente); el beneficio, nulo. El contenido queda además en el historial de git y resumido en este ADR.

**Desactivar el workflow en vez de borrarlo** (comentar el `on:` o dejarlo solo con `workflow_dispatch`). Descartada. Resuelve el síntoma —la CI en rojo— pero deja en el repositorio un archivo que alguien puede reactivar por error, y no explica nada a quien lo encuentre dentro de seis meses. Un ADR comunica mejor que un workflow muerto y comentado.

**Migrar el workflow para que despliegue a Oracle por SSH.** Descartada *por ahora*, no por siempre. Requiere cargar la clave SSH privada de la VM como secret de GitHub, lo que amplía la superficie de exposición de una credencial que hoy tiene una sola persona. Además el deploy manual no es hoy el cuello de botella del proyecto. Queda anotado como pendiente opcional en `docs/DEPLOY_ORACLE.md`.

## Consecuencias

**Ganamos:**
- La CI deja de fallar de forma permanente por infraestructura inexistente. Un check en rojo vuelve a significar algo.
- Un solo destino de deploy documentado, sin archivos que sugieran alternativas que no funcionan.
- Trazabilidad explícita de las tres etapas en un único documento.

**Perdemos:**
- La configuración de Fly.io y Railway deja de estar a mano en el árbol de trabajo. Mitigación: sigue en el historial de git (`git log --diff-filter=D --` sobre las rutas de la tabla de arriba) y resumida acá.

**Sin impacto:** el deploy real no cambia en absoluto. Sigue siendo manual por SSH sobre las dos VMs de Oracle, exactamente como antes de este ADR.

## Cuándo revisar

- Si el proyecto migra a la infraestructura de UCC (Moodle institucional) — escenario descrito en [`docs/diagrams/deployment.md`](../diagrams/deployment.md).
- Si se decide automatizar el deploy con CI/CD, momento en que hay que resolver primero el manejo de la clave SSH como secret.
- Si Oracle discontinúa o recorta el Always Free tier y hay que volver a un proveedor pago.
