# Optimización avanzada de RAG

> **Resumen (3 líneas):** La investigación del estado del arte en RAG para LMS (2025/2026) identifica que la fragmentación y vectorización ingenunas son propensas a fallos silenciosos de semántica. Este documento presenta los cuatro pilares de optimización — chunking adaptativo, embeddings ajustados, búsqueda híbrida y expansión de consultas — y define qué implementamos en el MVP de NexusAI vs. qué queda para iteraciones posteriores.

---

## Contexto

El `conceptos.md` define el pipeline RAG base de NexusAI: chunks de ~500 tokens, `text-embedding-3-small`, top-5 por similitud coseno. Ese diseño es correcto para el MVP, pero la investigación de 2025/2026 sobre sistemas RAG en contextos educativos identifica limitaciones concretas que emergen a escala y con material académico heterogéneo (PDFs con tablas, fórmulas LaTeX, código, diagramas).

---

## Por qué falla el RAG naïve con material académico

La simple fragmentación de documentos en bloques estáticos (512 tokens fijos) frecuentemente **rompe la continuidad lógica de párrafos o tablas** en el material didáctico:

- Un teorema que ocupa 3 párrafos queda partido en dos chunks sin solapamiento semántico.
- Una tabla comparativa dividida a la mitad pierde contexto en ambos fragmentos.
- Preguntas que mezclan terminología exacta ("transformada de Fourier discreta") y semántica ("cómo se calcula la frecuencia en señales digitales") fallan con búsqueda puramente vectorial.

Estos fallos son **silenciosos**: el sistema devuelve una respuesta, pero basada en contexto incorrecto o incompleto.

---

## Pilar 1 — Chunking adaptativo e inteligente

**El enfoque estático (512 tokens fijos)** divide sin respetar la estructura lógica del documento.

**El enfoque adaptativo** aplica *sentence-level, token-wise chunking*: respeta los límites de las oraciones y el contexto del negocio antes de cortar.

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

def crear_chunks_adaptativos(texto: str, source_metadata: dict) -> list[dict]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,          # tokens objetivo
        chunk_overlap=50,        # ~10% de solapamiento conservador
        separators=[
            "\n\n",              # Respetar saltos de párrafo primero
            "\n",                # Luego saltos de línea
            ". ",                # Luego oraciones completas
            " ",                 # Solo como último recurso: palabras
        ],
        length_function=len,
    )
    fragmentos = splitter.split_text(texto)
    return [
        {
            "text":     frag,
            "metadata": {**source_metadata, "chunk_index": i}
        }
        for i, frag in enumerate(fragmentos)
    ]
```

**Para material académico con tablas y fórmulas:** considerar parsers estructurados (ej. `unstructured.io`) que detectan headers, filas de tabla y bloques de código antes de fragmentar.

---

## Pilar 2 — Modelos de embedding ajustados

La calidad de la recuperación vectorial depende de la dimensionalidad y precisión del modelo de incrustación.

| Modelo | Dimensiones | Cobertura | Ideal para |
|---|---|---|---|
| `text-embedding-3-small` (OpenAI) | 1536 | Multilingüe | MVP NexusAI — buena relación costo/calidad |
| `text-embedding-3-large` (OpenAI) | 3072 | Multilingüe mejorado | Post-MVP si el retrieval queda corto |
| `BGE-Large-En` (BAAI) | 1024 | Inglés principalmente | Documentos técnicos en inglés |
| Embeddings duales | 3072 (concat) | Máxima precisión | Producción a escala, costo alto |

**Regla práctica para NexusAI:** el modelo de embedding debe ser el mismo durante indexación y en cada consulta. Cambiar el modelo en producción invalida todos los vectores almacenados — requiere re-indexación completa del corpus.

El puente Moodle→FastAPI debe ser agnóstico al modelo de embedding y permitir la selección del modelo optimizado desde la configuración del workspace.

---

## Pilar 3 — Búsqueda híbrida (Hybrid Search)

La recuperación exclusiva por similitud coseno (Dense Embeddings) falla ante búsquedas de **palabras clave exactas**: nombres de teoremas, códigos de asignaturas, nombres propios.

**Hybrid Search** combina dos algoritmos:

```
score_final = α × score_semántico + (1 - α) × score_léxico
```

| Componente | Algoritmo | Fortaleza |
|---|---|---|
| Búsqueda semántica | Cosine similarity sobre vectores densos | Entiende sinónimos y paráfrasis |
| Búsqueda léxica | TF-IDF o BM25 | Coincidencia exacta de términos específicos |

```python
from rank_bm25 import BM25Okapi

def hybrid_search(
    query: str,
    collection,
    corpus_texts: list[str],
    alpha: float = 0.7,
    top_k: int = 5
) -> list[dict]:
    # Búsqueda semántica
    query_embedding  = get_embedding(query)
    semantic_results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k * 2,  # Pool más amplio para re-ranking
    )

    # Búsqueda léxica BM25
    tokenized_corpus = [doc.split() for doc in corpus_texts]
    bm25             = BM25Okapi(tokenized_corpus)
    bm25_scores      = bm25.get_scores(query.split())

    # Fusión de scores con peso configurable
    # ... normalizar y combinar ...
    return merged_results[:top_k]
```

**Para NexusAI:** la búsqueda híbrida es especialmente valiosa cuando los alumnos preguntan por términos técnicos exactos del material (ej. "¿qué es el teorema de Nyquist?") vs. preguntas conceptuales ("¿cómo se relaciona la frecuencia de muestreo con la reconstrucción de señales?").

La inclusión de metadatos (`course_id` extraído en Moodle) permite ejecutar búsquedas híbridas filtradas por contexto académico, combinando similitud semántica con restricción de pertenencia al curso.

---

## Pilar 4 — Expansión y enriquecimiento de consultas (Query Expansion)

Antes de enrutar el mensaje hacia el backend IA, el proxy PHP en Moodle puede aplicar técnicas de enriquecimiento contextual sin que el alumno lo note:

```php
// En chat_api.php::send_message() — antes de construir el payload
$user_progress = $DB->get_records('course_modules_completion', [
    'userid'   => $USER->id,
    'coursemoduleid' => $courseid,
]);

$context_enrichment = [
    'user_progress_percent' => calcular_progreso($user_progress),
    'last_accessed_module'  => obtener_ultimo_modulo($USER->id, $courseid),
];

// Se agrega silenciosamente como metadata al payload hacia FastAPI
$payload['enrichment'] = $context_enrichment;
```

El agente IA (con herramientas MCP) puede usar este contexto para:
- Personalizar el **tono pedagógico** (más básico si el alumno está en semana 2, más avanzado en semana 12).
- Ajustar el **nivel de dificultad** de la explicación.
- Referenciar el módulo específico donde el alumno tiene dificultades.

---

## Estado del arte 2025/2026 — síntesis

Según investigaciones recientes sobre mejores prácticas RAG para LMS:

- La **fragmentación naïve** es el primer cuello de botella — resuelto con chunking adaptativo.
- El **Recall@5** (porcentaje de veces que la respuesta correcta está en los top-5 chunks) aumenta ~15-20% con Hybrid Search vs. búsqueda puramente semántica en corpus de textos académicos.
- Los **metadatos estructurados** (course_id, module_id, page_number) son tan importantes como el embedding en sí para la precisión contextual.
- La **expansión de consultas** con datos de progreso del estudiante mejora la personalización sin costo de inferencia adicional.

---

## Decisiones tomadas para NexusAI

- **MVP:** chunking adaptativo con `RecursiveCharacterTextSplitter` (parágrafo → línea → oración), 500 tokens, 10% overlap, `text-embedding-3-small`.
- **Post-MVP (si el retrieval es insuficiente):** activar Hybrid Search con BM25 sobre el corpus indexado.
- **Metadata de enriquecimiento:** incluir `course_id` y `module_id` desde el primer sprint — retroalimentarlos al índice es barato y la pérdida de no tenerlos es costosa de remediar.
- **Query Expansion:** evaluar en Sprint 4 si los resultados de las pruebas de usuario muestran respuestas genéricas sin contexto pedagógico.

## Abierto / pendiente

- [ ] Definir la métrica primaria para evaluar el retrieval: Recall@5 o MRR (Mean Reciprocal Rank). Ver `evaluacion-rag.md`.
- [ ] Evaluar si Nexus AI gestiona internamente Hybrid Search o si necesitamos implementarlo en FastAPI.
- [ ] Decidir el valor de `α` (peso semántico vs. léxico) mediante A/B testing con usuarios reales.
- [ ] Investigar `unstructured.io` para parsing de tablas y fórmulas matemáticas en PDFs académicos.

## Referencias

- [Enhancing RAG: A Study of Best Practices — arXiv 2501.07391v1](https://arxiv.org/html/2501.07391v1)
- [Enhancing RAG — ACL Anthology 2025](https://aclanthology.org/2025.coling-main.449.pdf)
- [RAG Best Practices 2025 — Aggil.fr](https://www.aggil.fr/blog/rag-2025-best-practices)
- [Advanced RAG techniques — Elasticsearch Labs](https://www.elastic.co/search-labs/blog/advanced-rag-techniques-part-1)
- [RAG systems: Best practices — Google Cloud Blog](https://cloud.google.com/blog/products/ai-machine-learning/optimizing-rag-retrieval)
- [Six steps to improve your RAG data foundation — Databricks](https://community.databricks.com/t5/technical-blog/six-steps-to-improve-your-rag-application-s-data-foundation/ba-p/97700)

---

*Última actualización: 2026-05-02 — Marcos Bugliotti*
