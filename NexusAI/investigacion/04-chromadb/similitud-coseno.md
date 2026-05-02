# Similitud coseno y búsqueda HNSW

> **Resumen:** NexusAI usa **similitud coseno** en ChromaDB para comparar vectores de embeddings. La búsqueda es aproximada vía HNSW (Hierarchical Navigable Small Worlds), que es O(log n) y trae top-5 en <30ms sobre 10K vectores.

---

## Contexto

La "búsqueda semántica" del RAG se traduce en una operación matemática: encontrar los K vectores más cercanos a un vector de consulta. "Cercano" depende de la métrica de distancia elegida.

## Métricas de distancia disponibles en ChromaDB

| Métrica | Rango | Cuándo usarla | Para embeddings OpenAI |
|---|---|---|---|
| **Cosine** (`hnsw:space: cosine`) | [0, 2] | Comparación de dirección de vectores, invariante a magnitud. | ✅ **Recomendada.** |
| Squared L2 (`l2`) | [0, ∞) | Distancia euclídea. Sensible a magnitud. | ⚠ OpenAI embeddings ya están normalizados, L2 ≈ cosine. |
| Inner product (`ip`) | (-∞, ∞) | Dot product. Requiere vectores normalizados. | ⚠ Solo si sabés lo que hacés. |

## Por qué coseno

Los embeddings de OpenAI ya están normalizados (norma L2 = 1). Con vectores normalizados:

- **Cosine similarity** = `dot(a, b)` ∈ [-1, 1]
- **Cosine distance** = `1 - cosine_similarity` ∈ [0, 2]

Cuanto **menor** la distancia, más similares los vectores. Un chunk perfectamente relacionado con la query tendría distancia ~0.1-0.3. Chunks no relacionados rondan 0.8-1.2.

## Qué umbral usar

Heurística práctica:

```python
results = collection.query(query_embeddings=[qvec], n_results=10)
distances = results["distances"][0]

# Regla dura: descartar chunks con distancia > 0.7
relevant = [
    (doc, meta, dist)
    for doc, meta, dist in zip(results["documents"][0], results["metadatas"][0], distances)
    if dist < 0.7
][:5]  # Tope de 5 chunks

if not relevant:
    # Fallback honesto — nada relevante en el material
    return "No encuentro esta información..."
```

**El umbral exacto se calibra con el dataset de evaluación.** Empezamos con 0.7 y ajustamos. Ver [02-rag/evaluacion-rag.md](../02-rag/evaluacion-rag.md).

## HNSW — cómo funciona la búsqueda aproximada

HNSW (Hierarchical Navigable Small Worlds) construye un grafo multi-nivel donde:

- El nivel superior tiene pocos nodos conectados a larga distancia.
- Los niveles inferiores agregan más nodos con conexiones locales.
- La búsqueda baja por niveles, refinando el resultado.

**Complejidad:** O(log n) vs O(n) de fuerza bruta.

### Parámetros HNSW en ChromaDB

| Parámetro | Default | Efecto |
|---|---|---|
| `hnsw:construction_ef` | 100 | Calidad del grafo al insertar. Más alto = mejor recall, más RAM y tiempo de indexación. |
| `hnsw:search_ef` | 10 | Profundidad de búsqueda al query. Más alto = mejor recall, más latencia. |
| `hnsw:M` | 16 | Grado del grafo (conexiones por nodo). 16-32 suele ser óptimo. |

### Configuración recomendada para NexusAI

```python
collection = client.get_or_create_collection(
    name=f"course_{course_id}",
    metadata={
        "hnsw:space": "cosine",
        "hnsw:construction_ef": 200,  # Priorizamos calidad — indexación es offline
        "hnsw:search_ef": 50,         # Más lento que default pero más preciso
        "hnsw:M": 16,                 # Default
    },
)
```

Con 10K vectores y estos parámetros, **recall@10 ~ 0.98** vs fuerza bruta, con latencia <30ms.

## Filtrado por metadata

ChromaDB permite combinar búsqueda vectorial con filtros exactos sobre metadata:

```python
# Solo chunks de un archivo específico
results = collection.query(
    query_embeddings=[qvec],
    n_results=5,
    where={"file_id": "f_1234"},
)

# Combinaciones con operadores
results = collection.query(
    query_embeddings=[qvec],
    n_results=5,
    where={
        "$and": [
            {"course_id": str(course_id)},
            {"page": {"$gte": 10}},
            {"page": {"$lte": 50}},
        ]
    },
)

# Filtrado por contenido del texto (substring)
results = collection.query(
    query_embeddings=[qvec],
    n_results=5,
    where_document={"$contains": "derivada"},
)
```

**Uso previsto en NexusAI:**

- `where={"course_id": ...}` (defensivo, aunque la colección ya está por curso).
- `where_document` para post-MVP (ej. "responder solo con chunks que mencionen X").

## Visualización — intuición geométrica

```mermaid
flowchart TB
    Q([Query: ¿qué es una derivada?]) -.dist 0.15.-> C1[Chunk: definición formal de derivada]
    Q -.dist 0.22.-> C2[Chunk: interpretación geométrica de la derivada]
    Q -.dist 0.35.-> C3[Chunk: reglas de derivación]
    Q -.dist 0.68.-> C4[Chunk: integrales definidas]
    Q -.dist 0.91.-> C5[Chunk: bibliografía]

    style C1 fill:#8f8,color:#000
    style C2 fill:#8f8,color:#000
    style C3 fill:#bfb,color:#000
    style C4 fill:#fc8,color:#000
    style C5 fill:#f88,color:#000
```

Verde oscuro = muy relevante, verde claro = relevante, naranja = dudoso, rojo = descartar.

## Decisiones tomadas para NexusAI

- **Métrica:** cosine.
- **HNSW:** `construction_ef=200`, `search_ef=50`, `M=16`.
- **Umbral de relevancia:** distance < 0.7 (calibrar con dataset de evaluación).
- **Filtrado defensivo** por `course_id` además del aislamiento por colección.

## Abierto / pendiente

- [ ] Calibrar umbral real con el dataset de evaluación (Sprint 2).
- [ ] Benchmark latencia con 10K vectores en Railway Hobby.
- [ ] Evaluar si agregar `where_document` por keyword mejora retrieval en preguntas con jerga puntual.

## Referencias

- [Malkov & Yashunin — *Efficient and Robust Approximate Nearest Neighbor Search using HNSW*](https://arxiv.org/abs/1603.09320)
- [ChromaDB — HNSW configuration](https://docs.trychroma.com/usage-guide#changing-the-distance-function)
- [Pinecone — Similarity metrics explained](https://www.pinecone.io/learn/vector-similarity/)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
