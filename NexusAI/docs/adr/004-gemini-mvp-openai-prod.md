# ADR-004: Gemini 2.5 Flash en MVP, GPT-4o-mini en producción

| | |
|---|---|
| **Estado** | ✅ Aceptada |
| **Fecha** | 2026-05-02 |
| **Autor/es** | Santiago Tricherri |
| **Decididores** | Equipo NexusAI |

---

## Contexto

Habiendo decidido usar una arquitectura agnóstica de proveedor LLM (ver [ADR-003](003-multi-provider-llm.md)), nos queda elegir **qué proveedor concreto usar en cada entorno**:

- **MVP / piloto** (50-75 alumnos, demo al jurado): queremos validar la idea con usuarios reales sin gastar tokens.
- **Producción** (500 alumnos UCC): necesitamos un proveedor con SLA, rate limits adecuados y términos compatibles con uso institucional.

## Decisión

| Entorno | LLM de chat | Modelo de embeddings | Costo estimado |
|---|---|---|---|
| **MVP / piloto** | Gemini 2.5 Flash | Gemini Embedding (768 dim) o nomic-embed-text vía Ollama | **$0** |
| **Producción** | GPT-4o-mini | text-embedding-3-small (1.536 dim) | ~$108/mes para 500 alumnos |

**Cambio entre entornos:** solo variables de entorno. No hay cambios de código.

## Alternativas evaluadas

### Alternativa A — OpenAI GPT-4o-mini desde el día 1

Usar OpenAI desde MVP.

**Pros:**

- Un solo proveedor en todos los entornos.
- Calidad estable, bien testeada.

**Contras:**

- **~$10-100/mes** desde MVP.
- Necesita financiación o sponsor desde el inicio del PI.
- Requiere setear billing antes de tener resultado validado.

**Por qué no:** el MVP debería poder validarse sin compromiso económico. Desbloquea iteración rápida.

### Alternativa B — Gemini 2.5 Flash en MVP y producción

Quedarse con Gemini en todos los entornos.

**Pros:**

- $0 todo el camino (en tier gratuito).

**Contras:**

- **Tier gratuito tiene límites duros** (1.500 requests/día, 15 RPM).
- **No hay SLA** en tier gratuito.
- **Términos prohíben uso de producción de alto volumen.**
- Para 500 alumnos UCC, el límite de 1.500 req/día se rompe el primer día.

**Por qué no:** Gemini gratuito no escala a UCC completa. Necesitamos un proveedor pago para producción seria.

### Alternativa C — GPT-4o desde el día 1

Modelo más caro pero más capaz.

**Pros:**

- Máxima calidad de razonamiento.

**Contras:**

- **16-17× más caro que GPT-4o-mini.** Para 500 alumnos: $1.688/mes vs $102/mes.
- Para Q&A sobre contexto ya recuperado por RAG, GPT-4o-mini es suficiente — la calidad extra de GPT-4o no compensa el costo.

**Por qué no:** mal costo/beneficio. Reservamos GPT-4o como **opt-in del docente** para casos complejos puntuales.

### Alternativa D — Gemini en MVP, GPT-4o-mini en producción ✅ ELEGIDA

Aprovechar el tier gratuito de Gemini para el MVP, escalar a OpenAI cuando se justifique pagar.

**Pros:**

- **$0 en MVP** — desbloquea el piloto sin compromiso financiero.
- **Producción a costo razonable** ($108/mes para 500 alumnos = $0.22/alumno/mes).
- La arquitectura multi-provider (ADR-003) hace que el cambio sea trivial.
- Permite tener ambos proveedores configurados y elegir cuál usar por entorno (`development.env`, `production.env`).

**Contras:**

- Posible variación sutil de calidad entre Gemini Flash y GPT-4o-mini — hay que evaluar antes del pasaje a producción.
- Diferentes dimensiones de embeddings (768 vs 1.536) — re-indexación al cambiar.

**Por qué sí:** balance óptimo costo/aprovechamiento del tier gratuito + escalabilidad real cuando hace falta.

## Consecuencias

### Positivas

- **MVP gratuito** — desbloquea iteración rápida con usuarios reales.
- **Producción defendible** — costos proyectables, escalables, transparentes.
- **Mismo código** corriendo en ambos entornos.
- **Defensa al jurado:** dos números claros — "MVP $0, producción $108/mes para 500 alumnos".
- **Docente puede activar GPT-4o opt-in** para casos puntuales sin costo base.

### Negativas / trade-offs aceptados

- **Re-indexación obligatoria** al pasar de MVP (768 dim) a producción (1.536 dim).
- **Calidad de respuesta puede variar sutilmente** entre Gemini Flash y GPT-4o-mini.
- **Dependencia de dos proveedores externos** en lugar de uno.

### Cómo se mitigan

- **Re-indexación:** script documentado en [`investigacion/03-openai/embeddings.md`](../../investigacion/03-openai/embeddings.md). Indexar 240K chunks con OpenAI cuesta ~$5 — barato y rápido.
- **Calidad variable:** dataset de evaluación RAG (30 preguntas + ground truth) corrido contra ambos proveedores en Sprint 2-3, antes de pasaje a producción.
- **Doble dependencia:** ambos son opcionales gracias a la abstracción del ADR-003. Si uno cae o cambia precios, podemos pasar al otro o a un tercero (Anthropic, Ollama local).

## Cuándo revisar esta decisión

Reabrir si:

| Trigger | Acción esperada |
|---|---|
| Gemini lanza un tier "Education" con SLA y volumen alto a precio razonable | Considerar Gemini también en producción |
| OpenAI sube precios de GPT-4o-mini > 30% | Re-evaluar contra Gemini paid tier o Anthropic Haiku |
| El piloto MVP supera 1.500 req/día (límite Gemini gratuito) | Pasar a Gemini paid o adelantar a OpenAI |
| Restricciones de privacidad/jurisdicción de Gemini bloquean el piloto | Evaluar Anthropic, Azure OpenAI, o LLM local (Ollama) |
| Dataset de evaluación muestra calidad significativamente peor en uno de los dos | Cambiar default o documentar el escenario donde cada uno funciona mejor |

## Métricas a monitorear

- **Costo OpenAI mensual** (alerta a $50, $100, $150 cuando se active producción).
- **Cuota Gemini consumida** (alerta al 80% del límite diario en MVP).
- **Calidad de respuestas** (faithfulness ≥ 95%, recall@5 ≥ 0.85 — ver dataset evaluación).
- **Latencia p95** por proveedor.

## Referencias

- [Google Gemini API — Pricing y límites](https://ai.google.dev/pricing)
- [OpenAI — Pricing](https://openai.com/pricing)
- [`investigacion/03-openai/Modelos-de-Lenguaje.md`](../../investigacion/03-openai/Modelos-de-Lenguaje.md)
- [`investigacion/03-openai/costos-rate-limits.md`](../../investigacion/03-openai/costos-rate-limits.md)
- [ADR-003: arquitectura multi-provider](003-multi-provider-llm.md)

---

*Última actualización: 2026-05-02*
