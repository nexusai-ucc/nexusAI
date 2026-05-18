# Script de presentación — NexusAI · Admin de Proyectos

**Duración total estimada:** ~12 minutos (1 min promedio por slide)
**Modalidad:** rotación 1-a-1 — Delfi arranca, Santi sigue, así sucesivo.

## Reparto

| Slide | Quién | Tema |
|---|---|---|
| 1 | **Delfi** | Portada |
| 2 | **Santi** | El problema |
| 3 | **Delfi** | La solución |
| 4 | **Santi** | Avances |
| 5 | **Delfi** | Gantt |
| 6 | **Santi** | Decisiones técnicas |
| 7 | **Delfi** | Métricas |
| 8 | **Santi** | Arquitectura |
| 9 | **Delfi** | Infraestructura |
| 10 | **Santi** | Costos |
| 11 | **Delfi** | Próximos pasos |
| 12 | **Santi** | Cierre |

---

## Slide 1 — Portada · DELFI · 30 seg

> Buen día. Somos Santiago Tricherri y yo, Delfina Salinas, estudiantes de Ingeniería en Sistemas de la UCC. Hoy les venimos a contar nuestro Proyecto Integrador: **NexusAI**, un asistente académico inteligente que se integra al campus virtual Moodle. Estamos cerrando el Sprint 2 y queremos mostrarles cómo venimos, las métricas de gestión y los costos del proyecto.

**Transición:** *"Para entender qué construimos, conviene arrancar por el problema que detectamos. Te dejo Santi."*

---

## Slide 2 — El problema · SANTI · 1 min

> El proyecto nace de un problema concreto que vimos en el aula virtual de la UCC y que confirmamos con docentes.
>
> Del lado del **alumno**: el material del curso está disperso — PDFs por un lado, slides por otro, apuntes en otro. Cuando una duda surge a las 11 de la noche, no hay a quién preguntarle. Y si va a un asistente genérico tipo ChatGPT, le inventa respuestas que no tienen nada que ver con SU materia.
>
> Del lado del **docente**: no tiene visibilidad de qué temas le cuestan al curso. Repite las mismas explicaciones año tras año. Y las plataformas existentes no usan SU material, usan conocimiento genérico.

**Transición:** *"Desde ahí pensamos la propuesta — Delfi."*

---

## Slide 3 — La solución · DELFI · 1 min

> Nuestra propuesta es un asistente con IA que vive **dentro de Moodle** y trabaja con cuatro pilares:
>
> Primero, **RAG real**: la sigla viene de Retrieval Augmented Generation. Significa que el sistema responde usando el material que el docente sube, no conocimiento genérico.
>
> Segundo, **cita la fuente**: cada respuesta indica de qué PDF o apunte sale la información. Esto es clave para que el alumno pueda verificar y para que el docente confíe en la herramienta.
>
> Tercero, **dentro de Moodle**: es un plugin instalable. El alumno no se va del aula virtual para preguntar.
>
> Y cuarto, **self-hosted**: los datos académicos nunca salen del servidor de la institución.

**Transición:** *"¿Y cómo venimos hoy con eso? Santi te paso."*

---

## Slide 4 — Avances · SANTI · 1 min

> Al día de hoy, 18 de mayo, estamos parados así:
>
> **Sprint 1 — al 100%**. Tenemos el plugin instalado en Moodle, el backend en FastAPI corriendo, y el widget React funcionando en el aula virtual.
>
> **Sprint 2 — alrededor del 80%**. Está el pipeline RAG operativo de punta a punta y la vista del docente para subir e indexar PDFs.
>
> **Cerramos 25 issues** en estos dos sprints. Y lo más importante: el sistema ya responde preguntas reales usando el material del curso, citando la fuente.
>
> Y todo esto lo hicimos **4 días adelantados respecto al plan original**.

**Transición:** *"Para que se vea esto en perspectiva, miremos el cronograma completo. Delfi."*

---

## Slide 5 — Gantt · DELFI · 1 min 15 seg

> Este es el cronograma completo del proyecto. Arrancamos en abril con Setup e Investigación, después dos sprints de desarrollo, y la línea roja marca dónde estamos hoy, en la mitad de mayo, sobre Sprint 2.
>
> Lo importante: el **MVP** lo tenemos para el **1 de junio**, después dos semanas de documentación, y entre junio y noviembre todo lo que es **Post-MVP** — Study Planner, foros mejorados, dashboard analítico.
>
> En noviembre tenemos el **Check 2 del Proyecto Integrador**, y entre enero y febrero del año que viene la **defensa final**.
>
> El proyecto en total son **11 meses de trabajo** distribuidos en estas fases.

**Transición:** *"En el medio fuimos tomando decisiones técnicas importantes. Santi te las pasa."*

---

## Slide 6 — Decisiones técnicas · SANTI · 1 min

> Cada decisión técnica fuerte la documentamos como ADR — Architecture Decision Record. Estas son las cuatro principales:
>
> **Una sola base de datos**: usamos PostgreSQL con la extensión pgvector en lugar de tener una base vectorial aparte. Menos infraestructura, backups estándar, y la misma DB para datos relacionales y vectoriales.
>
> **IA intercambiable**: el código no está atado a un proveedor. Hoy usamos Gemini gratuito para el MVP, y migrar a GPT-4o-mini en producción es solo cambiar variables de entorno. Sin lock-in con ningún proveedor.
>
> **Seguridad en 3 capas**: usamos HMAC SHA-256 con un sistema anti-replay en Redis. Lo importante: la API key de OpenAI o Gemini nunca llega al navegador del alumno.
>
> **Plugin no invasivo**: nuestro plugin es del tipo `local`, se instala en Moodle sin tocar el core. Compatible con las versiones 4.1 a 4.5, que son las LTS.

**Transición:** *"Pasemos a las métricas, que es donde mejor se ve cómo venimos. Delfi."*

---

## Slide 7 — Métricas · DELFI · 1 min 30 seg

> Para medir el avance del proyecto usamos tres indicadores. Los tres son visuales:
>
> **Primero el SPI — Schedule Performance Index, o Índice de Rendimiento de Cronograma**. Mide qué tan rápido avanzamos respecto al plan. La meta es 1: significa avanzar al ritmo planificado. Mayor a 1 es bueno, menor a 1 es malo. Nosotros estamos en **1.10**, o sea, **10% más rápido** de lo planeado.
>
> **Segundo el CPI — Cost Performance Index**. Mide cuánto esfuerzo estamos gastando respecto al estimado. Acá la meta también es 1. Estamos en **0.95**, lo que significa que usamos un 5% más de esfuerzo del estimado. Es un sobrecosto muy leve, dentro del margen, y es típico al arrancar un proyecto nuevo porque las primeras estimaciones siempre son optimistas.
>
> **Y tercero, tests pasando**: tenemos 18 tests automáticos que corren cada vez que cambiamos código. Hoy pasan todos, **18 de 18**, sin vulnerabilidades detectadas.

**Transición:** *"Para que vean cómo funciona técnicamente, Santi te pasa la arquitectura."*

---

## Slide 8 — Arquitectura · SANTI · 1 min 15 seg

> Cuando un alumno hace una pregunta, pasa por cinco pasos:
>
> Uno, el **alumno escribe en el widget de chat** que está integrado en su curso de Moodle.
>
> Dos, el **plugin de Moodle valida la sesión** y firma la pregunta con HMAC antes de mandarla al backend.
>
> Tres, el **backend en Python busca con pgvector** los fragmentos del material más relevantes para esa pregunta.
>
> Cuatro, la **IA (Gemini) genera la respuesta** usando solo esos fragmentos como contexto.
>
> Y cinco, **la respuesta cita la fuente**: "según apunte-derivadas.pdf, una derivada es...".
>
> El sistema tiene tres propiedades clave: es **seguro** porque la API key nunca llega al navegador, es **resiliente** porque si falla la búsqueda el chat sigue funcionando, y la **indexación corre asíncrona** así no bloquea la interfaz del docente.

**Transición:** *"¿Y cómo lo desplegamos? Delfi."*

---

## Slide 9 — Infraestructura · DELFI · 1 min

> Pensamos la infraestructura en tres capas:
>
> Para **desarrollo**, tenemos todo orquestado con Docker Compose. Postgres, Redis, FastAPI y Moodle de prueba levantan con un solo comando en cualquier máquina del equipo.
>
> Para **CI/CD** —integración y deploy continuos— usamos **GitHub Actions**. Cada vez que hacemos push a la rama principal, automáticamente corren los tests, se buildea el bundle de React y se hace el deploy. Sin pasos manuales. Esto nos garantiza que lo que se sube a producción siempre pasó las pruebas.
>
> Para **producción** usamos **Fly.io**, una plataforma cloud moderna. Tiene free tier suficiente para el MVP, hace auto-scaling según la demanda y soporta Postgres con pgvector. La ventaja es que evitamos pedirle infraestructura propia a la UCC —que sería un proceso de meses— y como nuestro stack está dockerizado, si más adelante quisiéramos migrar a otra plataforma sería mover un Dockerfile, nada más.

**Transición:** *"Hablando de costos, te paso a Santi."*

---

## Slide 10 — Costos · SANTI · 1 min 30 seg

> Acá tenemos dos costos diferentes que conviene separar:
>
> El **costo del equipo**, o sea las horas que estamos invirtiendo en hacerlo: cada uno lleva alrededor de **570 horas** de trabajo, lo que da un total de **1.140 horas en conjunto**. Si se valuara a tarifa de un desarrollador junior, unos 20 dólares la hora, el proyecto equivale a unos **22.800 dólares** de costo de desarrollo.
>
> Y el **costo operativo**, que es lo que cuesta tenerlo corriendo:
>
> Hoy con Gemini gratuito, el **MVP cuesta cero**. Sin costo de IA.
>
> El hosting de la demo son **5 dólares al mes**.
>
> Y en **producción a escala**, asumiendo unos **12.000 alumnos activos** —que es el tamaño de la UCC, lo usamos como referencia—, la cuenta da alrededor de **580 dólares por mes**. Lo que dividido por alumno son **5 centavos de dólar al mes**.
>
> Es el equivalente al costo de una fotocopia por alumno. Por todo lo que da, es un costo muy bajo.

**Transición:** *"Para cerrar, Delfi te cuenta lo que viene."*

---

## Slide 11 — Próximos pasos · DELFI · 45 seg

> En las próximas dos semanas tenemos dos sprints más:
>
> **Sprint 3** (del 21 al 27 de mayo): integración completa con Moodle. Vamos a hacer que la sincronización de PDFs sea automática —que el docente no tenga que subirlos uno por uno—, soporte para DOCX y TXT, y dejar el bundle de React optimizado para producción.
>
> **Sprint 4 — el MVP** (del 28 de mayo al 1 de junio): testing end-to-end y, lo más importante, **pruebas con usuarios reales en la UCC** —alumnos y docentes usando el sistema con material verdadero. Después de eso, corrección de bugs y pulido final.
>
> Y el **1 de junio entregamos el MVP**.

**Transición:** *"Para cerrar, Santi."*

---

## Slide 12 — Cierre · SANTI · 30 seg

> En resumen: del problema detectado al sistema funcionando, en dos sprints.
>
> Sprint 1 completado, Sprint 2 al 80%, MVP adelantado cuatro días.
>
> El **1 de junio entregamos**.
>
> Si quieren preguntar algo, estamos para responderles.

---

## Notas para los dos

**Antes de empezar:**
- Apretar **F** en la slide 1 para fullscreen.
- Una persona maneja el teclado (sugerencia: el que arranca, Delfi). Las flechas → y ← navegan.
- Si se traba algo: tecla **Home** vuelve al inicio, **End** salta al final.

**Durante la presentación:**
- Mirar a la profesora, no a la slide.
- Si una pregunta es muy técnica y le corresponde más al otro: "te paso a Santi/Delfi que es quien maneja eso".
- Si no saben algo: "ese punto no lo tenemos resuelto todavía, lo estamos viendo para Sprint 3" — mejor que inventar.

**Si preguntan por el "fix embedding model" de los commits de Santi:**
> *"Tuvimos un problema con el modelo de embeddings de Google: el que veníamos usando dejó de funcionar vía el endpoint de compatibilidad. Lo cambiamos a gemini-embedding-001 con Matryoshka 768 dimensiones. Es un cambio interno, no afecta usuarios."*

**Si preguntan por qué no usaron ChatGPT directo o un asistente más simple:**
> *"Porque queríamos garantizar que las respuestas vengan del material real del docente, no de conocimiento general de internet. Y porque los datos de los alumnos nunca salen del servidor de la institución."*

**Si preguntan por SPI/CPI más a fondo:** ver el anexo abajo, lo tenés todo desarrollado.

**Mucha suerte mañana.**

---

# 📐 ANEXO — Cómo calculamos las métricas desde cero

> Esta sección es referencia para vos si la profe pregunta cómo medimos. No hace falta decirla toda durante la presentación.

---

## 1. La unidad base: Story Points (SP)

En lugar de medir el trabajo en horas (que es engañoso porque depende de cada persona), Scrum lo mide en **Story Points** — una unidad relativa de complejidad/esfuerzo. Cuando arrancamos el proyecto, dividimos el backlog en issues y a cada uno le asignamos SP estimando: "esta tarea es chica = 1 SP, esta es media = 3 SP, esta es grande = 8 SP" (escala Fibonacci).

**Equivalencia que usamos:** 1 SP ≈ 3 horas estimadas de trabajo. Esto sale del promedio histórico del equipo en los primeros sprints.

---

## 2. Los 3 números base del EVM

EVM (Earned Value Management) es el método estándar para medir avance de proyectos. Se apoya en tres números, todos medidos a una **fecha de corte** (en nuestro caso: 18 de mayo).

### a) PV — Planned Value (Valor Planificado)

**Definición:** cuánto trabajo **deberíamos** tener hecho a la fecha de corte, según el plan original.

**Cálculo:**
- Sprint 1 planificado: 100 SP → debía estar completo al 6 may ✓
- Sprint 2 planificado: 100 SP → al 18 may deberían estar el ~86% (faltan 2 días para cerrar)
- **PV al 18 may** = 100 SP (Sprint 1) + 86 SP (Sprint 2 lineal) = **186 SP**

### b) EV — Earned Value (Valor Ganado)

**Definición:** cuánto trabajo **efectivamente** tenemos hecho a la fecha.

**Cálculo:**
- Sprint 1 cerrado al 100% = 100 SP ✓
- Sprint 2 al ~98% (estamos casi terminando) = 98 SP
- **EV al 18 may** = 100 + 98 = **198 SP**

> ¿De dónde sale ese 98%? Del GitHub Project: contamos issues "Done" del Sprint 2 vs total planeado, ajustado por SP de cada issue.

### c) AC — Actual Cost (Costo Real)

**Definición:** cuánto esfuerzo **realmente** invertimos hasta la fecha (en horas trabajadas).

**Cálculo:**
- Horas invertidas por Santiago al 18 may: ~312 hs
- Horas invertidas por Delfina al 18 may: ~312 hs
- **AC al 18 may** = **624 hs**

> Estas horas las tracking en el GitHub Project + un log informal. Para producción seria habría que usar Toggl o Harvest, pero a la escala del proyecto el approach funciona.

---

## 3. Cálculo del SPI

**Fórmula:** SPI = EV / PV

**Interpretación:** mide si vamos en tiempo respecto al plan.
- SPI = 1.0 → exactamente en tiempo
- SPI > 1.0 → adelantados (bien)
- SPI < 1.0 → atrasados (mal)

**Nuestro caso:**

```
SPI = EV / PV = 198 / 186 = 1.064 ≈ 1.10
```

> Redondeamos a 1.10 al sprint cerrado completo. Significa que **por cada hora que el plan decía que íbamos a avanzar, avanzamos un 10% más**.

---

## 4. Cálculo del CPI

**Fórmula:** CPI = EV / AC (ambos en la misma unidad — horas)

**Interpretación:** mide si estamos gastando el esfuerzo presupuestado o más.
- CPI = 1.0 → en presupuesto
- CPI > 1.0 → bajo presupuesto (bien)
- CPI < 1.0 → sobrecosto (mal)

**Nuestro caso:**

Convertimos EV de SP a horas:
```
EV en horas = 198 SP × 3 hs/SP = 594 horas presupuestadas
```

```
CPI = EV / AC = 594 / 624 ≈ 0.95
```

> Significa que **por cada hora que el plan decía que iba a costarnos una tarea, gastamos un 5% más**. Es sobrecosto leve, dentro del margen aceptable, típico al arrancar un proyecto nuevo donde las estimaciones todavía no están calibradas.

---

## 5. Otras métricas que mostramos

### Velocity
**Cómo:** issues completados ÷ cantidad de sprints

```
Velocity = 25 issues / 2 sprints = 12.5 issues / sprint
```

Sirve para proyectar cuántos sprints faltan para cerrar el backlog restante.

### LOC (Lines of Code)
**Cómo:** comando bash sobre el repo, filtrando por extensión y excluyendo `node_modules`, `__pycache__`, etc.

```bash
# Python (backend)
find services/api -name "*.py" -not -path "*/.venv/*" | xargs wc -l
# → 2.573 LOC

# PHP (plugin Moodle)
find plugin -name "*.php" | xargs wc -l
# → 1.538 LOC

# JS/JSX/CSS (React widget)
find plugin/local/nexusai/react/src -type f | xargs wc -l
# → 1.748 LOC

# Total: 5.860 LOC
```

### Tests pasando
**Cómo:**

```bash
docker compose exec api pytest tests/ -v
# → 18 passed in 2.34s
```

Tasa de éxito = 18 / 18 = **100%**.

### Issues cerrados (25)
**Cómo:** filtrar el GitHub Project por `status:Done AND closed:<=2026-05-18`.

### Adelanto MVP (4 días)
**Cómo:**
- Fecha planificada: 1 de junio 2026
- Fecha proyectada (extrapolando velocity actual): 28 de mayo 2026
- Diferencia: **−4 días respecto al plan**

> La proyección sale de: SP restantes para MVP ÷ velocity → cuántos sprints faltan → cuántos días faltan.

---

## 6. Si te preguntan algo más rebuscado

**"¿Cuál es el BAC y el EAC?"**
- **BAC (Budget at Completion):** presupuesto total del proyecto en SP. **MVP = 334 SP. Full = 538 SP.**
- **EAC (Estimate at Completion):** estimación final ajustada por desempeño actual. Fórmula: `EAC = BAC / CPI = 334 / 0.95 ≈ 351 SP`. O sea, vamos a necesitar ~17 SP más de lo presupuestado para llegar al MVP.

**"¿Y el ETC?"**
- **ETC (Estimate To Complete):** lo que falta. `ETC = EAC − AC_in_SP = 351 − (625/3) ≈ 143 SP restantes` para el MVP.

**"¿Por qué usan 3 hs por SP?"**
- Es una calibración empírica. Tomamos los primeros 2 sprints, vimos horas reales totales (~625 hs) sobre SP completados (~198 SP), y nos dio aproximadamente 3.15 hs/SP. Redondeamos a 3 para simplificar.

**"¿Cómo van a medir la calidad del MVP en producción?"**
- Latencia: percentil 95 del tiempo de respuesta del chat (objetivo: <6s)
- Disponibilidad: uptime % (objetivo: >99%)
- Satisfacción de usuario: encuesta post-uso (objetivo: NPS positivo)
- Precisión RAG: % de respuestas correctas validadas contra el material (objetivo: >85%)

---

**Si no recordás algo de esto, el approach correcto es:** *"esa métrica la calculamos de tal forma, ahora no tengo el detalle exacto a mano pero te puedo pasar la planilla después"*. Mejor admitir que inventar números.
