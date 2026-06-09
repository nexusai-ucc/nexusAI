# NexusAI — Entrega Final del MVP

Asistente académico con IA integrado en Moodle.
Universidad Católica de Córdoba · Ingeniería en Sistemas · 2026.
Santiago Tricherri y Delfina Salinas.

---

# El problema y los datos que lo confirman

Cuando hablamos con compañeros de la facultad, todos contaban lo mismo: la información de las materias está dispersa entre Moodle, WhatsApp, Drive y mails. Los alumnos pierden tiempo buscando en vez de estudiar. Los docentes no saben qué dudas se repiten ni qué temas no quedan claros.

## Relevamiento en la UCC

**+70%** de los estudiantes reporta dificultades para encontrar información de la materia.

## Las 4 funcionalidades más solicitadas

1. Asistente que responde dudas de la materia
2. Buscador inteligente de documentos
3. Generación automática de quizzes y resúmenes
4. Detección de temas que faltan en el material

Las **cuatro** las implementamos en el MVP.

---

# La solución: NexusAI

NexusAI es un plugin de Moodle. Se instala dentro del Moodle de la institución y los alumnos lo usan desde el mismo curso donde ya estudian.

## Cuatro propiedades que lo distinguen

**RAG auténtico con citas trazables**: cada respuesta enlaza al fragmento exacto del material del curso. Si no se puede responder con el material disponible, el sistema lo admite — no inventa.

**Self-hosted**: los datos académicos se quedan en la institución. La API key del LLM nunca llega al navegador.

**Multi-curso opcional**: el alumno puede consultar el material de todos sus cursos a la vez, con citas que indican de qué materia viene cada fragmento.

**Feedback loop al docente**: lo que el sistema no puede responder queda registrado para que el docente mejore el material.

---

# Arquitectura y stack tecnológico

## Hybrid PHP Proxy: tres capas, una sola base

**Frontend**: plugin Moodle PHP que renderiza un bundle React adentro del curso.

**Proxy HMAC server-to-server**: cada request del navegador pasa por el PHP del plugin, que firma con HMAC SHA-256 y reenvía al backend. La API key del LLM nunca llega al navegador.

**Backend**: FastAPI + Python 3.11, PostgreSQL con pgvector (índice HNSW), Redis para rate limiting y nonces anti-replay.

## Stack

- React 18 + Webpack (bundle AMD para Moodle)
- FastAPI + Python 3.11 + Docker
- PostgreSQL 16 + pgvector + Alembic
- Redis 7
- Gemini 2.5 Flash (multi-provider abstracted)
- Plugin Moodle PHP `local`, compatible 4.1 LTS a 4.5
- Docker Compose en dev, Railway en producción

## Triple defensa de autenticación

Bearer token + firma HMAC SHA-256 + nonce Redis con TTL.

---

# Demo en vivo: 5 minutos

Lo que van a ver es el sistema real. Moodle local en `localhost:8082` conectado al backend de NexusAI en Railway. Pueden verificar el backend ustedes mismos en `nexusai-production-e414.up.railway.app/health`.

## Rol docente

1. Subir un PDF al curso
2. Ver la indexación en tiempo real (SSE)
3. Revisar la pestaña "Gaps detectados"

## Rol alumno

4. Chat con respuesta streaming
5. Citas clickeables con preview del fragmento
6. Pestaña Buscador: retrieval sin LLM
7. Quiz generator: 3 preguntas y score
8. Toggle multi-curso

---

# Sprints y deploy en producción

## 5 sprints entre el 9 de abril y el 1 de junio de 2026

**Sprint 0 · Setup**: 47 docs de investigación + ADRs → 60/60 SP
**Sprint 1 · Core chat**: Backend, plugin, React, HMAC → 45/50 SP
**Sprint 2 · RAG completo**: Indexación, vista docente, retrieval → 55/60 SP
**Sprint 3 · Calidad**: Retry, rate limiting, logging, CI/CD → 25/25 SP
**Sprint 4 · MVP**: 7 features completas → 70/70 SP

**Total: 255/265 story points completados (96%)**

## Deploy

Backend en **Railway** con autodeploy desde main. Online 24/7 hasta la defensa final.
URL pública: `nexusai-production-e414.up.railway.app`

El plugin se distribuye como ZIP y se instala en cada instancia Moodle.

Para el demo levantamos un Moodle local con moodle-docker apuntando al backend de Railway — exactamente la arquitectura que usaría una universidad real.

---

# Métricas del MVP y gestión de riesgos

## Métricas

- **37** tests automatizados en backend
- **51** casos de testing manual en 9 áreas
- **~80%** de cobertura
- **<1s** primer token en streaming SSE
- Chat completo: 3-6 s
- Costos del MVP: **$0 / mes** (Railway + Gemini free tier)
- Proyección 500 alumnos: ~$100 / mes

## Matriz de riesgos críticos

**R-01 · Alucinaciones del LLM** (técnico, alto): prompts estrictos + threshold de similitud + regex post-respuesta que detecta "no encontré" y dispara feedback al docente.

**R-02 · Filtración de API key del LLM** (seguridad, alto): patrón Hybrid PHP Proxy — la clave nunca llega al navegador. Triple defensa Bearer + HMAC + nonce.

**R-03 · Scope creep entre sprints** (cronograma, medio): backlog congelado al inicio de cada sprint, política "esto va al post-MVP".

**R-04 · Caída del backend en la defensa** (operativo, medio): health checks + fallback con capturas pregrabadas del demo.

---

# Lecciones aprendidas y próximos pasos

## Volveríamos a hacer

- Investigar mucho al inicio: el Sprint 0 con 47 docs ahorró meses de refactor
- Documentar con ADRs desde el día uno
- Monolito modular sobre microservicios (para 2 personas con plazo fijo)

## Cambiaríamos

- Tests automatizados desde Sprint 1, no desde Sprint 3
- Arrancar el submission al Plugin Directory antes del cierre

## Roadmap post-MVP

**Inmediato**: submission al Moodle Plugin Directory oficial (revisión mediana: 8 días).
**Corto plazo**: analytics para el alumno con dashboard de temas, tokens, sesiones.
**Mediano plazo**: pilotos UCC reales en cursos reales con medición de impacto pedagógico.
**Líneas de evolución**: clustering semántico de gaps, sugerencias proactivas, planes de estudio adaptativos, fine-tuning del LLM.

---

# Aplicación de Administración de Proyectos de Software

NexusAI no fue solo desarrollar un producto: fue ejercitar todo el ciclo de gestión que vimos en la materia, incluido el análisis de **Valor Ganado (EVM)** al cierre.

## Áreas de gestión aplicadas

**Planificación**: WBS de 5 niveles, cronograma con dependencias, estimaciones con story points por planning poker.

**Ejecución**: Scrum con 5 sprints. Daily syncs, planning, review, retrospectiva. Backlog priorizado con MoSCoW.

**Control**: matriz de 12 riesgos con probabilidad × impacto, planes de mitigación, monitoreo de velocity.

**Calidad**: 14 ADRs, 37 tests automatizados, pipeline de CI/CD con GitHub Actions desde Sprint 3.

**Cierre**: lecciones aprendidas documentadas, código transferible, plan de continuidad post-MVP.

## Valor Ganado (EVM) al cierre

**Premisas**: BAC = 265 SP × 1.5 h/SP = 400 h ≈ $10.000 notional (tarifa junior $25/h). EV = 255 SP completados = 385 h equivalentes. AC = ~420 h reales.

**Indicadores clave:**

- **SPI = 0.96** — Schedule Performance Index. Cronograma sano (meta > 0.95).
- **CPI = 0.92** — Cost Performance Index. Sobrecosto leve (~8%).
- **SV = −10 SP** — atraso compensado en Sprint 4.
- **CV = −$875** — ~9% sobre presupuesto notional.
- **EAC = ~$10.875** — proyección final al cierre del MVP.
- **% Completado = 96.2%** — EV / BAC.

**Lectura**: ambos ratios están en el rango "verde" del PMI para proyectos ágiles (0.90 - 1.10). El MVP cerró en plazo con sobrecosto controlado.

> El producto es el entregable visible; la gestión es el aprendizaje real de la materia.

---

# Gracias

El MVP de NexusAI está en producción, es entregable y se puede instalar en cualquier Moodle 4.x apuntando al backend que mantenemos en Railway.

## Recursos

**Repositorio**: github.com/nexusai-ucc/nexusAI
**Backend en producción**: nexusai-production-e414.up.railway.app
**Release del plugin**: v0.9.4 · 208 KB

¿Preguntas?
