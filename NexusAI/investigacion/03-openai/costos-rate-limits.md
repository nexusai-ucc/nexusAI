# Costos, rate limits y optimización

Resumen: En el MVP el costo de LLM es **$0** usando Gemini 2.5 Flash (tier gratuito). Para producción con GPT-4o-mini, 500 alumnos cuestan ~$100/mes. Se incluyen proyecciones por escala, palancas de optimización y costos de hosting.

## Contexto

El jurado va a preguntar por el costo. Tenemos que presentar números realistas diferenciando claramente dos escenarios: el MVP (gratuito, para validar la idea) y producción a escala (pago, para la UCC real).

## Supuestos base

- Consultas por alumno por día: 15
- Días activos por mes: 20 (universidad real)
- Tokens input promedio por consulta: 2.500 (system prompt + historial + contexto RAG + pregunta)
- Tokens output promedio por consulta: 500

## Escenario A — MVP con Gemini 2.5 Flash (gratuito)

| Alumnos | Consultas/mes | Costo LLM | Costo embeddings | Total LLM |
|---|---|---|---|---|
| Hasta ~75 | ~22.500 | **$0** | **$0** | **$0** |

El tier gratuito de Gemini cubre 1.500 requests/día. Con un piloto de 50-75 alumnos activos no se supera ese límite. Suficiente para validar la idea con usuarios reales sin gasto.

**Limitación:** en el tier gratuito no hay SLA, no hay garantía de uptime, y los términos prohíben uso de producción de alto volumen. Es el proveedor correcto para el MVP, no para la UCC completa.

## Escenario B — Producción con GPT-4o-mini

| Alumnos | Consultas/mes | Input tokens/mes | Output tokens/mes | Costo/mes |
|---|---|---|---|---|
| 50 | 15.000 | 37.5M | 7.5M | ~$10 |
| 200 | 60.000 | 150M | 30M | ~$41 |
| 500 | 150.000 | 375M | 75M | ~$102 |
| 1.000 | 300.000 | 750M | 150M | ~$203 |

Cálculo para 500 alumnos: 375M × $0.15/M + 75M × $0.60/M = $56.25 + $45 = **$101.25/mes**

## Escenario C — Producción con GPT-4o (referencia, no recomendado como default)

| Alumnos | Costo/mes |
|---|---|
| 50 | ~$169 |
| 200 | ~$675 |
| 500 | ~$1.688 |
| 1.000 | ~$3.375 |

GPT-4o-mini es 16× más barato en outputs y 17× en inputs. Para 500 alumnos la diferencia es $1.586/mes. No tiene sentido como default — solo como opt-in del docente para casos complejos.

## Palancas de optimización

### 1. Prompt caching (aplica a OpenAI en producción)
OpenAI cobra 50% menos por tokens de input que ya procesó recientemente. Crítico para NexusAI porque el system prompt y parte del contexto se repiten entre consultas de la misma materia.

```python
# El system prompt + chunks de uso frecuente quedan cacheados automáticamente
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": LONG_SYSTEM_PROMPT},  # Cacheable
        {"role": "user", "content": f"Contexto: {frequent_chunks}\n\nPregunta: {q}"},
    ],
)
```

Impacto estimado: -30% del costo de inputs en promedio.

### 2. Rate limiting por alumno

Tabla `{local_nexusai_usage}` en PostgreSQL:

```sql
CREATE TABLE local_nexusai_usage (
    id          BIGSERIAL PRIMARY KEY,
    userid      BIGINT NOT NULL,
    courseid    BIGINT NOT NULL,
    date        DATE NOT NULL,
    count       INT NOT NULL DEFAULT 0,
    UNIQUE (userid, courseid, date)
);
```

Límite propuesto: **50 consultas/alumno/día**, configurable por el docente. Esto capa el peor caso (un alumno que hace 200 preguntas en un rato) sin molestar al uso normal, y protege el costo del proveedor de LLM.

### 3. Cache de respuestas idénticas (post-MVP)
Preguntas frecuentes (ej. "¿cuál es el primer parcial?") se repiten. Cache TTL 24h:

```python
cache_key = hashlib.sha256(f"{course_id}:{normalize(question)}".encode()).hexdigest()
cached = await redis.get(cache_key)
if cached:
    return json.loads(cached)
# ... llamar al LLM ...
await redis.set(cache_key, json.dumps(response), ex=86400)
```

Reduce ~15-20% de las llamadas en estado estacionario.

### 4. Modelo dinámico (post-MVP)
Un router heurístico que elige el modelo según la complejidad de la pregunta:

```python
def choose_model(question: str) -> str:
    if len(question) > 200 or any(w in question.lower()
            for w in ["compará", "analiza", "explicá las implicancias"]):
        return "gpt-4o"
    return "gpt-4o-mini"
```

## Rate limits de los proveedores

### Gemini 2.5 Flash (MVP — gratuito)
| Límite | Valor |
|---|---|
| Requests por minuto (RPM) | 15 |
| Requests por día | 1.500 |
| Tokens por minuto | 1.000.000 |

Para un piloto de 50-75 alumnos el límite de 1.500 req/día no se supera. Con picos en horario de clase se puede rozar el límite de RPM (15/min). Solución: queue de requests en FastAPI.

### OpenAI GPT-4o-mini (Tier 1 — producción)
| Modelo | RPM | TPM |
|---|---|---|
| gpt-4o-mini | 500 | 200.000 |
| text-embedding-3-small | 3.000 | 1.000.000 |

Para 500 alumnos con picos en horario de clase (19-22h), proyectamos picos de ~500 consultas/min → al borde del límite de RPM. Solución: Tier 2 (se obtiene gastando $50+ acumulados y esperando 7 días).

## Hosting del backend — costos relacionados

| Plataforma | Costo/mes | Uso |
|---|---|---|
| Render Free | $0 | Desarrollo y pruebas. No persiste datos en disco. |
| Railway Hobby | $5 | Producción MVP. Volúmenes persistentes. |
| Hetzner CX23 | €3.49 | Mejor precio/performance para producción real. |
| DigitalOcean Droplet | $6 | Alternativa a Hetzner con documentación más accesible. |

**Plan MVP:** Render Free en desarrollo, Railway Hobby para la demo al jurado.

**Nota:** ya no necesitamos considerar hosting separado para ChromaDB — pgvector corre sobre el mismo PostgreSQL del sistema, eliminando ese componente de infraestructura.

## Costo total proyectado

### MVP (demo al jurado — Gemini gratuito)
| Item | Costo mensual |
|---|---|
| LLM + Embeddings (Gemini tier gratuito) | $0 |
| Hosting (Railway Hobby) | $5 |
| Dominio + SSL | $1 |
| **TOTAL** | **~$6/mes** |

### Producción (500 alumnos UCC — GPT-4o-mini)
| Item | Costo mensual |
|---|---|
| GPT-4o-mini (chat) | ~$100 |
| text-embedding-3-small (indexación + queries) | ~$1 |
| Hosting (Hetzner o DigitalOcean) | ~$6 |
| Dominio + SSL | $1 |
| **TOTAL** | **~$108/mes** |

Equivalente a **~$0.22/alumno/mes** para 500 alumnos.

## Decisiones tomadas para NexusAI

- **MVP:** Gemini 2.5 Flash (gratuito) como LLM de chat y Gemini Embedding o nomic-embed-text como modelo de embeddings. Costo LLM = $0.
- **Producción:** GPT-4o-mini como default. GPT-4o como opt-in del docente para casos complejos.
- **Rate limit:** 50 consultas/alumno/día, configurable por materia desde el MVP.
- **Prompt caching** activado desde el Sprint 2 (solo aplica en producción con OpenAI).
- **Cache de respuestas** (Redis) en post-MVP.
- **Proyección para defensa:** $0 en MVP (Gemini gratuito), ~$108/mes para 500 alumnos en producción (GPT-4o-mini).

## Abierto / pendiente

- [ ] Confirmar si la UCC financia los tokens o si hay que buscar sponsor/patrocinio institucional.
- [ ] Evaluar créditos para investigación/educación de Google (Google for Education) y OpenAI.
- [ ] Setear alertas de costo en el dashboard de OpenAI a $50 / $100 / $150 cuando se active producción.
- [ ] Upgrade a Tier 2 de OpenAI si el beta con alumnos reales roza los RPM.
- [ ] Confirmar restricciones de privacidad de Gemini tier gratuito sobre datos de alumnos antes del piloto.

## Referencias

- [Google Gemini API — Pricing y límites](https://ai.google.dev/pricing)
- [OpenAI — Pricing](https://openai.com/pricing)
- [OpenAI — Rate limits](https://platform.openai.com/docs/guides/rate-limits)
- [OpenAI — Prompt caching](https://platform.openai.com/docs/guides/prompt-caching)
- [Railway pricing](https://railway.app/pricing)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
