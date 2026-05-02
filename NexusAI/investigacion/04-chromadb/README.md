# 04 — Base de Datos Vectorial

Almacenamiento de embeddings para el RAG de NexusAI. Luego de evaluar las alternativas disponibles, **se decidió usar pgvector sobre PostgreSQL** en lugar de ChromaDB u otra base vectorial dedicada.

## Archivos

- [decision-pgvector.md](decision-pgvector.md) — Por qué pgvector sobre PostgreSQL, comparativa completa, configuración HNSW, queries SQL+vector.
- [similitud-coseno.md](similitud-coseno.md) — Cómo funciona la búsqueda semántica, métrica coseno, parámetros HNSW, umbral de relevancia.

## Objetivo

Documentar la decisión de almacenamiento vectorial y dejar configurada la búsqueda semántica óptima para el volumen esperado (~240K chunks para la UCC completa).

## Decisión clave

| Alternativa | Decisión | Motivo |
|---|---|---|
| ChromaDB | ❌ Descartada | Sistema separado de PostgreSQL. Queries vectoriales y relacionales requieren dos llamadas. Complejidad operacional innecesaria para la escala del proyecto. |
| pgvector | ✅ Elegida | Un único sistema para datos relacionales y vectores. Queries SQL+vector en una sola operación. Suficiente para la escala proyectada (~240K vectores por institución, varios millones en expansión multi-institución). |
| Qdrant / Weaviate / Pinecone | ❌ Descartadas | Justificadas a partir de 10-50M vectores con alta concurrencia. Fuera del rango de NexusAI. |

## Principio arquitectónico

PostgreSQL es la única base de datos del sistema. pgvector agrega una columna `vector(1536)` a la tabla `nexusai_chunks` con un índice HNSW de distancia coseno. Una query como _"dame los 5 chunks más similares a esta pregunta, del curso 42, que no estén eliminados"_ es una sola operación SQL — sin sincronización cross-sistema.
