# Retrospectivas

Cada sprint terminó con una retrospectiva del equipo. Acá se sintetizan las
lecciones agregadas, organizadas por sprint y luego por reflexión global.

## Retrospectiva por sprint

### Sprint 0 — Setup e investigación

**Qué salió bien**

- Investigación exhaustiva antes de empezar a tipear código. 47 documentos
  en `investigacion/` cubren Moodle, RAG, pgvector, FastAPI, frontend
  embebido, etc. Permitió tomar decisiones arquitectónicas con base sólida.
- Decisión temprana de **una sola base de datos** (pgvector sobre PG) en
  lugar de Chroma — evitó muchísima complejidad operativa.
- ADRs escritos desde el primer día. Cada decisión queda trazable.

**Qué no salió bien**

- Sub-estimamos el tiempo de relevamiento. Originalmente eran 3 semanas,
  terminaron siendo 8 — pero a la larga valió la pena.
- Pelea inicial con la versión correcta de Moodle (4.1 LTS vs 4.5). Hook
  API cambia entre versiones; obligó a soportar dos paths.

**Acción de mejora**

- Para próximos proyectos: dedicar más tiempo a explorar el dominio antes
  de comprometerse con un stack.

### Sprint 1 — Core chat

**Qué salió bien**

- Construir el chat funcional sin RAG primero fue una buena decisión.
  Validó toda la cadena (browser → AMD → External Function → cURL+HMAC →
  FastAPI → LLM → respuesta) antes de meterle complejidad.
- El patrón **Hybrid PHP Proxy** (ADR-001) quedó probado al final del
  sprint. Daba confianza para todo lo siguiente.

**Qué no salió bien**

- Subestimar el ramp-up de Webpack para output AMD que Moodle entiende.
  Días perdidos peleando con `publicPath` y chunks lazy.

**Acción de mejora**

- Bundle React único, sin code-splitting lazy. Más simple, menos riesgo.

### Sprint 2 — RAG y carga de material

**Qué salió bien**

- Pipeline RAG arrancó funcionando al primer intento. Crédito a la
  investigación previa de chunking y a la decisión de usar embeddings de
  Gemini Matryoshka (768 dim).
- Integración de `BackgroundTasks` para indexación async fue limpia. El
  frontend hace polling, el alumno no se entera.

**Qué no salió bien**

- Decidir el `min_similarity` correcto fue iterativo. 0.5 era muy estricto
  (descartaba chunks útiles), 0.2 muy permisivo (traía ruido). Aterrizamos
  en 0.3 para chat, 0.25 para buscador, 0.4 para quiz dirigido.

**Acción de mejora**

- Documentar thresholds en código como constantes con comentarios
  explicativos del trade-off.

### Sprint 3 — Calidad y métricas

**Qué salió bien**

- Retries con backoff (BACK-11) cubrieron casos reales: la API de Gemini a
  veces devuelve 429 en horas pico, el retry los absorbe sin que el alumno
  note nada.
- Logging JSON estructurado permitió debugging mucho más rápido en
  desarrollo.

**Qué no salió bien**

- Implementar rate limiting demoró más de lo esperado. Decidir si era por
  user_id, por session_id, o global, ocupó debate más del necesario.

**Acción de mejora**

- Decisiones de UX como rate limiting deben pasar por un ADR corto antes
  de tipear código.

### Sprint 4 — MVP completo

**Qué salió bien**

- Streaming SSE quedó robusto y mantuvo Hybrid PHP Proxy intacto. El HMAC
  sigue siendo server-to-server y el browser nunca lo ve. Latencia
  perceived dramáticamente mejor.
- Las **citas clickeables** (Feature D) cerraron el loop visual del RAG.
  Demostrable y defendible.
- Quiz generator con `response_format=json_object` evitó toda la pesadilla
  de parsing manual de Markdown / regex. Pydantic valida el schema.
- Detección de gaps (Feature G) con señal combinada (retrieval + respuesta
  del LLM) atrapa casos que ninguna de las dos detectaría sola.

**Qué no salió bien**

- **LLM "follow-the-example"**: el LLM copiaba literalmente el
  `apunte-derivadas.pdf` del ejemplo en el system prompt. No nos dimos
  cuenta por días hasta que un test manual lo evidenció. Fix tardío.
- Gaps iniciales solo se detectaban con chunks vacíos o similaridad baja.
  Fallaron los casos donde el retrieval traía chunks de alta similaridad
  pero **irrelevantes** (matches semánticos espurios). Agregar la regex
  sobre la respuesta del LLM lo arregló.
- Dos integrantes crearon migraciones Alembic con el mismo número
  (`004_*`) trabajando en paralelo. Linealizar el árbol fue trivial pero
  no debería haber pasado.
- La barra de búsqueda inicial de la pestaña Quiz aceptaba topics sin
  material relacionado y generaba quiz aleatorio engañoso. Fix de Sprint 4
  late: devolver 404 con mensaje claro al alumno.

**Acciones de mejora**

- En el system prompt, **nunca usar filenames concretos como ejemplo**.
  Usar `[archivo.pdf]` o referencias abstractas.
- Antes de mergear migraciones Alembic, hacer `alembic heads` para
  detectar branches.
- Tests automatizados deben cubrir prompts de LLM con assertions de
  contenido (ej: "la respuesta no debe contener el string del ejemplo del
  prompt").

## Lecciones agregadas (retrospectiva global)

### Lo que volveríamos a hacer

- **Investigar mucho al inicio.** Las 8 semanas de Sprint 0 ahorraron
  meses de refactor después. El ROI fue alto.
- **Documentar decisiones con ADRs.** Permitieron retomar discusiones
  zanjadas sin re-discutir y dieron material académico defendible.
- **Monolito modular sobre microservicios.** Para 2 personas y un plazo
  fijo, no hay otra opción razonable.
- **Multi-provider LLM desde el día uno.** Liberó al equipo de depender
  de un solo proveedor y permitió desarrollar el MVP gratis con Gemini.

### Lo que cambiaríamos

- **Empezar testing automatizado más temprano.** Los tests entraron en
  Sprint 3 y deberían haber estado desde Sprint 1.
- **Hacer demos internas de 10 minutos por sprint.** Lo hicimos solo en
  Sprint 2 y 4; en Sprint 1 y 3 dimos por hecho que todos sabíamos qué se
  había hecho. No.
- **CI/CD desde la primera semana.** Lo deployamos en Sprint 3; debería
  haber sido en Sprint 0. Hubiera atrapado bugs antes.

### Lo que aprendimos sobre IA en educación

- **Trazabilidad gana confianza.** Las pills clickeables hacen más por la
  credibilidad del sistema que cualquier disclaimer textual.
- **El LLM mejora cuando le decís en qué *no* tiene que confiar.** El
  system prompt explícito sobre admitir gaps es más efectivo que prompts
  optimistas.
- **El feedback loop al docente es el verdadero diferencial.** No es la
  IA respondiéndole al alumno — es la IA dándole al docente datos
  accionables sobre qué le falta a su material.


