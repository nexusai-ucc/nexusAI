# Init scripts de PostgreSQL

Estos scripts los corre automáticamente la imagen `pgvector/pgvector:pg16` **una sola vez**, durante la inicialización del volumen `postgres_data`. Si querés re-ejecutarlos, tenés que borrar el volumen:

```bash
docker compose down -v
docker compose up -d postgres
```

## Orden de ejecución

Los scripts se ejecutan en orden alfabético:

| Archivo | Qué hace |
|---|---|
| `01-create-databases.sh` | Crea las DBs `nexusai` (backend) y `moodle` (con profile `full`) |
| `02-enable-pgvector.sh` | Habilita `CREATE EXTENSION vector` en la DB `nexusai` |

## Verificar que se ejecutaron correctamente

```bash
# Conectar al postgres del compose
docker compose exec postgres psql -U nexusai -d nexusai

# Listar DBs
\l

# Verificar pgvector en nexusai
\dx
```

Deberías ver `nexusai`, `moodle` y la extensión `vector` listadas.

## Agregar migraciones nuevas

Estos scripts SOLO crean las DBs y la extensión. Las **migraciones de schema** (crear tablas `nexusai_documents`, `nexusai_chunks`, etc.) viven en `services/api/migrations/` y las corre el backend al arrancar (a implementar en Sprint 1).
