# NexusAI — Entrega Final del MVP

Asistente académico con IA integrado en Moodle.
Universidad Católica de Córdoba · Ingeniería en Sistemas · 2026.
Santiago Tricherri y Delfina Salinas.

Proyecto Integrador · Administración de Proyectos de Software.

---

# El problema y los datos que lo confirman

Cuando hablamos con compañeros de la facultad, todos contaban lo mismo: la información de las materias está dispersa entre Moodle, WhatsApp, Drive y mails. Los alumnos pierden tiempo buscando en vez de estudiar. Los docentes no saben qué dudas se repiten ni qué temas no quedan claros.

## Relevamiento UCC

**+70%** de los estudiantes reporta dificultades para encontrar información de la materia.

## Las 4 funcionalidades más solicitadas

1. Asistente que responde dudas de la materia
2. Buscador inteligente de documentos
3. Generación automática de quizzes y resúmenes
4. Detección de temas que faltan en el material

Las cuatro las implementamos en el MVP.

---

# La solución: NexusAI

Es un plugin de Moodle que se instala dentro del Moodle de la institución. Los alumnos lo usan desde el mismo curso donde ya estudian.

## Cuatro propiedades distintivas

**RAG auténtico con citas trazables**: cada respuesta enlaza al fragmento exacto del material del curso. Si no se puede responder con el material disponible, lo admite — no inventa.

**Self-hosted**: los datos académicos se quedan en la institución. La API key del LLM nunca llega al navegador.

**Multi-curso opcional**: el alumno consulta el material de todos sus cursos a la vez, con citas que indican de qué materia viene cada fragmento.

**Feedback loop al docente**: lo que el sistema no puede responder queda registrado para mejorar el material.

---

# Arquitectura: Hybrid PHP Proxy

Tres capas y una sola base de datos.

**Frontend**: plugin Moodle PHP que renderiza un bundle React adentro del curso.

**Proxy HMAC server-to-server**: cada request del navegador pasa por el PHP del plugin, que firma con HMAC SHA-256 y reenvía al backend. La API key del LLM nunca llega al navegador.

**Backend**: FastAPI + Python 3.11, PostgreSQL con pgvector (índice HNSW), Redis para rate limiting y nonces anti-replay.

**Multi-provider LLM**: Gemini 2.5 Flash en el MVP, abstraído por interfaz para cambiar a OpenAI o Anthropic en una variable.

**Triple defensa de autenticación**: Bearer token + firma HMAC + nonce Redis con TTL.

---

# Stack tecnológico

- **Frontend**: React 18 + Webpack (bundle AMD para Moodle)
- **Backend**: FastAPI + Python 3.11 + Docker
- **Datos**: PostgreSQL 16 + pgvector + índice HNSW + Alembic
- **Cache**: Redis 7
- **LLM**: Gemini 2.5 Flash vía SDK compatible con OpenAI
- **Plugin Moodle**: PHP tipo `local`, compatible 4.1 LTS a 4.5
- **Infra**: Docker Compose en dev, Railway en producción
- **CI/CD**: GitHub Actions

Todo open source, código en GitHub, ZIP del plugin en el pendrive.

---

# Demo en vivo

Cinco minutos. Lo que van a ver es el sistema real. Moodle local en `localhost:8082` conectado al backend de NexusAI en Railway.

Pueden verificar el backend en `nexusai-production-e414.up.railway.app/health` desde el celular.

## Rol docente (90 segundos)

1. Subir un PDF al curso
2. Ver la indexación en tiempo real (SSE)
3. Revisar la pestaña "Gaps detectados"

## Rol alumno (2.5 minutos)

4. Chat con respuesta streaming
5. Citas clickeables con preview del fragmento
6. Pestaña Buscador: retrieval sin LLM
7. Quiz generator: 3 preguntas y score
8. Toggle multi-curso

---

# Sprints: cómo lo construimos

5 sprints entre el 23 de abril y el 8 de junio de 2026.

**Sprint 0 · Setup** (9-22 Abr) — Investigación, ADRs, decisiones de arquitectura. 60/60 SP.

**Sprint 1 · Core chat** (23 Abr - 6 May) — Backend FastAPI, plugin Moodle, frontend React, HMAC end-to-end. 45/50 SP.

**Sprint 2 · RAG completo** (7-20 May) — Indexación, vista docente, retrieval con pgvector. 55/60 SP.

**Sprint 3 · Calidad** (21-27 May) — Retry policies, rate limiting, logging estructurado, CI/CD. 25/25 SP.

**Sprint 4 · MVP completo** (28 May - 1 Jun) — Las 7 features del demo: search, multi-curso, streaming, citas, historial, quiz, gaps. 70/70 SP.

**Total: 255/265 story points completados (96%)**

---

# Commits y código del proyecto

Los números del trabajo de equipo a junio 2026.

## Actividad en GitHub

**97 commits** totales en 4 branches (main, dev, feature/*, fix/*).

**Trabajo balanceado entre los dos:**
- Delfina Salinas: **49 commits** (51%)
- Santiago Tricherri: **47 commits** (49%)

**46 días de desarrollo activo** (23 abril - 8 junio 2026), promedio 2.1 commits diarios.

## Líneas de código

| Tecnología | LoC | Archivos |
|---|---|---|
| **Python** (backend FastAPI) | 5.380 | 51 |
| **PHP** (plugin Moodle) | 3.238 | 28 |
| **TypeScript / React** (frontend) | ~2.500 | ~20 |
| **Markdown** (documentación) | 18.503 | 123 |

## Calidad del repo

- **14 ADRs** documentando decisiones técnicas
- **37 tests automatizados** en backend
- **51 casos de testing manual** en 9 áreas
- **~80% de cobertura de tests** en backend
- CI/CD con GitHub Actions: build + test + lint en cada PR

---

# Deploy en producción

**Backend en Railway** con autodeploy desde main. Cada push dispara build de Docker y release.

Online 24/7 hasta la defensa final.

URL pública: `nexusai-production-e414.up.railway.app`

El plugin Moodle se distribuye como ZIP y se instala dentro de cada instancia Moodle.

## Para la demo

Levantamos un Moodle local con moodle-docker apuntando al backend de Railway — exactamente la arquitectura que usaría una universidad real.

---

# Métricas del MVP

## Calidad

- **37** tests automatizados en backend
- **51** casos de testing manual en 9 áreas
- **~80%** de cobertura de tests
- **0** vulnerabilidades críticas (escaneo `npm audit` + `pip-audit`)

## Performance

- **<1s** primer token en streaming SSE
- **3-6 s** chat completo (con LLM)
- **0.3-0.8 s** buscador puro (sin LLM)
- **30-50 s** indexación PDF de 50 páginas

## Cobertura funcional

- **7** features del MVP entregadas
- **16** endpoints HTTP en backend
- **10** External Functions en el plugin

---

# Costos y TCO

## Costos del MVP (lo que ya gastamos)

| Concepto | Costo real |
|---|---|
| Railway (backend hosting) | **$0** (free tier) |
| Gemini 2.5 Flash (LLM) | **$0** (free tier) |
| PostgreSQL + Redis | **$0** (incluido en Railway) |
| Dominio | **$0** (subdominio Railway) |
| GitHub | **$0** (repo público) |
| **Total infraestructura del MVP** | **$0 / mes** |

## Costo de desarrollo (notional, tarifa de mercado)

| Concepto | Cantidad | Subtotal |
|---|---|---|
| Horas planificadas (BAC) | 400 h | $10.000 USD |
| Horas reales (AC) | 420 h | $10.500 USD |
| Sobrecosto | +20 h (+5%) | +$500 USD |

Tarifa de referencia: $25/h (junior developer mercado argentino).

## Proyección de escalado (post-MVP)

| Usuarios | Railway | LLM (Gemini Pro) | Storage | **Total mensual** |
|---|---|---|---|---|
| 100 alumnos | $5 | $15 | $1 | **~$21** |
| 500 alumnos | $20 | $75 | $5 | **~$100** |
| 2.000 alumnos | $80 | $300 | $20 | **~$400** |
| 10.000 alumnos | $200 | $1.500 | $100 | **~$1.800** |

Costo por respuesta a 500 alumnos: **~$0.0003** (fracción de centavo).

---

# Gestión de riesgos

Trabajamos con una **matriz de 12 riesgos viva** con probabilidad × impacto. Estos son los 4 críticos y cómo los mitigamos:

**R-01 · Alucinaciones del LLM** (técnico, alto)
Prompts estrictos + threshold de similitud + regex post-respuesta que detecta "no encontré" y dispara feedback al docente.

**R-02 · Filtración de API key del LLM** (seguridad, alto)
Patrón Hybrid PHP Proxy: la clave nunca llega al navegador. Triple defensa Bearer + HMAC + nonce Redis.

**R-03 · Scope creep entre sprints** (cronograma, medio)
Backlog congelado al inicio de cada sprint, política explícita "esto va al post-MVP".

**R-04 · Caída del backend en la defensa** (operativo, medio)
Backend en Railway con autodeploy + health checks + fallback con capturas pregrabadas del demo.

---

# Lecciones aprendidas y próximos pasos

## Volveríamos a hacer

- Investigar mucho al inicio: el Sprint 0 con 47 docs ahorró meses de refactor
- Documentar con ADRs desde el día uno (14 ADRs en total)
- Monolito modular sobre microservicios (para 2 personas con plazo fijo)

## Cambiaríamos

- Tests automatizados desde Sprint 1, no desde Sprint 3
- Arrancar el submission al Plugin Directory antes del cierre

## Roadmap post-MVP

**Inmediato**: submission al Moodle Plugin Directory oficial (revisión mediana: 8 días).
**Corto plazo**: analytics para el alumno con dashboard de temas, tokens, sesiones.
**Mediano plazo**: pilotos UCC reales en cursos reales durante un cuatrimestre.
**Largo plazo**: clustering semántico de gaps, sugerencias proactivas, planes de estudio adaptativos, fine-tuning del LLM con material del curso.

---

# Aplicación de Administración de Proyectos de Software

NexusAI no fue solo desarrollar un producto: fue ejercitar todo el ciclo de gestión que vimos en la materia.

**Planificación**: WBS de 5 niveles, cronograma con dependencias, estimaciones con story points por planning poker.

**Ejecución**: Scrum con 5 sprints. Daily syncs, planning, review, retrospectiva. Backlog priorizado con MoSCoW. 96% de cumplimiento de SP.

**Control**: matriz de 12 riesgos con probabilidad × impacto, planes de mitigación, monitoreo de velocity sprint a sprint.

**Calidad**: 14 ADRs documentando decisiones, 37 tests automatizados, pipeline de CI/CD con GitHub Actions.

**Costos**: cálculo de TCO del MVP y proyección de costos a 4 niveles de escalado.

**Cierre**: lecciones aprendidas documentadas, código transferible, plan de continuidad post-MVP.

> El producto es el entregable visible; la gestión es el aprendizaje real de la materia.

---

# Valor Ganado (EVM)

Aplicamos EVM al cierre del proyecto para medir cumplimiento real contra lo planificado.

## Premisas del cálculo

- **BAC** (Budget at Completion): 265 SP × 1.5 h/SP = 400 h ≈ $10.000 notional
- **EV** (Earned Value): 255 SP completados = 385 h equivalentes
- **AC** (Actual Cost): ~420 h reales (incluye retrabajos)
- **Tarifa**: $25/h (junior dev mercado)

## Indicadores clave

- **SPI = 0.96** — Schedule Performance Index. Cronograma sano (meta > 0.95).
- **CPI = 0.92** — Cost Performance Index. Sobrecosto leve (~8%).
- **SV = −10 SP** — Schedule Variance. Atraso compensado en Sprint 4.
- **CV = −$875** — Cost Variance. ~9% sobre presupuesto notional.
- **EAC = ~$10.875** — Estimate at Completion.
- **% Completado = 96.2%** — EV / BAC.

## Lectura

Ambos ratios están en el rango "verde" del PMI para proyectos ágiles (0.90 - 1.10). El MVP cerró en plazo con sobrecosto controlado, sano para un proyecto con scope creep moderado.

---

# Gracias

El MVP de NexusAI está en producción, es entregable y se puede instalar en cualquier Moodle 4.x apuntando al backend que mantenemos en Railway.

## Recursos para el tribunal

- **Repositorio GitHub**: github.com/nexusai-ucc/nexusAI
- **Backend en producción**: nexusai-production-e414.up.railway.app
- **Swagger interactivo**: /docs en esa URL
- **Release del plugin**: v0.9.4 · 208 KB
- **Pendrive**: documentación, código, presentación, credenciales

## Equipo

- **Santiago Tricherri** · Project Manager · Backend & AI
- **Delfina Salinas** · Scrum Master · Frontend & RAG

¿Preguntas?
