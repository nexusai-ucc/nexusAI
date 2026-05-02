# text-embedding-3-small

> **Resumen:** Modelo de embeddings elegido para NexusAI. 1536 dimensiones, $0.02 por 1M tokens, excelente relación calidad/precio. Indexar 10.000 chunks cuesta ~$0.10.

---

## Contexto

El modelo de embeddings convierte texto en vectores numéricos. Es la base de la búsqueda semántica: la misma función se usa para indexar los chunks y para vectorizar la pregunta del alumno.

## Modelos disponibles de OpenAI

| Modelo | Dimensiones | Costo / 1M tokens | MTEB score | Uso recomendado |
|---|---|---|---|---|
| `text-embedding-3-small` | 1536 | **$0.02** | 62.3 | **Default NexusAI** — barato, performante. |
| `text-embedding-3-large` | 3072 | $0.13 | 64.6 | Cuando la calidad extra justifica 6× más costo. |
| `text-embedding-ada-002` | 1536 | $0.10 | 61.0 | Legacy — no usar en proyectos nuevos. |

## Por qué text-embedding-3-small

- **Costo bajísimo:** indexar el material completo de una materia (~10.000 chunks de 500 tokens = 5M tokens) cuesta **$0.10**.
- **Latencia baja:** ~100 ms por consulta (embeddear la query del alumno).
- **Calidad suficiente** para Q&A sobre contexto conocido (no es búsqueda web abierta).
- **Compatible con ChromaDB** — se configura el métrica coseno y listo.

## Uso en Python

```python
from openai import OpenAI
client = OpenAI()

def embed(text: str) -> list[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding

# Batch (más eficiente para indexación)
def embed_batch(texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,  # Hasta 2048 entradas por llamada
    )
    return [d.embedding for d in response.data]
```

## Costo de indexación por materia

Escenario realista para una materia UCC:

| Material | Páginas | Tokens aprox | Chunks (500 tok) | Costo |
|---|---|---|---|---|
| Apunte teórico 1 | 50 | 40.000 | 80 | $0.0008 |
| Apunte teórico 2 | 30 | 24.000 | 48 | $0.0005 |
| Guía de ejercicios | 20 | 16.000 | 32 | $0.0003 |
| Paper recomendado | 15 | 12.000 | 24 | $0.0002 |
| **Total por materia** | 115 | 92.000 | 184 | **$0.0018** |

En la práctica, indexar toda una materia cuesta **menos de un centavo de dólar**. Re-indexación completa al cambiar chunking: mismo orden de magnitud.

## Costo de queries en producción

Cada consulta del alumno pasa por un embed:

- Input típico: 50-100 tokens (la pregunta)
- Costo: **~$0.000002 por consulta**
- 500 alumnos × 15 consultas/día × 30 días = 225.000 embeddings/mes
- Total embeddings producción: **~$0.45/mes**

Insignificante comparado con el costo de generación.

## Dimensiones reducidas (truncation)

OpenAI permite pedir el embedding en menos dimensiones (Matryoshka):

```python
response = client.embeddings.create(
    model="text-embedding-3-small",
    input=text,
    dimensions=512,  # En vez de 1536
)
```

**No lo usamos en MVP.** Las 1536 dimensiones nativas consumen 88 MB de RAM por 10.000 vectores — nada. Solo evaluaríamos truncar si escalamos a 100K+ vectores por materia.

## Versionado crítico

**Si cambia el modelo de embeddings, hay que re-indexar todo el material.** Vectores de `text-embedding-3-small` no son comparables con los de `text-embedding-3-large` ni con `ada-002`.

Guardamos el nombre del modelo en los metadata de la colección ChromaDB:

```python
collection = client.get_or_create_collection(
    name=f"course_{course_id}",
    metadata={
        "hnsw:space": "cosine",
        "embedding_model": "text-embedding-3-small",
        "embedding_dim": 1536,
        "created_at": time.time(),
    },
)
```

Si algún día migramos, el script de migración revisa este metadata y hace la re-indexación.

## Decisiones tomadas para NexusAI

- **Default y único modelo del MVP: `text-embedding-3-small`** con 1536 dimensiones nativas.
- **Batch de indexación** de hasta 100 chunks por request (evita rate limits).
- **Guardamos el nombre del modelo** en el metadata de cada colección.
- **No usamos dimension reduction** en el MVP.

## Abierto / pendiente

- [ ] Comparar retrieval quality entre `small` y `large` con el dataset de evaluación (Sprint 2).
- [ ] Implementar batch rate limiting (no más de N embeddings/min al indexar) para evitar 429.
- [ ] Script de migración de modelo de embeddings documentado para post-MVP.

## Referencias

- [OpenAI — Embeddings guide](https://platform.openai.com/docs/guides/embeddings)
- [OpenAI — text-embedding-3 announcement](https://openai.com/index/new-embedding-models-and-api-updates/)
- [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
