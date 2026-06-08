# Costos

## Metodología

El análisis de costos se divide en cuatro categorías:

1. **Infraestructura** — hosting de backend, base de datos, cache, dominio.
2. **Servicios externos** — LLM y embeddings (Gemini en MVP, OpenAI en
   producción).
3. **Personal** — horas-persona del equipo valuadas a tarifa de mercado
   junior/semisenior en Argentina, 2026.
4. **Costos académicos** — herramientas educativas (Student Pack, Azure for
   Students) que reducen costos reales a cero.

## Costos de infraestructura

### Escenario MVP (estado actual, junio 2026)

| Servicio | Plan | Costo mensual (USD) | Costo anual (USD) | Estado |
|---|---|---|---|---|
| Railway (backend FastAPI) | Free tier ($5 USD/mes crédito) | 0 | 0 | ✅ activo |
| Railway PostgreSQL + pgvector | Free tier (mismo proyecto) | 0 | 0 | ✅ activo |
| Railway Redis | Free tier (mismo proyecto) | 0 | 0 | ✅ activo |
| GitHub Free | público | 0 | 0 | ✅ activo |
| **Subtotal MVP** | | **$0** | **$0** | |

### Escenario producción (post-MVP, 500 alumnos)

| Servicio | Plan | Costo mensual (USD) | Costo anual (USD) |
|---|---|---|---|
| VPS para backend (Hetzner CX22 o DO 2GB) | dedicado | 6 | 72 |
| PostgreSQL gestionado (DO Managed DB) o self-hosted | starter | 0-15 | 0-180 |
| Redis | self-hosted en mismo VPS | 0 | 0 |
| Dominio (.com o .ar) | — | ~1 | 12-15 |
| TLS / SSL | Let's Encrypt | 0 | 0 |
| Backup de DB | DO automated | incluido | incluido |
| **Subtotal producción** | | **~7-22** | **~84-267** |

## Costos de servicios de IA

### MVP con Gemini (tier gratuito)

| Componente | Modelo | Costo |
|---|---|---|
| Chat completions | `gemini-2.5-flash` | $0 (tier gratuito Google AI Studio) |
| Embeddings | `gemini-embedding-001` (Matryoshka, 768 dim) | $0 (tier gratuito) |
| **Total MVP** | | **$0** |

Limitaciones del tier gratuito: 15 RPM (requests per minute), 1M TPM (tokens
per minute), 1.500 RPD (requests per day) por proyecto. Suficiente para
desarrollo + demo de tesis con docenas de usuarios.

### Producción con OpenAI

Estimación basada en una facultad de 500 alumnos activos, ~10 consultas por
alumno por semana, contexto de chat con 1.500 tokens de prompt + 400 de
respuesta promedio.

| Componente | Modelo | Costo unitario | Estimación mensual |
|---|---|---|---|
| Chat input | `gpt-4o-mini` | $0.15 / M tokens | ~$50 (3 × 10⁸ tokens) |
| Chat output | `gpt-4o-mini` | $0.60 / M tokens | ~$48 (8 × 10⁷ tokens) |
| Embeddings | `text-embedding-3-small` | $0.02 / M tokens | ~$1 |
| **Total producción** | | | **~$100/mes** |

Equivalente a **$0.20 por alumno por mes**.

## Costos de personal (valoración teórica)

El equipo está compuesto por 2 estudiantes de Ingeniería en Sistemas (UCC).
La valoración se hace a tarifa de mercado junior con conocimientos
específicos del stack (Python + React + Moodle), tomando como referencia
rangos de salarios IT en Córdoba/Argentina para junio 2026.

**Tarifa hora estimada:** USD 12 / hora (≈ ARS equivalente al cambio del
momento, valuación junior con stack específico).

| Sprint | Duración | Horas por persona | Horas totales | Costo (USD) |
|---|---|---|---|---|
| Sprint 0 — Setup e investigación | 8 semanas | 60 | 120 | 1.440 |
| Sprint 1 — Core chat | 6 semanas | 80 | 160 | 1.920 |
| Sprint 2 — RAG | 6 semanas | 80 | 160 | 1.920 |
| Sprint 3 — Calidad | 6 semanas | 60 | 120 | 1.440 |
| Sprint 4 — MVP completo | 4 semanas | 100 | 200 | 2.400 |
| Documentación final | 6 semanas | 40 | 80 | 960 |
| **Total** | | **420 horas** | **840 horas** | **~10.080 USD** |

Si el proyecto fuera comercial, el costo de desarrollo del MVP rondaría los
**USD 10.000** (sin contar oficina, equipo informático, software, etc.).
Este número es útil para defender el valor del proyecto frente al
tribunal pero **no representa un costo real para la institución** —
los integrantes son estudiantes y el trabajo es académico.

## Costo total proyectado

### Para la tesis (estado actual)

| Concepto | Costo |
|---|---|
| Infraestructura MVP | $36/año |
| Gemini (tier gratuito) | $0 |
| Personal (estudiantes) | $0 real / ~$10.080 valuación |
| **Total real** | **~$36/año** |

Gracias al GitHub Student Pack ($200 USD de crédito DigitalOcean), el
hosting de Moodle público para la defensa también queda en $0 — cubriendo
los 12 meses de defensa de tesis sin costo real.

### Para producción comercial (1 año, 500 alumnos)

| Concepto | Costo anual |
|---|---|
| Infraestructura | ~$170 |
| OpenAI API | ~$1.200 |
| Mantenimiento (10h/mes × $12/h) | $1.440 |
| **Total** | **~$2.810** |

Equivalente a **$5.62 por alumno por año** — un orden de magnitud por debajo
de soluciones comerciales tipo Khan Academy ($59/alumno/año) o plataformas
de tutoría IA con modelo similar.

## Análisis costo-beneficio

El costo total para una institución que adopte NexusAI es de ~$2.800/año
para 500 alumnos. El beneficio principal es **asistencia académica
disponible 24/7 sin contratar tutores adicionales**. Si la institución
ahorra siquiera 1 hora-tutor por alumno por año a $20/hora, el ahorro es
$10.000/año — un retorno de ~3.5x sobre el costo del sistema.

Adicionalmente, el sistema es **self-hosted**: una vez instalado, los datos
académicos no salen de la infraestructura de la institución, lo que evita
problemas regulatorios de privacidad que tienen los servicios SaaS de
asistentes IA.


