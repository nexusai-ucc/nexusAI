# Guion de la presentación: 30 minutos

> v0.3, 05/11/2026. Primera versión para corregir entre los tres. El texto es para decirlo con palabras propias, no para leerlo. El diseño diapositiva por diapositiva está en [BRIEF_CANVA.md](BRIEF_CANVA.md) y el porqué del orden, en [INVESTIGACION_DEFENSA.md](INVESTIGACION_DEFENSA.md). El reparto es una sugerencia.
>
> Reemplaza a `entrega-final/presentacion/script-defensa.md`, que es del MVP: habla de Railway, no incluye a Marcos y sus números ya no valen.

**Idea clave**, la frase que el tribunal tiene que llevarse: **la IA responde con el material del curso, y lo que no sabe se lo avisa al docente.**

| Min | Bloque | Quién |
|---|---|---|
| 0–3 | Apertura | Delfina |
| 3–6 | Problema | Delfina |
| 6–8 | Objetivo y aportes | Santiago |
| 8–16 | Demo con el público | Delfina, Marcos y Santiago |
| **16–26** | **Parte técnica** | Santiago (16–21:30) y Marcos (21:30–26) |
| 26–27 | Proceso | Santiago |
| 27–29 | Resultados | Santiago |
| 29–30 | Aportes | Delfina |

## 0–3 · Apertura · Delfina

Sin índice y sin "buenas tardes, somos el grupo…". Arranca con la escena.

> Una alumna de Sistemas Inteligentes tiene parcial mañana y le pregunta a un chat de IA cómo se evalúa un clustering. La respuesta es correcta, pero no es la de su materia: no usa la notación del profesor, no dice en qué apunte está y, si se equivoca, ella no tiene forma de saberlo.
>
> La misma pregunta, dentro de su campus [captura de NexusAI]: responde con el material de la cátedra y dice de dónde lo sacó.
>
> Y si el material no lo cubre, pasa algo más: el profesor se entera.

Mientras la diapositiva muestra las dos respuestas: "Somos Delfina, Santiago y Marcos, y esto es NexusAI".

## 3–6 · Problema · Delfina

> No lo supusimos: lo medimos. Encuestamos a 166 estudiantes y 17 docentes de la UCC.
>
> El 80,7 % de los estudiantes percibe que la información de sus materias está dispersa: el campus, WhatsApp, Drive.
>
> Los 88 que respondieron la pregunta sobre IA ya la usan para estudiar. El problema es que no conoce su materia.
>
> Y del lado docente, el 88,2 % le delegaría tareas a una IA integrada al campus. Pero casi la mitad pone una condición: poder revisar antes. Quieren estar en el circuito, no afuera.

*Cuidado:* el dato de la IA no tiene opción negativa en el formulario. Se usa como contexto, no como prueba (ver [PREGUNTAS_TRIBUNAL.md](PREGUNTAS_TRIBUNAL.md)).

## 6–8 · Objetivo y aportes · Santiago

> Nos propusimos un asistente dentro de Moodle que responda solo con el material de cada curso, citando la fuente, y que le devuelva al docente lo que el material no cubre.
>
> Los aportes, que vamos a demostrar en los próximos minutos:
> 1. Un plugin publicado en el directorio oficial de Moodle, que se instala como cualquier otro.
> 2. RAG con citas verificables y que admite lo que no sabe.
> 3. Un circuito con el docente: los vacíos del material le llegan.
> 4. Un proceso de ingeniería medido: pruebas, calidad, seguridad y accesibilidad.

En esta diapositiva aparece el QR: "Saquen el celular: van a ser los alumnos".

## 8–16 · Demo con el público

Ver [GUION_DEMO.md](GUION_DEMO.md).

## 16–26 · Parte técnica

La parte técnica se cuenta siguiendo **una pregunta real que hizo el público en la demo**. Cada tema muestra la decisión, la alternativa descartada y el número que la respalda. Todos los parámetros salen del código de `development`; las rutas van entre paréntesis para responder si el tribunal repregunta.

### 16–17:30 · Arquitectura · Santiago

> Su pregunta salió del celular hacia Moodle, no hacia nuestro servidor. Son tres capas: un widget en React dentro de Moodle; el plugin, de tipo `local`, en PHP; y el backend en FastAPI con PostgreSQL y pgvector.

- **El navegador nunca habla con el backend.** Todo pasa por el plugin, que actúa como proxy autenticado. Eso resuelve tres cosas a la vez: la clave del proveedor de IA nunca llega al celular, CSRF lo cubre el mecanismo nativo de Moodle (`require_sesskey`) y no hay CORS.
- **Plugin `local` y no bloque:** con el tema Boost, los bloques quedan escondidos y cada docente tendría que agregarlo curso por curso.
- **Monolito modular** (ADR-001): somos 3 personas, y no hay partes que necesiten escalar por separado.

*Diapositiva:* diagrama de 3 capas (`docs/diagrams/architecture.md`).

### 17:30–19 · Indexación · Santiago

> Para poder responder, el informe tuvo que convertirse en vectores. Esto pasó cuando el docente lo subió.

1. **Extracción:** pdfplumber, que en las pruebas manejó mejor las tablas que PyPDF2 y pdfminer. También admite DOCX, PPTX, XLSX, CSV, HTML y TXT, y hace OCR si el PDF es una imagen (`documents/extractor.py`).
2. **Chunking:** fragmentos de **512 tokens con 64 de solapamiento**, contados con el tokenizador `cl100k_base`. El solapamiento evita cortar una idea a la mitad (`documents/chunker.py`).
3. **Embeddings:** un vector de **768 dimensiones** por fragmento.
4. **Índice:** pgvector con **HNSW** (`m = 16`, `ef_construction = 64`) sobre distancia coseno. La búsqueda es aproximada y sublineal, en lugar de comparar contra todos los fragmentos (migración `002_hnsw_index`).
5. **Asíncrono:** el documento pasa por `pending → indexing → indexed` sin bloquear al docente. Si el mismo archivo se vuelve a subir, se detecta por hash (p95 de 0,03 s en la prueba de carga).
6. **Una sola base:** PostgreSQL con pgvector guarda datos y vectores juntos, en vez de una base vectorial aparte que habría que mantener y sincronizar (ADR-002).

*Diapositiva:* flujo de indexación (`docs/diagrams/rag-flow.md`).

### 19–20:30 · Retrieval y generación · Santiago

> Con su pregunta pasó esto:

1. Se convierte en un vector con el mismo modelo de embeddings.
2. Se buscan los **5 fragmentos más cercanos** por distancia coseno (operador `<=>`), descartando los de similitud menor a **0,3** (`chat/router.py`, `documents/retriever.py`).
3. **Tres filtros en la misma consulta:**
   - el curso, para que una pregunta de Cálculo no traiga Programación;
   - solo documentos `indexed`;
   - solo las actividades que ese usuario puede ver en Moodle. El plugin calcula la lista y el backend no la inventa: si la actividad está oculta para el alumno, el fragmento no existe para él (VIS-01).
4. Los fragmentos van al prompt con la instrucción de citar el archivo y de decir explícitamente si no está en el material. Un guardrail corta los intentos de explorar el sistema o de manipular el comportamiento del modelo.
5. La respuesta vuelve en **streaming por SSE**, en tres tipos de evento: `meta` (sesión y cantidad de fragmentos), `token` (cada pedazo de texto) y `done` (tokens usados). Por eso empieza a aparecer en el celular antes de que el modelo termine.

**Por qué RAG y no reentrenar un modelo:** reentrenar por materia es caro, hay que repetirlo cada vez que cambia el material y no permite citar. Con RAG, un PDF nuevo responde en un minuto, como se vio en la demo.

*Diapositiva:* secuencia del chat con los 3 filtros (`docs/diagrams/sequence-chat.md`).

En vivo, si alcanza el tiempo: panel docente → **Buscar** con la misma pregunta. Muestra los fragmentos encontrados. Esa búsqueda es **híbrida**: 0,6 de similitud semántica más 0,4 de coincidencia léxica (`ts_rank` de PostgreSQL), así que también encuentra términos exactos como siglas (`search/router.py`).

### 20:30–21:30 · Detección de vacíos · Santiago

> La pregunta de los commits no tenía respuesta. ¿Cómo lo supo el sistema?

- **Dos señales**, y alcanza con una (`gaps/recorder.py`):
  1. la similitud máxima de los fragmentos es menor a **0,4**, o no hubo ninguno;
  2. la respuesta del modelo dice que no está en el material. Se detecta con patrones en español y en inglés, y cubre el caso de fragmentos parecidos pero irrelevantes.
- Las preguntas se **agrupan por significado** comparando sus embeddings con un umbral de **0,75**. Así el docente ve un tema con su cantidad de consultas y no 30 preguntas sueltas (`gaps/router.py`).
- El registro es *fire-and-forget*: si falla, el chat del alumno no se entera.

### 21:30–23 · Seguridad y privacidad · Marcos

> Entre Moodle y el backend no basta con una contraseña.

- **Dos capas en cada pedido** (ADR-005, `auth/hmac.py`):
  1. una API key Bearer, que identifica al cliente;
  2. una firma **HMAC-SHA256** de *timestamp + nonce + body* con un secreto compartido, que garantiza que el mensaje no se modificó.
- **Anti-replay:** el timestamp tiene que estar dentro de una ventana de **300 s**, y cada nonce se guarda en Redis con ese TTL. Un pedido capturado y reenviado se rechaza con 401; lo prueba el smoke de cada deploy.
- **Abuso y costo:**
  - rate limit por usuario de **20 por minuto y 50 por día**;
  - presupuesto de tokens por rol (alumno: 8.000 por hora y 40.000 por día), reservado de forma **atómica** con `INCRBY` en Redis antes de llamar al modelo, así 10 pedidos simultáneos no pueden pasar todos con el mismo saldo (`shared/token_budget.py`);
  - moderación de la entrada antes de que llegue al modelo.
- **Privacidad:** los datos del alumno (chats, quizzes, vacíos) viven en tablas de Moodle, y el backend no guarda estado del alumno (ADR-014). El plugin implementa la Privacy API, así que se exportan y se borran como cualquier otro dato de Moodle. Al proveedor de IA le llegan la pregunta y los fragmentos, no la identidad del alumno.
- Auditoría OWASP Top 10 (`docs/security/owasp-audit-2026-08.md`).

### 23–24 · Resiliencia · Marcos

> Dependemos de un proveedor externo, y eso falla.

- **Cadena de fallback** (`providers/llm.py`): cada llamada tiene 3 reintentos. Si fallan por cuota (429), servicio caído (503), modelo retirado (404) o parámetro no soportado (400), se pasa a los modelos intermedios y después a un proveedor secundario. Se cambia por configuración, sin tocar código (ADR-003).
- **No es teoría:**
  - Google retiró un modelo sin aviso, y la prueba diaria contra el proveedor real lo detectó;
  - DEF-07: Gemini devolvía los embeddings sin el campo `index` y el código asumía que venía. Ningún mock lo mostraba: lo encontró la prueba de integración real.
- La prueba diaria contra Gemini falló casi siempre desde octubre por alta demanda. **Por eso la demo de hoy usa un modelo pago.**

### 24–25 · Concurrencia: DEF-09 · Marcos

> El defecto que más nos enseñó lo encontró la prueba de carga, no la funcional.

- **Síntoma:** con 40 usuarios simultáneos, el p95 del chat subía a 60 s y el 32 % de los chats quedaba sin respuesta. Además se perdían registros de consumo.
- **Causa:** el pool de la base tenía 5 conexiones más 10 de overflow. Cada chat abría una transacción en el retrieval y la retenía **mientras esperaba al modelo**, y el registro de consumo pedía otra conexión del mismo pool. Con unos 15 chats en vuelo no quedaban conexiones libres: cada pedido esperaba una que nadie soltaba, hasta vencer el `pool_timeout` de 30 s.
- **Arreglo** (#644): el chat cierra la transacción antes de llamar al modelo, y el registro de consumo tiene su propio pool de 2+3 conexiones con timeout de 5 s (`db/session.py`).
- **Por qué no lo vieron los tests:** todos usaban dobles de la base. Hacía falta un pool real y unos 15 chats simultáneos.
- **Resultado:** 100 usuarios simultáneos, 99,95 % de éxito, p95 de 2,52 s y cero registros perdidos. Se midió con k6 y el modelo simulado, para aislar nuestro código del proveedor.
- *Diapositiva:* gráfico del p95 por escalón, antes y después (`docs/calidad/PRUEBAS_DE_CARGA.md` §2).

### 25–26 · Calidad · Marcos

- **Pipeline:** ningún merge sin pasar las tres suites:
  - backend con pytest, ruff y mypy;
  - widget con Vitest;
  - plugin con PHPUnit y phpcs, en una matriz de Moodle 4.5 y 5.0, PHP 8.1 y 8.2, PostgreSQL y MySQL.
  Además, un quality gate de SonarCloud que bloquea si el código nuevo tiene menos de 80 % de cobertura, bugs o vulnerabilidades.
- **Contratos:** los mismos vectores de prueba de HMAC y las mismas respuestas JSON los verifican los tests de Python **y** los de PHP (`NexusAI/contracts/`). Si el backend cambia el formato, el plugin se entera en el CI.
- **Números:**
  - cobertura de 56,6 % a 83,6 %;
  - en SonarCloud, de 26 bugs y 14 vulnerabilidades a 0, con A en confiabilidad, seguridad y mantenibilidad;
  - 10 defectos registrados con su rojo/verde.
- **CD:** cada push a staging despliega, verifica que corre el commit exacto y hace un smoke de punta a punta (`deploy-staging.yml`).
- Accesibilidad: auditoría WCAG 2.2 AA del widget y del panel.
- **Lo de hoy:** [completar con la prueba de enero: 60 navegadores a través de Moodle con el modelo real].

*Fuentes de la sección:* `docs/calidad/METRICAS.md`, `REGISTRO_DEFECTOS.md`, `PRUEBAS_DE_CARGA.md`, `INTEGRACION_EXTERNA.md`, `CD_STAGING.md`, `docs/calidad/accesibilidad/AUDITORIA_ACCESIBILIDAD.md`.

## 26–27 · Proceso · Santiago

> - Trabajamos con Scrum, con cada tarea como issue: más de 260 PRs mergeados.
> - La infraestructura de la universidad no estuvo disponible y migramos a Oracle Cloud (ADR-011).
> - Moodle revisó el plugin, nos marcó 16 puntos, los corregimos y hoy está publicado.

*Antes del deck:* recontar los PRs con datos de febrero.

## 27–29 · Resultados · Santiago

Contra los objetivos específicos del informe, uno por uno, tal cual están: cumplido, parcial o no cumplido.
- Relevamiento: cumplido (166 estudiantes y 17 docentes).
- Plugin `local` sin modificar el núcleo: cumplido y publicado.
- Asistente RAG, validado con usuarios reales: [completar según el piloto].
- Quizzes con corrección: cumplido.
- Panel docente y vacíos: cumplido.
- Evaluación del impacto con usuarios reales: [completar según el piloto].

> Costos: estimamos unos US$ 2.900 por año para 500 alumnos, incluido el mantenimiento. Son US$ 5,81 por alumno por año. Es una estimación: todavía no operó a esa escala.
>
> Límites: depende de un proveedor externo de IA, cuya latencia es lo que más varía, y la calidad de la respuesta depende de la calidad del material.

## 29–30 · Aportes · Delfina

> La alumna del principio tiene una respuesta de su materia, que puede verificar. Su profesor sabe qué no estaba cubierto. Y el sistema que lo hace está publicado y probado.

La última diapositiva muestra **los 4 aportes**. No hay diapositiva de "gracias": se termina con los aportes y se pasa a las preguntas.
