# Guion de presentación · NexusAI · Entrega final del MVP

**Duración total**: 15 minutos
**Distribución**: 5 min contexto/solución → 5 min demo en vivo → 5 min proceso/riesgos/EVM/cierre
**Esquema**: 17 slides intercalados S-D. Santi abre, Delfi cierra.

| # | Quién | Tiempo | Tema |
|---|---|---|---|
| 1 | **Santi** | 25s | Portada |
| 2 | **Delfi** | 50s | El problema |
| 3 | **Santi** | 50s | Diagnóstico (+70%) |
| 4 | **Delfi** | 50s | La solución |
| 5 | **Santi** | 75s | Arquitectura |
| 6 | **Delfi** | 40s | Stack |
| 7 | **Santi** | 20s | Demo en vivo — intro |
| 8 | **Delfi** | 4 min | Demo guion (ejecutan demo real) |
| 9 | **Santi** | 40s | Sprints |
| 10 | **Delfi** | 35s | Deploy |
| 11 | **Santi** | 40s | Métricas |
| 12 | **Delfi** | 45s | Riesgos |
| 13 | **Santi** | 30s | Lecciones |
| 14 | **Delfi** | 30s | Próximos pasos |
| 15 | **Santi** | 40s | Aplicación de Adm de Proyectos |
| 16 | **Delfi** | 50s | **Valor Ganado (EVM)** *(nuevo)* |
| 17 | **Santi** | 25s | Cierre |

---

## SLIDE 1 — Portada · **SANTI** (25s)

> Buenos días/tardes. Soy Santiago Tricherri y ella es Delfina Salinas. Hoy venimos a presentar la entrega final del MVP de **NexusAI**, un asistente académico con IA integrado en Moodle, desarrollado como Proyecto Integrador de Ingeniería en Sistemas en la UCC.
>
> En los próximos 15 minutos les vamos a contar el problema, la solución, una demo en vivo y un repaso del proceso de gestión del proyecto.

**Transición**: *"Para empezar, le paso la palabra a Delfi para que les cuente cómo arrancó todo."*

---

## SLIDE 2 — El problema · **DELFI** (50s)

> Cuando arrancamos el proyecto fuimos a hablar con compañeros de la facultad y todos nos contaban lo mismo: la información de las materias **está dispersa**. Una parte en Moodle, otra en WhatsApp, otra en Drive, otra en PDFs por mail.
>
> Resultado: los alumnos pierden tiempo buscando en vez de estudiar. Y los docentes no tienen forma de saber qué dudas se están repitiendo, ni qué temas del material no están claros.
>
> Entonces nos preguntamos: **¿y si la IA pudiera responder dudas usando el material real del curso, y al mismo tiempo avisarle al docente qué falta?**

**Transición**: *"Santi te cuenta los datos del relevamiento."*

---

## SLIDE 3 — Diagnóstico +70% · **SANTI** (50s)

> Para validar la hipótesis hicimos un **relevamiento en la UCC** con estudiantes de Ingeniería.
>
> El dato más fuerte: **más del 70%** reporta dificultades para encontrar información de la materia, por la dispersión que mencionaba Delfi.
>
> Las cuatro funcionalidades más solicitadas fueron, en orden: asistente que responde dudas, buscador inteligente de documentos, generación automática de quizzes y resúmenes, y detección de temas que faltan en el material.
>
> Las **cuatro** las implementamos en el MVP.

**Transición**: *"Con esos datos diseñamos la solución, Delfi."*

---

## SLIDE 4 — La solución · **DELFI** (50s)

> **NexusAI es un plugin de Moodle**. No es una app aparte ni un SaaS — se instala adentro del Moodle de la institución y los alumnos lo usan desde el mismo curso donde ya estudian.
>
> Cuatro propiedades que lo distinguen:
>
> **RAG auténtico con citas trazables**: cada respuesta enlaza al fragmento exacto del material. Si no se puede responder con el material disponible, lo admite — no inventa.
>
> **Self-hosted**: los datos académicos se quedan en la institución. La API key del LLM nunca llega al navegador.
>
> **Multi-curso opcional**: el alumno puede consultar el material de todos sus cursos a la vez, con citas que indican de qué materia viene cada fragmento.
>
> **Feedback loop al docente**: lo que el sistema no puede responder queda registrado para que el docente mejore el material.

**Transición**: *"¿Cómo está construido por dentro? Santi."*

---

## SLIDE 5 — Arquitectura · **SANTI** (75s)

> Tres capas y una sola base de datos, con un patrón clave: **Hybrid PHP Proxy**.
>
> Del lado del usuario, **plugin Moodle en PHP** que renderiza un bundle React adentro del curso.
>
> En el medio, el plugin actúa como **proxy HMAC server-to-server**. Cada request del navegador pasa primero por el PHP del plugin, que firma con HMAC SHA-256 y reenvía al backend. Esto significa que la API key del LLM y el shared secret **nunca llegan al navegador**.
>
> Del lado del backend, **FastAPI con Python 3.11**, **PostgreSQL con pgvector** para búsqueda semántica con índice HNSW, y **Redis** para rate limiting y nonces anti-replay.
>
> **Multi-provider LLM**: en el MVP usamos Gemini 2.5 Flash, abstraído por interfaz, así que pasar a OpenAI o Anthropic es cambiar una variable de entorno.
>
> Autenticación con triple defensa: **Bearer token, firma HMAC, nonce con TTL en Redis**.

**Transición**: *"El stack en una mirada, Delfi."*

---

## SLIDE 6 — Stack · **DELFI** (45s)

> Rápido el stack para que tengan referencia:
>
> **Frontend**: React 18 con Webpack, bundle AMD para Moodle.
>
> **Backend**: FastAPI con Python 3.11, contenedor Docker.
>
> **Datos**: PostgreSQL 16 con pgvector, índice HNSW, migraciones con Alembic.
>
> **Cache**: Redis 7.
>
> **LLM**: Gemini 2.5 Flash vía SDK compatible con OpenAI.
>
> **Plugin**: PHP tipo `local`, compatible con Moodle 4.1 LTS a 4.5. Hook API 4.4+, callback legacy 4.1-4.3.
>
> **Infra**: Docker Compose en dev, Railway en producción.
>
> Todo open source, código en GitHub, ZIP del plugin en el pendrive.

**Transición**: *"Pasamos a ver el producto funcionando. Santi."*

---

## SLIDE 7 — Demo en vivo (intro) · **SANTI** (25s)

> Cinco minutos de demo. Lo que van a ver es **el sistema real**: este Moodle corre en `localhost:8082` pero está conectado al **backend de NexusAI en Railway**. Lo pueden verificar desde el celular abriendo la URL más `/health`.
>
> Yo manejo la pantalla, Delfi guía el recorrido.

**(Cambio de pantalla a Moodle en vivo)**

**Transición**: *"Delfi, arrancamos."*

---

## SLIDE 8 — Demo guion · **DELFI** narra · **SANTI** ejecuta (4 min)

**Delfi va leyendo, Santi clickea. Mostrar el slide al pasar entre bloques (Cmd+Tab).**

### Rol docente (90 segundos)

> Empezamos como **docente**. Santi entra al curso de prueba y abre **NexusAI · Materials**.
>
> **(1) Subir PDF al curso** — el apunte de derivadas. El backend lo procesa: chunkea en fragmentos de 512 tokens con 64 de overlap, genera embeddings con Gemini, los guarda en pgvector.
>
> **(2) Indexación en tiempo real** — el badge cambia de "procesando" a "listo" sin recargar. SSE en vivo.
>
> **(3) Pestaña "Gaps detectados"** — preguntas que los alumnos hicieron y el sistema no pudo responder. Feedback loop al docente.

### Rol alumno (2.5 min)

> Cambiamos de usuario, entramos como **alumno**.
>
> **(4) Chat con respuesta streaming** — preguntamos sobre derivadas. La respuesta llega palabra por palabra, vía PHP proxy streaming.
>
> **(5) Citas clickeables** — las marquitas `[1]` `[2]` en la respuesta. Click muestra preview del fragmento exacto del PDF.
>
> **(6) Buscador retrieval sin LLM** — para cuando solo quiero encontrar dónde está algo. Más rápido, más barato.
>
> **(7) Quiz generator** — 3 preguntas sobre derivadas a partir del material real, score con explicación.
>
> **(8) Toggle multi-curso** — la misma pregunta busca en todos los cursos del alumno, citas indican de qué materia.

**(Volver a la presentación con Cmd+Tab)**

**Transición**: *"Eso es el producto. Ahora el proceso. Santi."*

---

## SLIDE 9 — Sprints · **SANTI** (45s)

> Cinco sprints entre el 9 de abril y el 1 de junio.
>
> **Sprint 0 setup**: 47 documentos de investigación, ADRs. 60/60 SP.
> **Sprint 1 core chat**: backend, plugin, React, HMAC end-to-end. 45/50.
> **Sprint 2 RAG completo**: indexación, vista docente, retrieval. 55/60.
> **Sprint 3 calidad**: retry, rate limiting, logging, CI/CD. 25/25.
> **Sprint 4 MVP**: las 7 features del demo. 70/70.
>
> Total: **255/265 story points completados — 96%**. Las 10 que quedaron son polish post-MVP.

**Transición**: *"¿Dónde corre todo esto, Delfi?"*

---

## SLIDE 10 — Deploy · **DELFI** (40s)

> El backend está **deployado en Railway con autodeploy desde main**. Cada push dispara build de Docker y release. Online 24/7 hasta la defensa final.
>
> La URL pública está en el slide y en el documento de acceso del pendrive. El tribunal puede pegarla en cualquier navegador para verificar.
>
> El plugin Moodle se distribuye como **ZIP** y se instala en la instancia Moodle de cada institución. Está en el pendrive y en GitHub Releases.
>
> Para el demo levantamos un Moodle local con moodle-docker apuntando al backend de Railway — exactamente la arquitectura que usaría una universidad real.

**Transición**: *"Los números del sistema, Santi."*

---

## SLIDE 11 — Métricas · **SANTI** (45s)

> Algunos números del MVP funcionando:
>
> **37 tests automatizados** en backend, **51 casos de testing manual** en 9 áreas, **~80% de cobertura**.
>
> **Primer token en streaming SSE: menos de 1 segundo**. Chat completo: 3 a 6 segundos. Buscador puro: 0.3-0.8s.
>
> **Costos del MVP**: Railway $0/mes, Gemini $0/mes (free tier). Proyección a 500 alumnos: ~$100/mes.
>
> **Cobertura funcional**: 7 features entregadas, 16 endpoints HTTP, 10 External Functions en el plugin.

**Transición**: *"Y los riesgos del proyecto, Delfi."*

---

## SLIDE 12 — Riesgos · **DELFI** (50s) *[NUEVO]*

> Trabajamos con una **matriz de riesgos viva** durante todo el proyecto. Identificamos 12 riesgos con probabilidad × impacto. Estos son los cuatro de mayor severidad y cómo los neutralizamos:
>
> **R-01 · Alucinaciones del LLM** (técnico, alto): el modelo respondiendo cosas que no están en el material. **Mitigación**: prompts estrictos, threshold de similitud y regex post-respuesta que detecta "no encontré" y dispara el feedback loop.
>
> **R-02 · Filtración de la API key del LLM** (seguridad, alto): si la clave llega al navegador del alumno, cualquiera la roba. **Mitigación**: el patrón Hybrid PHP Proxy que vimos antes, más triple defensa Bearer + HMAC + nonce.
>
> **R-03 · Scope creep** (cronograma, medio): cada demo a compañeros nos pedía algo más. **Mitigación**: backlog congelado por sprint y política de "esto va al post-MVP".
>
> **R-04 · Caída del backend en la defensa** (operativo, medio): si Railway se cae justo hoy. **Mitigación**: health checks y capturas pregrabadas de cada paso del demo como fallback.

**Transición**: *"De acá vinieron las lecciones. Santi."*

---

## SLIDE 13 — Lecciones · **SANTI** (35s)

> Lo que **volveríamos a hacer**: invertir 8 semanas en investigación al inicio — Sprint 0 con 47 documentos ahorró meses de refactor. Documentar con ADRs desde el día uno. Y elegir monolito modular sobre microservicios — para 2 personas con plazo fijo, no había otra opción razonable.
>
> Lo que **cambiaríamos**: meter tests automatizados desde Sprint 1, no desde Sprint 3. Y arrancar el plugin Directory submission antes del cierre.

**Transición**: *"Mirando para adelante, Delfi."*

---

## SLIDE 14 — Próximos pasos · **DELFI** (35s)

> Tres horizontes:
>
> **Inmediato**: submission al **Moodle Plugin Directory oficial** — mediana de revisión 8 días.
>
> **Corto plazo**: **analytics para el alumno** — hoy el docente ve gaps, el alumno necesita su propio dashboard con temas más consultados, tokens, sesiones.
>
> **Mediano plazo**: **pilotos UCC reales** — instalar el plugin en cursos reales y medir impacto pedagógico durante un cuatrimestre.

**Transición**: *"Y para cerrar, una mirada sobre la materia. Santi."*

---

## SLIDE 15 — Aplicación de Administración de Proyectos · **SANTI** (45s) *[NUEVO]*

> Quiero cerrar mi parte conectando lo técnico con lo que vimos en la materia. NexusAI no fue solo desarrollar un producto: fue ejercitar **todo el ciclo de gestión** de Administración de Proyectos de Software.
>
> En **planificación**: WBS de 5 niveles, cronograma con dependencias y estimaciones con story points por planning poker.
>
> En **ejecución**: Scrum con 5 sprints, daily syncs, sprint planning, review y retrospectiva. Backlog priorizado con MoSCoW.
>
> En **control**: matriz de 12 riesgos con probabilidad × impacto, planes de mitigación y monitoreo de velocity sprint a sprint.
>
> En **calidad**: 14 ADRs documentando decisiones, 37 tests automatizados, pipeline de CI/CD.
>
> En **costos**: cálculo de TCO del MVP y proyección a 500 alumnos.
>
> Y en **cierre**: las lecciones documentadas, código transferible, plan de continuidad. El producto es el entregable visible; **la gestión es el aprendizaje real de la materia**.

**Transición**: *"Y para cerrar con números duros, Delfi te muestra el valor ganado del proyecto."*

---

## SLIDE 16 — Valor Ganado (EVM) · **DELFI** (50s) *[NUEVO]*

> Como cierre del análisis de gestión, aplicamos **Earned Value Management** al MVP.
>
> Las premisas: tomamos como BAC el presupuesto total del MVP — **265 story points × 1.5 horas por SP, son 400 horas**, que a tarifa junior de mercado de 25 dólares la hora dan unos **10.000 dólares notional**. El Earned Value al cierre son los 255 SP completados, equivalentes a 385 horas. El Actual Cost real, sumando retrabajos, fue de unas **420 horas**.
>
> Con esos números:
>
> **SPI = 0.96** — Schedule Performance Index. Cumplimos el 96% del cronograma planificado. Sobre la meta de 0.95.
>
> **CPI = 0.92** — Cost Performance Index. 92% de eficiencia en costos, con un sobrecosto leve del 8% por las features que agregamos en el sprint final.
>
> **SV = −10 SP** de atraso, **CV = −875 dólares** de sobrecosto.
>
> Y la lectura: **ambos ratios están en el rango verde del PMI para proyectos ágiles, entre 0.90 y 1.10**. El MVP cerró en plazo, con sobrecosto controlado, sano para un proyecto con scope creep moderado.

**Transición**: *"Santi cierra."*

---

## SLIDE 17 — Cierre · **SANTI** (25s)

> Para cerrar:
>
> **NexusAI es un MVP funcional**, deployado en producción, con código abierto y un plugin listo para instalar. Cubre las cuatro funcionalidades pedidas en el relevamiento y entrega valor al alumno y al docente.
>
> Todo el material — código, documentación, presentación, credenciales — está en el pendrive.
>
> **Gracias por su atención**. Quedamos abiertos a las preguntas del tribunal.

---

## Tips para ensayar

- **Cronometren con celular** la primera pasada completa. Apunten 14 minutos para tener 1 minuto de margen.
- **No leer**. Memoricen las **3 ideas fuerza** de cada slide.
- **La transición** entre persona y persona es lo que más se nota. Practiquen las frases de pase.
- **Si la demo falla**: tener captura de pantalla de cada paso. Si algo se cae, no improvisen — pasen al siguiente y mencionen "este flow está en el video demo del repo".
- **Preguntas más probables del tribunal**: seguridad (HMAC), costos de LLM, escalabilidad, comparación con ChatGPT, propiedad intelectual del material, cumplimiento de plazos. Repasen capítulos 5 (arquitectura), 9 (riesgos), 11 (métricas) y 18 (manuales).
