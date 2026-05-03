# ADR-003: Arquitectura agnóstica de proveedor LLM (`LLMProvider` / `EmbeddingProvider`)

| | |
|---|---|
| **Estado** | ✅ Aceptada |
| **Fecha** | 2026-05-02 |
| **Autor/es** | Marcos Bugliotti, Santiago Tricherri |
| **Decididores** | Equipo NexusAI |

---

## Contexto

NexusAI necesita generar respuestas (LLM de chat) y vectorizar texto (embeddings). Hay múltiples proveedores comerciales y open-source con APIs y modelos distintos.

Restricciones del proyecto:

- **MVP a costo cero:** queremos validar la idea con usuarios reales sin gastar.
- **Producción a escala UCC:** ~500 alumnos requieren un proveedor con SLA y rate limits adecuados.
- **Cambio de proveedor sin reescribir el sistema:** no queremos atarnos a un vendor específico.
- **Privacy:** la Privacy API de Moodle nos obliga a declarar el proveedor externo, pero la decisión de cuál usar la queremos diferida (config, no código).

Casi todos los proveedores relevantes (OpenAI, Google Gemini, Anthropic, Groq, Together, Ollama local) son **compatibles con el SDK de OpenAI** cambiando únicamente la `base_url` y el modelo.

## Decisión

Encapsular el acceso a LLM y embeddings detrás de **dos clases de abstracción**:

- `LLMProvider` — para chat completions (con streaming).
- `EmbeddingProvider` — para vectorización.

Ambas leen su configuración (proveedor, modelo, dimensiones, base URL, API key) **exclusivamente de variables de entorno**. El código de NexusAI nunca hardcodea OpenAI ni ningún proveedor.

```python
# app/infrastructure/llm_provider.py
import os
from openai import OpenAI

class LLMProvider:
    def __init__(self):
        self.model = os.getenv("LLM_MODEL", "gemini-2.0-flash")
        self.client = OpenAI(
            api_key=os.getenv("LLM_API_KEY"),
            base_url=os.getenv("LLM_BASE_URL",
                "https://generativelanguage.googleapis.com/v1beta/openai/"),
        )

    def chat_stream(self, messages, **kwargs):
        return self.client.chat.completions.create(
            model=self.model, messages=messages, stream=True, **kwargs
        )
```

Análogo para `EmbeddingProvider`. Cambio de proveedor = editar variables de entorno + reiniciar Uvicorn (más migración de schema si cambian dimensiones de embeddings — ver ADR-002).

## Alternativas evaluadas

### Alternativa A — OpenAI fija, hardcodeada en el código

Llamar `OpenAI()` directamente sin abstracción.

**Pros:**

- Simple, menos código.
- API estable y rica.

**Contras:**

- **No permite Gemini gratuito en MVP** — sería $100+/mes solo para validar.
- Vendor lock-in.
- Cualquier cambio futuro requiere refactor.
- La Privacy API tendría que decir "OpenAI" específicamente, atando la documentación a un proveedor.

**Por qué no:** el constraint del MVP gratuito es duro. La abstracción cuesta poco y libera mucho.

### Alternativa B — LangChain o framework similar

Usar una librería como LangChain que ya abstrae múltiples proveedores.

**Pros:**

- Abstracción "lista para usar".
- Soporta muchos proveedores out-of-the-box.

**Contras:**

- **Dependencia pesada** y con cambios frecuentes.
- API en evolución constante (breaking changes regulares).
- Para nuestro caso (un wrapper simple) es overkill.
- Agrega capas que dificultan debugging.

**Por qué no:** no necesitamos toda la maquinaria de LangChain. Una clase de 30 líneas hace exactamente lo que queremos sin la dependencia.

### Alternativa C — Abstracción casera con SDK OpenAI ✅ ELEGIDA

Aprovechar que prácticamente todos los proveedores comerciales relevantes son compatibles con el SDK de OpenAI (basta cambiar `base_url`).

**Pros:**

- **Una sola dependencia:** el SDK de OpenAI.
- Cambio de proveedor solo con variables de entorno.
- Código mínimo, fácil de entender.
- Funciona con Gemini (vía `generativelanguage.googleapis.com/v1beta/openai/`), OpenAI, Anthropic (vía proxies), Ollama local, Groq, etc.
- La Privacy API declara el proveedor de forma genérica (`llm_provider`), no atada a un vendor.

**Contras:**

- Algunas features muy específicas de proveedores (ej. Gemini-only "thinking" mode, Anthropic-only "tools") no son accesibles vía esta abstracción.

**Por qué sí:** balance perfecto entre simplicidad y flexibilidad para nuestro caso.

## Consecuencias

### Positivas

- **MVP gratuito:** $0 en costo de LLM usando el tier gratuito de Gemini.
- **Producción escalable:** mismo código corriendo contra OpenAI cuando se justifique pagar.
- **Sin vendor lock-in:** cualquier futuro cambio de proveedor (Anthropic, modelos open-source, lo que sea) es config + reiniciar.
- **Privacy API limpia:** declaración genérica `llm_provider`, no atada a OpenAI ni a nadie.
- **Tests determinísticos:** mockear `LLMProvider` es trivial, no hace falta mockear el SDK de OpenAI.

### Negativas / trade-offs aceptados

- **Features específicas de un proveedor** (ej. Gemini "thinking" tokens visibles, OpenAI structured outputs avanzados) no se pueden usar directamente sin perder portabilidad.
- **Comportamientos sutiles distintos** entre proveedores (calidad de respuesta, latencia, formato exacto de errores) — el código tiene que ser defensivo.
- **Migración entre modelos de embeddings** requiere re-indexación si cambian dimensiones (ver ADR-002).

### Cómo se mitigan

- **Features específicas:** si en algún momento una feature solo de Gemini o solo de OpenAI es crítica, se puede agregar un método específico al `LLMProvider` con detección por modelo activo. Por ahora, no hay ninguna que lo justifique.
- **Comportamientos distintos:** el dataset de evaluación RAG (ver `investigacion/02-rag/evaluacion-rag.md`) prueba ambos proveedores antes de cualquier cambio en producción.
- **Re-indexación:** documentada en ADR-002 con script de migración planificado.

## Cuándo revisar esta decisión

Reabrir si:

| Trigger | Acción esperada |
|---|---|
| Necesitamos una feature solo de un proveedor (ej. Gemini "thinking", OpenAI Structured Outputs avanzados) | Evaluar agregar método específico al LLMProvider o hacer fork del código |
| Aparece un proveedor con API totalmente incompatible con SDK OpenAI | Crear un adapter pattern adicional |
| Queremos correr LLM 100% local (Ollama, llama.cpp) en producción | Verificar que el SDK OpenAI siga funcionando contra el endpoint local. (Spoiler: sí, Ollama expone API compatible) |

## Referencias

- [Google Gemini — OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai)
- [OpenAI Python SDK](https://github.com/openai/openai-python)
- [Ollama — OpenAI-compatible API](https://github.com/ollama/ollama/blob/main/docs/openai.md)
- [`investigacion/03-openai/Modelos-de-Lenguaje.md`](../../investigacion/03-openai/Modelos-de-Lenguaje.md)
- [`investigacion/03-openai/embeddings.md`](../../investigacion/03-openai/embeddings.md)

---

*Última actualización: 2026-05-02*
