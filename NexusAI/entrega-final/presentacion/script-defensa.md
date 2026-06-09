# Script de defensa · NexusAI · MVP

**17 slides · ~15 minutos · alternado Santi/Delfi**

Texto corto, lenguaje natural. Pensado para hablar, no para leer.

| # | Quién | Tiempo | Slide |
|---|---|---|---|
| 1 | **Santi** | 20s | Portada |
| 2 | **Delfi** | 40s | El problema |
| 3 | **Santi** | 40s | 4 funcionalidades |
| 4 | **Delfi** | 40s | La solución |
| 5 | **Santi** | 50s | Arquitectura |
| 6 | **Delfi** | 25s | Demo intro |
| 7 | **Santi** | 40s | Sprints y Deploy |
| 8 | **Delfi** | 40s | Commits y código |
| 9 | **Santi** narra · **Delfi** ejecuta | 4 min | Lo que vamos a mostrar (demo) |
| 10 | **Delfi** | 40s | Métricas del MVP |
| 11 | **Santi** | 50s | Costos |
| 12 | **Delfi** | 50s | Riesgos |
| 13 | **Santi** | 50s | Valor Ganado (EVM) |
| 14 | **Delfi** | 40s | Aplicación de Adm de Proyectos |
| 15 | **Santi** | 35s | Lecciones |
| 16 | **Delfi** | 35s | Próximos pasos |
| 17 | **Santi** | 20s | Gracias |

---

## 1 · Portada · Santi (20s)

> Buenas tardes. Soy Santi, ella es Delfi. Hoy venimos a presentarles la entrega final de **NexusAI**, nuestro proyecto integrador de Ingeniería en Sistemas en la UCC.
>
> En 15 minutos les contamos qué hicimos y por qué.

> *Le paso a Delfi.*

---

## 2 · El problema · Delfi (40s)

> Cuando arrancamos este proyecto, hablamos con compañeros de la facultad. Y todos contaban lo mismo: la información de las materias **está desparramada por todos lados**. Una parte en Moodle, otra en grupos de WhatsApp, otra en Drive, otra en mails.
>
> Resultado: los alumnos pierden tiempo buscando en vez de estudiar. Y los profes no se enteran de qué dudas se están repitiendo.
>
> Nos preguntamos: **¿y si la IA pudiera responder usando el material del curso, y avisarle al profe qué falta explicar?**

> *Santi te muestra los datos.*

---

## 3 · Las 4 funcionalidades · Santi (40s)

> Para validar que esto era un problema real, **hicimos un relevamiento en la UCC**. Y los números nos confirmaron lo que pensábamos: más del 70% reporta dificultades para encontrar información.
>
> Cuando les preguntamos qué les gustaría tener, surgieron estas cuatro cosas:
>
> Un asistente que conteste dudas, un buscador inteligente, generación de quizzes y resúmenes, y algo que nos sorprendió: **detección de los temas que no están en el material**, para ayudar al profe.
>
> Las cuatro las hicimos.

> *Delfi te cuenta cómo las resolvimos.*

---

## 4 · La solución · Delfi (40s)

> **NexusAI es un plugin de Moodle**. No es una app aparte ni un sitio nuevo. Se instala dentro del Moodle de la facultad y los alumnos lo usan desde el mismo curso donde ya están.
>
> Tiene tres cosas que lo hacen distinto:
>
> Primero, **cita el material del curso**. Cada respuesta enlaza al fragmento exacto del PDF. Si la pregunta no está en el material, lo admite — no se la inventa.
>
> Segundo, **los datos quedan en la institución**. No salen a un servicio externo.
>
> Y tercero, **lo que no puede responder se lo muestra al profe**, para que mejore el material.

> *Santi te cuenta cómo lo construimos por dentro.*

---

## 5 · Arquitectura · Santi (50s)

> Por dentro tiene tres partes.
>
> Del lado del alumno, el **plugin de Moodle** muestra un chat hecho en React. Como si fuera una pestaña más del curso.
>
> Después está el **proxy**, que es la parte clave. Cada vez que el alumno escribe algo, la pregunta pasa primero por el servidor del plugin, que la firma y la reenvía. Esto es importante porque la clave del LLM **nunca llega al navegador del alumno** — queda guardada en la institución.
>
> Y atrás está el **backend** en Python, con una base de datos PostgreSQL que guarda el material indexado y busca por similitud.
>
> El LLM que usamos hoy es Gemini, pero está hecho para cambiarlo fácil a OpenAI o cualquier otro.

> *Delfi presenta la demo.*

---

## 6 · Demo intro · Delfi (25s)

> Ahora vamos a verlo funcionando. Lo que van a ver es **el sistema real**, no un mockup.
>
> Tenemos un Moodle corriendo acá en la laptop, conectado al backend en **Railway** que está online ahora mismo. Si quieren, pueden abrir esa URL en el celular y verificar que está vivo.
>
> Cinco minutos.

> *Antes de hacer el demo, Santi te muestra cómo lo construimos.*

---

## 7 · Sprints y Deploy · Santi (40s)

> Lo construimos en **5 sprints, entre abril y junio**.
>
> El Sprint 0 fue puro estudio: 47 documentos de investigación antes de tocar código.
> Después el chat básico, el sistema de RAG completo, control de calidad, y finalmente las 7 features del MVP.
>
> En total **completamos el 96% de lo planificado** — 255 story points de 265.
>
> Y todo el sistema está deployado en Railway, online 24/7 hasta la defensa final.

> *Delfi te muestra los números del repositorio.*

---

## 8 · Commits y código · Delfi (40s)

> Algunos números de la actividad del equipo en GitHub:
>
> Llevamos más de **100 commits en 4 ramas**, repartidos casi mitad y mitad entre Santi y yo. **46 días de desarrollo activo**, con 2 commits por día en promedio.
>
> Y el código: **5.000 líneas de Python** en el backend, **3.000 de PHP** en el plugin de Moodle, **2.500 de TypeScript** en el frontend.
>
> Y algo de lo que estamos orgullosos: **18.000 líneas de documentación**. Apostamos fuerte a que el proyecto sea entendible por cualquiera que venga después.

> *Pasamos a la demo. Santi va a narrar y yo ejecuto.*

---

## 9 · Lo que vamos a mostrar (Demo en vivo) · Santi narra · Delfi ejecuta (4 min)

**Delfi va clickeando en pantalla, Santi va leyendo. Mostrar el slide al cambiar de bloque.**

### Rol docente (90 segundos)

> Empezamos como **docente**. Entramos al curso de prueba y abrimos la pestaña de NexusAI.
>
> **(1)** Delfi sube un PDF — el apunte de derivadas. El sistema lo procesa, lo divide en pedacitos y genera embeddings con Gemini.
>
> **(2)** Fíjense que el badge cambia de "procesando" a "listo" sin recargar la página. Indexación en vivo.
>
> **(3)** Ahora cambiamos a la pestaña "Gaps detectados". Acá están las preguntas que los alumnos hicieron y el sistema no pudo responder. Es el feedback para el docente.

### Rol alumno (2.5 min)

> Cambiamos de usuario y entramos como alumno.
>
> **(4)** Hacemos una pregunta sobre derivadas. La respuesta llega palabra por palabra, igual que ChatGPT.
>
> **(5)** Estas marquitas que ven, los corchetes con números, son **citas clickeables**. Tocamos una y aparece el fragmento exacto del PDF que respaldó esa respuesta.
>
> **(6)** Esta otra pestaña es el **buscador**: encuentra dónde está algo sin generar respuesta. Más rápido y más barato.
>
> **(7)** Y esta es la pestaña de **quiz**: pedimos 3 preguntas sobre derivadas y el sistema las genera del material real. Las respondemos y nos da el score.
>
> **(8)** Por último, **multi-curso**: si activamos este toggle, la pregunta busca en el material de todos los cursos a la vez, y nos dice de qué materia viene cada respuesta.

> *Volvemos a la presentación. Delfi te cuenta cómo medimos la calidad.*

---

## 10 · Métricas · Delfi (40s)

> Para medir que el MVP esté bien hecho, miramos cuatro cosas:
>
> Hicimos **37 tests automatizados** y **51 casos de testing manual**, llegando a un **80% de cobertura** en el backend.
>
> En performance: **el primer token aparece en menos de un segundo**, y la respuesta completa tarda entre 3 y 6 segundos.
>
> Y el dato que más nos gusta: **el MVP nos costó cero pesos al mes**. Todo con planes gratuitos.

> *Santi te cuenta los costos en detalle.*

---

## 11 · Costos · Santi (50s)

> Hablemos de plata. Tres miradas:
>
> **Hoy el MVP cuesta cero**. Railway, Gemini, Postgres, Redis y GitHub, todo en plan gratuito.
>
> Si lo medimos en **horas de desarrollo a valor de mercado**, hicimos unas 420 horas, que a $25 la hora de un junior dev son unos **$10.500 USD**. Estaba presupuestado en $10.000 — un 5% por encima, dentro de lo razonable.
>
> Y si lo escalamos: con **500 alumnos** activos cuesta aproximadamente **$100 por mes**. Con **10.000 alumnos**, $1.800. **Por respuesta, una fracción de centavo**.

> *Delfi te cuenta los riesgos del proyecto.*

---

## 12 · Riesgos · Delfi (50s)

> Durante el proyecto identificamos **12 riesgos**. Estos cuatro fueron los más críticos:
>
> Que **el modelo se invente respuestas**. Lo resolvimos forzándolo a citar y agregando un chequeo automático que dispara una alerta al docente cuando no puede responder.
>
> Que **se filtre la clave del LLM** si llega al navegador. Lo resolvimos con el proxy que les contó Santi: la clave nunca sale del servidor.
>
> Que **se agreguen features sin parar y se atrase el cierre**. Lo resolvimos congelando el backlog al inicio de cada sprint.
>
> Y que **se caiga el backend justo en la defensa de hoy**. Para eso tenemos un video del demo grabado, listo por si Railway se cae.

> *Santi te cuenta el cumplimiento del proyecto en números.*

---

## 13 · Valor Ganado (EVM) · Santi (50s)

> Para cerrar el análisis de gestión, aplicamos **Valor Ganado**, lo que vimos en la materia.
>
> Dos indicadores clave:
>
> **SPI igual a 0.96** — cumplimos el 96% del cronograma planificado. Verde según el estándar PMI.
>
> **CPI igual a 0.92** — tuvimos un sobrecosto leve, del 8%, por las features que sumamos en el sprint final. También está dentro del rango sano para proyectos ágiles.
>
> En palabras simples: **entregamos en tiempo, con un 8% más de esfuerzo del planificado**. Es exactamente lo que se espera de un MVP con scope creep controlado.

> *Delfi te cuenta cómo se conecta todo esto con la materia.*

---

## 14 · Aplicación de Adm de Proyectos · Delfi (40s)

> Quiero cerrar con esto, que para nosotros es lo más importante: **este proyecto no fue solo desarrollar un producto**.
>
> Fue ejercitar todo el ciclo que vimos en la materia: planificación con WBS y cronograma, ejecución con Scrum, control con la matriz de riesgos, calidad con ADRs y tests, costos con TCO, y cierre con retrospectiva.
>
> **El producto es lo visible. La gestión es el aprendizaje real**.

> *Santi te cuenta qué nos llevamos.*

---

## 15 · Lecciones · Santi (35s)

> Dos cosas que **volveríamos a hacer**: invertir tanto tiempo al inicio en investigar antes de codear, y documentar cada decisión técnica con un ADR. Eso nos ahorró mucho retrabajo.
>
> Y dos cosas que **cambiaríamos**: meter los tests automáticos desde el Sprint 1, no desde el 3. Y arrancar antes los trámites para publicar el plugin oficialmente.

> *Delfi te cuenta para dónde va el proyecto después de hoy.*

---

## 16 · Próximos pasos · Delfi (35s)

> El MVP está cerrado, pero el proyecto sigue. Tenemos tres horizontes:
>
> **Inmediato**: presentar el plugin al directorio oficial de Moodle para que cualquier universidad lo pueda instalar.
>
> **Corto plazo**: un dashboard para el alumno con su propio progreso.
>
> **Mediano plazo**: probarlo en cursos reales de la UCC durante un cuatrimestre.

> *Santi cierra.*

---

## 17 · Gracias · Santi (20s)

> Eso es todo.
>
> **NexusAI está en producción, es entregable y se puede instalar en cualquier Moodle**. Todo el material está en el pendrive.
>
> Gracias por su atención. Quedamos abiertos a las preguntas.

---

## Tips para ensayar

- **Cronometren la primera pasada completa**. Apunten a 14 minutos para tener margen.
- **No leer**. Estos textos son referencia. Memoricen las 2 ideas clave de cada slide.
- **Hablen como si le contaran a un amigo**, no como si dictaran un examen. Lenguaje natural.
- **La transición** es lo que más se nota. Practiquen las frases de pase ("Santi te cuenta...", "Delfi te muestra...").
- **Si la demo falla**: tener el video pregrabado listo en otra pestaña. Si algo se cae, levantan el video sin disculparse y siguen.
- **Preguntas del tribunal más probables**: seguridad (la clave del LLM), costos a escala, comparación con ChatGPT, derechos sobre el material de la facultad, cumplimiento del cronograma. Si no saben algo, **digan "buena pregunta, lo profundizamos en el documento del pendrive"** — es mejor que improvisar mal.
