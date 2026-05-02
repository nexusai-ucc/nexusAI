# Embeddings — Decisión de modelo

Resumen: NexusAI usa embeddings para la búsqueda semántica del RAG. En el MVP se usan embeddings de **Gemini** (gratuitos, parte del mismo tier) o **nomic-embed-text vía Ollama** (local, sin costo). Para producción se escala a **text-embedding-3-small de OpenAI** ($0.02/M tokens). La decisión de modelo de embedding es independiente a la del LLM de chat.

## Contexto

El modelo de embeddings convierte texto en vectores numéricos. Es la base de la búsqueda semántica del RAG: la misma función se usa para indexar los chunks del material del curso y para vectorizar la pregunta del alumno en cada consulta.

Una consideración importante para NexusAI: el sistema opera principalmente con **contenido en español**. Los modelos entrenados predominantemente en inglés pueden tener menor calidad semántica sobre textos en español.

## Modelos evaluados

| Modelo | Proveedor | Dimensiones | Costo | Soporte español | Uso en NexusAI |
|---|---|---|---|---|---|
| Gemini Embedding | Google | 768 / 3.072 | Gratuito (tier free) | Bueno (multilingüe) | **Default MVP (opción A)** |
| nomic-embed-text | Ollama (local) | 768 | Gratuito (hardware propio) | Bueno | **Default MVP (opción B)** |
| multilingual-e5-large | HuggingFace (local) | 1.024 | Gratuito (local) | Excelente | Alternativa MVP si calidad en español es prioritaria |
| text-embedding-3-small | OpenAI | 1.536 | $0.02/M tokens | Bueno | **Default producción** |
| text-embedding-3-large | OpenAI | 3.072 | $0.13/M tokens | Bueno | Solo si calidad extra justifica 6× más costo |
| text-embedding-ada-002 | OpenAI | 1.536 | $0.10/M tokens | Regular | Legacy — no usar en proyectos nuevos |

## Por qué text-embedding-3-small para producción

- **Costo bajísimo:** indexar el material completo de una materia (~10.000 chunks de 500 tokens = 5M tokens) cuesta $0.10.
- **Latencia baja:** ~100 ms por consulta (embeddear la query del alumno).
- **Calidad suficiente** para Q&A sobre contexto conocido (no es búsqueda web abierta).
- **Compatible con pgvector** — se configura métrica coseno como índice HNSW y listo.
- **1.536 dimensiones** están dentro del límite nativo de pgvector para HNSW (2.000 dims), sin necesidad de `halfvec`.

## Por qué nomic-embed-text o Gemini Embedding para el MVP

- **Costo cero:** no consumen cuota de API paga.
- **768 dimensiones** son suficientes para la escala del MVP.
- Gemini Embedding viene incluido en el mismo tier gratuito que Gemini 2.5 Flash — un solo proveedor para LLM y embeddings en el MVP simplifica la configuración.
- nomic-embed-text corre localmente vía Ollama: sin latencia de red, sin dependencia de disponibilidad de API externa.

## Capa de abstracción del proveedor de embeddings

Al igual que con el LLM, el modelo de embedding se configura vía variables de entorno:

```python
import os
from openai import OpenAI

class EmbeddingProvider:
    def __init__(self):
        self.model = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")
        self.client = OpenAI(
            api_key=os.getenv("EMBEDDING_API_KEY"),
            base_url=os.getenv("EMBEDDING_BASE_URL",
                "https://generativelanguage.googleapis.com/v1beta/openai/"),
        )
        self.dimensions = int(os.getenv("EMBEDDING_DIMENSIONS", "768"))

    def embed(self, text: str) -> list[float]:
        response = self.client.embeddings.create(
            model=self.model,
            input=text,
        )
        return response.data[0].embedding

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        response = self.client.embeddings.create(
            model=self.model,
            input=texts,  # Hasta 2048 entradas por llamada en OpenAI
        )
        return [d.embedding for d in response.data]
```

Variables de entorno por entorno:

```bash
# MVP (Gemini Embedding — gratuito)
EMBEDDING_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
EMBEDDING_API_KEY=<gemini_api_key>
EMBEDDING_MODEL=models/text-embedding-004
EMBEDDING_DIMENSIONS=768

# Producción (text-embedding-3-small — pago)
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_API_KEY=<openai_api_key>
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
```

## Almacenamiento en PostgreSQL con pgvector

Los embeddings se almacenan como columna `vector(N)` en la tabla `nexusai_chunks`. El tamaño de la columna debe coincidir con las dimensiones del modelo activo. Esto es crítico al cambiar de modelo:

```sql
-- MVP con 768 dims (Gemini / nomic-embed-text)
ALTER TABLE nexusai_chunks ADD COLUMN embedding vector(768);

-- Producción con 1536 dims (text-embedding-3-small)
ALTER TABLE nexusai_chunks ADD COLUMN embedding vector(1536);

-- Índice HNSW con distancia coseno
CREATE INDEX ON nexusai_chunks USING hnsw (embedding vector_cosine_ops);
```

## Versionado crítico — migración entre modelos

**Si cambia el modelo de embeddings, hay que re-indexar todo el material.** Los vectores de Gemini Embedding no son comparables con los de text-embedding-3-small porque viven en espacios vectoriales distintos.

Para manejar esto, guardamos el modelo activo en la tabla de documentos:

```sql
ALTER TABLE nexusai_documents ADD COLUMN embedding_model VARCHAR(100);
```

El script de re-indexación filtra por `embedding_model != current_model` y re-procesa solo los documentos afectados.

## Costo de indexación por materia (producción con text-embedding-3-small)

| Material | Páginas | Tokens aprox | Chunks (500 tok) | Costo |
|---|---|---|---|---|
| Apunte teórico 1 | 50 | 40.000 | 80 | $0.0008 |
| Apunte teórico 2 | 30 | 24.000 | 48 | $0.0005 |
| Guía de ejercicios | 20 | 16.000 | 32 | $0.0003 |
| Paper recomendado | 15 | 12.000 | 24 | $0.0002 |
| **Total por materia** | **115** | **92.000** | **184** | **$0.0018** |

Indexar toda una materia cuesta menos de un centavo de dólar. Re-indexación completa: mismo orden de magnitud.

## Costo de queries en producción

Cada consulta del alumno genera un embedding de la pregunta:

- Input típico: 50-100 tokens (la pregunta)
- Costo con text-embedding-3-small: ~$0.000002 por consulta
- 500 alumnos × 15 consultas/día × 30 días = 225.000 embeddings/mes
- **Total embeddings producción: ~$0.45/mes** — insignificante comparado con el costo de generación.

## Decisiones tomadas para NexusAI

- **MVP:** Gemini Embedding (gratuito, mismo proveedor que el LLM) o nomic-embed-text vía Ollama. A definir en Sprint 1 según facilidad de setup.
- **Producción / proyecto final:** text-embedding-3-small con 1.536 dimensiones nativas.
- **Arquitectura agnóstica:** clase `EmbeddingProvider` con configuración vía variables de entorno, igual que el LLM.
- **Dimensiones del MVP:** 768 (Gemini / nomic). Al migrar a producción, re-indexación completa y actualización del schema de pgvector.
- Batch de indexación de hasta 100 chunks por request para evitar rate limits.
- No se usa dimension reduction (Matryoshka) en el MVP.

## Abierto / pendiente

- [ ] Decidir entre Gemini Embedding y nomic-embed-text en Sprint 1 (trade-off: simplicidad de proveedor único vs independencia de API externa).
- [ ] Comparar retrieval quality en español entre los modelos candidatos con un dataset de evaluación (Sprint 2).
- [ ] Implementar batch rate limiting al indexar para evitar errores 429.
- [ ] Script de migración de modelo de embeddings documentado para el salto MVP → producción.

## Referencias

- [Google Gemini API — Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)
- [Ollama — nomic-embed-text](https://ollama.com/library/nomic-embed-text)
- [OpenAI — Embeddings guide](https://platform.openai.com/docs/guides/embeddings)
- [OpenAI — text-embedding-3 announcement](https://openai.com/blog/new-embedding-models-and-api-updates)
- [pgvector — HNSW indexing](https://github.com/pgvector/pgvector#hnsw)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
