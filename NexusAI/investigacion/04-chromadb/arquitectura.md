# ChromaDB — arquitectura y modo de uso

> **Resumen:** ChromaDB es una base vectorial open-source. Para NexusAI MVP usamos modo **in-process** (embebido en el mismo contenedor FastAPI), con persistencia en disco. 10.000 vectores × 1536 dim = ~88 MB RAM. Sobra con un VPS de 2 GB.

---

## Contexto

Necesitamos una base vectorial rápida, barata y que se integre con Python. Las alternativas evaluadas fueron ChromaDB, Pinecone, Weaviate, Qdrant y pgvector.

## Alternativas comparadas

| Base | Tipo | Pros | Contras | Descartamos porque |
|---|---|---|---|---|
| **ChromaDB** | Embedded / server | Open-source, simple, Python-first, embebido en proceso sin overhead. | Joven (v0.x). Single-node salvo Chroma Cloud. | — **Elegida.** |
| Pinecone | Managed cloud | Performance top, filtros poderosos. | $70+/mes mínimo. Vendor lock-in. | Costo prohibitivo para PI académico. |
| Weaviate | Server | Schema rico, módulos de transformers. | Requiere server dedicado. | Overkill para 10K vectores. |
| Qdrant | Server | Rust, muy rápido, self-host o cloud. | Algo más verbose que Chroma. | Chroma cubre nuestro caso con menos setup. |
| pgvector | Extension Postgres | Usa la misma DB que Moodle. | Performance decae en >100K filas sin tuning serio. | Nos ata a Postgres y mezcla dominios. |

## Modos de uso de ChromaDB

### Modo in-process (lo que usamos)

La base vive dentro del proceso FastAPI. Sin servidor separado, sin overhead de red.

```python
import chromadb

client = chromadb.PersistentClient(path="/data/chromadb")
collection = client.get_or_create_collection(
    name="course_mat101",
    metadata={"hnsw:space": "cosine"},
)
```

- `PersistentClient(path=...)` persiste en disco.
- Sin `path` → `EphemeralClient` (memoria, desaparece al reiniciar — útil solo para tests).

### Modo server (cuando escalemos)

```bash
pip install chromadb
chroma run --path /data/chromadb --host 0.0.0.0 --port 8000
```

```python
client = chromadb.HttpClient(host="chromadb", port=8000)
```

Post-MVP, si FastAPI escala horizontalmente, movemos ChromaDB a un servicio dedicado.

## Colecciones y namespacing

Una **colección por materia**. El nombre codifica el curso:

```python
def get_course_collection(course_id: int) -> chromadb.Collection:
    return client.get_or_create_collection(
        name=f"course_{course_id}",
        metadata={
            "hnsw:space": "cosine",
            "embedding_model": "text-embedding-3-small",
            "embedding_dim": 1536,
            "course_id": str(course_id),
            "created_at": time.time(),
        },
    )
```

Por qué una colección por curso y no una global con filtro:

- **Aislamiento real** entre materias — imposible filtrar mal y traer chunks de otro curso.
- **Performance:** HNSW escala mejor en colecciones más chicas.
- **Borrado simple:** si el docente pide borrar todo el material de una materia, `client.delete_collection(name)` y listo.

## Insertar chunks

```python
collection.add(
    ids=[f"{file_id}_{i}" for i in range(len(chunks))],
    embeddings=embed_batch([c["text"] for c in chunks]),
    metadatas=[{
        "file_id": c["file_id"],
        "file_name": c["file_name"],
        "page": c["page"],
        "chunk_idx": i,
    } for i, c in enumerate(chunks)],
    documents=[c["text"] for c in chunks],
)
```

## Buscar

```python
results = collection.query(
    query_embeddings=[embed(question)],
    n_results=5,
    where={"course_id": str(course_id)},  # Redundante con la colección, pero defensivo
)
# results["documents"][0] → top-5 textos
# results["metadatas"][0] → metadata de cada uno
# results["distances"][0] → distancias (menor = más similar, en coseno)
```

## Re-indexación de un archivo

Cuando el docente actualiza un PDF:

```python
# Borrar chunks viejos del archivo
collection.delete(where={"file_id": file_id})

# Insertar los nuevos
collection.add(...)
```

## Persistencia y backup

- ChromaDB persiste en `/data/chromadb/` como SQLite + parquet.
- **Backup:** `rsync` o snapshot del volumen Docker.
- **Rebuild from scratch:** si se corrompe, se puede re-indexar desde los archivos de Moodle — ChromaDB no es la fuente de verdad, es caché.

## Requerimientos de recursos

| Escenario | Vectores | RAM necesaria | Disco |
|---|---|---|---|
| 1 materia, 200 chunks | 200 | <5 MB | <10 MB |
| 10 materias, 2K chunks c/u | 20.000 | ~180 MB | ~300 MB |
| Institución completa, 100K chunks | 100.000 | ~900 MB | ~1.5 GB |

**VPS de 2 GB RAM sobra** para el MVP.

## Decisiones tomadas para NexusAI

- **ChromaDB en modo `PersistentClient`** dentro del contenedor FastAPI.
- **Una colección por curso**, nombre `course_{course_id}`.
- **Metadata rica** (`file_id`, `file_name`, `page`, `chunk_idx`).
- **Distancia coseno** (`hnsw:space: cosine`).
- **Path persistente** en volumen Docker (`/data/chromadb`).

## Abierto / pendiente

- [ ] Decidir política de backup (frecuencia, retención).
- [ ] Evaluar Chroma Cloud si saltamos de single-node (post-MVP).
- [ ] Benchmark real de búsqueda con 10K vectores en Raspberry-class hardware (docente con Moodle low-cost).

## Referencias

- [ChromaDB docs](https://docs.trychroma.com/)
- [ChromaDB — Production deployment](https://docs.trychroma.com/production)
- [HNSW paper (Malkov & Yashunin)](https://arxiv.org/abs/1603.09320)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
