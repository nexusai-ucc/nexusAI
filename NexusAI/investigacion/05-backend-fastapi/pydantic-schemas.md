# Schemas Pydantic V2 y validación de entrada/salida

> **Resumen (3 líneas):** FastAPI confía en Pydantic para definir contratos estrictos entre Moodle y el backend de inferencia. La migración a Pydantic V2 (núcleo compilado en Rust) introduce `ConfigDict(extra='forbid')` para rechazar payloads inesperados y `Structured Outputs` de OpenAI para garantizar respuestas JSON 100% conformes al schema definido. Cubre los schemas `ChatRequestSchema` y `NexusAIResponseSchema`.

---

## Contexto

El backend FastAPI tiene dos fronteras de validación:

1. **Entrada:** requests provenientes del plugin Moodle → deben tener los campos exactos que el contrato define. Cualquier campo extra o faltante debe rechazarse ruidosamente.
2. **Salida:** respuestas del LLM (OpenAI) → frecuentemente texto no estructurado que hay que convertir en JSON válido sin reintentos ni heurísticas.

Pydantic V2 y la funcionalidad *Structured Outputs* de OpenAI resuelven ambas fronteras.

---

## Pydantic V2 vs. V1 — qué cambia

| Aspecto | Pydantic V1 | Pydantic V2 |
|---|---|---|
| Core | Pure Python | `pydantic-core` compilado en Rust |
| Velocidad de serialización | Baseline | ~5-50× más rápido |
| `model_config` | `class Config:` anidada | `model_config = ConfigDict(...)` |
| Validación extra fields | `extra = 'ignore'` por defecto | Configurable — usamos `'forbid'` |
| Import de `Field` | `from pydantic import Field` | Sin cambios |

```bash
pip install "pydantic>=2.0"
pip install "pydantic-settings>=2.0"
```

---

## Schema de entrada — `ChatRequestSchema`

```python
# src/app/models/schemas.py
from pydantic import BaseModel, Field, ConfigDict


class ChatRequestSchema(BaseModel):
    """
    Contrato de entrada desde el plugin Moodle.
    ConfigDict(extra='forbid') rechaza cualquier campo no declarado —
    garantiza que el payload emitido por PHP sea idéntico al aceptado por FastAPI.
    """
    model_config = ConfigDict(extra='forbid')

    user_id:   int = Field(..., gt=0, description="Identidad del emisor (FK a mdl_user)")
    course_id: int = Field(..., gt=0, description="Contexto del vector RAG (FK a mdl_course)")
    content:   str = Field(..., min_length=2, max_length=5000, description="Pregunta del estudiante")
    session:   str = Field(default='', description="ID de sesión para continuación conversacional")
```

**Por qué `extra='forbid'`:** si el plugin PHP envía un campo no declarado (ej. un `admin_token` por error), FastAPI devuelve `422 Unprocessable Entity` de inmediato. Sin esta directiva, el campo pasaría desapercibido — comportamiento silenciosamente inseguro.

### Validación en el endpoint

```python
# src/app/api/routers/chat.py
@router.post("/infer")
async def chat_inference(payload: ChatRequestSchema, request: Request):
    # FastAPI valida automáticamente contra ChatRequestSchema antes de ejecutar
    # Si falla: 422 con detalle del campo inválido
    ...
```

---

## Schema de respuesta — `NexusAIResponseSchema`

```python
class NexusAIResponseSchema(BaseModel):
    """
    Contrato de salida hacia el plugin Moodle.
    Campos diseñados para soportar la capa de transparencia de fuentes del RAG.
    """
    reasoning:        str        = Field(description="Explicación pedagógica adaptada")
    confidence_score: float      = Field(ge=0.0, le=1.0, description="Confianza del retrieval (0-1)")
    source_documents: list[str]  = Field(default_factory=list, description="Documentos fuente citados")
```

El campo `confidence_score` permite al frontend (React) mostrar un indicador visual de confiabilidad. Si el score es bajo (< 0.5), el widget puede mostrar "Respuesta basada en información parcial — consultá con tu docente".

---

## Structured Outputs de OpenAI — salida JSON garantizada

El LLM por defecto devuelve texto libre. Sin Structured Outputs, la extracción de campos requiere `json.loads()` con manejo de excepciones y reintentos cuando el modelo genera JSON malformado.

**Structured Outputs** (lanzado por OpenAI en 2024) usa *decodificación restringida* (Constrained Decoding) para coaccionar al modelo a emitir exactamente el JSON definido en el schema — sin reintentos, sin heurísticas, sin fallas de parsing.

```python
# src/app/services/llm_service.py
from openai import AsyncOpenAI
from app.models.schemas import NexusAIResponseSchema

async_openai_client = AsyncOpenAI()


async def generate_structured_response(
    context_chunks: list[str],
    user_query: str
) -> NexusAIResponseSchema:
    """
    Usa client.chat.completions.parse() para forzar salida JSON
    conforme al schema NexusAIResponseSchema.
    """
    system_prompt = (
        "Sos un asistente académico. Respondé exclusivamente con información "
        "del contexto provisto. Si no encontrás la respuesta, indicalo en 'reasoning'."
    )

    context_text = "\n\n---\n".join(context_chunks)

    completion = await async_openai_client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system",  "content": system_prompt},
            {"role": "user",    "content": f"Contexto:\n{context_text}\n\nPregunta: {user_query}"},
        ],
        response_format=NexusAIResponseSchema,  # Schema Pydantic pasado directamente
    )

    # .parse() devuelve la instancia ya validada del schema — nunca falla
    return completion.choices[0].message.parsed
```

**Por qué `client.beta.chat.completions.parse()` y no `response_format={"type": "json_object"}`:**

- `json_object` solo garantiza que el output sea JSON válido, no que sea conforme al schema.
- `.parse()` usa el schema Pydantic directamente para construir el grafo de tokens permitidos en cada paso de decodificación — el modelo **no puede** generar JSON que no valide.

---

## Integración con SSE — cuándo usar schema estructurado vs. streaming

| Caso de uso | Método recomendado |
|---|---|
| Respuesta con metadatos (confidence, sources) | `Structured Outputs` + schema completo |
| Respuesta conversacional larga (streaming) | SSE con `stream=True` (ver `sse-streaming.md`) |
| Respuesta corta sin streaming | `.parse()` estándar |

Para el MVP de NexusAI, el endpoint `/infer` usa streaming SSE por defecto (ver `sse-streaming.md`) y el schema de salida completo (`NexusAIResponseSchema`) se usa en el endpoint `/infer/structured` para casos donde el frontend necesita los metadatos de confianza.

---

## Decisiones tomadas para NexusAI

- **`ConfigDict(extra='forbid')` en todos los schemas de entrada** — rechaza silenciosamente campos extra que podrían provenir de bugs en el plugin PHP.
- **`Structured Outputs` para respuestas con metadatos** — `confidence_score` y `source_documents` son requisitos del sistema de transparencia académica.
- **SSE + `stream=True` para el chat conversacional** — la latencia de 1-5s hace el streaming no negociable desde la perspectiva UX.
- **Pydantic V2** — la velocidad de serialización importa cuando el backend escala a miles de estudiantes concurrentes.

## Abierto / pendiente

- [ ] Definir el umbral de `confidence_score` para mostrar advertencia en la UI (¿0.4? ¿0.5?).
- [ ] Evaluar si incluir `source_documents` en el stream SSE o solo en el response final.
- [ ] Tests unitarios para validar que payloads con campos extra retornan 422 correctamente.

## Referencias

- [Pydantic V2 — Introducción](https://docs.pydantic.dev/latest/)
- [Pydantic V2: Introducing Pydantic v2 — Key Features](https://pydantic.dev/articles/pydantic-v2)
- [OpenAI — Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Introducing Structured Outputs in the API — OpenAI](https://openai.com/index/introducing-structured-outputs-in-the-api/)
- [FastAPI + Pydantic V2: Validation Without the Drag — Medium](https://medium.com/@bhagyarana80/fastapi-pydantic-v2-validation-without-the-drag-17fe1f1771e2)

---

*Última actualización: 2026-05-02 — Marcos Bugliotti*
