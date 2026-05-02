# Especificaciones de la API de Nexus AI (Nuklai)

> **Resumen (3 líneas):** Nexus AI es una plataforma de agentes IA construida sobre el Nexus Query Engine (Nuklai), que expone endpoints REST para orquestar LLMs, gestionar sesiones conversacionales, ejecutar herramientas MCP y recibir ingestión de datos para RAG. El plugin Moodle consume esta API como backend de inferencia. Documenta los cuatro capabilities, el modelo de autenticación y las decisiones de integración.

---

## Contexto

El plugin `local_nexusai` actúa como proxy seguro entre Moodle y la plataforma Nexus AI. Nexus AI no es un LLM en sí mismo — es una capa inteligente sobre múltiples modelos que añade orquestación de agentes, memoria de sesión, herramientas MCP y un motor de ingestión de datos vectoriales.

**URL base de la API:** `https://api.nexus.nukl.ai/`

---

## Los cuatro capabilities de la API

### 1. Invocación de Agentes y Modelos — `/invoke`

Nexus AI permite configurar múltiples LLMs simultáneamente y seleccionar el agente a invocar por identificador.

```json
POST https://api.nexus.nukl.ai/invoke
Authorization: Bearer <api_key>

{
  "agent_identifier": "nexusai-academic-assistant",
  "session_id": "sess_abc123",
  "prompt": "¿Qué dice el capítulo 3 sobre transformadas de Fourier?",
  "metadata": {
    "source_system": "moodle",
    "course_id": 42,
    "user_id": 7
  }
}
```

**LLMs soportados:** GPT-4o, Claude (Anthropic), DeepSeek, modelos locales vía Ollama.

Los agentes de IA combinan el LLM con herramientas compatibles con el Protocolo de Contexto de Modelos (MCP — Model Context Protocol), lo que les permite razonar sobre datos estructurados.

### 2. Gestión de Sesiones — `/sessions`

Nexus AI mantiene el estado conversacional con historial completo del hilo. Esto elimina la necesidad de que la base de datos de Moodle almacene el árbol de tokens de las conversaciones iterativas.

```json
POST https://api.nexus.nukl.ai/sessions
{
  "create": true,
  "context": { "course_id": 42 }
}
// → { "session_id": "sess_abc123" }
```

El `session_id` generado se almacena en `local_nexusai_logs` para trazabilidad y rate limiting.

### 3. Herramientas MCP — NXSQL y búsqueda de metadatos

Nexus AI incluye herramientas predefinidas que los agentes pueden invocar autónomamente:

| Herramienta | Descripción |
|---|---|
| **NXSQL** | Motor de consultas SQL sobre bases de datos secundarias conectadas al workspace |
| **Metadata search** | Búsqueda en el índice de metadatos del workspace |
| **Clarivate Nexus** | Integración con bases de datos académicas (post-MVP) |

Esto permite al agente razonar sobre datos estructurados sin que el plugin Moodle necesite implementar la lógica de consulta.

### 4. Data Ingestion API — `/ingest`

Canal crítico para RAG. El plugin Moodle extrae los PDFs del curso usando la File API y los envía a Nexus AI para su vectorización e indexación.

```python
# Llamada desde la tarea programada de Moodle (vía cURL PHP en producción)
import requests

response = requests.post(
    "https://api.nexus.nukl.ai/ingest",
    headers={"Authorization": f"Bearer {api_key}"},
    files={"document": ("apunte_cap3.pdf", pdf_binary, "application/pdf")},
    data={
        "metadata": json.dumps({
            "source_system": "moodle",
            "course_id": 42,
            "module_id": 15,
            "document_name": "apunte_cap3.pdf",
        })
    }
)
```

Nexus AI gestiona internamente el chunking, la generación de embeddings y el almacenamiento en el Vector Store.

---

## Modelo de autenticación

Nexus AI soporta dos mecanismos de autenticación:

| Mecanismo | Uso | Configuración |
|---|---|---|
| **JWT (JSON Web Token)** | Flujos OAuth/OIDC para integraciones dinámicas | Rotación automática |
| **API Key estática** | Server-to-server (nuestro caso: Moodle → Nexus AI) | Almacenada en `mdl_config_plugins` |

Para el plugin Moodle se usa **API Key estática** almacenada en `get_config('local_nexusai', 'nexus_api_key')` — nunca expuesta al navegador del estudiante.

Sobre esta capa, el plugin agrega **HMAC-SHA256** con timestamp y nonce para verificar integridad del payload y prevenir replay attacks. Ver `autenticacion-hmac.md`.

---

## Trazabilidad — Nexus Helix Network

La plataforma Nexus registra de forma nativa la telemetría completa de cada invocación: identidad del usuario, enrutamiento MCP, herramientas ejecutadas y tokens consumidos. La integración con la red *Helix* provee una capa de confianza criptográfica que verifica permisos de acceso en cada cadena — indispensable en entornos universitarios de alta regulación.

---

## Decisiones tomadas para NexusAI

- **API Key estática** para el MVP — evita complejidad OAuth innecesaria en la primera iteración.
- **Delegación de historial a `/sessions`** — simplifica el esquema de BD de Moodle; `local_nexusai_logs` solo guarda `session_id` para rate limiting.
- **Data Ingestion en cron diario** — la sincronización de materiales no necesita ser en tiempo real para el MVP.
- **`agent_identifier` configurable** en `settings.php` — permite al admin apuntar a distintos agentes según el workspace universitario.

## Abierto / pendiente

- [ ] Definir la estructura exacta de metadatos JSON que recomienda la Data Ingestion API de Nexus AI (Cosine Similarity vs. Dot Product para el índice vectorial).
- [ ] Evaluar si activar las herramientas MCP de Clarivate para búsqueda bibliográfica (post-MVP).
- [ ] Confirmar si Nexus AI soporta colecciones separadas por `course_id` (para evitar contaminación semántica entre materias).

## Referencias

- [Nexus AI API — Introducción](https://docs.nukl.ai/docs/nexus/api/intro)
- [Nexus API — Autorización](https://docs.nukl.ai/docs/nexus/api/authorization)
- [Nexus Platform Documentation](https://docs.nexus.knowbl.com/)
- [MCP Servers for Nexus AI — Skywork](https://skywork.ai/skypage/en/nexus-mcp-servers-ai-engineers/197794412244859692)

---

*Última actualización: 2026-05-02 — Marcos Bugliotti*
