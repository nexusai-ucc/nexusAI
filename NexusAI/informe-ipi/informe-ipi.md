---
lang: es
geometry: margin=2.5cm
papersize: a4
fontsize: 11pt
colorlinks: true
linkcolor: "blue!60!black"
urlcolor: "blue!60!black"
header-includes:
  - \usepackage{setspace}
  - \onehalfspacing
  - \usepackage{ragged2e}
  - \providecommand{\tightlist}{\setlength{\itemsep}{0pt}\setlength{\parskip}{0pt}}
---

<!--
============================================================================
INFORME DE PROYECTO INTEGRADOR (IPI) — NexusAI
Estructura según plantilla oficial UCC v2.1 - 2026.
Redacción: formal, impersonal / 3ª persona. Citas APA v7. Texto justificado.
Marcadores ">  ⚠️ COMPLETAR:" señalan lo que falta decidir/insertar.
Compilar con ./build.sh
============================================================================
-->

\begin{titlepage}
\centering
\vspace*{0.5cm}

{\Large\itshape Universidad Católica de Córdoba\par}
{\large Facultad de Ingeniería\par}
\vspace{1.5cm}

{\large Proyecto:\par}
\vspace{0.5cm}
{\Huge\bfseries NexusAI\par}
\vspace{0.4cm}
{\large\itshape Asistente académico con inteligencia artificial integrado en Moodle\par}

\vspace{1.5cm}
{\itshape [insertar logo UCC]\par}
\vspace{1.5cm}

{\large\itshape Informe Final de Grado\par}
\vspace{1.5cm}

\begin{flushleft}
\textbf{Alumnos:}
\begin{itemize}
  \item Santiago Tricherri
  \item Marcos Bugliotti
  \item Delfina Salinas
\end{itemize}

\textbf{Directores:}
\begin{itemize}
  \item Ignacio Luciano Carreño
  \item Federico Eduardo Porrini
  \item Leandro Juarez
\end{itemize}
\end{flushleft}

\vfill
{\itshape [COMPLETAR: día] de [mes] de 2026\par}
\vspace{0.5cm}
{\large Córdoba — Argentina\par}
\end{titlepage}

\newpage
\tableofcontents
\newpage

# Resumen

El presente informe documenta el desarrollo de **NexusAI**, un asistente académico
basado en inteligencia artificial integrado como plugin en la plataforma Moodle.
**(Introducción)**

Las plataformas de gestión del aprendizaje (LMS) como Moodle se utilizan
mayoritariamente como repositorios documentales estáticos, mientras que los
estudiantes recurren a asistentes de IA generales —ajenos al material de cada
materia— para resolver sus dudas. Esto produce respuestas genéricas, dispersión
de la información y pérdida de visibilidad del docente sobre las consultas del
alumnado. **(Problema)**

Para abordar esta situación se diseñó e implementó un plugin de tipo `local` para
Moodle, acompañado de un backend que aplica la técnica de *Retrieval-Augmented
Generation* (RAG) sobre el material indexado de cada curso, almacenado en una base
de datos vectorial. La solución recupera los fragmentos más relevantes del
material y los provee como contexto a un modelo de lenguaje de gran escala, que
responde citando explícitamente la fuente. **(Metodología)**

El producto mínimo viable (MVP), entregado en junio de 2026, alcanzó siete
funcionalidades en producción —buscador semántico, chat conversacional
multi-curso, respuesta en *streaming*, citas trazables, historial, generador de
cuestionarios y detección de vacíos de contenido— con una cobertura de pruebas
automatizadas cercana al 80% en el backend. En los meses posteriores el
desarrollo continuó de forma sostenida, incorporando foros con detección de
posts similares y asistencia de IA, un panel de analítica para el docente,
generación de exámenes exportables al formato nativo de Moodle, un plan de
estudio personalizado que combina errores de práctica y vacíos detectados, y
soporte para formatos de material adicionales al PDF. **(Resultado)**

Los resultados muestran que es posible ofrecer asistencia académica contextualizada
y auditable dentro del LMS institucional, preservando la soberanía de los datos y
mitigando la alucinación de los modelos de lenguaje mediante la trazabilidad de las
respuestas. **(Conclusión)**

**Palabras clave:** Moodle, inteligencia artificial, RAG, asistente académico,
educación, soberanía de datos.

## Abstract

This report documents the development of **NexusAI**, an artificial-intelligence
academic assistant integrated as a plugin into the Moodle platform. **(Introduction)**

Learning Management Systems (LMS) such as Moodle are mostly used as static document
repositories, while students rely on general-purpose AI assistants —unaware of each
subject's material— to solve their doubts. This leads to generic answers,
information dispersion, and a loss of teacher visibility over student queries.
**(Problem)**

To address this, a Moodle `local` plugin was designed and implemented, together
with a backend that applies Retrieval-Augmented Generation (RAG) over each course's
indexed material, stored in a vector database. The solution retrieves the most
relevant fragments and provides them as context to a large language model, which
answers by explicitly citing its source. **(Methodology)**

The minimum viable product (MVP), delivered in June 2026, reached seven production
features —semantic search, multi-course conversational chat, response streaming,
traceable citations, history, quiz generation, and content-gap detection— with
automated test coverage close to 80% in the backend. Development continued
steadily in the following months, adding forums with similar-post detection and
AI assistance, a teacher analytics panel, exam generation exportable to Moodle's
native format, a personalized study plan combining practice errors and detected
gaps, and support for additional material formats beyond PDF. **(Result)**

Results show that contextualized and auditable academic assistance can be delivered
within the institutional LMS while preserving data sovereignty and mitigating large
language model hallucination through answer traceability. **(Conclusion)**

**Keywords:** Moodle, artificial intelligence, RAG, academic assistant, education,
data sovereignty.

\newpage

# Presentación del tema

La adopción de la inteligencia artificial generativa en la educación universitaria
avanza más rápido que la integración formal de estas herramientas en las plataformas
educativas. Mientras los estudiantes utilizan asistentes generales para resolver
dudas académicas, las plataformas LMS institucionales como Moodle continúan
funcionando como repositorios documentales, sin integración con la inteligencia
artificial.

El proyecto NexusAI surge de esta brecha. Su propósito es incorporar, dentro del
propio campus virtual, un asistente académico capaz de responder consultas en
lenguaje natural sobre el material real de cada materia, generar ejercicios de
práctica y proveer información accionable al docente. La relevancia del tema radica
en que la solución no compite con el docente ni reemplaza a la plataforma existente:
agrega una capa de inteligencia sobre Moodle, manteniendo a los estudiantes en el
entorno donde reside el material académico validado.

El problema que motiva el proyecto se desarrolla en detalle en la sección
*Diagnóstico*, y constituye el eje central sobre el cual se articula el resto del
informe.

\newpage

# Glosario

Se definen a continuación los términos específicos del dominio del proyecto,
necesarios para comprender el informe por parte de un lector no especializado en el
área.

- **LMS (Learning Management System):** plataforma de gestión del aprendizaje que
  centraliza materiales, actividades y comunicación de un curso. Moodle es el LMS de
  referencia en el ámbito universitario argentino.
- **Moodle:** sistema de gestión de aprendizaje de código abierto, ampliamente
  utilizado por instituciones educativas para administrar cursos en línea.
- **Plugin:** componente de software que extiende las funcionalidades de una
  plataforma existente sin modificar su núcleo. NexusAI se distribuye como un plugin
  de tipo `local` para Moodle.
- **Inteligencia artificial generativa:** rama de la IA capaz de producir contenido
  nuevo —texto, imágenes, código— a partir de patrones aprendidos de grandes
  volúmenes de datos.
- **Modelo de lenguaje de gran escala (LLM):** modelo de inteligencia artificial
  entrenado sobre grandes cantidades de texto, capaz de comprender y generar
  lenguaje natural.
- **RAG (Retrieval-Augmented Generation):** técnica que combina la búsqueda de
  información relevante en una fuente de datos propia con la generación de texto de
  un LLM, permitiendo respuestas fundamentadas en material específico.
- **Embedding:** representación numérica (vector) de un fragmento de texto que captura
  su significado semántico, permitiendo comparar la similitud entre textos.
- **Base de datos vectorial:** sistema de almacenamiento optimizado para guardar y
  buscar *embeddings* por similitud semántica.
- **Alucinación (de un LLM):** fenómeno por el cual un modelo de lenguaje genera
  información plausible pero falsa o no fundamentada en una fuente real.
- **Chunk (fragmento):** porción de texto en la que se divide un documento para su
  indexación y recuperación.
- **Streaming:** entrega progresiva de la respuesta del modelo, token por token, para
  reducir la latencia percibida por el usuario.

\newpage

# Diagnóstico (problemática)

La problemática que da origen al proyecto no constituye únicamente un problema en
sentido estricto, sino también una oportunidad de mejora dentro del proceso
educativo universitario mediado por plataformas digitales.

## Estado actual (contexto)

Las plataformas LMS como Moodle son fundamentales en la educación universitaria,
pero en la práctica se utilizan como repositorios estáticos: los estudiantes
descargan archivos y entregan trabajos, sin un acompañamiento real al proceso de
aprendizaje. A partir de la experiencia directa del equipo del proyecto como
estudiantes de la Universidad Católica de Córdoba (UCC), se identificaron de manera
preliminar tres problemáticas recurrentes en el uso del campus virtual, que luego se
validaron mediante un relevamiento formal a 166 estudiantes y 17 docentes de la
institución:

- **Dispersión de la información** entre el campus virtual, aplicaciones de mensajería
  y servicios de almacenamiento personales, que dificulta encontrar el material
  correcto en el momento de estudiar. El 80,7% de los estudiantes encuestados percibe
  esta dispersión al menos "a veces", y un 43,4% la califica como alta o frecuente.
- **Dificultad para organizar el estudio** y planificar repasos antes de las
  evaluaciones, en un contexto donde solo el 34% de los estudiantes describe la
  mayoría de sus materias como bien organizadas dentro del campus.
- **Uso pasivo del campus virtual** frente al material académico: aunque el 72,3% de
  los estudiantes ingresa al campus a diario o varias veces por semana, el 100% de
  quienes fueron consultados al respecto ya recurre a herramientas de IA generalistas
  —ajenas al material de la materia— para estudiar o resolver trabajos, lo que
  evidencia una necesidad no cubierta por la plataforma institucional.

## Impacto sobre los interesados

La situación afecta a dos grupos principales. Por un lado, los estudiantes reciben
respuestas genéricas de modelos entrenados sobre internet abierto —no sobre el
material específico de su curso—, con riesgo de respuestas plausibles pero
incorrectas en el contexto de esa materia particular. Por otro lado, los docentes
pierden visibilidad sobre qué consultan los estudiantes acerca de su material,
porque dichas consultas suceden fuera del LMS.

## Oportunidades

A partir de este diagnóstico se identifican tres oportunidades de mejora que el
proyecto busca aprovechar:

- Mantener a los estudiantes dentro del campus virtual, donde reside el material
  validado por el docente.
- Ofrecer respuestas fundamentadas en el material específico del curso, y no en
  fuentes genéricas de internet.
- Generar datos accionables para el docente sobre las consultas y los vacíos de
  contenido detectados.

> Los datos citados en esta sección provienen del relevamiento propio del equipo:
> encuesta a 166 estudiantes y encuesta a 17 docentes de la UCC, realizadas entre
> marzo y junio de 2026. El detalle de preguntas, metodología y resultados completos
> se desarrolla en la sección *Relevamiento y metodología de investigación*,
> a continuación.

\newpage

# Relevamiento y metodología de investigación

Esta sección documenta en detalle el relevamiento mencionado en el
Diagnóstico: diseño, proceso de recolección, preguntas completas y
resultados de las dos encuestas propias del equipo, junto con el contexto
institucional relevado en paralelo.

## Metodología

Ambas encuestas se diseñaron como formularios de Google, difundidas entre
marzo y junio de 2026, y comparten una particularidad metodológica que se
documenta explícitamente para no inflar artificialmente la muestra: el
formulario se amplió mientras ya se estaban recolectando respuestas, de
modo que las primeras respuestas solo vieron el bloque inicial de
preguntas y las posteriores vieron el formulario completo. Por esta razón,
cada resultado reportado a continuación indica el **N real** de quienes
vieron esa pregunta en particular, en lugar de asumir el total de
respondentes para toda pregunta — algunos resultados tienen como
denominador el total de la encuesta y otros un subconjunto, según
corresponda.

## Encuesta a estudiantes (N = 166)

Relevamiento cerrado entre el 31 de marzo y junio de 2026, con 166
respuestas mayoritariamente de la Facultad de Ingeniería, con representación
también de Ciencias Económicas y de Administración, Ciencias de la Salud,
Derecho y Ciencias Sociales, Ciencias Políticas y RRII, y Ciencias
Agropecuarias. El cuestionario cubrió cinco bloques: perfil y uso del
campus, experiencia y organización de materias, dispersión de información
y comunicación, validación de funcionalidades de NexusAI, y una pregunta
abierta de cierre.

**Frecuencia de uso del campus virtual (n=166):** el 72,3% (120/166) lo usa
todos los días o varias veces por semana. El campus es, en la práctica,
parte de la rutina de la mayoría — la problemática que motiva el proyecto
no es la falta de uso, sino qué tan bien ese uso frecuente se traduce en
organización real del estudio.

**Dispersión de la información (n=166):** para poder combinar las dos
versiones del formulario (que ofrecían escalas de respuesta distintas para
esta pregunta), los resultados se agruparon en tres categorías
equivalentes. El 43,4% (72/166) reporta dispersión alta o frecuente, el
37,3% (62/166) reporta dispersión intermedia y el 19,3% (32/166) reporta
dispersión baja o nula. En conjunto, **el 80,7% de los estudiantes percibe
dispersión de información al menos "a veces"**, confirmando con datos
formales la problemática que el equipo había identificado inicialmente de
forma informal.

**Experiencia y organización de materias (n=88):** el 80,7% califica su
experiencia con el campus como buena o mejor, pero la razón dominante
("funciona bien aunque le faltan cosas") describe un uso intensivo y a la
vez insatisfecho, no un rechazo a la plataforma. Sobre la organización de
sus materias, solo el 34% ve "la mayoría" o "todas" bien organizadas; el
54,5% las describe como "mitad y mitad" — la organización depende
fuertemente de cada docente, no de la plataforma en sí.

**Uso de herramientas de IA para estudiar (n=88):** el 100% de quienes
vieron esta pregunta ya usa alguna herramienta de IA generalista para
estudiar, hacer trabajos, o ambas cosas. Es un dato a interpretar con
cautela porque el formulario no ofrecía ninguna opción negativa, pero es
consistente con el resto del relevamiento: la IA generalista ya es una
práctica de estudio extendida, mientras el campus virtual no ofrece nada
equivalente integrado.

**Corrección automática de ejercicios (n=88):** el 95,5% (84/88) ve valor
en que una IA corrija ejercicios con explicación — 43,2% la usaría
frecuentemente, 37,5% como complemento a la corrección del docente. Solo
el 4,5% prefiere que la corrección quede exclusivamente en manos del
docente.

Dos respuestas abiertas ilustran el patrón encontrado:

> "Mejoraría el hecho de que no esté tan dispersa la información, también
> que esté más organizado."

> "El valor del aula virtual depende mucho de cómo la preparen los
> profesores. Bien organizada, mejora mucho la experiencia."

## Encuesta a docentes (N = 17)

Relevamiento cerrado entre el 1 de abril y el 19 de junio de 2026, con 17
respuestas de docentes mayoritariamente de la Facultad de Ingeniería. La
encuesta se revisó previamente con Leandro Juarez, director del proyecto y
docente de la cátedra de Proyecto Integrador, antes de su difusión.

**Uso actual de IA en la práctica docente (n=17):** el 64,7% (11/17) ya usa
alguna herramienta de IA; ningún docente la rechaza de plano.

**Delegación de tareas a una IA integrada al campus (n=17):** el 88,2%
(15/17) delegaría al menos parcialmente tareas a una IA integrada —el
47,1% condicionado a poder revisar el resultado antes de publicarlo, el
23,5% "según la tarea" y el 17,6% sin condición. Ningún docente respondió
que no delegaría nada. La condición de supervisión antes de publicar,
repetida en la mayoría de las respuestas, valida directamente el patrón de
diseño "asistir, no reemplazar" adoptado en NexusAI.

**Estructura inicial del curso armada por IA (n=15):** el 86,7% (13/15) ve
valor en que una IA arme la estructura inicial del curso, dividido entre
hacerlo con revisión posterior (40%) o en paralelo decidiendo cada paso
junto a la IA (40%). Solo el 13,3% prefiere armarlo íntegramente solo.

**Herramientas de evaluación actuales (n=15):** un tercio no las usa y no
puede opinar; del resto, las opiniones se dividen entre "básicas pero
sirven", "me faltan funcionalidades" y "cubren lo que necesito" en
proporciones similares. Las sugerencias abiertas más repetidas piden
corrección automática de trabajos y rúbricas inteligentes.

Dos respuestas abiertas:

> "Transformarlo en una herramienta de gestión real y no un reservorio de
> materiales."

> "Alertas tempranas sobre temas docentes a resolver (contenido, clases,
> asistencias, notas, condiciones)."

La tabla siguiente resume cómo los resultados confirmaron o descartaron
decisiones de alcance tomadas antes de tener los datos:

| Condición evaluada | Resultado real |
|---|---|
| >50% de interés en generador de evaluaciones / delegar tareas a una IA → adelantar esa épica al Sprint 3 | **Confirmado (88,2%)** — consistente con incluir Herramientas para Docentes en el alcance del MVP. |
| Bajo interés en analytics → bajar prioridad post-MVP | **Descartado** — alto interés: la mayoría de las respuestas abiertas pide ver temas con más dudas y alumnos en riesgo, lo que mantuvo Analytics dentro del alcance. |
| >70% prioriza citar fuentes / objeciones fuertes a que los datos salgan a un proveedor externo de IA | No se preguntó explícitamente en la versión final del formulario — el requisito de citación ya estaba definido desde el diseño técnico, y no hay evidencia de objeción en las respuestas abiertas relevadas. |

## Contexto institucional relevado

En paralelo a las encuestas, el equipo relevó los requisitos técnicos y
políticos que impone la UCC para instalar un plugin de terceros en su
instancia institucional de Moodle (versión y SO del servidor, proceso
formal de aprobación, restricciones de red, marco de privacidad
aplicable). La mayoría de esas preguntas —dirigidas al área técnica de
Moodle de la universidad— quedó sin respuesta confirmada dentro del plazo
del proyecto. Por eso, desde una etapa temprana, el equipo priorizó una
estrategia de despliegue que no dependiera de esa aprobación
institucional: una demo autohospedada, independiente de la infraestructura
de la UCC, que es efectivamente la que se usa durante el desarrollo y la
que se describe en el Anexo D de este informe (backend permanente en
Oracle Cloud; cada integrante corre Moodle localmente apuntando a ese
backend). La sumisión del plugin al Moodle Plugins Directory, descripta en
la sección *Publicación en Moodle Marketplace*, es en los hechos la vía que
terminó reemplazando a la aprobación institucional directa: un plugin
publicado y revisado por Moodle HQ es más fácil de autorizar para un área
de IT que uno sin ningún tipo de validación externa.

## Síntesis

| Problemática del Diagnóstico | Evidencia de la encuesta a estudiantes | Evidencia de la encuesta a docentes |
|---|---|---|
| Dispersión de la información | 80,7% percibe dispersión al menos "a veces"; 43,4% la percibe alta o frecuente. | — |
| Uso pasivo / desorganizado del campus virtual | Solo 34% ve sus materias bien organizadas; depende del docente más que de la plataforma. | 33% no usa las herramientas de evaluación del campus. |
| Recurso a IA generalista ajena al material del curso | 100% de quienes vieron la pregunta ya usa IA para estudiar y/o trabajos; 95,5% quiere corrección automática con explicación. | 64,7% ya usa IA en su práctica docente; 88,2% delegaría tareas a una IA integrada al campus. |

\newpage

# Objetivos

## Objetivo general

Desarrollar un plugin para Moodle que incorpore un asistente académico basado en
inteligencia artificial, capaz de responder consultas en lenguaje natural sobre el
contenido real de cada materia, generar ejercicios de práctica personalizados y
proveer herramientas de *analytics* al docente, mejorando la experiencia educativa
dentro del aula virtual de la UCC.

## Objetivos específicos

- Identificar y documentar las problemáticas del uso actual del campus virtual a
  partir de la experiencia directa del equipo como estudiantes de la UCC,
  validada mediante un relevamiento formal a 166 estudiantes y 17 docentes de la
  institución.
- Diseñar e implementar un plugin de tipo `local` para Moodle que se integre al
  entorno existente sin modificar su núcleo.
- Desarrollar un prototipo funcional (MVP) con un asistente conversacional basado en
  técnicas de RAG e integración con modelos de lenguaje de gran escala, validado con
  usuarios reales.
- Implementar un sistema de generación de cuestionarios de práctica con corrección
  automática asistida por IA.
- Proveer al docente un panel de *analytics* sobre las consultas de sus estudiantes
  y herramientas de detección de vacíos de contenido en el material.
- Evaluar el impacto de la solución mediante pruebas con usuarios reales y métricas
  de calidad de respuesta.

## Tabla de trazabilidad

La siguiente tabla evidencia el cumplimiento de cada objetivo específico
vinculándolo con los requerimientos implementados y la prueba que lo valida.

| Objetivo específico | Requerimiento(s) | Evidencia de cumplimiento |
|---|---|---|
| Relevamiento de problemáticas | — | Encuesta a 166 estudiantes y 17 docentes UCC (`investigacion/09-relevamiento/`): 80,7% de estudiantes percibe dispersión de información; 100% de quienes respondieron ya usa IA generalista para estudiar; 88,2% de docentes delegaría tareas a una IA integrada al campus. |
| Plugin `local` integrado a Moodle | RF-15 a RF-18 | Plugin instalable en Moodle 4.1–4.5; pruebas de instalación |
| Asistente conversacional RAG | RF-01 a RF-07 | Chat en producción; `test_retriever`, `test_pipeline` |
| Generación de cuestionarios | RF-10 a RF-14 | Funcionalidad de *quiz* en producción; validación de tema |
| Analytics y detección de vacíos | RF-20 a RF-22 | Reporte de *gaps* por curso; `test` de *gaps recorder*; validado además por el 88,2% de docentes dispuestos a delegar tareas de analytics/evaluación relevado en la encuesta a docentes |
| Evaluación con usuarios reales | RNF-06 a RNF-09 | Métricas de latencia; *golden set* de calidad de respuesta |

> **PENDIENTE —** ajustar la columna de "Evaluación con usuarios reales" con los
> resultados de las pruebas de usabilidad cuando estén consolidados (TEST-01/TEST-02,
> fuera del alcance de este relevamiento).

\newpage

# Marco teórico

El presente marco teórico proporciona el fundamento conceptual necesario para
comprender la problemática, sin plantear todavía una solución específica. El análisis
abarca el contexto del problema, las técnicas disponibles y las alternativas
existentes en el mercado.

## Contexto general del problema

La incorporación de inteligencia artificial generativa a los entornos educativos ha
sido señalada como una de las tendencias tecnológicas más relevantes para la
educación superior. Los modelos de lenguaje de gran escala (LLM) son capaces de
sostener conversaciones en lenguaje natural, pero su conocimiento proviene de los
datos con los que fueron entrenados, por lo que desconocen el material particular de
una materia universitaria. Al consultarlos sobre dicho material, tienden a producir
respuestas genéricas o, en el peor caso, **alucinaciones**: información plausible pero
incorrecta o no fundamentada (Ji et al., 2023).

## Técnicas investigadas

Para que un asistente responda sobre contenido específico de una materia existen tres
estrategias principales:

| Estrategia | Costo | Flexibilidad | Limitación principal |
|---|---|---|---|
| *Prompting* puro | Bajo | Baja | El modelo no conoce el material; inventa o se rehúsa |
| *Fine-tuning* | Muy alto | Alta | Requiere reentrenar el modelo por cada curso |
| RAG | Medio | Media-alta | Requiere infraestructura de indexación y recuperación |

La técnica de **Retrieval-Augmented Generation** (RAG) combina la búsqueda semántica
sobre documentos propios con la generación de texto de un LLM (Lewis et al., 2020).
Permite incorporar material nuevo sin reentrenar el modelo, recuperando los fragmentos
más relevantes y proveyéndolos como contexto. Diversos trabajos posteriores han
sistematizado sus variantes y su aplicación a tareas intensivas en conocimiento
(Gao et al., 2023). La calidad del sistema depende de decisiones de diseño como la
estrategia de fragmentación (*chunking*), el modelo de *embeddings* y la métrica de
similitud empleada.

## Tecnologías investigadas

Además de la técnica general (RAG), se investigó y comparó la pila tecnológica
concreta necesaria para implementarla, evaluando alternativas reales antes de
decidir cada componente.

### Base de datos vectorial

| Alternativa | Decisión | Motivo |
|---|---|---|
| **pgvector** (extensión de PostgreSQL) | Elegida | Un solo sistema para datos relacionales y vectoriales; permite combinar filtros SQL y búsqueda vectorial en una sola consulta. |
| ChromaDB (ChromaDB, s.f.) | Descartada | Sistema separado de PostgreSQL: las consultas relacionales y vectoriales requieren dos llamadas y lógica de coordinación adicional. |
| Pinecone / Weaviate / Qdrant | Descartadas | Se justifican a partir de decenas de millones de vectores con alta concurrencia; la escala proyectada de NexusAI (~240.000 vectores para toda la UCC, hasta ~4,8 millones en una expansión multi-institución) queda muy por debajo de ese umbral. |

### Modelos de lenguaje y *embeddings*

Se comparó el costo y las prestaciones de los modelos de lenguaje candidatos:
Gemini 2.5 Flash ofrece una capa gratuita suficiente para un MVP sin costo
operativo, pero sin garantías de nivel de servicio para producción (Google,
s.f.-a); GPT-4o-mini resulta significativamente más económico que GPT-4o y es
la referencia de facto del mercado para este tipo de tareas, por lo que se lo
eligió como modelo de producción, reservando GPT-4o para casos de razonamiento
más complejo (OpenAI, s.f.-b). Dado que prácticamente todos los proveedores
relevantes exponen una interfaz compatible con el SDK de OpenAI —incluido
Gemini (Google, s.f.-a)— se diseñó una abstracción propia (`LLMProvider` /
`EmbeddingProvider`) que permite cambiar de proveedor modificando únicamente
una variable de entorno, en lugar de adoptar un *framework* de orquestación
como LangChain, descartado por su peso y la inestabilidad de su API entre
versiones.

### Arquitectura de plugin Moodle

Moodle admite varios tipos de plugin (`local`, `block`, `mod`, `filter`,
`auth`, entre otros). Se descartó `block` porque, con el tema Boost de Moodle
4.x, los bloques quedan ocultos en un panel lateral y cada docente debería
agregarlo curso por curso manualmente. Se evaluó también el **subsistema de IA
nativo de Moodle 4.5+**, y se descartó por carecer de un estado de memoria
conversacional persistente a lo largo del cuatrimestre —limitación funcional
del núcleo que motiva, en gran medida, el desarrollo de un plugin propio en
lugar de adoptar la funcionalidad ya incorporada a la plataforma. Se eligió
finalmente un plugin de tipo `local`, que permite definir *web services*,
tareas programadas y *hooks* propios sin depender de que el docente lo agregue
manualmente a cada curso.

### Extracción y fragmentación de documentos

Para la extracción de texto de los materiales subidos por el docente se evaluó
pdfplumber frente a PyPDF2/pypdf (extracción deficiente en PDFs con diseño
complejo), pdfminer.six (interfaz más compleja de integrar) y PyMuPDF
(descartado por su licencia AGPL, incompatible con la distribución del
plugin); pdfplumber (pdfplumber, s.f.) se eligió por su manejo nativo de
tablas y diseño de página. Para la fragmentación (*chunking*) se adoptaron
fragmentos de aproximadamente 500 tokens con 10% de superposición entre
fragmentos consecutivos: los fragmentos pequeños mejoran la precisión de la
recuperación semántica, mientras que la superposición mitiga la pérdida de
contexto cuando un fragmento corta una oración o una idea a la mitad.

## Opciones similares en el mercado

Se relevaron asistentes académicos basados en IA existentes, con el fin de comprender
el panorama actual y las carencias que el proyecto podría atender, distinguiendo dos
grupos: asistentes académicos generales, ajenos al ecosistema Moodle, y plugins de
Moodle que ya incorporan IA.

### Asistentes académicos generales

- **Khanmigo (Khan Academy):** tutor de IA pedagógicamente pulido, con modo socrático
  y cuidado explícito de la privacidad de menores, pero responde sobre el contenido de
  Khan Academy —no sobre el material de cada materia— y no se integra con Moodle
  (Khan Academy, s.f.).
- **Coursera Coach:** asistente ya conectado a los videos y transcripciones del curso,
  pero cerrado al ecosistema Coursera, sin apertura a contenido externo (Coursera, 2023).
- **NotebookLM (Google):** ofrece buen RAG con citas precisas, pero requiere que el
  usuario suba los documentos manualmente, uno por uno, y almacena los datos en
  servidores de un tercero (Google, s.f.-b).
- **Microsoft Copilot for Education:** fuerte integración con Teams, Word y OneNote,
  pero centrado en su propio ecosistema, sin integración nativa con Moodle (Microsoft, s.f.).
- **ChatGPT Edu:** máxima potencia del modelo base, pero sin integración con el LMS —el
  alumno tiene que pegar el contexto manualmente— y sin *analytics* para el docente
  (OpenAI, s.f.-a).

| Producto | Integra con Moodle | RAG sobre material del docente | Self-hosted | Open source | Analytics docente |
|---|---|---|---|---|---|
| Khanmigo | ❌ | ❌ | ❌ | ❌ | parcial |
| Coursera Coach | ❌ | sí, en Coursera | ❌ | ❌ | parcial |
| NotebookLM | ❌ | sí, manual | ❌ | ❌ | ❌ |
| MS Copilot Edu | ❌ | con plugins | ❌ | ❌ | parcial |
| ChatGPT Edu | ❌ | ❌ | ❌ | ❌ | ❌ |
| **NexusAI** | ✅ | sí, automático | ✅ | ✅ | ✅ |

Ningún competidor de este grupo combina integración nativa con Moodle, RAG automático
sobre el material del docente y despliegue autohospedado. Con la misma honestidad con
la que se reconocen las fortalezas propias, corresponde señalar dónde NexusAI no gana
frente a este grupo: Khanmigo acumula años de investigación pedagógica que NexusAI
recién empieza a construir, y el modelo de lenguaje de producción (GPT-4o-mini) rinde
por debajo de un GPT-4 completo en razonamiento puro —aunque para preguntas y
respuestas sobre un contexto ya recuperado por RAG esa diferencia pesa menos—; Khan
Academy y Coursera además ya cuentan con un ecosistema de cursos armado, mientras que
NexusAI depende del material que cada docente suba, lo cual es a la vez su limitación
y su fortaleza central: contexto real de la materia, no contenido enlatado.

### Plugins de Moodle con inteligencia artificial

El panorama relevante para este proyecto no son solo los asistentes académicos
generales, sino el ecosistema de plugins de Moodle que ya incorporan IA, por ser la
comparación directa con lo que NexusAI propone:

- **`block_openai_chat`** (Bryce Yoder): el plugin de IA más descargado del directorio
  de Moodle. Ofrece un chat con OpenAI en la barra lateral y un campo "Source of Truth"
  donde el docente pega texto manualmente como contexto —sin RAG real: si el docente
  quiere que el bot conozca 200 páginas de apuntes, tiene que pegarlas a mano.
- **`block_ai_chat` + `local_ai_manager`** (BYCS): arquitectura modular con subplugins
  para distintos proveedores (OpenAI, Azure, Anthropic) y soporte multi-tenant, pero
  sin RAG sobre el material del curso: es un chatbot genérico conectado a un LLM, no
  distinto en esencia de `block_openai_chat`.
- **`block_terusrag`:** uno de los pocos plugins de Moodle que implementa RAG real
  sobre el material del curso, pero con *issues* abiertos reportados sobre la calidad
  de las respuestas, por deficiencias en su *chunking* y recuperación.
- **`local_ai_course_assistant`** (Saylor): el más completo de los cuatro y la
  referencia arquitectónica más cercana a NexusAI —widget flotante con *streaming* SSE,
  soporte multi-proveedor, modo socrático y cumplimiento GDPR/SOC2—, pero pensado para
  instituciones globales, sin Study Planner, *analytics* docente ni generación de
  evaluaciones.

| Característica | `block_openai_chat` | `block_ai_chat` | `block_terusrag` | `local_ai_course_assistant` | NexusAI |
|---|---|---|---|---|---|
| RAG auténtico sobre PDFs del curso | ❌ | ❌ | con bugs | parcial | ✅ |
| RAG self-hosted (datos en la institución) | ❌ | ❌ | ❌ | parcial | ✅ |
| Chat con historial | ✅ | ✅ | ✅ | ✅ | ✅ |
| *Streaming* SSE | parcial | parcial | ❌ | ✅ | ✅ |
| Widget flotante en todas las páginas | ❌ | ❌ | ❌ | ✅ | ✅ |
| Indexación automática de material | ❌ | ❌ | ✅ | manual | ✅ |
| *Study Planner* / cuestionarios con IA | ❌ | ❌ | ❌ | ❌ | ✅ |
| *Analytics* docente | ❌ | ❌ | ❌ | ❌ | ✅ |
| Fallback honesto ante falta de información | ❌ | ❌ | ❌ | parcial | ✅ |
| Agnóstico de proveedor de LLM | ❌ | ✅ | ❌ | ✅ | ✅ |

Ninguno de los cuatro combina indexación automática del material del curso, RAG
self-hosted de calidad y herramientas de analítica para el docente en una misma
solución — ese es, en el ecosistema Moodle específicamente, el vacío que NexusAI
ocupa.

**Por qué no se adoptó el subsistema de IA nativo de Moodle 4.5+.** Moodle 4.5
introdujo un subsistema de IA con arquitectura *Placement → Manager → Provider*: los
*Placements* definen dónde aparece la IA en la interfaz, los *Providers* conectan con
APIs externas y el *Manager* media entre ambos, gestionando límites de uso, registro y
aceptación de políticas. Su limitación central para este proyecto es que solo expone
tres acciones —`generate_text`, `generate_image` y `summarise_text`— sin ninguna acción
nativa de conversación con historial persistente, que es el requisito central de
NexusAI (RF-01, RF-06). A eso se suma que el subsistema no existe antes de Moodle 4.5,
mientras que el proyecto necesitaba compatibilidad desde 4.1 al momento de diseñarse.
Por ambos motivos se optó por un plugin `local` autocontenido en lugar de construir
sobre el subsistema nativo, decisión coherente con la elección de tipo de plugin
descrita en la sección anterior.

El principal riesgo competitivo identificado es que Moodle HQ madure este subsistema
nativo y agregue una acción de chat con historial en una versión futura; la mitigación
considerada es que el diferencial de NexusAI no se limita al chat, sino que incluye
Study Planner, *analytics* docente y foros con IA —funcionalidades que exceden el
alcance de lo que el subsistema nativo expone incluso en un escenario de maduración.

\newpage

# Propuesta de solución

La propuesta de solución describe cómo se aborda el problema planteado, a partir de lo
analizado en el marco teórico. Esta es la sección más técnica del trabajo.

NexusAI es un plugin de Moodle con asistente de IA que combina tres capas: un plugin
de tipo `local` (Moodle HQ, 2024) dentro de Moodle, una interfaz de chat embebida y un backend que
orquesta el pipeline RAG. La pieza diferencial es el **RAG auténtico**: el material que
el docente sube a Moodle se indexa automáticamente y el asistente responde citando la
fuente; si la pregunta no puede responderse con el material disponible, el sistema lo
admite explícitamente en lugar de inventar.

## Alcance funcional

El sistema delimita claramente lo que entra y lo que queda fuera de su alcance
actual. El MVP (junio de 2026) fue el primer hito funcional; el desarrollo
continuó después de esa entrega, ampliando el alcance original.

**Funcionalidades del MVP (junio 2026):**

- Asistente conversacional RAG con respuesta en *streaming* y citas trazables al
  fragmento de origen.
- Buscador semántico (recuperación pura, sin LLM) sobre el material del curso.
- Chat multi-curso opcional, con citas que indican la materia de cada fragmento.
- Gestión de material por parte del docente: carga de PDF, indexación automática
  asíncrona, visualización de estado y borrado en cascada.
- Generador de cuestionarios de opción múltiple a partir del material, con feedback
  inmediato.
- Panel de detección de vacíos de contenido (*gaps*) para el docente.

**Funcionalidades incorporadas después del MVP:**

- Foros con detección automática de posts similares o duplicados mientras el
  alumno escribe, resumen de hilos largos y sugerencia de respuesta con RAG para
  el docente.
- Panel de analítica docente con preguntas frecuentes agrupadas por tema, a
  partir de un registro anonimizado de las interacciones del chat.
- Generador de exámenes a partir del material del curso, exportable al formato
  GIFT nativo de Moodle.
- Modo Estudio ampliado: más tipos de pregunta (verdadero/falso, abiertas,
  flashcards), historial de errores persistido en el backend, y un plan de
  estudio personalizado que combina errores de práctica, vacíos de contenido
  detectados en el chat y el próximo examen del calendario del curso.
- Filtros de búsqueda por tipo de material y por unidad/sección del curso.
- Vista de calendario con próximos exámenes y entregas.
- Soporte de material en PPTX, XLSX, CSV, Markdown y HTML además de PDF, con
  reconocimiento óptico de caracteres (OCR) de respaldo para documentos
  escaneados.
- Rediseño de la interfaz (agosto de 2026): el chat pasó de un *dropdown* flotante
  a un panel lateral acoplado, y el panel del docente se unificó en un lenguaje
  visual consistente de tipo *dashboard*, con paneles de material, vacíos de
  contenido, preguntas frecuentes, generación de exámenes y búsqueda integrados
  bajo la misma navegación.

**Fuera de alcance (excluido conscientemente):** soporte multi-institución
nativo, integración con mensajería externa, y contenido multimedia, entre otros
(ver detalle en *Anexos*).

Los requerimientos funcionales (RF-01 a RF-22) y no funcionales (RNF-01 a RNF-21) que
detallan el alcance del MVP se encuentran documentados en los Anexos.

## Diseño

### Arquitectura del software

La arquitectura adoptada es **cliente-servidor en tres capas** con un backend
organizado como **monolito modular**. El navegador del estudiante nunca se comunica
directamente con el backend: toda llamada pasa por el plugin de Moodle, que actúa como
proxy autenticado (patrón *Hybrid PHP Proxy*). Este diseño resuelve tres cuestiones de
manera simultánea: la clave de la API del LLM nunca llega al navegador, la protección
ante CSRF queda cubierta por el mecanismo nativo de Moodle, y se evitan los problemas
de CORS al existir una única comunicación servidor-a-servidor.

```mermaid
flowchart TB
    subgraph BROWSER["Navegador del alumno"]
        REACT["React 18<br/>(bundle AMD<br/>chatwidget-lazy.min.js)"]
    end

    subgraph MOODLE["Moodle 4.x — servidor universidad UCC"]
        PHP["Plugin local_nexusai<br/>(PHP)"]
        MFILES[("mdl_files<br/>(material curso)")]
        MTABLES[("local_nexusai_messages<br/>local_nexusai_usage<br/>local_nexusai_feedback")]
        MAUTH["require_login()<br/>has_capability()<br/>sesskey"]
    end

    subgraph BACKEND["Backend NexusAI"]
        FASTAPI["FastAPI — monolito modular<br/>app.chat / app.documents<br/>app.infrastructure / app.shared"]
        PG[("PostgreSQL + pgvector<br/>nexusai_documents<br/>nexusai_chunks<br/>(índice HNSW coseno)")]
        REDIS[(Redis<br/>cache + rate limit)]
    end

    subgraph EXTERNAL["Externo (configurable vía env vars)"]
        LLM["LLMProvider<br/>Gemini Flash (MVP)<br/>GPT-4o-mini (prod)"]
        EMB["EmbeddingProvider<br/>Gemini Embedding (MVP)<br/>text-embedding-3-small (prod)"]
    end

    REACT -->|"core/ajax + sesskey<br/>(mismo origen)"| PHP
    PHP <-->|HMAC SHA-256<br/>+ Bearer + timestamp + nonce| FASTAPI
    PHP <--> MFILES
    PHP <--> MTABLES
    PHP <--> MAUTH
    FASTAPI <-->|SQL + vector<br/>una sola query| PG
    FASTAPI <-->|cache| REDIS
    FASTAPI -->|"Bearer key<br/>(server-side only)"| LLM
    FASTAPI -->|"Bearer key<br/>(server-side only)"| EMB

    style REACT fill:#e3f2fd,color:#000,stroke:#1976d2
    style PHP fill:#fff3e0,color:#000,stroke:#f57c00
    style FASTAPI fill:#e8f5e9,color:#000,stroke:#388e3c
    style LLM fill:#f3e5f5,color:#000,stroke:#7b1fa2
    style EMB fill:#f3e5f5,color:#000,stroke:#7b1fa2
    style PG fill:#e1f5fe,color:#000,stroke:#0277bd
    style REDIS fill:#ffebee,color:#000,stroke:#c62828
```

> **Figura 1.** Diagrama de componentes de NexusAI (navegador, plugin Moodle, backend
> y servicios externos). *Fuente:* elaboración propia (`docs/diagrams/architecture.md`).
> *Texto alternativo:* esquema de
> tres capas que conecta el navegador con el plugin PHP, este con el backend FastAPI, y
> el backend con la base de datos vectorial y los proveedores de LLM y *embeddings*.

### Patrones de diseño

El sistema aplica el patrón *Hybrid PHP Proxy* para el aislamiento de credenciales y la
abstracción **multi-proveedor** de LLM y *embeddings*, que permite cambiar de proveedor
mediante variables de entorno, sin modificar el código de aplicación.

### Interfaz de usuario

La interfaz de chat se dispara desde un ícono en la barra de navegación de Moodle y
se despliega como un panel lateral acoplado al borde derecho de la pantalla, de
ancho fijo y alto completo, en lugar del *dropdown* flotante de las primeras
versiones. Presenta la respuesta en *streaming*, citas clickeables que expanden el
fragmento utilizado con su porcentaje de similitud, e historial de conversaciones
por sesión, todo dentro del mismo panel. En dispositivos móviles el panel se
comporta como una hoja a pantalla completa (*bottom-sheet*).

![Figura 2a](img/chat-widget.png){width=48%} ![Figura 2b](img/search-widget.png){width=48%}

> **Figura 2a/2b.** Widget de chat (izquierda) respondiendo con cita a la fuente, y
> buscador semántico (derecha) mostrando resultados resaltados. *Fuente:* elaboración
> propia, capturas del MVP desplegado localmente. *Texto alternativo:* a la izquierda,
> una conversación donde el asistente responde qué es el *clustering* citando el PDF
> de origen; a la derecha, el buscador semántico devolviendo un resultado con el
> término de búsqueda resaltado.

![Figura 2c](img/docente-panel.png){width=48%} ![Figura 2d](img/docente-gaps.png){width=48%}

> **Figura 2c/2d.** Panel del docente: gestión de material indexado (izquierda) y
> reporte de vacíos de contenido (derecha). *Fuente:* elaboración propia, capturas del
> MVP desplegado localmente. *Texto alternativo:* a la izquierda, la tabla de
> materiales subidos con su estado de indexación; a la derecha, una pregunta de un
> alumno que el material no pudo responder bien, con su similitud promedio.

## Implementación

La solución se construyó de manera incremental, dividida en módulos lógicos:

- **Módulo de asistente conversacional (chat):** orquesta el pipeline RAG y el
  *streaming* de respuestas.
- **Módulo de gestión de documentos:** extracción de texto, fragmentación, generación
  de *embeddings* e indexación asíncrona.
- **Módulo de búsqueda semántica:** recuperación de fragmentos por similitud.
- **Módulo de cuestionarios (*quiz*):** generación de preguntas de opción múltiple.
- **Módulo de detección de vacíos (*gaps*):** registro de consultas no resueltas y
  reporte agregado para el docente.
- **Módulo de seguridad:** autenticación HMAC SHA-256 en tres capas (clave de API,
  firma y *nonce* anti-replay).

El pipeline de indexación procesa los documentos de forma asíncrona: extrae el texto,
lo divide en fragmentos de aproximadamente 512 tokens con solapamiento, genera los
*embeddings* y los almacena en una base de datos PostgreSQL con la extensión
**pgvector** (pgvector, s.f.), actualizando el estado del
documento (`pending → indexing → indexed | error`).

```mermaid
sequenceDiagram
    autonumber
    actor A as Alumno
    participant R as React (browser)
    participant P as Plugin PHP (Moodle)
    participant F as FastAPI (backend)
    participant PG as PostgreSQL/pgvector
    participant Re as Redis
    participant E as EmbeddingProvider
    participant L as LLMProvider

    A->>R: Escribe pregunta y envía
    R->>R: validate input
    R->>P: core/ajax → local_nexusai_send_message<br/>{courseid, message, sesskey}

    P->>P: require_login()
    P->>P: has_capability('local/nexusai:use')
    P->>Re: GET rate_limit:user:date
    Re-->>P: count actual
    alt count > 50
        P-->>R: error "rate limit"
        R-->>A: muestra mensaje
    else count <= 50
        P->>P: increment usage in mdl
        P->>P: build payload + HMAC SHA-256

        P->>F: POST /api/chat<br/>headers: HMAC + Bearer + timestamp + nonce<br/>body: {question, course_id, user_id}

        F->>F: HMACSecurityMiddleware<br/>verify HMAC + timestamp window + nonce
        F->>F: verify Bearer

        F->>E: embed(question)
        E-->>F: vector (768 o 1536 dim)

        F->>PG: SELECT ... ORDER BY embedding ⟨=⟩ $1<br/>WHERE course_id = $2 AND status = 'indexed'<br/>LIMIT 5
        PG-->>F: chunks + metadata + distances

        alt min distance > 0.7
            F-->>P: respuesta fallback honesto
            P-->>R: respuesta
            R-->>A: muestra mensaje
        else min distance <= 0.7
            F->>F: build prompt<br/>(system + historial + contexto + pregunta)
            F->>L: chat.completions.create<br/>(stream=True)
            loop por cada token
                L-->>F: token chunk
                F-->>P: SSE data: {token}
                P-->>R: SSE proxy
                R-->>A: token aparece en UI
            end
            F->>F: persistir mensaje + tokens en mdl
        end
    end
```

> **Figura 3.** Diagrama de secuencia de una consulta del estudiante. *Fuente:*
> elaboración propia (`docs/diagrams/sequence-chat.md`). *Texto alternativo:*
> secuencia desde que el alumno escribe una pregunta hasta que recibe la respuesta
> en streaming, pasando por autenticación, rate limiting, embedding de la pregunta,
> búsqueda vectorial y generación con el LLM.

```mermaid
flowchart TB
    A[PDFs/DOCX/TXT<br/>en mdl_files] -->|cron o trigger docente| B[Plugin PHP<br/>extrae binario]
    B -->|HMAC + multipart| C[FastAPI<br/>POST /api/documents/index]
    C --> D[pdfplumber<br/>extract_text por página]
    D --> E[Limpieza<br/>headers, footers, wraps,<br/>espacios múltiples]
    E --> F[Chunking<br/>500 tokens / 10% overlap<br/>respetando párrafos]
    F --> G[+ metadata:<br/>document_id, page, chunk_index]
    G --> H[EmbeddingProvider.embed_batch<br/>Gemini MVP / OpenAI prod]
    H --> I[("PostgreSQL/pgvector<br/>INSERT INTO nexusai_chunks<br/>vector(768) MVP / vector(1536) prod")]
    I --> J[Update<br/>nexusai_documents<br/>status=indexed]

    style C fill:#e8f5e9,color:#000
    style I fill:#e1f5fe,color:#000
    style J fill:#e1f5fe,color:#000
    style H fill:#f3e5f5,color:#000
```

> **Figura 4.** Pipeline de indexación de material (offline). *Fuente:* elaboración
> propia (`docs/diagrams/rag-flow.md`). *Texto alternativo:* flujo desde que el
> docente sube un documento hasta que queda indexado como chunks vectoriales,
> pasando por extracción de texto, limpieza, fragmentación y generación de
> *embeddings*.

## Pruebas

La estrategia de pruebas combina:

- **Pruebas unitarias y de integración** automatizadas en el backend (extracción,
  fragmentación, recuperación, autenticación HMAC), con una cobertura cercana al 80%.
- **Pruebas funcionales** manuales sobre el plugin y la interfaz de chat.
- **Pruebas de aceptación** vinculadas a los criterios definidos en los requerimientos.
- **Evaluación de calidad de respuesta** mediante un conjunto de referencia
  (*golden set*) de preguntas y respuestas esperadas.

> **PENDIENTE —** consolidar los resultados de las pruebas con usuarios reales y los
> valores medidos frente a los objetivos de latencia (RNF-06 a RNF-09).

\newpage

# Publicación en Moodle Marketplace

Más allá de las pruebas internas descritas en la sección anterior, el
proyecto fue sometido a una validación externa concreta: la revisión de
código y funcionalidad que exige el Moodle Plugins Directory
(*Moodle Marketplace*) para publicar un plugin de terceros. Esta sección
documenta ese proceso, los hallazgos de la revisión y cómo se resolvieron,
por tratarse de la evaluación independiente más rigurosa que atravesó el
plugin hasta el momento de este informe.

## Por qué separar el repositorio

El formulario de registro de un plugin en moodle.org no admite indicar una
subcarpeta: recibe una URL de repositorio y asume que su raíz es la raíz
del plugin (Moodle HQ, s.f.). El código de NexusAI, sin embargo, vive
dentro de un monorepo (`nexusAI`) junto al backend, la documentación y el
material de investigación del proyecto, cuatro niveles por debajo de la
raíz real del repositorio git. Un validador automático que clona el repo y
busca `version.php` en el nivel superior no lo encuentra, y el envío se
rechaza antes de llegar a un revisor humano.

De las alternativas evaluadas para resolverlo —pasar la URL del monorepo
tal cual, usar un *submodule* de git o copiar la carpeta a mano a un
repositorio nuevo— ninguna resultó viable sin perder el historial de
commits del plugin o sin dejar de resolver el problema de fondo. La
solución adoptada fue `git subtree split`: extrae únicamente los commits
que modificaron la carpeta del plugin, con su historial intacto, hacia un
repositorio nuevo y vacío (`nexusai-ucc/moodle-local_nexusai`), cuyo nombre
sigue además la convención `moodle-{tipo}_{nombre}` que exige Moodle. Desde
entonces, el monorepo sigue siendo el lugar donde se desarrolla, y un
workflow de GitHub Actions (`sync-derived-repos.yml`) repite el *subtree
split* de forma automática en cada *push* a `development`, manteniendo al
repositorio público sincronizado sin intervención manual.

## Proceso de envío y primera revisión

El plugin se envió al Moodle Plugins Directory el 20 de septiembre de 2026
en su versión `0.18.1` (*beta*), tras validar un checklist de requisitos de
envío: metadatos completos en `version.php`, cabecera de licencia GPL v3+,
cadenas de idioma en inglés y español, instalación desde ZIP sin pasos de
compilación adicionales, CI real corriendo sobre Moodle 4.5 a 5.2 con
PostgreSQL y MySQL, `LICENSE` dual (MIT en el repositorio raíz, GPL v3 en
el plugin), ícono de 256×256 px y capturas de pantalla en inglés.

El flujo de revisión de Moodle es público (`moodle.org/plugins/queue.php`)
y sigue un circuito estándar: *Upload initial version → Waiting for
approval → Needs more work → Upload fixed version → …* hasta la
aprobación. Recibir *"Needs more work"* en la primera ronda es la norma, no
una señal de rechazo. NexusAI no fue la excepción: el ticket de revisión
(identificado internamente como **MMR-301**, a cargo del revisor
Volodymyr Dovhan, de Moodle HQ) devolvió el plugin con **"Changes
needed"**, señalando 16 puntos a corregir sobre el código de la versión
enviada.

## Correcciones de la primera ronda

El equipo corrigió los 16 puntos del ticket en dos rondas de *pull
requests*, agrupables en estas categorías:

- **Privacidad en foros con IA:** las funciones de resumen de hilo,
  sugerencia de respuesta y detección de posts similares verificaban el
  acceso a la discusión pero no a cada post individual, por lo que una
  respuesta privada podía llegar a un modelo de lenguaje o a estudiantes a
  los que no estaba dirigida, y una respuesta de un foro de preguntas y
  respuestas podía verse antes de que el estudiante publicara la propia.
  Se corrigió reutilizando la verificación de visibilidad nativa de
  `mod_forum` en cada post.
- **Endurecimiento de la conexión con el backend:** el *stream* del chat
  llamaba a `curl_init()` directamente; se reemplazó por la clase `\curl`
  de Moodle, que valida el certificado TLS del backend y no sigue
  redirecciones.
- **Falsos positivos de seguridad:** la página de estado de administración
  marcaba como "bloqueada" cualquier URL en `localhost`, en una red privada
  o en el puerto 8000, aun cuando el plugin funcionaba correctamente contra
  un backend de desarrollo legítimo; se ajustó para que solo valide que el
  endpoint responda `http(s)` y muestre los campos de salud del backend.
- **Calendario:** el feed `.ics` no excluía a usuarios suspendidos o
  eliminados ni verificaba que el usuario conservara el permiso
  `local/nexusai:use` en el curso.
- **Internacionalización y cabeceras de licencia:** textos fijos del
  widget de chat y de los paneles de foro que no pasaban por el paquete de
  idioma, y archivos PHP sin la cabecera estándar GPL que exige Moodle en
  todo el código fuente, incluidos los módulos AMD y las fuentes React que
  viajan en el ZIP.
- **Matriz de integración continua:** la versión enviada corría CI solo
  sobre un subconjunto de versiones soportadas; se amplió para cubrir
  Moodle 4.5 a 5.3 contra PostgreSQL y MySQL.

Estas correcciones, junto con la purga de posts de foro indexados en el
backend tras borrar los datos de un usuario —otro de los 16 puntos—, se
integraron en la versión `0.19.0`.

## Auditoría propia y cierre de los últimos gaps

Antes de responder al ticket, el equipo hizo una auditoría interna cruzando
cada punto marcado como resuelto contra el código real de `development`, y
encontró una discrepancia: borrar un **curso completo** seguía sin purgar
los posts de foro que el backend tenía indexados de ese curso.
`data_cleanup::delete_course()` —la función que corre cuando Moodle borra
un curso de verdad— solo encolaba la purga de documentos; la purga de
posts de foro solo era alcanzable desde los tres métodos de la API de
Privacidad de Moodle, que **no se ejecuta** en un borrado de curso real
(a diferencia de un pedido de eliminación de datos de un usuario). El
método que faltaba conectar (`provider::delete_backend_forum_posts()`) ya
existía y ya soportaba el caso de "todos los usuarios del curso"; solo
hacía falta exponerlo como público y llamarlo desde el lugar correcto.

Una revisión posterior, más allá de los 16 puntos originales, encontró un
segundo caso del mismo tipo de bug: borrar un **foro puntual**, dejando el
resto del curso intacto, tampoco purgaba nada —siempre, no solo en el caso
excepcional que el equipo tenía anotado. La causa resultó ser distinta a
la del curso: el observador del evento `course_module_deleted` de Moodle
filtra a propósito cualquier actividad que no sea de tipo "Archivo", y
aunque se hubiera manejado ahí, no habría funcionado: `forum_delete_instance()`
—la función que borra las discusiones y los posts de un foro— se ejecuta
**antes** de que Moodle dispare ese evento. Para cuando un observador
llega a correr, los posts ya no existen en las tablas del foro y no hay
nada que consultar. La solución usa en cambio
`pre_course_module_delete($cm)`, un *callback* que Moodle descubre por
convención de nombre de archivo y ejecuta **antes** de borrar el módulo,
pensado exactamente para este tipo de caso —el mismo patrón que usan
`tool_recyclebin` y otros complementos del núcleo de Moodle.

Ambos hallazgos se corrigieron, con pruebas automatizadas nuevas que
reproducen cada caso, y la corrección quedó incluida en la versión
`0.19.0` enviada de vuelta al revisor.

## Sincronización automática y una lección operativa

Como el repositorio que revisa Moodle es un derivado del monorepo, cada
corrección depende de que el workflow de sincronización
(`sync-derived-repos.yml`) efectivamente la traslade. Al mergear las
correcciones del último hallazgo, el workflow falló silenciosamente en las
dos corridas siguientes: el token de GitHub (`SYNC_REPOS_TOKEN`) con el que
el workflow empuja los cambios al repositorio público había vencido, así
que el repositorio que vería el revisor seguía mostrando una versión vieja
del plugin a pesar de que el monorepo ya tenía el fix. El incidente se
detectó revisando el estado real de las corridas de CI —no asumiéndolo por
el estado de los *pull requests* en el monorepo—, se resolvió generando un
nuevo token de acceso de alcance limitado (permisos de escritura
únicamente sobre los dos repositorios derivados) y quedó documentado como
recordatorio de verificar la fecha de vencimiento del token la próxima vez
que se renueve.

## Estado actual

Al cierre de este informe, el plugin está en versión `0.19.0`
(`MATURITY_BETA`), con las correcciones de los 16 puntos de MMR-301 y de
los dos hallazgos adicionales ya sincronizadas al repositorio público
(`nexusai-ucc/moodle-local_nexusai`), a la espera de la próxima devolución
del revisor de Moodle HQ.

\newpage

# Gestión del proyecto y metodología ágil

Esta sección documenta cómo se gestionó el proyecto puertas adentro: la
metodología adoptada, el cierre formal de dos de sus instancias —Fase 1 y
Sprint 2— con sus métricas de valor ganado, y un ejemplo concreto de cómo
la planificación se ajustó frente a la evidencia durante el desarrollo.

## Metodología adoptada

El equipo trabajó con **Scrum**, en sprints de aproximadamente dos
semanas, con roles diferenciados: Santiago Tricherri como *Project
Manager* y responsable del backend de IA, Delfina Salinas como *Scrum
Master* y responsable del frontend, y Marcos Bugliotti a cargo de la base
de datos y la integración con Moodle. Cada fase y cada sprint cierran con
un **acta formal**, firmada por los tres integrantes, que documenta
entregables planificados contra entregados, desviaciones justificadas,
métricas y una retrospectiva — el mismo formato que exige la cátedra de
Administración de Proyectos de Software, de la que estas actas son
entregable directo.

El seguimiento de avance usa **EVM** (*Earned Value Management*): valor
planificado (PV), valor ganado (EV) y costo real (AC) por fase, de los
que se derivan las variaciones de cronograma y costo (SV, CV) y los
índices de desempeño SPI (`EV/PV`) y CPI (`EV/AC`) — una práctica de
gestión de proyectos formal, no solo una tabla de velocity informal.

## Cierre de Fase 1 — Setup e Investigación

La Fase 1 (9 al 22 de abril de 2026) cerró con sus entregables técnicos
100% completados y en plazo, con un **sobre-cumplimiento deliberado** en
investigación y formalización: 47 documentos en `investigacion/` contra
los ~20 esperados originalmente, y 6 ADRs aceptados contra los 4
planificados (se sumaron HMAC PHP↔Python y la estrategia de Privacidad,
ambos necesarios antes de lo previsto por decisiones técnicas tempranas).

Las métricas de valor ganado al cierre de la fase fueron **SPI = 1,00**
(en línea con el cronograma) y **CPI = 0,77** (23% de sobrecosto en
esfuerzo). El equipo interpretó ese sobrecosto como una decisión
consciente, no como un desvío no controlado: invertir más horas en
documentación y ADRs amortizó tiempo de desarrollo en los sprints
siguientes, hipótesis que las mediciones acumuladas del proyecto al 4 de
mayo (SPI = 1,10, CPI = 0,85) respaldaron.

De las lecciones aprendidas documentadas en el acta de cierre, dos
resultan especialmente relevantes para entender decisiones posteriores:
el equipo subestimó el tiempo de coordinación con actores externos a la
universidad (la reunión con el técnico de Moodle de la UCC quedó
pendiente al cierre de la fase y nunca se concretó, lo que terminó
reforzando la estrategia de demo autohospedada descrita en *Relevamiento y
metodología de investigación*), y reconoció que hubiera convenido empezar
la primera prueba funcional antes de cerrar toda la documentación, ya que
varios problemas de integración (migración del Hook API de Moodle,
*chunks* de Webpack rotos, *symlinks* no funcionando en Docker) solo
aparecieron al implementar.

El registro de riesgos abierto al cierre de la fase incluía, entre otros:
el riesgo de que la aprobación institucional de la UCC demorara más de
4-6 semanas (mitigación: Plan B de demo local, que terminó siendo la
estrategia efectiva), el riesgo de que la calidad del RAG con material
real quedara por debajo de lo esperado (mitigación: dataset de evaluación
propio con preguntas reales del Proyecto Integrador) y el riesgo de
restricciones de privacidad del proveedor de embeddings sobre datos de
alumnos (mitigación: términos a confirmar antes del piloto, con un
proveedor local como plan de contingencia).

## Cierre de Sprint 2 — RAG completo

El Sprint 2 (7 al 20 de mayo de 2026) cerró en plazo con el núcleo
funcional del MVP: el sistema ya respondía preguntas usando el material
real del curso, citando la fuente, con una vista docente para gestionar
ese material. Tres desviaciones de alcance quedaron documentadas con su
justificación técnica: el modelo de *embeddings* planificado
(`text-embedding-004`) dejó de responder por la vía compatible con OpenAI
que expone Google y se reemplazó por `gemini-embedding-001`; el formato de
subida de archivos pasó de *multipart* con HMAC (frágil de firmar
correctamente en PHP) a JSON con el archivo en base64; y el *streaming*
de respuestas, considerado para este sprint, se postergó al Sprint 3 al
estimarse en 3 días adicionales de trabajo frente a una latencia sin
*streaming* ya aceptable (3 a 6 segundos) para el MVP.

Las métricas de cierre: 25 *issues* completados, una velocidad acumulada
de ~12,5 *issues* por sprint, SPI = 1,10 (10% adelantado), CPI = 0,85
(15% de sobrecosto, ya esperado al tratarse de los primeros sprints),
cerca de 5.860 líneas de código entre backend, plugin y frontend, y una
suite de tests que creció de 18 a aproximadamente 35 casos. La
retrospectiva registró como punto fuerte que el *polling* de estado de
indexación en la vista docente resultó una solución de UX simple y
efectiva, y como punto débil la documentación opaca de la API de
*embeddings* de Google, cuyo modelo aceptado cambió sin aviso previo.

## Un pivote real de infraestructura

La planificación original del Sprint 3 contemplaba desplegar el backend
en Fly.io, con un procedimiento documentado paso a paso. Ese despliegue
se ejecutó, pero fue reemplazado más adelante por el esquema actual:
backend autohospedado en Oracle Cloud (decisión formalizada en el
ADR-011). El documento de planificación original de Fly.io se conserva en
el repositorio sin modificar, marcado explícitamente como histórico — un
registro honesto de que la infraestructura efectivamente usada no fue la
primera que se planificó, y de por qué cambió.

## Cierre

El Anexo C de este informe conserva la tabla de *velocity* consolidada
del proyecto completo (SP comprometidos y completados por sprint) como
referencia numérica rápida; este capítulo documenta, en cambio, el relato
de gestión detrás de dos de esas instancias de cierre formal —con sus
métricas de valor ganado, sus desviaciones justificadas y sus lecciones
aprendidas— tal como quedaron asentadas en las actas firmadas por el
equipo.

\newpage

# Beneficios post-implementación

Tras la implementación del proyecto se esperan los siguientes beneficios, tanto
tangibles como intangibles:

- **Acceso a asistencia académica disponible de forma permanente (24/7)** sobre el
  material real del curso, sin necesidad de incorporar personal de tutoría adicional.
- **Reducción de la dispersión de la información**, al concentrar las consultas dentro
  del campus virtual donde reside el material validado.
- **Mejora en la toma de decisiones del docente**, mediante el reporte de vacíos de
  contenido que evidencia qué temas no quedan cubiertos por el material.
- **Mitigación del riesgo de respuestas incorrectas**, gracias a la trazabilidad de
  cada respuesta hacia su fragmento de origen.
- **Preservación de la soberanía de los datos académicos**, al mantenerlos en la
  infraestructura controlada por la institución.

\newpage

# Impacto económico (estudio de costos)

El análisis de costos contempla cuatro categorías: infraestructura, servicios de IA,
personal y costos académicos. Se distingue el escenario actual del MVP del escenario de
una eventual producción.

## Costos de infraestructura y servicios de IA

En el escenario actual del MVP, el uso de niveles gratuitos de hosting y del modelo de
IA permite un costo operativo prácticamente nulo. En un escenario de producción
estimado para 500 estudiantes activos, el costo se mantiene reducido.

| Concepto | Escenario MVP (actual) | Escenario producción (anual, 500 alumnos) |
|---|---|---|
| Infraestructura (hosting, base de datos, *cache*, dominio) | ~$36 / año | ~$170 |
| Servicios de IA (LLM + *embeddings*) | $0 (nivel gratuito) | ~$1.200 |
| Mantenimiento (10 h/mes) | — | ~$1.440 |
| **Total** | **~$36 / año** | **~$2.810** |

El costo de producción equivale a aproximadamente **$5,62 por estudiante por año**, un
orden de magnitud por debajo de soluciones comerciales comparables.

## Costos de personal (valoración teórica)

El equipo está compuesto por dos estudiantes de Ingeniería en Sistemas. Valorado a
tarifa de mercado junior (~$12 por hora), el desarrollo del MVP representó
aproximadamente **840 horas-persona**, equivalentes a una valoración teórica de
**~$10.080**. Este monto **no constituye un costo real** para la institución —el trabajo
es académico— pero permite dimensionar el valor del proyecto.

## Análisis costo-beneficio

El beneficio principal es la disponibilidad de asistencia académica permanente sin
contratar personal de tutoría adicional. Si la institución ahorrara una hora de tutoría
por estudiante por año, el retorno superaría ampliamente el costo del sistema. A ello se
suma la condición autohospedada de la solución, que evita riesgos regulatorios de
privacidad asociados a los servicios de IA de terceros.

\newpage

# Impacto social

El impacto social del proyecto se relaciona con la mejora del acceso al conocimiento y
la equidad educativa, más allá de los aspectos técnicos o económicos.

- **Beneficio general:** el sistema democratiza el acceso a un acompañamiento académico
  permanente, históricamente limitado a quienes disponen de tiempo, recursos o redes de
  apoyo para resolver dudas fuera del aula.
- **Segmentos beneficiados:** estudiantes que cursan a distancia, que trabajan, o que
  por distintos motivos no pueden asistir a consultas presenciales, encuentran un canal
  de apoyo disponible en todo momento.
- **Inclusión y reducción de brechas:** al responder sobre el material validado por el
  docente y citar la fuente, el sistema ofrece una alternativa más confiable y equitativa
  que el uso desigual de herramientas de IA generales.
- **Apoyo al rol docente:** la solución amplifica la tarea del docente en lugar de
  reemplazarla, y le brinda información para mejorar su material en beneficio del conjunto
  del estudiantado.

El relevamiento propio del equipo (166 estudiantes, 17 docentes UCC; ver
`investigacion/09-relevamiento/`) refuerza estos puntos con datos concretos: el 100%
de los estudiantes que respondieron ya recurre a herramientas de IA generalistas para
estudiar, evidenciando una necesidad de acompañamiento académico ya instalada que hoy
queda fuera del ámbito institucional y sin trazabilidad hacia el material real de la
materia. Del lado docente, el 88,2% delegaría tareas a una IA integrada al campus
—la mayoría con la condición de revisar el resultado antes de publicarlo—, lo que
indica una disposición amplia a que la tecnología amplifique su rol sin
reemplazarlo, consistente con el diseño "asistir, no sustituir" adoptado por NexusAI.

\newpage

# Impacto medioambiental (opcional)

Si bien se trata de una solución de software, se consideran sus efectos sobre el consumo
de recursos de cómputo:

- **Uso eficiente de la energía:** la arquitectura de un único servicio (monolito
  modular) y el uso de una sola base de datos reducen la huella de cómputo frente a
  arquitecturas distribuidas más complejas.
- **Aprovechamiento de niveles gratuitos y recursos compartidos:** el despliegue del MVP
  utiliza infraestructura compartida, evitando el aprovisionamiento de hardware dedicado.
- **Sostenibilidad a largo plazo:** la abstracción multi-proveedor permite migrar a
  modelos de IA más eficientes a medida que estén disponibles, sin rediseñar el sistema.

\newpage

# Conclusión

El proyecto cumplió con los objetivos planteados al inicio. Se desarrolló un plugin de
Moodle funcional con un asistente de IA que aplica RAG auténtico sobre el material del
curso, con citas trazables, despliegue autohospedado y respuesta en *streaming*. El MVP
entregado en junio de 2026 alcanzó siete funcionalidades en producción con una
cobertura de pruebas automatizadas en el backend cercana al 80%, superando el objetivo
planteado, y el desarrollo continuó después de esa entrega incorporando foros con
asistencia de IA, analítica docente, generación de exámenes, un plan de estudio
personalizado y soporte de más formatos de material.

Desde el punto de vista académico, el trabajo aporta respuestas concretas a tres
cuestiones vigentes en la aplicación de IA a la educación: la mitigación de la
alucinación mediante RAG con citas trazables; el cierre del circuito de
retroalimentación entre estudiante y docente mediante la detección automática de vacíos
de contenido; y la preservación de la privacidad y la soberanía de los datos académicos
mediante una arquitectura autohospedada.

Entre las **limitaciones** actuales se reconocen la ausencia de un esquema
multi-institución nativo, la dependencia de la calidad del modelo de lenguaje en el
generador de cuestionarios, y la cobertura manual de pruebas en el frontend y el
plugin.

Como **trabajo futuro** se plantean la publicación del plugin en el directorio oficial de
Moodle, la incorporación de pruebas automatizadas de frontend, y el agrupamiento
semántico (por embeddings, no solo por texto normalizado) de los vacíos de contenido
detectados.

En síntesis, el proyecto demuestra que es posible integrar asistencia académica
contextualizada y auditable dentro del LMS institucional, amplificando el rol del docente
en lugar de sustituirlo.

> *(Espacio reservado para reflexiones personales del equipo, a incorporar si la
> cátedra lo solicita.)*

\newpage

# Bibliografía / Referencias

Las referencias siguen la norma APA v7. Toda fuente citada en el texto figura en esta
sección, y toda referencia listada fue utilizada en el informe.

- ChromaDB. (s.f.). *Chroma documentation*. Recuperado 2026, de
  https://docs.trychroma.com/
- Coursera. (2023). *Coursera launches Coach, a personalized AI-powered coaching
  experience, and new applications of GenAI in the enterprise*. Coursera Blog.
  https://blog.coursera.org/coursera-launches-coach/
- Gao, Y., Xiong, Y., Gao, X., Jia, K., Pan, J., Bi, Y., Dai, Y., Sun, J., Wang, H., &
  Wang, H. (2023). *Retrieval-augmented generation for large language models: A survey.*
  arXiv. https://arxiv.org/abs/2312.10997
- Google. (s.f.-a). *Gemini API — OpenAI compatibility*. Recuperado 2026, de
  https://ai.google.dev/gemini-api/docs/openai
- Google. (s.f.-b). *NotebookLM*. Recuperado 2026, de https://notebooklm.google/
- Ji, Z., Lee, N., Frieske, R., Yu, T., Su, D., Xu, Y., Ishii, E., Bang, Y. J., Madotto,
  A., & Fung, P. (2023). Survey of hallucination in natural language generation. *ACM
  Computing Surveys, 55*(12), 1–38. https://doi.org/10.1145/3571730
- Khan Academy. (s.f.). *Khan Labs — Khanmigo*. Recuperado 2026, de
  https://www.khanacademy.org/khan-labs
- Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H.,
  Lewis, M., Yih, W., Rocktäschel, T., Riedel, S., & Kiela, D. (2020). Retrieval-augmented
  generation for knowledge-intensive NLP tasks. *Advances in Neural Information Processing
  Systems, 33*, 9459–9474.
- Microsoft. (s.f.). *Microsoft Copilot for Education*. Recuperado 2026, de
  https://www.microsoft.com/en-us/education/products/copilot
- Moodle HQ. (2024). *Moodle Developer Documentation — Plugin types: local*.
  https://moodledev.io/docs/apis/plugintypes/local
- Moodle HQ. (s.f.). *Plugin contribution checklist*. Recuperado 2026, de
  https://moodledev.io/general/community/plugincontribution/checklist
- OpenAI. (s.f.-a). *ChatGPT Edu*. Recuperado 2026, de https://openai.com/chatgpt/education/
- OpenAI. (s.f.-b). *GPT-4o pricing*. Recuperado 2026, de https://openai.com/api/pricing/
- pdfplumber. (s.f.). *pdfplumber* [Software]. GitHub.
  https://github.com/jsvine/pdfplumber
- pgvector. (s.f.). *pgvector: Open-source vector similarity search for Postgres*
  [Software]. GitHub. https://github.com/pgvector/pgvector

\newpage

# Anexos

Los anexos reúnen material complementario que respalda el informe sin interrumpir su
lectura principal.

## Anexo A — Requerimientos detallados

Cada requerimiento tiene un ID único (RF-NN funcionales, RNF-NN no funcionales), una
prioridad en el contexto del MVP y el sprint donde se implementó.

### Requerimientos funcionales

**Asistente conversacional RAG**

| ID | Requerimiento | Prioridad | Sprint |
|---|---|---|---|
| RF-01 | Consulta en lenguaje natural sobre el material del curso desde un widget flotante. | Alta | 1 |
| RF-02 | El asistente responde usando exclusivamente el material indexado, citando los archivos fuente. | Alta | 2 |
| RF-03 | Si la pregunta no se puede responder con el material disponible, el sistema lo admite explícitamente. | Alta | 2 |
| RF-04 | El alumno ve el fragmento exacto usado para responder, con su porcentaje de similitud. | Alta | 4 |
| RF-05 | La respuesta aparece token por token (*streaming*) para reducir la latencia percibida. | Media | 4 |
| RF-06 | El alumno puede retomar conversaciones anteriores desde un historial. | Media | 4 |
| RF-07 | Modo multi-curso opcional: el asistente consulta material de todos los cursos inscriptos. | Media | 4 |

**Buscador semántico**

| ID | Requerimiento | Prioridad | Sprint |
|---|---|---|---|
| RF-08 | Búsqueda de fragmentos por similitud semántica, sin pasar por el LLM. | Media | 4 |
| RF-09 | Cada resultado muestra archivo, fragmento y porcentaje de similitud. | Media | 4 |

**Generador de cuestionarios**

| ID | Requerimiento | Prioridad | Sprint |
|---|---|---|---|
| RF-10 | Generación de un *quiz* de opción múltiple desde el material del curso. | Media | 4 |
| RF-11 | El alumno elige un tema específico o deja el campo vacío para variedad de temas. | Media | 4 |
| RF-12 | Si el tema pedido no está en el material, el sistema avisa (no genera un *quiz* engañoso). | Media | 4 |
| RF-13 | Cada pregunta tiene 4 opciones: una correcta y tres distractores plausibles. | Media | 4 |
| RF-14 | Feedback inmediato tras cada respuesta, con explicación y archivo fuente. | Media | 4 |

**Gestión de material (rol docente)**

| ID | Requerimiento | Prioridad | Sprint |
|---|---|---|---|
| RF-15 | El docente sube archivos PDF al curso para que el asistente los indexe. | Alta | 2 |
| RF-16 | Extracción de texto, *chunking* y *embeddings* de cada archivo de forma asíncrona. | Alta | 2 |
| RF-17 | El docente ve el estado de cada documento (`pending` / `indexing` / `indexed` / `error`). | Alta | 2 |
| RF-18 | El docente puede borrar un documento; el borrado se propaga en cascada a sus *chunks*. | Alta | 2 |
| RF-19 | Detección de *uploads* duplicados por hash SHA-256, evita reindexar el mismo archivo. | Media | 4 |

**Feedback al docente (detección de vacíos)**

| ID | Requerimiento | Prioridad | Sprint |
|---|---|---|---|
| RF-20 | Registro automático de las preguntas que el material no pudo responder. | Media | 4 |
| RF-21 | Reporte agregado de vacíos por curso, ordenado por frecuencia. | Media | 4 |
| RF-22 | El reporte de vacíos se filtra por ventana temporal (7/30/90/365 días). | Baja | 4 |

### Requerimientos no funcionales

| ID | Requerimiento | Categoría |
|---|---|---|
| RNF-01 | La API key del LLM nunca llega al navegador del alumno. | Seguridad |
| RNF-02 | Toda comunicación entre el plugin y el backend se firma con HMAC SHA-256 en 3 capas (Bearer + firma + *nonce*). | Seguridad |
| RNF-03 | El backend rechaza firmas inválidas, timestamps vencidos (>5 min) o *nonces* reusados. | Seguridad |
| RNF-04 | El plugin valida la *capability* `local/nexusai:use` antes de llamar al backend. | Seguridad |
| RNF-05 | El backend valida que un usuario no pueda leer sesiones de chat ajenas. | Seguridad |
| RNF-06 | Latencia al primer token de respuesta (streaming) < 2 s. | Performance |
| RNF-07 | Latencia de respuesta completa del chat (sin streaming) < 8 s. | Performance |
| RNF-08 | Latencia del buscador semántico (retrieval puro) < 1 s. | Performance |
| RNF-09 | Tiempo de indexación de un PDF de 50 páginas < 60 s. | Performance |
| RNF-10 | Instalable en Moodle 4.1 LTS a 4.5 sin `composer install` ni dependencias externas. | Compatibilidad |
| RNF-11 | El widget funciona en Chrome, Firefox, Safari y Edge en versiones actuales. | Compatibilidad |
| RNF-12 | El backend corre sobre Python 3.11+, PostgreSQL 16+ y pgvector 0.3.5+. | Compatibilidad |
| RNF-13 | Los datos académicos viven en una base de datos controlada por la institución. | Privacidad |
| RNF-14 | El plugin declara su Privacy API según la versión de Moodle (`null_provider` en MVP). | Privacidad |
| RNF-15 | El proveedor del LLM se cambia sin modificar código (variable de entorno). | Privacidad |
| RNF-16 | Cobertura de tests automatizados del backend de al menos 70%. | Mantenibilidad |
| RNF-17 | CI/CD en GitHub Actions para backend, frontend y plugin PHP. | Mantenibilidad |
| RNF-18 | Decisiones arquitectónicas documentadas como ADRs en `docs/adr/`. | Mantenibilidad |
| RNF-19 | Cada *feature* documentada con ADR (si aplica), comentarios en código e issue con criterios de aceptación. | Mantenibilidad |
| RNF-20 | El plugin se distribuye como ZIP instalable vía *Site administration → Plugins → Install plugins*. | Distribución |
| RNF-21 | Cada *release* etiquetada en GitHub con *changelog* y `version.php` actualizado. | Distribución |

## Anexo B — Modelo de datos

NexusAI usa una sola base de datos PostgreSQL con la extensión pgvector activada; los
embeddings vectoriales y los datos relacionales viven en la misma instancia.

```mermaid
erDiagram
    DOCUMENTS ||--o{ CHUNKS : "compone"
    CHAT_SESSIONS ||--o{ MESSAGES : "contiene"

    DOCUMENTS {
        uuid id PK
        int course_id "ID del curso Moodle"
        int uploader_id "ID del docente Moodle"
        string filename
        string mime_type
        string status "pending, indexing, indexed, error"
        string file_hash "SHA-256 para dedup"
    }

    CHUNKS {
        uuid id PK
        uuid document_id FK
        text content
        int chunk_index
        int token_count
        vector embedding "Vector 768 MVP, 1536 prod"
    }

    CHAT_SESSIONS {
        uuid id PK
        int user_id "ID del alumno Moodle"
        int course_id "0 = multi-curso"
    }

    MESSAGES {
        uuid id PK
        uuid session_id FK
        string role "user, assistant, system"
        text content
        int token_count_prompt
        int token_count_completion
    }

    UNANSWERED_QUESTIONS {
        uuid id PK
        int course_id
        int user_id
        text question
        float max_similarity
        int chunks_retrieved
    }
```

> **Figura 5.** Diagrama entidad-relación de NexusAI. *Fuente:* elaboración propia
> (`entrega-final/15_modelo_datos.md`). *Texto alternativo:* cinco tablas — documents,
> chunks, chat_sessions, messages y unanswered_questions — con `documents` componiendo
> `chunks` y `chat_sessions` conteniendo `messages`.

**Notas de implementación:** `chunks.embedding` usa un índice **HNSW** con distancia
coseno (`m=16`, `ef_construction=200`) para búsqueda aproximada en tiempo casi
constante. `documents` tiene un índice único parcial sobre
`(course_id, filename, file_hash)` que evita reindexar el mismo archivo dos veces. El
esquema evolucionó en 5 migraciones Alembic (001 a 004, con dos migraciones `004_*`
desarrolladas en paralelo por integrantes distintos y luego encadenadas). Del lado del
plugin Moodle, hoy solo existe `local_nexusai_placeholder` (vacía); las tablas
`local_nexusai_usage`, `local_nexusai_cache` y `local_nexusai_course_settings` quedan
planificadas para post-MVP.

## Anexo C — Métricas del proyecto

**Velocidad por sprint**

| Sprint | SP comprometidos | SP completados | Velocity |
|---|---|---|---|
| Sprint 0 — Setup | 60 | 60 | 100% |
| Sprint 1 — Core chat | 50 | 45 | 90% |
| Sprint 2 — RAG | 60 | 55 | 92% |
| Sprint 3 — Calidad | 25 | 25 | 100% |
| Sprint 4 — MVP | 70 | 70 | 100% |
| **Promedio** | | | **96%** |

**Métricas de desarrollo**

| Métrica | Valor |
|---|---|
| Commits al repositorio | ~290 |
| Issues cerradas | 160+ |
| Pull requests mergeados | 85+ |
| Líneas de código backend Python | ~3.500 |
| Líneas de código plugin PHP | ~2.500 |
| Líneas de código React | ~3.200 |
| Migraciones de base de datos | 5 |
| ADRs documentadas | 6 |
| Tests automatizados del backend | 37 |
| Cobertura de tests del backend | ~80% |

**Calidad del LLM (*golden set*)**

| Métrica | Resultado en el MVP |
|---|---|
| Preguntas con respuesta correcta y citación adecuada | 8/10 |
| Preguntas donde el LLM admitió no poder responder (correcto) | 2/2 |
| Falsos positivos (respuesta segura pero incorrecta) | 0 |
| Falsos negativos (no responde teniendo material disponible) | 0 |

## Anexo D — Repositorio y evidencias

- **Repositorio:** [github.com/nexusai-ucc/nexusAI](https://github.com/nexusai-ucc/nexusAI)
- **Issues:** [github.com/nexusai-ucc/nexusAI/issues](https://github.com/nexusai-ucc/nexusAI/issues)
- **Integración continua (GitHub Actions):**
  [github.com/nexusai-ucc/nexusAI/actions](https://github.com/nexusai-ucc/nexusAI/actions)
- **Release del MVP:** `v0.8.0-mvp`
  ([github.com/nexusai-ucc/nexusAI/releases/tag/v0.8.0-mvp](https://github.com/nexusai-ucc/nexusAI/releases/tag/v0.8.0-mvp)).
  El plugin siguió evolucionando después del MVP (versión actual `0.14.2` según
  `plugin/local/nexusai/version.php`) sin un *tag* formal más reciente en el
  repositorio — pendiente etiquetar el próximo *release* (RNF-21).

> **Nota:** el backend está desplegado de forma permanente en dos ambientes sobre
> Oracle Cloud (*Always Free*): *staging*, para pruebas del día a día
> (`https://api-staging.146.181.62.67.nip.io`), y producción, solo para
> funcionalidad ya validada (`https://api.159.112.139.166.nip.io`). Moodle no se
> despliega junto al backend — cada integrante lo sigue corriendo localmente,
> apuntando el plugin al ambiente correspondiente. El deploy a ambas VMs es
> manual; para reducir el riesgo de acumular cambios sin probar, el equipo
> concentra los merges a `main` al cierre de cada sprint, trabajando el resto
> del tiempo contra `development` y *staging*.

## Anexo E — Registro de decisiones de arquitectura (ADRs)

El proyecto documenta sus decisiones de arquitectura significativas como
*Architecture Decision Records* (ADR) en `docs/adr/`: diez decisiones
aceptadas o propuestas, cada una con su contexto, las alternativas
evaluadas y sus consecuencias. Las cuatro primeras ya se desarrollaron en
Marco Teórico; se listan acá solo como registro formal. Las seis restantes
no están desarrolladas en ningún otro capítulo del informe.

**ADR-001 — Backend Python como monolito modular** (Aceptada, 02/05/2026).
Un único proceso FastAPI organizado por dominios (`chat/`, `documents/`,
`analytics/`) en lugar de microservicios, decisión desarrollada en Marco
Teórico. Revisar si la indexación bloquea el chat por minutos, o si el
equipo crece a más de 6 desarrolladores.

**ADR-002 — pgvector sobre PostgreSQL como única base de datos** (Aceptada,
02/05/2026; acotada por ADR-014 a partir de septiembre: pgvector queda
solo para el índice del material del curso). Revisar si una institución
supera los 10 millones de vectores.

**ADR-003 — Arquitectura agnóstica de proveedor LLM** (Aceptada,
02/05/2026). Abstracción propia (`LLMProvider`/`EmbeddingProvider`) sobre
el SDK de OpenAI, compatible con la mayoría de los proveedores relevantes
cambiando solo la URL base. Revisar si aparece un proveedor incompatible
con ese SDK.

**ADR-004 — Gemini en MVP, OpenAI en producción** (Aceptada, 02/05/2026).
Costo de producción proyectado de ~\$108/mes para 500 alumnos
(\$0,22/alumno/mes). Revisar si el piloto supera el límite gratuito de
Gemini (1.500 solicitudes/día) antes de pasar a producción.

**ADR-005 — Autenticación PHP/Python con HMAC SHA-256 en 3 capas**
(Aceptada, 04/05/2026). El plugin y el backend son dos servicios
independientes, y la clave del proveedor de IA vive solo en el backend —
nunca puede llegar al navegador. La autenticación se resuelve en tres
capas: una clave `Bearer` identifica al cliente, una firma HMAC SHA-256
sobre `timestamp + nonce + body` garantiza integridad con una ventana de
5 minutos de tolerancia, y un *nonce* de un solo uso guardado en Redis
(`SET NX EX 300`) impide repetir una solicitud capturada. Se descartó JWT
por no aportar nada sobre HMAC+timestamp para autenticación
servicio-a-servicio sin estado, y mTLS por la complejidad de distribuir y
rotar certificados para dos servicios bajo el mismo control de despliegue.
Revisar si el proyecto pasa a ser multi-institucional (cada universidad
como cliente distinto).

**ADR-006 — Estrategia de Privacy API: `null_provider` primero**
(Fecha 04/05/2026; **reemplazada por ADR-014**). Mientras los datos del
alumno vivieran solo en el backend externo y no en tablas de Moodle, el
plugin declaraba formalmente `null_provider` en lugar de implementar el
`metadata\provider` completo sin datos reales que exportar o borrar — una
decisión deliberada (YAGNI), no una omisión, con triggers explícitos para
disparar la migración (agregar cualquier tabla `local_nexusai_*` con
`userid`, o decidir publicar el plugin en moodle.org). Esos triggers se
cumplieron en septiembre y la decisión quedó reemplazada por ADR-014.

**ADR-010 — Alcance del copiloto de onboarding al docente** (**Propuesta,
30/08/2026 — pendiente de aprobación, no aceptada todavía**). Define que
NexusAI **no escribe nada en Moodle**: cada paso del tutorial de
"primeros pasos" de un curso es un link a la pantalla nativa de Moodle
donde el propio docente hace la acción — se descartó explícitamente la
alternativa de que NexusAI cree recursos (foros, grupos) en nombre del
docente, por el riesgo de romper datos reales y por ampliar la superficie
de la declaración de Privacidad sin necesidad.

**ADR-011 — Retiro de las configuraciones de deploy de Railway y Fly.io**
(Aceptada, 07/09/2026). El backend pasó por tres destinos de despliegue a
lo largo del proyecto: Railway durante el MVP y la defensa ante el jurado,
Fly.io en el post-MVP temprano, y Oracle Cloud (*Always Free*) desde
agosto de 2026, destino actual. Al llegar a septiembre, ninguno de los dos
primeros seguía activo, pero el *workflow* de GitHub Actions que
desplegaba a Fly.io seguía corriendo en cada *push* a `main` y fallando
sistemáticamente — el repositorio mostraba una CI en rojo permanente por
infraestructura que ya no existía, señal que competía con las fallas
reales. El ADR formaliza eliminar esos archivos de configuración muerta
(`deploy.yml`, `fly.toml`, `railway.json`, incluida una segunda copia
divergente del *workflow* que nunca llegó a ejecutarse por estar en una
ruta que GitHub Actions no lee) y deja explícitamente **sin modificar** la
documentación histórica del proyecto (`entrega-final/`, `investigacion/`,
el propio `CHANGELOG.md`) que describe Railway o Fly.io como entorno
vigente, porque era cierto cuando se escribió — reescribirla sería
falsificar el registro del proyecto, no limpiarlo.

**ADR-012 — Alertas mínimas viables, sin infraestructura nueva de
monitoreo** (Aceptada, 11/09/2026). Las dos VMs de Oracle Cloud corren con
1 núcleo y 1 GB de RAM cada una, compartidos entre el backend, PostgreSQL
y Redis — un stack de observabilidad como Prometheus + Grafana +
Alertmanager consumiría una porción desproporcionada de esa RAM para el
tráfico de un piloto. Se implementaron alertas por correo electrónico
(SMTP, sin dependencias nuevas más allá de la librería estándar de Python)
para los cuatro eventos con impacto directo en la experiencia del usuario:
caída del backend, tasa elevada de errores 5xx, fallas o lentitud del
proveedor de LLM, y cuota de IA agotada — cada uno con un umbral y una
ventana en Redis para no inundar la casilla de correo mientras el problema
persiste.

**ADR-014 — Datos del alumno en tablas nativas de Moodle (opción C
híbrida)** (Aceptada, 26/09/2026; reemplaza a ADR-006 en dónde viven los
datos personales, y acota a ADR-002). Es la decisión arquitectónica más
relevante del proyecto en su última etapa. El diseño original —todo el
dato del alumno en el backend externo— generaba privacidad incompleta
(el borrado y la exportación no cubrían todas las tablas, y borrar un
curso en Moodle dejaba datos huérfanos en el backend), quedaba fuera de
las herramientas de Moodle (sin backup de curso, sin reportes nativos,
sin backups del propio backend en ningún ambiente) y dependía de 48 de
las 55 funciones externas del plugin llamando al backend por HTTP.
Mediciones del equipo mostraron el costo real de esa dependencia: una
lectura nativa en la base de Moodle toma 0,23 ms de mediana, la misma
lectura vía el backend en la misma máquina toma 4,7 ms, y una llamada al
backend de producción toma ~135 ms. La decisión mueve los datos del
alumno (sesiones de chat, mensajes, interacciones, intentos y errores de
cuestionarios, flashcards, alertas de calendario) a dieciséis tablas
nativas `local_nexusai_*`, propiedad del plugin PHP; el backend conserva
únicamente el índice vectorial del material del curso y las cachés de
contenido, sin datos personales. El trade-off aceptado es tener la misma
lógica de negocio duplicada en dos lenguajes (PHP y Python) para lo que
se portó, mitigado probando la versión portada contra los mismos casos
que los tests de Python ya cubrían.
