# pgvector — Arquitectura y decisión

Resumen: NexusAI usa **pgvector** como solución de almacenamiento vectorial, sobre el mismo PostgreSQL del sistema. Esto elimina ChromaDB como componente separado, permite queries SQL+vector en una sola operación, y es suficiente para la escala proyectada del proyecto (~240K vectores por institución).

## Contexto

Necesitamos almacenar embeddings de chunks de documentos y hacer búsqueda semántica eficiente sobre ellos. Las alternativas evaluadas fueron ChromaDB, pgvector, Qdrant, Weaviate y Pinecone.

## Alternativas comparadas

| Base | Tipo | Pros | Contras | Decisión |
|---|---|---|---|---|
| **pgvector** | Extensión PostgreSQL | Un solo sistema con los datos relacionales. Queries SQL+vector en una sola operación. Sin sincronización cross-sistema. | Requiere tuning para datasets muy grandes. | ✅ **Elegida** |
| ChromaDB | Embedded / server | Simple, Python-first, arranque rápido. | Sistema separado de PostgreSQL que hay que operar y sincronizar. Filtrado por metadata básico vs SQL nativo. | ❌ Descartada |
| Pinecone | Managed cloud | Performance top, filtros poderosos. | $70+/mes mínimo. Vendor lock-in. | ❌ Descartada |
| Weaviate | Server | Schema rico, módulos de transformers. | Requiere servidor dedicado. Overkill para la escala del proyecto. | ❌ Descartada |
| Qdrant | Server | Rust, muy rápido, self-host o cloud. | Justificado a partir de volúmenes muy grandes. Complejidad operacional innecesaria. | ❌ Descartada |

## Por qué pgvector es la decisión correcta para NexusAI

### 1. Un solo sistema de datos
PostgreSQL ya es una dependencia obligatoria del sistema (datos relacionales de usuarios, cursos, conversaciones). Agregar ChromaDB significaría operar, deployar y mantener dos bases de datos en lugar de una. Con pgvector, todo vive en el mismo sistema.

### 2. Queries SQL+vector en una sola operación
Una query típica de NexusAI es: _"dame los 5 chunks más similares a esta pregunta, pero solo de los documentos del curso 42, que no estén marcados como eliminados"_.

Con pgvector, esto es una sola query SQL:

```sql
SELECT
    c.chunk_text,
    c.embedding <=> $1 AS distance,
    d.filename,
    d.course_id
FROM nexusai_chunks c
JOIN nexusai_documents d ON c.document_id = d.id
WHERE d.course_id = $2
  AND d.status = 'indexed'
ORDER BY c.embedding <=> $1
LIMIT 5;
```

Con ChromaDB + PostgreSQL separados, esto serían dos llamadas y lógica de coordinación en Python.

### 3. La escala proyectada está dentro del rango cómodo de pgvector

| Escenario | Vectores estimados |
|---|---|
| UCC completa (200 materias × 30 docs × 40 chunks) | ~240.000 vectores |
| 5 instituciones | ~1.200.000 vectores |
| 20 instituciones | ~4.800.000 vectores |

pgvector con índice HNSW maneja varios millones de vectores en hardware modesto. El threshold donde se justifica una base vectorial dedicada es alrededor de 10-50M vectores con alta concurrencia — muy por encima del escenario de NexusAI incluso en expansión multi-institución.

**Modelo de deployment:** una instancia por institución. Cada universidad instala NexusAI en su propio servidor. El volumen de vectores por instancia siempre está acotado a los datos de esa institución.

## Habilitación de pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Se incluye en el script de instalación del plugin o en el setup inicial del servidor.

## Schema de la tabla de chunks

```sql
CREATE TABLE nexusai_chunks (
    id           BIGSERIAL PRIMARY KEY,
    document_id  BIGINT NOT NULL REFERENCES nexusai_documents(id) ON DELETE CASCADE,
    chunk_index  INT NOT NULL,
    chunk_text   TEXT NOT NULL,
    token_count  INT NOT NULL,
    embedding    vector(1536),  -- dimensiones según el modelo activo
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- Índice HNSW con distancia coseno
CREATE INDEX ON nexusai_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);
```

**Nota sobre dimensiones:** el tamaño de la columna `vector(N)` debe coincidir con las dimensiones del modelo de embeddings activo. En el MVP con Gemini Embedding o nomic-embed-text (768 dims) se usa `vector(768)`. En producción con text-embedding-3-small (1.536 dims) se usa `vector(1536)`. Al cambiar de modelo, es necesaria una migración del schema y re-indexación completa.

## Inserción de chunks

```python
import psycopg2
import numpy as np

def insert_chunks(conn, document_id: int, chunks: list[dict], embeddings: list[list[float]]):
    with conn.cursor() as cur:
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            cur.execute("""
                INSERT INTO nexusai_chunks
                    (document_id, chunk_index, chunk_text, token_count, embedding)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                document_id,
                i,
                chunk["text"],
                chunk["token_count"],
                embedding,  # psycopg2 + pgvector lo serializa automáticamente
            ))
    conn.commit()
```

## Búsqueda semántica

```python
def semantic_search(conn, course_id: int, query_embedding: list[float], top_k: int = 5):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                c.id,
                c.chunk_text,
                c.embedding <=> %s AS distance,
                d.filename,
                d.course_id
            FROM nexusai_chunks c
            JOIN nexusai_documents d ON c.document_id = d.id
            WHERE d.course_id = %s
              AND d.status = 'indexed'
            ORDER BY c.embedding <=> %s
            LIMIT %s
        """, (query_embedding, course_id, query_embedding, top_k))
        return cur.fetchall()
```

El operador `<=>` es la distancia coseno de pgvector. Cuanto menor el valor, más similar el chunk a la query.

## Re-indexación de un documento

Cuando el docente actualiza un PDF, se borran los chunks viejos y se insertan los nuevos. La clave externa con `ON DELETE CASCADE` en `nexusai_chunks(document_id)` simplifica el borrado:

```python
def reindex_document(conn, document_id: int):
    with conn.cursor() as cur:
        # Borrar chunks viejos (CASCADE borra automáticamente si se elimina el documento)
        cur.execute("DELETE FROM nexusai_chunks WHERE document_id = %s", (document_id,))
        cur.execute("UPDATE nexusai_documents SET status = 'pending' WHERE id = %s", (document_id,))
    conn.commit()
    # Luego el worker de indexación procesa el documento nuevamente
```

## Requerimientos de recursos

| Escenario | Vectores | RAM (índice HNSW) | Disco |
|---|---|---|---|
| 1 materia, 200 chunks | 200 | <5 MB | <10 MB |
| 10 materias, 2K chunks c/u | 20.000 | ~180 MB | ~300 MB |
| UCC completa, 240K chunks | 240.000 | ~2 GB | ~3.5 GB |

Un VPS de 4 GB RAM cubre la UCC completa con margen. Para el MVP, 2 GB son suficientes.

## Backup

PostgreSQL incluye herramientas nativas de backup (`pg_dump`). No hay sistema separado que respaldar. Si la base se corrompe, los documentos originales viven en Moodle y se puede re-indexar desde cero — PostgreSQL no es la fuente de verdad de los archivos, solo de los chunks y vectores.

## Decisiones tomadas para NexusAI

- **pgvector sobre PostgreSQL** como única base de datos del sistema. Sin ChromaDB.
- **Índice HNSW** con distancia coseno (`vector_cosine_ops`), `m=16`, `ef_construction=200`.
- **Dimensiones del MVP:** `vector(768)` (Gemini Embedding / nomic-embed-text). Al migrar a producción, migración a `vector(1536)` y re-indexación completa.
- **ON DELETE CASCADE** en `nexusai_chunks` para simplificar re-indexación.
- Backup vía `pg_dump` estándar de PostgreSQL.

## Abierto / pendiente

- [ ] Decidir dimensiones definitivas del MVP (768 vs 1536) según el modelo de embeddings elegido en Sprint 1.
- [ ] Script de migración de schema para el salto MVP → producción (768 → 1536 dims).
- [ ] Benchmark de latencia de búsqueda con 240K vectores en el hardware de hosting elegido.
- [ ] Definir política de backup (frecuencia, retención).

## Referencias

- [pgvector — GitHub](https://github.com/pgvector/pgvector)
- [pgvector — HNSW indexing](https://github.com/pgvector/pgvector#hnsw)
- [Malkov & Yashunin — HNSW paper](https://arxiv.org/abs/1603.09320)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
