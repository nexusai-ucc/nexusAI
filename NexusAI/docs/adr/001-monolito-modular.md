# ADR-001: Backend Python como monolito modular (no microservicios)

| | |
|---|---|
| **Estado** | ✅ Aceptada |
| **Fecha** | 2026-05-02 |
| **Autor/es** | Equipo NexusAI |
| **Decididores** | Santiago Tricherri (PM), Delfina Salinas (SM), Marcos Bugliotti |

---

## Contexto

Al diseñar el backend Python que orquesta el pipeline RAG + OpenAI, surge la pregunta clásica: ¿lo hacemos como un único servicio (monolito) o como múltiples servicios separados (microservicios)?

Las fuerzas en juego son:

- **Equipo:** 3 personas (Santiago, Delfina, Marcos), trabajando en paralelo en plugin Moodle, frontend React y backend Python. No hay 1 dev por servicio.
- **Plazo:** MVP el 1 Jun 2026 (5 semanas desde el inicio del Sprint 1). Cada hora cuenta.
- **Audiencia:** este es un Proyecto Integrador académico, no un producto en producción con miles de usuarios.
- **Volumen esperado MVP:** ~50 alumnos en piloto. Post-MVP, ~500 alumnos en producción.
- **Complejidad inherente:** RAG con OpenAI + ChromaDB + indexación de documentos + chat con historial. Hay varios dominios distintos.
- **Defendibilidad ante jurado:** la arquitectura debe ser **explicable** y **justificable**, no impresionar con complejidad innecesaria.

## Decisión

El backend Python se construye como un **monolito modular** (FastAPI + un solo proceso Python), con cada dominio en su propio paquete con interfaces claras. **No se usan microservicios para el MVP.**

La estructura interna es:

```
services/api/app/
├── main.py
├── config.py
├── chat/                # Dominio: chat (RAG + LLM)
├── documents/           # Dominio: indexación de documentos
├── analytics/           # Dominio: analytics (post-MVP, placeholder)
├── infrastructure/      # Clientes externos (OpenAI, Chroma, Redis)
├── shared/              # Auth HMAC, observability, helpers
└── prompts/             # System prompts versionados
```

Cada dominio expone su API a través de su `router.py`. Los dominios se comunican entre sí via interfaces explícitas (no por importar funciones internas).

## Alternativas evaluadas

### Alternativa A — Microservicios desde el inicio

Splitear en `chat-service`, `indexer-service`, `analytics-service`, `auth-service`, `gateway`, etc. Cada uno con su propio repo o subcarpeta, su propio deploy, su propia DB si aplica.

**Pros:**

- Escalabilidad independiente por servicio.
- Aislamiento de fallos (un servicio caído no tira el resto).
- Cada servicio puede usar el stack que mejor le venga.
- "Suena moderno" para la defensa.

**Contras:**

- Equipo de 3 personas: si uno se enferma, se cae el 33% del staff. Microservicios asumen 1 equipo por servicio.
- **Latencia adicional:** cada hop entre servicios suma 5-50 ms. Una consulta del alumno ya hace 3 hops (React → PHP → Python → OpenAI). Splitar en 4 servicios Python sumaría 100-200 ms más.
- **Deploy complejo:** múltiples pipelines, gestión de versiones cruzadas, healthchecks coordinados.
- **Debugging:** un bug en producción atraviesa logs de N servicios. Distributed tracing es laburo extra.
- **Costo de hosting:** 1 contenedor en Railway = $5/mes. 5 contenedores = $25/mes + add-ons.
- **Tiempo de MVP:** cada minuto invertido en setup de microservicios es un minuto menos de feature.

**Por qué no:** todo el costo, casi nada del beneficio en este contexto. Sam Newman (autor de *Building Microservices*): "*You shouldn't start with microservices unless you have a good reason.*" No tenemos esa razón.

### Alternativa B — Monolito clásico (sin modularización fuerte)

Un solo `main.py` con todo el código en una jerarquía plana o pobre, sin separación clara de dominios.

**Pros:**

- Más rápido de arrancar.
- Menos overhead mental.

**Contras:**

- Cuando crece, se vuelve "big ball of mud".
- Imposible extraer un dominio a un servicio separado sin reescribir.
- Tests difíciles de aislar.
- Onboarding de cada feature nueva pesa más.

**Por qué no:** ahorra tiempo hoy, pero hipoteca el post-MVP. La modularización cuesta 0 si la planteás desde el día 1.

### Alternativa C — Monolito modular ✅ ELEGIDA

Un solo proceso, un solo deploy, **pero internamente organizado por dominios** con interfaces explícitas. Cada dominio podría ser extraído a un servicio separado más adelante con costo bajo.

**Pros:**

- Toda la simplicidad operacional del monolito.
- Toda la limpieza arquitectónica que necesitaríamos para microservicios.
- Camino de evolución claro: si en post-MVP un dominio justifica su servicio propio, lo extraemos.
- Defendible ante el jurado: muestra criterio (no over-engineering, no falta de planning).

**Contras:**

- Disciplina requerida para no atravesar las fronteras de los módulos. Mitigable con linting/code review.

**Por qué sí:** balance óptimo costo/beneficio para el contexto.

## Consecuencias

### Positivas

- **Deploy simple:** un único contenedor Docker, una sola URL, un solo pipeline CI.
- **Latencia mínima:** sin hops adicionales entre servicios.
- **Tests más simples:** un solo entorno de pruebas, sin coordinar versiones.
- **Costo bajo:** $5/mes hosting MVP.
- **Onboarding fácil para los 3 devs:** cada uno corre el sistema entero en su laptop.
- **Camino claro a microservicios:** si el dolor aparece, splitar es manageable.

### Negativas / trade-offs aceptados

- **Escalabilidad limitada por nodo:** si un dominio (ej. indexación) tiene picos de uso, escala todo el monolito o nada.
- **Un fallo en un dominio puede tirar todo:** un bug en indexación que rompa Python tira también el chat.
- **No podemos elegir stacks distintos por dominio:** todo Python.

### Cómo se mitigan

- **Escalabilidad:** para el MVP no es problema (50-500 usuarios). Si llegamos al límite de un VPS, escalamos vertical (más RAM/CPU). Cuando eso no alcance, extraemos el dominio caliente a su servicio.
- **Fallos cruzados:** disciplina de tests + buenas prácticas de manejo de excepciones en cada dominio. Async en operaciones largas (indexación) para no bloquear el chat.
- **Stack único:** Python cubre todos los casos (RAG, indexación, analytics). No es una limitación real para el MVP.

## Cuándo revisar esta decisión

Reabrir el debate de splitar a microservicios si:

| Trigger | Acción esperada |
|---|---|
| Indexar 200+ PDFs bloquea el chat por minutos | Extraer `nexus-indexer` como worker async (Celery/RQ) |
| Aparece la épica 04 (analytics docente) con queries pesadas | Evaluar extraer `nexus-analytics` con DB propia agregada |
| pgvector no escala (>10M vectores con concurrencia alta) | Evaluar Qdrant o Weaviate como base vectorial dedicada |
| Equipo crece a > 6 devs | Evaluar splitar para que cada equipo tenga su servicio |
| Un dominio impone requirements distintos al resto (ej. GPU) | Extraer ese dominio |

Mientras estos triggers no se den, **mantenemos el monolito modular**.

## Referencias

- Sam Newman — *Building Microservices*, 2nd edition (2021).
- Martin Fowler — [*MonolithFirst*](https://martinfowler.com/bliki/MonolithFirst.html) (2015).
- Google SRE — [*Microservices vs Monoliths*](https://sre.google/workbook/anti-fragile-services/) — capítulo sobre sobrecomplejidad.
- [`investigacion/05-backend-fastapi/estructura-api.md`](../../investigacion/05-backend-fastapi/estructura-api.md)

---

*Última actualización: 2026-05-02*
