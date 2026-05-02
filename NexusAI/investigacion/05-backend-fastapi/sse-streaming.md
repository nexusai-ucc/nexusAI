# Streaming de respuestas IA con Server-Sent Events (SSE)

> **Resumen (3 líneas):** Una llamada de inferencia a GPT-4o-mini puede tardar varios segundos; bloquear la conexión HTTP generaría una percepción de inoperatividad en la plataforma Moodle. FastAPI soporta de forma nativa el protocolo SSE mediante `EventSourceResponse`, que transmite la respuesta fragmento a fragmento (`chunk by chunk`) mientras el modelo genera, eliminando la latencia percibida por el estudiante.

---

## Contexto

El pipeline RAG introduce latencia en dos puntos:
1. **Embedding + búsqueda vectorial:** ~130 ms (ChromaDB, coseno similarity).
2. **Generación del LLM:** 1-5 segundos para GPT-4o-mini en respuestas típicas académicas.

Sin streaming, el estudiante ve una pantalla en blanco durante ese tiempo. **Con SSE**, los primeros tokens del LLM aparecen en ~200 ms y el texto se construye visualmente ante sus ojos — experiencia idéntica a ChatGPT.

---

## Por qué SSE y no WebSockets

| Criterio | SSE (Server-Sent Events) | WebSockets |
|---|---|---|
| Dirección | Unidireccional (servidor → cliente) | Bidireccional |
| Protocolo | HTTP estándar — mismo puerto 443 | Requiere upgrade a `ws://` |
| Compatibilidad con proxies universitarios | Alta — es HTTP puro | Problemática — muchos firewalls bloquean WS |
| Reconexión automática | Nativa en el browser | Manual |
| Complejidad de implementación | Baja | Alta |
| Caso de uso | **Streaming de texto IA** | Chat en tiempo real, juegos, colaboración |

Para NexusAI la comunicación es estrictamente unidireccional durante la generación (servidor → cliente), lo que hace SSE la opción correcta. Los firewalls universitarios que bloquean WebSockets no afectan SSE.

---

## Formato del protocolo SSE

Cada evento SSE es un mensaje de texto con formato específico:

```
data: {"token": "La "}\n\n
data: {"token": "transformada "}\n\n
data: {"token": "de Fourier..."}\n\n
data: ""\nevent: completion\n\n
```

- Cada mensaje termina en `\n\n`.
- El campo `event:` permite discriminar tipos: `message` (token), `completion` (fin), `error`.
- El cliente React escucha con `EventSource` y acumula los tokens en el estado del componente.

---

## Implementación en FastAPI — `src/app/api/routers/chat.py`

```python
# src/app/api/routers/chat.py
from fastapi import APIRouter, Request
from fastapi.responses import EventSourceResponse
from sse_starlette.sse import ServerSentEvent
from openai import AsyncOpenAI

from app.models.schemas import ChatRequestSchema
import json

router = APIRouter()
async_openai_client = AsyncOpenAI()


@router.post("/infer", response_class=EventSourceResponse)
async def chat_inference(payload: ChatRequestSchema, request: Request):
    """
    Endpoint de inferencia con streaming SSE.
    Valida el payload Pydantic → invoca RAG (comentado en sprint 2) →
    llama a OpenAI con stream=True → emite tokens como eventos SSE.
    """

    async def generator():
        try:
            # Sprint 2: activar RAG antes de llamar al LLM
            # context = await vector_service.retrieve(payload.course_id, payload.content)

            stream = await async_openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": payload.content
                        # Sprint 2: f"Contexto:\n{context}\n\nPregunta: {payload.content}"
                    }
                ],
                stream=True,
            )

            async for chunk in stream:
                # Interrupción controlada si el estudiante cierra el navegador
                if await request.is_disconnected():
                    break

                text_delta = chunk.choices[0].delta.content
                if text_delta:
                    # Serialización estricta por requerimientos del estándar SSE
                    yield ServerSentEvent(
                        data=json.dumps({"token": text_delta}),
                        event="message"
                    )

            # Evento de completitud — el cliente React cierra el EventSource
            yield ServerSentEvent(data="", event="completion")

        except Exception as e:
            yield ServerSentEvent(
                data=json.dumps({"error": str(e)}),
                event="error"
            )

    return EventSourceResponse(generator())
```

**Puntos críticos del código:**

- `async for chunk in stream` — el generador asíncrono cede el control al event loop en cada `await`, permitiendo que una única instancia FastAPI atienda miles de streams concurrentes simultáneamente.
- `request.is_disconnected()` — si el estudiante cierra el tab, el loop se interrumpe controladamente evitando computación y tokens de OpenAI desperdiciados.
- `ServerSentEvent(data=..., event=...)` — la serialización con el campo `event` tipado permite al cliente React filtrar por tipo de evento.

---

## Consumo en el cliente React (Moodle AMD)

```javascript
// amd/src/chatwidget.js — fragmento del consumidor SSE
import Ajax from 'core/ajax';

function startStreaming(courseId, userId, userMessage) {
    // El plugin Moodle no llama SSE directamente — primero pasa por core/ajax
    // que verifica la sesión y luego el PHP proxy llama al endpoint FastAPI
    const eventSource = new EventSource(
        `/webservice/streaming/nexusai?courseid=${courseId}&prompt=${encodeURIComponent(userMessage)}`
    );

    let fullResponse = '';

    eventSource.addEventListener('message', (event) => {
        const parsed = JSON.parse(event.data);
        fullResponse += parsed.token;
        updateChatBubble(fullResponse);  // Actualiza el DOM en tiempo real
    });

    eventSource.addEventListener('completion', () => {
        eventSource.close();
        finalizeChatBubble(fullResponse);
    });

    eventSource.addEventListener('error', (event) => {
        const parsed = JSON.parse(event.data);
        showErrorMessage(parsed.error);
        eventSource.close();
    });
}
```

> **Arquitectura actual del MVP:** el frontend React llama a `core/ajax` (Moodle web service), que invoca el PHP proxy, que llama al endpoint SSE de FastAPI. Esta cadena preserva el patrón Hybrid PHP Proxy. Un streaming SSE directo navegador → FastAPI requeriría CORS y expone credenciales al cliente.

---

## Rendimiento y escalabilidad

El paradigma `async/await` cede continuamente el control al event loop (asyncio) durante los lapsos de espera de red. Esto significa que:

- Una sola instancia FastAPI en Railway Hobby (0.5 vCPU, 512 MB) puede gestionar **decenas de streams concurrentes** sin bloquear.
- El `EventLoop` de Python es el cuello de botella en código CPU-bound, no en I/O-bound (que es nuestro caso: esperar tokens de OpenAI).
- `uvicorn --workers 2` duplica la capacidad ante carga alta.

Con 500 estudiantes concurrentes generando consultas de 3s promedio, se necesitan ~25 requests/segundo activos — perfectamente manejable con 2 workers Uvicorn en hardware compacto.

---

## Decisiones tomadas para NexusAI

- **SSE nativo de FastAPI** (`sse-starlette`) — no WebSockets, no long-polling.
- **`request.is_disconnected()`** como mecanismo de cancelación — evita consumo de tokens de OpenAI cuando el alumno abandona la pregunta.
- **Evento `completion` explícito** — el cliente React sabe cuándo cerrar el `EventSource` sin depender de timeouts.
- **`stream=True` con GPT-4o-mini** para el MVP — latencia mínima y costo ~16× menor que GPT-4o completo.

## Abierto / pendiente

- [ ] Implementar el endpoint de streaming completo con RAG (actualmente usa el prompt directo sin contexto vectorial).
- [ ] Evaluar si el PHP proxy puede hacer pass-through del stream SSE o si debe bufferear la respuesta completa antes de retornarla.
- [ ] Medir "Tiempo al Primer Token" (TTFT) en la demo con Moodle real — target: < 500 ms.

## Referencias

- [FastAPI — Server-Sent Events](https://fastapi.tiangolo.com/tutorial/server-sent-events/)
- [sse-starlette — GitHub](https://github.com/sysid/sse-starlette)
- [Streaming AI Agents Responses with SSE — Medium](https://akanuragkumar.medium.com/streaming-ai-agents-responses-with-server-sent-events-sse-a-technical-case-study-f3ac855d0755)
- [Stream OpenAI with FastAPI and React.js — Medium](https://medium.com/@hxu296/serving-openai-stream-with-fastapi-and-consuming-with-react-js-part-1-8d482eb89702)
- [Language Model Streaming with SSE — Daniel Corin](https://www.danielcorin.com/posts/2024/lm-streaming-with-sse/)

---

*Última actualización: 2026-05-02 — Marcos Bugliotti*
