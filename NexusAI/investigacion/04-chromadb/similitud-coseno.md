# Similitud coseno y búsqueda HNSW

Resumen: NexusAI usa similitud coseno con pgvector para comparar vectores de embeddings. La búsqueda es aproximada vía HNSW (Hierarchical Navigable Small Worlds), que es O(log n) y trae top-5 en <30ms sobre 240K vectores en hardware modesto.

## Contexto

La "búsqueda semántica" del RAG se traduce en una operación matemática: encontrar los K vectores más cercanos a un vector de consulta. "Cercano" depende de la métrica de distancia elegida. En pgvector, esta operación se hace directamente en SQL.

## Métricas de distancia disponibles en pgvector

| Operador | Métrica | Rango | Cuándo usarla | Para embeddings |
|---|---|---|---|---|
| `<=>` | Distancia coseno | [0, 2] | Comparación de dirección de vectores, invariante a magnitud. | ✅ Recomendada |
| `<->` | Distancia L2 (euclídea) | [0, ∞) | Sensible a magnitud. | ⚠ OpenAI/Gemini embeddings ya están normalizados, L2 ≈ coseno |
| `<#>` | Producto interno negativo | (-∞, ∞) | Dot product. Requiere vectores normalizados. | ⚠ Solo si sabés lo que hacés |

## Por qué coseno

Los embeddings de OpenAI y Gemini ya están normalizados (norma L2 = 1). Con vectores normalizados:

```
Cosine similarity = dot(a, b) ∈ [-1, 1]
Cosine distance   = 1 - cosine_similarity ∈ [0, 2]
```

Cuanto menor la distancia, más similares los vectores. Un chunk muy relacionado con la query tendrá distancia ~0.1-0.3. Chunks no relacionados rondan 0.8-1.2.

## Umbral de relevancia

No todos los resultados que devuelve pgvector son útiles. Se aplica un umbral de distancia para descartar chunks poco relevantes:

```python
def semantic_search_with_threshold(
    conn,
    course_id: int,
    query_embedding: list[float],
    top_k: int = 5,
    max_distance: float = 0.7,
) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                c.chunk_text,
                c.embedding <=> %s AS distance,
                d.filename,
                c.chunk_index
            FROM nexusai_chunks c
            JOIN nexusai_documents d ON c.document_id = d.id
            WHERE d.course_id = %s
              AND d.status = 'indexed'
              AND c.embedding <=> %s < %s      -- umbral de relevancia
            ORDER BY c.embedding <=> %s
            LIMIT %s
        """, (query_embedding, course_id, query_embedding, max_distance, query_embedding, top_k))

        results = cur.fetchall()

    if not results:
        return []  # Fallback honesto — nada relevante en el material

    return [
        {"text": row[0], "distance": row[1], "filename": row[2], "chunk_index": row[3]}
        for row in results
    ]
```

El umbral exacto se calibra con el dataset de evaluación. Se empieza con 0.7 y se ajusta. Ver `02-rag/evaluacion-rag.md`.

## HNSW — cómo funciona la búsqueda aproximada

HNSW (Hierarchical Navigable Small Worlds) construye un grafo multi-nivel donde:

- El nivel superior tiene pocos nodos conectados a larga distancia.
- Los niveles inferiores agregan más nodos con conexiones locales.
- La búsqueda baja por niveles, refinando el resultado.

Complejidad: **O(log n)** vs O(n) de fuerza bruta.

## Parámetros HNSW en pgvector

| Parámetro | Valor NexusAI | Efecto |
|---|---|---|
| `m` | 16 | Grado del grafo (conexiones por nodo). 16-32 es óptimo para la mayoría de casos. |
| `ef_construction` | 200 | Calidad del grafo al indexar. Más alto = mejor recall, más tiempo de indexación. La indexación es offline, priorizamos calidad. |
| `ef_search` | 50 | Profundidad de búsqueda al hacer query. Más alto = mejor recall, más latencia. |

```sql
-- Crear el índice con los parámetros configurados
CREATE INDEX ON nexusai_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

-- Configurar ef_search en runtime (por sesión o globalmente)
SET hnsw.ef_search = 50;
```

Con 240K vectores y estos parámetros, recall@10 ~ 0.98 vs fuerza bruta, con latencia <30ms en hardware modesto.

## Filtrado por metadata en pgvector

pgvector permite combinar búsqueda vectorial con filtros SQL estándar en la misma query. Esta es una ventaja directa sobre ChromaDB, que tiene un lenguaje de filtros propio más limitado.

```sql
-- Solo chunks de un documento específico
SELECT chunk_text, embedding <=> $1 AS distance
FROM nexusai_chunks
WHERE document_id = $2
ORDER BY embedding <=> $1
LIMIT 5;

-- Solo chunks de un rango de páginas (si se guarda metadata de página)
SELECT c.chunk_text, c.embedding <=> $1 AS distance
FROM nexusai_chunks c
JOIN nexusai_documents d ON c.document_id = d.id
WHERE d.course_id = $2
  AND c.chunk_index BETWEEN $3 AND $4
ORDER BY c.embedding <=> $1
LIMIT 5;

-- Búsqueda híbrida: semántica + keyword (post-MVP)
SELECT c.chunk_text, c.embedding <=> $1 AS distance
FROM nexusai_chunks c
JOIN nexusai_documents d ON c.document_id = d.id
WHERE d.course_id = $2
  AND c.chunk_text ILIKE '%derivada%'   -- filtro keyword adicional
ORDER BY c.embedding <=> $1
LIMIT 5;
```

## Intuición geométrica — qué hace la búsqueda semántica

```
Query: "¿qué es una derivada?"

  dist 0.15 → Chunk: definición formal de derivada         ✅ muy relevante
  dist 0.22 → Chunk: interpretación geométrica de derivada ✅ muy relevante
  dist 0.35 → Chunk: reglas de derivación                  ✅ relevante
  dist 0.68 → Chunk: integrales definidas                  ⚠ dudoso (cerca del umbral)
  dist 0.91 → Chunk: bibliografía                          ❌ descartar
```

Los chunks con distancia < 0.7 pasan el umbral y se incluyen en el contexto del prompt. Los demás se descartan y si no queda ninguno, el asistente responde el fallback honesto.

## Decisiones tomadas para NexusAI

- **Métrica:** coseno (`<=>` en pgvector).
- **HNSW:** `m=16`, `ef_construction=200`, `ef_search=50`.
- **Umbral de relevancia:** `distance < 0.7` (calibrar con dataset de evaluación en Sprint 2).
- **Filtrado:** SQL estándar — `WHERE d.course_id = $2 AND d.status = 'indexed'`.
- El fallback cuando no hay resultados relevantes es un mensaje honesto al alumno, no una respuesta inventada.

## Abierto / pendiente

- [ ] Calibrar umbral real con el dataset de evaluación (Sprint 2).
- [ ] Benchmark latencia con 240K vectores en el hardware de hosting elegido.
- [ ] Evaluar búsqueda híbrida (semántica + keyword) para preguntas con jerga puntual (post-MVP).

## Referencias

- [pgvector — Operadores de distancia](https://github.com/pgvector/pgvector#distance)
- [pgvector — HNSW configuration](https://github.com/pgvector/pgvector#hnsw)
- [Malkov & Yashunin — HNSW paper](https://arxiv.org/abs/1603.09320)
- [Pinecone — Similarity metrics explained](https://www.pinecone.io/learn/vector-similarity/)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
