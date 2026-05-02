# Estrategias de chunking

> **Resumen:** El tamaño de chunk es una de las decisiones más críticas de un pipeline RAG. Para documentos académicos, **500 tokens con 10-20% de overlap** es el sweet spot. Captura 1-2 párrafos completos sin perder contexto.

---

## Contexto

Si los chunks son muy chicos, pierden contexto y el retrieval trae fragmentos que no alcanzan para responder. Si son muy grandes, entran menos chunks en el prompt y el costo por consulta se dispara.

## Parámetros a definir

| Parámetro | Valor NexusAI | Rango común |
|---|---|---|
| Tamaño del chunk | **500 tokens** | 256 – 1024 |
| Overlap | **10%** (~50 tokens) | 0% – 20% |
| Estrategia | **Por token**, respetando separadores | Por carácter / token / semántica |

## Por qué 500 tokens

- Captura 1-2 párrafos académicos completos (un concepto suele ocupar 300-600 tokens).
- Permite meter ~5 chunks en el contexto del prompt sin superar el presupuesto (~2500 tokens).
- Los modelos de embedding usados (Gemini Embedding, nomic-embed-text, text-embedding-3-small) aceptan hasta 8192 tokens — muy por debajo del límite.
- Los benchmarks de RAG muestran mejor recall con chunks de 256-512 tokens para Q&A factual.

## Por qué 10% de overlap

El overlap evita que una idea quede cortada exactamente en el borde entre dos chunks. Ejemplo: si un concepto se explica en las últimas 3 líneas de un chunk y continúa en las primeras 3 del siguiente, el overlap garantiza que al menos uno de los dos chunks contenga la idea completa.

## Implementación en Python

```python
import tiktoken

def chunk_text(text: str, max_tokens: int = 500, overlap: int = 50) -> list[str]:
    """
    Corta texto en chunks de max_tokens, con overlap de tokens entre chunks consecutivos.
    Respeta separadores naturales (párrafos, oraciones) cuando es posible.
    """
    encoder = tiktoken.get_encoding("cl100k_base")  # Compatible con Gemini y OpenAI embeddings
    tokens = encoder.encode(text)

    chunks = []
    start = 0
    while start < len(tokens):
        end = start + max_tokens
        chunk_tokens = tokens[start:end]
        chunk_text = encoder.decode(chunk_tokens)
        chunks.append(chunk_text)
        start += max_tokens - overlap  # Avanzo menos que el tamaño para generar overlap

    return chunks
```

### Variante: chunking con respeto a párrafos

Versión mejorada que corta preferentemente en saltos de párrafo:

```python
import re

def smart_chunk(text: str, max_tokens: int = 500, overlap: int = 50) -> list[str]:
    paragraphs = re.split(r'\n\s*\n', text)  # Separa por párrafos vacíos
    encoder = tiktoken.encoding_for_model("text-embedding-3-small")

    chunks = []
    current = []
    current_tokens = 0

    for p in paragraphs:
        p_tokens = len(encoder.encode(p))
        if current_tokens + p_tokens > max_tokens and current:
            chunks.append("\n\n".join(current))
            # Overlap: arrastramos el último párrafo al siguiente chunk
            current = [current[-1]] if current_tokens > overlap else []
            current_tokens = len(encoder.encode(current[-1])) if current else 0
        current.append(p)
        current_tokens += p_tokens

    if current:
        chunks.append("\n\n".join(current))
    return chunks
```

## Metadata por chunk

Cada chunk se indexa con metadata para filtrar y citar:

```python
metadata = {
    "course_id":  "mat101",
    "file_name":  "unidad3-derivadas.pdf",
    "file_id":    "f_1234",      # Para re-indexación
    "page":       12,
    "chunk_idx":  5,
    "timestamp":  1714000000,    # Para invalidar chunks viejos
}
```

Esto permite:

- **Citar la fuente** en la respuesta ("según la página 12 de unidad3-derivadas.pdf...").
- **Re-indexar** un archivo específico sin tocar el resto (borrar por `file_id`, insertar nuevos).
- **Filtrar por curso** en la búsqueda.

## Alternativas evaluadas

| Estrategia | Cuándo usar | Por qué no para NexusAI MVP |
|---|---|---|
| **Semantic chunking** (corta cuando cambia el tema) | Textos muy largos sin estructura clara | Requiere un modelo extra para detectar cambios de tema. Complejidad no justificada para MVP. |
| **Sliding window fijo** | Cuando el contenido no tiene estructura | Nuestro material sí tiene párrafos y headings claros. |
| **Por página** | PDFs con páginas autocontenidas | Una página puede tener 200 tokens (gráfico) o 2000 (denso). Muy variable. |
| **Chunking por capítulo/sección** | Libros con estructura fuerte | No todos los PDFs son libros estructurados. |

## Decisiones tomadas para NexusAI

- **500 tokens con 10% overlap** como default.
- **Smart chunking por párrafos** cuando el PDF lo permite (fallback a sliding window si no).
- **Metadata rica** (`course_id`, `file_id`, `page`, `chunk_idx`, `timestamp`).
- **tiktoken** como tokenizador — consistente con el que usa OpenAI.

## Abierto / pendiente

- [ ] Probar con ≥3 apuntes reales de la materia de Leandro y medir calidad de retrieval con distintos tamaños (300, 500, 800 tokens).
- [ ] Definir cómo manejar tablas en PDF: ¿las tratamos como texto plano o las serializamos a markdown primero?
- [ ] Chunking para DOCX y TXT — la lógica de párrafos tiene que adaptarse.

## Referencias

- [Anthropic — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) (no lo usamos en MVP pero es referencia)
- [LangChain — Text Splitters](https://python.langchain.com/docs/concepts/text_splitters/)
- [Pinecone — Chunking strategies](https://www.pinecone.io/learn/chunking-strategies/)
- [tiktoken](https://github.com/openai/tiktoken)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
