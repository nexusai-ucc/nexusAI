# ADR-002: pgvector sobre PostgreSQL como única base de datos

| | |
|---|---|
| **Estado** | ✅ Aceptada |
| **Fecha** | 2026-05-02 |
| **Autor/es** | Marcos Bugliotti |
| **Decididores** | Equipo NexusAI |

---

## Contexto

NexusAI necesita almacenar y consultar:

- **Datos relacionales:** mensajes de chat, usuarios, cursos, documentos indexados, contadores de uso, feedback.
- **Embeddings de chunks:** vectores de 768 (MVP con Gemini) o 1.536 (producción con OpenAI) dimensiones, con búsqueda por similitud coseno.

Las consultas típicas combinan ambos mundos: _"dame los 5 chunks más similares a esta pregunta, **del curso 42**, **que no estén marcados como eliminados**, **del docente X**"_.

Las alternativas evaluadas fueron pgvector, ChromaDB, Pinecone, Weaviate y Qdrant.

## Decisión

Usar **PostgreSQL como única base de datos del sistema**, con la extensión **pgvector** para almacenar y consultar embeddings.

- Tabla `nexusai_chunks` con columna `embedding vector(N)`.
- Índice HNSW con distancia coseno (`vector_cosine_ops`), parámetros `m=16`, `ef_construction=200`.
- Las queries combinan filtros relacionales (`WHERE d.course_id = $X AND d.status = 'indexed'`) con búsqueda vectorial (`ORDER BY embedding <=> $1 LIMIT 5`) en una sola operación SQL.

## Alternativas evaluadas

### Alternativa A — ChromaDB (in-process o servidor)

Base vectorial open-source, Python-first, con modo embedded.

**Pros:**

- Simple, arranque rápido.
- Modo embedded sin servicio separado.
- Buen ecosistema Python.

**Contras:**

- **Sistema separado de PostgreSQL.** Requiere operar, deployar y mantener dos bases de datos.
- **Filtrado por metadata limitado** comparado con SQL nativo.
- **Queries cross-sistema:** una pregunta como "chunks similares + filtro por estado del documento + JOIN con tabla de usuarios" requiere dos llamadas (Chroma + PG) y lógica de coordinación en Python.
- Sincronización de estado entre Chroma y PG es trabajo extra.

**Por qué no:** la doble operación + la imposibilidad de hacer queries SQL+vector unificadas es un costo recurrente que no compensa la simplicidad inicial. pgvector cubre la escala del proyecto sin esos contras.

### Alternativa B — Pinecone (managed)

Base vectorial SaaS top de mercado.

**Pros:**

- Performance excelente.
- Sin operación.

**Contras:**

- $70+/mes mínimo.
- Vendor lock-in.
- Datos del RAG fuera del servidor de la institución (problema para self-hosted).

**Por qué no:** costo inviable para PI académico, contradice el principio "self-hosted" de NexusAI.

### Alternativa C — Qdrant / Weaviate (servidor self-hosted)

Bases vectoriales serias para producción, escritas en Rust/Go.

**Pros:**

- Performance excelente.
- Self-host posible.

**Contras:**

- Servicio adicional para operar.
- Justificadas a partir de **10-50M vectores con alta concurrencia**.
- Mismo problema cross-sistema que ChromaDB.

**Por qué no:** son la opción correcta para una escala que NexusAI no tiene. La UCC completa proyecta ~240K vectores; 5 instituciones, ~1.2M. Muy por debajo del umbral.

### Alternativa D — pgvector ✅ ELEGIDA

Extensión PostgreSQL que agrega tipo `vector` y operadores de distancia (`<=>`, `<->`, `<#>`).

**Pros:**

- **Una sola base de datos** para datos relacionales y vectores.
- **Queries SQL+vector unificadas** — todo en una sola operación.
- Sin sincronización cross-sistema.
- Cubre cómodamente la escala proyectada de NexusAI.
- Backup vía herramientas estándar de PostgreSQL (`pg_dump`).

**Contras:**

- Requiere tuning para datasets muy grandes (no es el caso).
- Dependencia de una extensión específica (no es PostgreSQL puro).

**Por qué sí:** alineado con el principio "una sola DB", elimina complejidad operacional, y la performance es más que suficiente para el proyecto.

## Consecuencias

### Positivas

- **Operación simple:** un solo backup, un solo monitoring, un solo conjunto de credenciales.
- **Queries expresivas:** SQL completo para filtrar, ordenar, agregar, joinear, además de búsqueda vectorial.
- **Costo cero adicional:** PostgreSQL ya está en la stack obligatoria (Moodle lo usa).
- **Consistencia transaccional:** insertar un documento + sus chunks + sus embeddings es una sola transacción.
- **Self-hosted total:** los embeddings nunca salen del servidor de la institución.

### Negativas / trade-offs aceptados

- **Tuning HNSW** requerido si la base crece a millones de vectores.
- **Dependencia de pgvector:** no se puede levantar el sistema con un PostgreSQL "vainilla". Hay que instalar la extensión.
- **Migración entre dimensiones (768 → 1.536)** requiere ALTER TABLE + re-indexación completa cuando se pasa de Gemini Embedding a OpenAI.

### Cómo se mitigan

- **Tuning:** el proyecto está diseñado one-instance-per-institution, lo que acota el volumen. Si en algún caso una institución crecera mucho, hay margen para subir parámetros HNSW (`m`, `ef_construction`) y/o agregar particiones.
- **Dependencia pgvector:** instrucciones claras en `docs/setup` + script `CREATE EXTENSION IF NOT EXISTS vector` automático en migraciones.
- **Migración 768→1536:** script de migración documentado para el salto MVP → producción, con re-indexación batch desde los archivos originales en Moodle.

## Cuándo revisar esta decisión

Reabrir el debate de cambiar de base vectorial si:

| Trigger | Acción esperada |
|---|---|
| Una institución supera **10M vectores** | Benchmark pgvector vs Qdrant en hardware de hosting elegido. Considerar Qdrant si pgvector no llega |
| Latencia de búsqueda vectorial > 500 ms con índice optimizado | Revisar tuning, considerar particionamiento por curso/semestre |
| Se necesita búsqueda híbrida BM25 + dense con scoring complejo | Evaluar si pgvector + extensión `pg_trgm`/`tsvector` alcanza, o conviene Weaviate/Qdrant |
| Aparece requerimiento de multi-tenancy con N×millones de vectores | Repensar el modelo de despliegue (single-institution → multi) |

## Referencias

- [pgvector — GitHub](https://github.com/pgvector/pgvector)
- [pgvector — HNSW indexing](https://github.com/pgvector/pgvector#hnsw)
- [Malkov & Yashunin — HNSW paper](https://arxiv.org/abs/1603.09320)
- [`investigacion/04-chromadb/decision-pgvector.md`](../../investigacion/04-chromadb/decision-pgvector.md)
- [`investigacion/04-chromadb/similitud-coseno.md`](../../investigacion/04-chromadb/similitud-coseno.md)

---

*Última actualización: 2026-05-02*
