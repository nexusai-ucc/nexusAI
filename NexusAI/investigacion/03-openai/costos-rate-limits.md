# Costos, rate limits y optimización

> **Resumen:** Proyección mensual de costos por tamaño de institución y cómo controlarlos. Con GPT-4o-mini + caching de prompts + rate limiting, 500 alumnos cuestan ~$80-100/mes.

---

## Contexto

El jurado va a preguntar por el costo. Tenemos que presentar números realistas, sensibilidades y palancas de optimización.

## Supuestos

- Consultas por alumno por día: **15**
- Días activos por mes: **20** (universidad real)
- Tokens input promedio por consulta: **2.500** (sys + historial + contexto + pregunta)
- Tokens output promedio por consulta: **500**

## Proyección — GPT-4o-mini

| Alumnos | Consultas/mes | Input tokens/mes | Output tokens/mes | **Costo/mes** |
|---|---|---|---|---|
| 50 | 15.000 | 37.5M | 7.5M | **~$10** |
| 200 | 60.000 | 150M | 30M | **~$41** |
| 500 | 150.000 | 375M | 75M | **~$102** |
| 1.000 | 300.000 | 750M | 150M | **~$203** |

Cálculo: `375M × $0.15/M + 75M × $0.60/M = $56.25 + $45 = $101.25`

## Proyección — GPT-4o (referencia)

| Alumnos | Costo/mes |
|---|---|
| 50 | ~$169 |
| 200 | ~$675 |
| 500 | ~$1.688 |
| 1.000 | ~$3.375 |

**Conclusión:** GPT-4o-mini es 16× más barato para outputs, 17× para inputs. En escala de 500 alumnos, la diferencia es **$1.600/mes** — literalmente el costo de todo el resto del hosting multiplicado por 50.

## Palancas de optimización

### 1. Prompt caching (-50% en inputs repetidos)

OpenAI cobra 50% menos por tokens de input que ya vió recientemente. Crítico para NexusAI porque el **system prompt y buena parte del contexto se repiten** entre consultas de la misma materia.

```python
# El system prompt + chunks de uso frecuente quedan cacheados
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": LONG_SYSTEM_PROMPT},  # Cacheable
        {"role": "user", "content": f"Contexto: {frequent_chunks}\n\nPregunta: {q}"},
    ],
)
```

Impacto estimado: **-30% del costo de inputs** en promedio.

### 2. Rate limiting por alumno

Tabla `{local_nexusai_usage}`:

```sql
CREATE TABLE local_nexusai_usage (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    userid BIGINT NOT NULL,
    courseid BIGINT NOT NULL,
    date DATE NOT NULL,
    count INT NOT NULL DEFAULT 0,
    UNIQUE KEY (userid, courseid, date)
);
```

**Límite propuesto:** 50 consultas/alumno/día (el docente puede ajustar por materia).

Esto **capa el peor caso** (un alumno que hace 200 preguntas en un rato) sin molestar al uso normal.

### 3. Cache de respuestas idénticas

Preguntas frecuentes (ej. "¿cuál es el primer parcial?") se repiten. Cache TTL 24h:

```python
cache_key = hashlib.sha256(f"{course_id}:{normalize(question)}".encode()).hexdigest()
cached = await redis.get(cache_key)
if cached:
    return json.loads(cached)
# ... llamar GPT ...
await redis.set(cache_key, json.dumps(response), ex=86400)
```

Reduce ~15-20% de las llamadas en estado estacionario.

### 4. Modelo dinámico (post-MVP)

Un router heurístico que elige el modelo según la complejidad:

```python
def choose_model(question: str, context: str) -> str:
    if len(question) > 200 or "compará" in question.lower() or "analiza" in question.lower():
        return "gpt-4o"
    return "gpt-4o-mini"
```

## Rate limits de OpenAI (Tier 1)

| Modelo | RPM | TPM |
|---|---|---|
| `gpt-4o` | 500 | 30.000 |
| `gpt-4o-mini` | 500 | 200.000 |
| `text-embedding-3-small` | 3.000 | 1.000.000 |

Para **500 alumnos con picos en horario de clase (19-22h)**, proyectamos picos de ~500 consultas/min → al borde del límite de RPM. Solución: **Tier 2 o superior** (se obtiene gastando $50+ y esperando 7 días).

## Hosting del backend — costos relacionados

| Plataforma | Costo/mes | Uso |
|---|---|---|
| Render Free | $0 | Desarrollo y pruebas. Efímero — no persiste ChromaDB. |
| Railway Hobby | $5 | **Producción MVP.** Volúmenes persistentes. |
| Hetzner CX23 | €3.49 | Mejor precio/performance. Let's Encrypt manual. |
| DigitalOcean Droplet | $6 | Alternativa a Hetzner con docs mejores. |
| Google Cloud Run | $5-20 | Auto-escalado, pero stateless (ChromaDB afuera). |

**Plan MVP:** Render Free en dev, Railway Hobby para la demo al jurado.

## Costo total proyectado — 500 alumnos, MVP

| Item | Costo mensual |
|---|---|
| OpenAI (GPT-4o-mini + embeddings) | ~$100 |
| Hosting (Railway Hobby) | $5 |
| Dominio + SSL | $1 |
| **TOTAL** | **~$106/mes** |

Equivalente a **~$0.21/alumno/mes**.

## Decisiones tomadas para NexusAI

- **GPT-4o-mini** como default. GPT-4o como opt-in del docente.
- **Rate limit:** 50 consultas/alumno/día, configurable por materia.
- **Prompt caching** activado desde el Sprint 2.
- **Cache de respuestas** (Redis) en post-MVP.
- **Proyección para defensa:** $106/mes para 500 alumnos, base GPT-4o-mini sin opt-in.

## Abierto / pendiente

- [ ] Confirmar si la UCC financia los tokens o si hay que buscar sponsor.
- [ ] Evaluar créditos de OpenAI para educación (si existen).
- [ ] Setear dashboard de costos en OpenAI con alertas a $50 / $100 / $150.
- [ ] Upgrade a Tier 2 si el beta con alumnos reales roza los RPM.

## Referencias

- [OpenAI — Pricing](https://openai.com/api/pricing/)
- [OpenAI — Rate limits](https://platform.openai.com/docs/guides/rate-limits)
- [OpenAI — Prompt caching](https://platform.openai.com/docs/guides/prompt-caching)
- [Railway pricing](https://railway.app/pricing)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
