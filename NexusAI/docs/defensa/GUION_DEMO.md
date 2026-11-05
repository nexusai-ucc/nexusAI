# Guion de la demo en vivo

> Borrador v0.1, 05/11/2026. **Todavía no se ensayó.** Los pasos se validaron contra el código de `development` (d1298aa), no en un Moodle corriendo. Los tiempos son estimados y se corrigen en el primer ensayo.

**Duración:** 6 minutos. **Pantalla:** Delfina. **Narración:** Marcos. **Plan B:** Santiago (reparto a confirmar).

## La idea

Una sola historia en lugar de recorrer las épicas: una pregunta que el material no responde llega al docente, el docente lo resuelve y el alumno recibe la respuesta. Muestra los tres diferenciales de NexusAI en un mismo recorrido: cita la fuente, admite lo que no sabe y le avisa al docente.

Queda afuera y se nombra en una diapositiva: voz, foros, calendario, flashcards, webhook y buscador.

## Preparación

### Corpus
- Reutilizar el curso "Sistemas Inteligentes (Demo)" y sus usuarios (`docs/presentaciones/NexusAI_Demo_Script_2026-08-06.md`) o rearmarlo con la versión congelada.
- **Un PDF de 1 o 2 páginas** sobre un tema que el resto del material no toque. Sale de ese mismo curso.
- **El nombre del archivo no puede tener espacios ni acentos:** la píldora de fuentes reconoce el nombre con `[\w\-]+\.(pdf|docx|txt)` (`MessageBubble.jsx`). Por ejemplo, `refuerzo-q-learning.pdf`.
- **Tres preguntas probadas** para el paso 2 y una distinta para el paso 1. El tribunal puede elegir entre las tres del paso 2.
- Las preguntas tienen que dar similitud máxima menor a 0,4, o que el modelo diga que no encontró información. Ese es el criterio de `gaps/recorder.py`, y hay que comprobarlo con el modelo definitivo.

### Antes de cada ensayo
- Borrar de "Preguntas de alumnos" los gaps de ensayos anteriores y sacar el PDF del paso 4.
- Dos ventanas: alumno a la izquierda y docente a la derecha, con sesiones separadas (perfiles distintos del navegador).
- Las credenciales no se escriben en vivo: las dos sesiones quedan abiertas.
- Zoom del navegador para que se lea desde el fondo de la sala.
- `/health` del backend abierto en una pestaña, para que Santiago lo vigile.

## Los pasos

| # | Tiempo | Quién actúa | Qué se hace | Qué tiene que verse |
|---|---|---|---|---|
| 1 | 0:50 | Alumno | En el widget ✧, una pregunta que el material responde | Respuesta en streaming, píldoras de fuentes. Clic: se abre la actividad en Moodle |
| 2 | 0:40 | Alumno | Una pregunta que el material no responde | Admite que no tiene la información |
| 3 | 0:30 | Docente | Panel de materiales → **Preguntas de alumnos** → gaps | Aparece la pregunta del paso 2 |
| 4 | 1:00 | Docente | **Material** → subir el PDF | Pasa por En cola → Indexando → Indexado. Queda como actividad Archivo en una unidad del curso |
| 5 | 0:50 | Alumno | Repite la pregunta del paso 2 | **Ahora responde y cita el PDF nuevo** |
| 6 | 1:10 | Alumno | **Modo Estudio** → Practicar, quiz de ese tema. Responder mal una. Después → Plan | El error alimenta el plan de repaso |
| 7 | 0:20 | Docente | **Analytics** | Métricas del curso. Si sobra tiempo, nombrar el generador de exámenes |

Suma 5:20. Quedan 40 segundos de margen.

### Lo que dice el narrador

1. "Cada respuesta sale del material del curso, y se puede ir a la fuente: Moodle aplica sus permisos al abrirla."
2. "Esto es lo que no hace un chat general: si no está en el material, lo dice, no inventa."
3. "Y esa pregunta no se pierde. El docente ve qué falta cubrir, sin leer cada conversación."
4. "El docente sube el apunte. Se procesa en segundo plano y queda como una actividad normal de Moodle."
5. "La misma pregunta de hace dos minutos. Ahora sí, y citando lo que el docente acaba de subir."
6. "Con eso practica. Lo que le sale mal vuelve en su plan de repaso."
7. "Y el docente tiene la foto del curso completo."

## Para comprobar en el primer ensayo

- [ ] Si el clic en la fuente abre la actividad (VIS-05, #546). No lo pude confirmar leyendo `MessageBubble.jsx`.
- [ ] Cuánto tarda indexar el PDF. Si tarda más de 1 minuto, achicarlo o mostrar uno ya indexado.
- [ ] Si el quiz acepta el tema del PDF nuevo: el umbral de similitud es 0,5 (`QUIZ_TOPIC_MIN_SIMILARITY`).
- [ ] Si un solo error hace aparecer el tema en el Plan. En agosto, el curso de demo mostraba un tema con 2 errores cargados: si hace falta, usar un alumno con historial.
- [ ] Si el gap aparece enseguida en el panel y cómo se ve cuando hay varios agrupados.
- [ ] Si el flujo funciona con los datos del alumno en tablas de Moodle (DATA-05 y DATA-06, `docs/CORTE_DATOS_MOODLE.md`).
- [ ] Latencia del paso 1 con el modelo elegido, medida 10 veces seguidas.

## Plan B

**Regla:** si en un paso del LLM pasan más de 15 segundos sin que empiece la respuesta, Santiago avisa y se pasa al nivel siguiente. No se depura frente al tribunal. El narrador lo dice sin dramatizar: "Es un servicio externo; pasamos a la otra máquina".

| Nivel | Cuándo | Qué se usa | Falta preparar |
|---|---|---|---|
| 0 | Normal | Notebook principal + backend de demo por internet | Definir backend y modelo |
| 1 | Falla el wifi de la sala | Hotspot de un celular | Probarlo: necesita datos y señal en la sala |
| 2 | Falla el backend o el LLM está lento | Segunda notebook con el stack en Docker | Armarla. El LLM sigue siendo externo, así que usa otro proveedor u otra key |
| 3 | Falla todo | Video de los mismos 7 pasos, con el narrador en vivo | Grabarlo con la versión congelada, en local, sin depender de internet |

Si falla un solo paso del final, se sigue: lo importante está en los pasos 2 a 5. Si fallan los pasos 2 a 5, se va directo al nivel 3.

## Ronda de preguntas

Si el tribunal quiere probar una pregunta libre, se hace en este momento y no durante la demo. Si responde mal, se aprovecha: "Mirá la fuente que usó; por eso citamos, para que se pueda verificar".
