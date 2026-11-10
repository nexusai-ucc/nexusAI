# Pre-entrega con 3 profes: guion y reparto

> v0.2, 06/11/2026 (PRE-06, #684). Primera versión para corregir entre los tres. **La presentación dura entre 30 y 35 minutos.** El guion es de 30 y deja 5 de margen para cambios de orador, la demo y algún imprevisto. Falta confirmar si las preguntas van aparte (PRE-07, #685).
>
> Sale de [GUION_PRESENTACION.md](GUION_PRESENTACION.md), que es el de la defensa (también de 30 minutos), y de [GUION_DEMO.md](GUION_DEMO.md), que es la demo para 60 personas. La pre-entrega es casi un ensayo general de la defensa. Cambian la demo, que es para 3 personas, y un bloque nuevo sobre lo que falta hasta febrero.

**Cuándo:** entre el 30/11 y el 2/12, presencial. **Ante quiénes:** 3 profes. **Duración:** 30–35 minutos.

**Para qué nos sirve:** además de mostrar el avance, es el primer ensayo real de la defensa de febrero. Sirve para probar 4 cosas:
- el orden de la presentación;
- la parte técnica;
- la demo con celulares sobre el servidor público;
- cómo respondemos preguntas.

**Idea clave** (la misma de febrero): **la IA responde con el material del curso, y lo que no sabe se lo avisa al docente.**

## Línea de tiempo

| Min | Bloque | Quién |
|---|---|---|
| 0–3 | Apertura (la escena de la alumna) | Delfina |
| 3–5 | Problema (encuesta) | Delfina |
| 5–7 | Objetivo y aportes | Santiago |
| **7–13** | **Demo con los profes** | Delfina en la pantalla, Marcos narra |
| **13–23** | **Parte técnica** | Santiago (13–18:30) y Marcos (18:30–23) |
| 23–24 | Proceso | Santiago |
| 24–26 | Resultados contra los objetivos | Santiago |
| 26–28 | Estado y lo que falta hasta febrero | Marcos |
| 28–30 | Aportes y qué queremos que nos digan | Delfina |
| 30–35 | Margen | — |

Comparado con la defensa:
- **El problema dura 2 minutos en lugar de 3,** porque los profes ya conocen el proyecto.
- **La demo dura 6 minutos en lugar de 8,** porque son 3 personas.
- **Se agrega un bloque:** "Estado y lo que falta hasta febrero", con esos 3 minutos. En la pre-entrega los profes quieren saber dónde estamos, no solo qué hicimos. Lo cuenta Marcos, así los tres hablan parecido.
- **La parte técnica son los 10 minutos completos de la defensa.**
- **El margen de 5 minutos no se planifica.** Si en el segundo ensayo (PRE-11) nos pasamos de 30, se recorta antes de usarlo.

## Antes de empezar (5 minutos antes, no cuentan en el tiempo)

Para que la demo no arranque con 2 minutos de login:

1. **Le damos una tarjeta a cada profe.** Hay 3 tarjetas:
   - 2 de **alumno** (`invitado01` e `invitado02`);
   - 1 que dice "**docente**: va a usar nuestra notebook".
2. **Los dos alumnos escanean el QR** y entran con su tarjeta, con datos móviles. Marcos los ayuda si hace falta.
3. **En la notebook ya está abierta la sesión del docente,** con dos pestañas:
   - el curso "NexusAI: la tesis";
   - el panel docente → **Material**.
4. **Delfina deja proyectado** el curso con su propia sesión de alumno (`invitado03`).
5. **Tiene que estar listo el PDF `novedades-check2.pdf`** en el escritorio de la notebook. No tiene que estar subido.

Si a los profes no les sirve usar el celular, se hace todo desde la notebook y la pantalla: es el nivel 1 del plan B.

## La demo (6 minutos, del 7 al 13)

Los roles son:
- **Profe A** y **Profe B:** alumnos, desde su celular.
- **Profe C:** docente, desde nuestra notebook.

| Min | Qué pasa | Quién | Qué tiene que verse | Qué dice Marcos |
|---|---|---|---|---|
| 0–1 | **A y B preguntan lo que quieran sobre la tesis** | A y B, en el celular | Respuesta en streaming con la fuente debajo | "Pregúntenle lo que quieran de nuestra tesis. Fíjense de dónde sale cada respuesta" |
| 1–1:30 | Una de esas preguntas, en la pantalla | Delfina hace clic en la fuente | Se abre el informe en la actividad citada | "Cada respuesta se puede verificar" |
| 1:30–2:15 | **Pregunta sembrada:** A escribe "¿Qué cambió desde el Check 2?" | A | El asistente dice que el material no lo cubre | "No inventa. Y esa pregunta no se pierde" |
| 2:15–3 | C abre **Preguntas de alumnos** y recarga | C, en la notebook | Aparece el vacío con la pregunta de A, además de lo que preguntaron A y B | "Esto es lo que ve el docente: qué le preguntaron y qué no estaba en su material" |
| 3–4 | **C sube `novedades-check2.pdf`** en **Material** | C, guiado por Delfina | En cola → Indexando → Indexado | "El docente completa el material sin tocar nada de IA" |
| 4–5 | **B repite la pregunta** | B | Responde y cita `novedades-check2.pdf` | "La misma pregunta de hace 3 minutos. Ahora sí, y con la fuente que se acaba de subir" |
| 5–6 | C prueba **Buscar** con la misma pregunta | C | Los fragmentos encontrados, con su porcentaje | "El docente también puede ver qué encuentra el sistema en su material" |

Los minutos de la tabla son relativos: el minuto 0 de la demo es el minuto 7 de la presentación.

**Si vamos atrasados,** se saca el paso de Buscar. Santiago lo cuenta igual en la parte técnica, cuando explica la búsqueda híbrida.

**La frase puente a la parte técnica** la dice Santiago: "Ahora vamos a ver qué pasó por dentro con la pregunta de recién, desde que salió de su celular".

**Qué se deja afuera:** el quiz y Analytics. En febrero el quiz se hace a mano alzada; con 3 personas no agrega nada y come un minuto.

## Parte técnica

Son los 10 minutos completos de [GUION_PRESENTACION.md](GUION_PRESENTACION.md) §16–26, corridos 3 minutos antes y contados sobre la pregunta que hizo el Profe A:

| Min | Tema | Quién |
|---|---|---|
| 13–14:30 | Arquitectura: 3 capas, el plugin como proxy, por qué `local` | Santiago |
| 14:30–16 | Indexación: chunking de 512/64, 768 dimensiones, HNSW | Santiago |
| 16–17:30 | Retrieval y generación: top 5, umbral de 0,3, los 3 filtros, SSE, búsqueda híbrida | Santiago |
| 17:30–18:30 | Detección de vacíos: las 2 señales, agrupamiento con 0,75 | Santiago |
| 18:30–20 | Seguridad: HMAC con anti-replay, presupuesto de tokens atómico, privacidad | Marcos |
| 20–21 | Resiliencia: cadena de fallback, DEF-07 | Marcos |
| 21–22 | Concurrencia: DEF-09 | Marcos |
| 22–23 | Calidad: pipeline, contratos, números, CD | Marcos |

## Proceso y resultados · Santiago (23–26)

Son los mismos bloques de [GUION_PRESENTACION.md](GUION_PRESENTACION.md) §26–29:
- **Proceso:** Scrum, PRs, la migración a Oracle y la revisión de Moodle.
- **Resultados:** cada objetivo específico del informe, con su estado (cumplido, parcial o no cumplido), y los costos.

**Lo que ya podemos decir de la demo,** que en febrero va en "Lo de hoy": el servidor de la pre-entrega es el mismo entorno que vamos a usar en la defensa (`deploy/demo/`), con modelo pago y HTTPS. Los números se completan después de PRE-03 (#681).

## Estado y lo que falta hasta febrero · Marcos (26–28)

Sigue a los resultados: de los objetivos que no están cumplidos, qué vamos a hacer y cuándo.
- **Lo que falta y cómo lo vamos a cerrar:**
  - **Evaluación con usuarios reales** (#264, #265). Hoy solo hay una prueba chica de mayo. [Completar con lo que decida el equipo: piloto, fechas, cuántas personas].
  - **Prueba de carga a través de Moodle,** con 60 navegadores y el modelo real, para la demo con público de febrero. Hasta ahora la carga se midió directo contra el backend y con el modelo simulado.
- **Las dos mediciones que dejan "Parcial" el objetivo 6** (PRE-08, #686): la latencia hasta el primer token y la fidelidad y honestidad de las respuestas. Se miden con el modelo real en el servidor de la demo. Si para el 30/11 ya están, este bloque se convierte en un resultado.

Mostrar lo que falta antes de que lo pregunten es lo que recomiendan las guías de defensa ([INVESTIGACION_DEFENSA.md](INVESTIGACION_DEFENSA.md)).

## Cierre · Delfina (28–30)

Los 4 aportes, igual que en febrero. Después, en vez de "gracias":

> Para la defensa de febrero, nos sirve mucho saber qué les sobró, qué les faltó y qué le preguntarían ustedes a NexusAI si fueran el tribunal.

## Qué queremos que nos digan los profes

Lo anota Marcos durante las preguntas. Después se pasa a [PREGUNTAS_TRIBUNAL.md](PREGUNTAS_TRIBUNAL.md) y a los guiones.

- [ ] ¿La parte técnica tiene el nivel que esperan para la defensa? ¿Les sobra o les falta algo?
- [ ] ¿La demo con el público les parece bien para febrero? ¿Hay algún problema con que sea abierta?
- [ ] ¿Qué esperan de la evaluación con usuarios reales para darla por cumplida?
- [ ] ¿Duración, tribunal y rúbrica de la defensa? Son las preguntas de PRE-07 que no se hayan respondido.
- [ ] Cada pregunta que hagan, textual.

## Plan B

| Nivel | Si falla | Qué se usa |
|---|---|---|
| 1 | El celular de algún profe (red, login) | Esa persona dicta y Delfina escribe en la pantalla. No se depura en el momento |
| 2 | El servidor | Stack en Docker en la notebook de Delfina (`deploy/demo`, `MOCK=0` con la misma key), solo para la pantalla |
| 3 | Todo | El video de la demo grabado en el segundo ensayo (PRE-11), con Marcos narrando en vivo |

**La regla de los 15 segundos:** si en la pantalla no aparece nada en 15 segundos, Santiago avisa y se pasa al nivel siguiente.

## Checklist

- [ ] **PRE-03** (#681): servidor con modelo real, HTTPS y streaming probado desde un celular con datos móviles.
- [ ] **PRE-04** (#682): curso con el informe final y `novedades-check2.pdf` **sin subir**. Cuentas `invitado01`–`invitado03` y `docente`, con las 4 tarjetas impresas.
- [ ] **PRE-10** (#688): primer ensayo con 3 personas en los roles de A, B y C.
- [ ] **PRE-11** (#689): segundo ensayo cronometrado (tiene que dar 30 minutos sin usar el margen), video grabado y plan B probado.
- [ ] **PRE-12** (#690):
  - **El día anterior:** probar que la pregunta sembrada **todavía** cae en vacíos. Si en un ensayo quedó subido el PDF de novedades, hay que borrarlo.
  - **El día:** señal del celular en el aula, sesión del docente abierta, QR en la diapositiva, informe impreso.
