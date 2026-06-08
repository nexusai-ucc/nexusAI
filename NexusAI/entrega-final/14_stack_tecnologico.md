# Stack tecnológico

## Tabla de componentes

| Capa | Tecnología | Versión / detalle |
|---|---|---|
| Frontend | React + Webpack | React 18.3, Webpack 5, bundle único AMD |
| Plugin Moodle | PHP | 8.0+ |
| Compatibilidad Moodle | Moodle | 4.1 LTS – 4.5 (Hook API nuevo en 4.4+, callback legacy en 4.1-4.3) |
| Backend IA | FastAPI + Uvicorn | FastAPI 0.115, Python 3.11 |
| ORM + migraciones | SQLAlchemy 2.0 async + Alembic | engine asyncpg, modelos en `app/db/models.py` |
| Base de datos + vectores | **PostgreSQL + pgvector** | PG 16, pgvector 0.3.5 con índice HNSW |
| LLM (MVP) | **Gemini 2.5 Flash** | Tier gratuito vía SDK OpenAI-compatible |
| LLM (producción) | **GPT-4o-mini** | API OpenAI |
| Embeddings (MVP) | `gemini-embedding-001` (Matryoshka) | 768 dim |
| Embeddings (producción) | `text-embedding-3-small` (OpenAI) | 1.536 dim — requiere re-indexación |
| Cache + nonces HMAC | Redis | 7 alpine |
| Containers | Docker Compose | profiles `dev`, `full`, `tools` |
| CI/CD | GitHub Actions | backend-ci, frontend-ci, moodle-ci, deploy a Railway |

## Justificación de las decisiones clave

Cada decisión está documentada formalmente como un ADR (Architectural Decision Record) en `docs/adr/`. Resumen:

### Monolito modular sobre microservicios

El equipo es de 2 personas con un deadline corto. Un monolito modular cubre todas las necesidades del MVP sin la complejidad operativa de microservicios (orquestación, observabilidad distribuida, contratos entre servicios). Los módulos del backend están bien separados — `chat`, `documents`, `search`, `quiz`, `gaps` — lo que permite extraer servicios cuando aparezca el dolor real (típicamente: un worker de indexación async cuando los uploads bloqueen el API).

→ Detalle en ADR-001.

### pgvector sobre ChromaDB

ChromaDB sería un sistema separado de PostgreSQL, lo que duplica la operación (dos bases, dos backups, dos puntos de falla) y bloquea queries que combinen SQL+vector en una transacción. pgvector cubre la escala del proyecto (single-institution, <10M vectores) con índice HNSW de aproximación, y permite hacer joins entre `chunks` y `documents` sin sacarlos de la DB.

→ Detalle en ADR-002.

### Arquitectura multi-provider LLM

El backend abstrae el LLM y el provider de embeddings detrás de las clases `LLMProvider` y `EmbeddingProvider`. Esto permite:

- Iterar gratis con Gemini 2.5 Flash en MVP.
- Cambiar a OpenAI GPT-4o-mini en producción modificando solo variables de entorno.
- Probar con Ollama local para desarrollo offline sin tocar código de aplicación.

→ Detalle en ADR-003.

### Gemini 2.5 Flash en MVP, OpenAI en producción

Gemini ofrece un tier gratuito generoso que permite desarrollar e iterar sin costos. Para producción, GPT-4o-mini de OpenAI da mejor calidad de respuesta a un costo bajo (~$0.15 por millón de tokens input). El switch entre proveedores es transparente gracias a la abstracción multi-provider.

→ Detalle en ADR-004.

### HMAC SHA-256 en 3 capas

La comunicación entre el plugin Moodle (PHP) y el backend (Python) usa HMAC SHA-256 con tres capas de seguridad:

1. **Bearer API key** identifica a la instancia de Moodle.
2. **Firma HMAC** sobre `timestamp || nonce || body` evita tampering.
3. **Nonce store en Redis** con TTL de 5 minutos evita replay attacks.

Los secretos viven solo en la configuración del plugin (Moodle admin) y en variables de entorno del backend. El navegador nunca los ve.

→ Detalle en ADR-005.

### Privacy API con `null_provider` en MVP

El plugin no persiste datos personales en Moodle (historial de chat, sesiones, documentos indexados — todo eso vive en el backend Python externo). En consecuencia, la Privacy API del plugin declara un `null_provider`. Si más adelante se agregan tablas locales en Moodle (audit log de uso, cache de respuestas), la implementación migra a `metadata\provider`.

→ Detalle en ADR-006.

## Tecnologías evaluadas y descartadas

| Alternativa | Por qué no |
|---|---|
| Microservicios desde el inicio | Equipo de 2 personas, deadline corto, sin tracción de usuarios todavía |
| ChromaDB | Sistema separado de PostgreSQL — duplica operación y bloquea queries SQL+vector |
| Pinecone (managed) | $70+/mes mínimo, vendor lock-in. Innecesario para single-institution |
| Qdrant / Weaviate | Justificados a partir de 10-50M vectores, fuera del rango |
| Fine-tuning del LLM en lugar de RAG | Costoso, requiere re-train por curso, menos flexible que retrieval |
| Vite en lugar de Webpack | Vite no tiene buen soporte para output AMD que necesita Moodle |
| LLM local (Llama, Mistral) | Fuera de alcance MVP; la abstracción permite agregarlo después sin cambios estructurales |
| Subsistema IA nativo de Moodle 4.5 | Solo soporta `generate_text`, `generate_image`, `summarise_text`. Sin acción "chat" nativa |
| API key OpenAI fija (sin abstracción) | Incompatible con MVP gratuito (Gemini) — la abstracción multi-provider es estructural |


