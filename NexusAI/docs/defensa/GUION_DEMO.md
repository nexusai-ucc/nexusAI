# Guion de la demo con el público

> v0.2, 05/11/2026. **No se ensayó.** Los pasos se revisaron contra el código de `development`, pero la prueba con público y la de carga a través de Moodle quedan para enero. Los tiempos son estimados.

**Duración:** 9 minutos, del minuto 8 al 17 de la exposición. **Pantalla:** Delfina. **Narración:** Marcos. **Control** (panel en otra pantalla, plan B y alertas): Santiago. Todo el reparto está a confirmar.

## La idea

El público usa NexusAI desde su celular, sobre **la propia tesis**. Lo que pregunta aparece en el panel del docente. Una pregunta que el material no cubre se resuelve en vivo: el docente sube un PDF y todos vuelven a preguntar y reciben la respuesta con la cita.

Cada momento prueba algo: que cita la fuente, que no inventa, que el docente se entera y que el material se actualiza en el momento.

## El curso

- **Nombre:** "NexusAI: la tesis". El material es el informe en PDF (`informe-ipi/informe-ipi.pdf`). Ya se revisó que no contenga credenciales.
- **El PDF sembrado:** una página con un dato que el informe no tiene y al que el público pueda responder: "¿Quién del equipo hizo más commits?". **El dato y su redacción los define el equipo:** hay commits con más de un nombre por persona y hay que unificarlos. El nombre del archivo, sin espacios ni acentos, por ejemplo `datos-del-equipo.pdf`: la píldora de fuentes solo reconoce `[\w\-]+\.(pdf|docx|txt)`.
- **Historial previo:** 6 alumnos de ensayo con preguntas y errores de quiz, así el panel docente no arranca vacío.

## Acceso del público

- **QR** a la URL del Moodle de la demo, con un dominio corto y HTTPS. Se muestra en la diapositiva del minuto 6, antes de hablar de él, con una frase: "Escaneen, entren con la tarjeta que tienen en el asiento".
- **Tarjetas** en cada asiento con usuario y contraseña propios (`invitado01` … `invitado70`), así cada uno tiene su propio límite. Las contraseñas no se proyectan.
- **Cuentas** con rol alumno en ese único curso, sin datos personales, sin mensajería, sin edición de perfil y sin acceso a otros cursos. Se borran después de la defensa.
- **Datos del celular:** el Moodle es público, así que no se depende del wifi de la sala.
- **Aviso en pantalla:** "Lo que pregunten puede aparecer en la pantalla. No escriban datos personales".

## Los momentos

| Min | Qué pasa | Pantalla | Qué tiene que verse | Qué dice el narrador |
|---|---|---|---|---|
| 0–1 | El público entra desde el celular | Diapositiva con QR | El widget ✧ dentro del curso, en versión celular | "Esto es Moodle, el mismo campus de siempre. El asistente vive adentro" |
| 1–3 | **Preguntan lo que quieran sobre la tesis** | Moodle con la sesión de Delfina | Respuestas en streaming con fuentes | "Pregúntenle lo que quieran de nuestra tesis. Fíjense en la fuente de cada respuesta" |
| 3–4 | Una pregunta para todos, dictada por alguien del tribunal si quiere | Delfina la escribe y hace clic en la fuente | Se abre el informe en el lugar citado | "Cada respuesta se puede verificar" |
| 4–5 | "Esto es lo que preguntaron ustedes" | Panel docente → **Preguntas de alumnos** (recargar) | Temas frecuentes y vacíos con las preguntas del público | "El docente no tiene que leer cada chat: ve qué preguntaron y qué no pudo responder el material" |
| 5–6 | Pregunta sembrada: "¿Quién del equipo hizo más commits?" | Todos la escriben | El sistema admite que no tiene esa información | "No inventa. Y esa pregunta no se pierde" |
| 6–7 | El docente sube el PDF | Panel → **Material** → subir | En cola → Indexando → Indexado | "El docente completa el material en un minuto, sin tocar nada de IA" |
| 7–8 | **Todos repiten la pregunta** | Cualquier celular | Responde y cita `datos-del-equipo.pdf` | "La misma pregunta de hace dos minutos. Ahora sí, y citando lo que se acaba de subir" |
| 8–9 | Quiz en pantalla | **Modo Estudio** → Practicar, sobre un tema del informe | El público vota a mano alzada; Delfina marca la opción más votada y se ve la corrección. Cierre en **Analytics** | "Con esto el alumno practica. Lo que le sale mal vuelve en su plan de repaso" |

El quiz se hace en la pantalla y no en 60 celulares porque cada quiz lo genera el LLM: con 60 a la vez sería lento y caro, y no agrega nada a lo que se prueba.

## Reglas para el equipo

- **Santiago controla lo que se proyecta.** Mira el panel docente en otra pantalla antes de proyectarlo. Si hay algo ofensivo o una broma, se muestra **Analytics** en su lugar.
- **15 segundos sin respuesta** en la pantalla: Santiago avisa y se pasa al nivel siguiente del plan B. No se depura frente al tribunal.
- Si no responde el celular de alguien del público, no se lo ayuda en ese momento: la demo sigue en la pantalla.
- **Inyección de prompts:** alguien va a intentar "ignorá tus instrucciones". Lo ensayamos antes. Si pasa, Marcos lo aprovecha: "El asistente solo responde sobre el material del curso".

## Plan B

| Nivel | Si falla | Qué se usa |
|---|---|---|
| 1 | Los celulares del público (red o carga) | La demo sigue igual en la pantalla: el público dicta las preguntas y Delfina las escribe |
| 2 | El Moodle público | Notebook con el stack completo en Docker, solo para la pantalla |
| 3 | El LLM está lento o caído | Segundo proveedor ya configurado en la cadena de fallback (`LLM_FALLBACK_*`) |
| 4 | Todo | Video de los mismos 9 minutos grabado en un ensayo con público, con narración en vivo |

## Infraestructura

| Pieza | Propuesta | Estado |
|---|---|---|
| Servidor exclusivo con Moodle 4.5, backend, PostgreSQL y Redis | Empezar con 4 vCPU y 8 GB, y ajustar con la prueba de carga | A contratar. Lo más cercano a Córdoba es mejor, pero la latencia del LLM pesa más que la del servidor |
| Dominio y HTTPS | Corto para el QR. Caddy ya está en el repo | A contratar |
| Modelo | `gpt-4o-mini` con embeddings de OpenAI, indexando el material con ese mismo modelo | A configurar |
| Cuota del proveedor | Con 60 preguntas por minuto serían ~200 k tokens/min, el límite de Tier 1 según la documentación de OpenAI (a confirmar en el panel) | Subir de tier y poner tope de gasto en el proyecto |
| Moderación | `MODERATION_API_KEY` con la API de moderación de OpenAI | A configurar |
| Límites por usuario | 20 por minuto y 50 por día (`rate_limit_per_user_*`), más presupuesto de tokens. Con una cuenta por persona alcanzan | Ya existe |

**Costos orientativos** (precios de sitios de terceros; confirmar en cada proveedor): servidor de 4 vCPU y 8 GB entre ~US$ 10 y 72 por mes según proveedor y región; dominio ~US$ 12 por año. Del modelo estimo menos de US$ 1 por demo: 60 personas × 5 preguntas × ~4 k tokens a US$ 0,15 por millón de entrada. Con US$ 50 alcanza para ensayos y margen.

## Riesgos encontrados en el código

1. **Nunca se probó la carga pasando por Moodle.** La prueba de k6 le pega directo al backend con la firma HMAC (`scripts/load/nexus_load.js`). Cada chat en streaming ocupa un proceso PHP durante toda la respuesta, y `chat_stream.php` no libera la sesión antes del stream. → Prueba de carga en enero con 60 navegadores reales (por ejemplo Playwright) que entren a Moodle y pregunten, y ajustar los procesos de PHP-FPM o Apache.
2. **Los 100 usuarios de la prueba de carga fueron con el LLM simulado.** Con el modelo real solo se probaron 2. → Esa misma prueba de enero, con el modelo real.
3. **Los paneles docentes no se actualizan solos:** hay que recargar. Está contemplado en el guion.
4. **La moderación deja pasar los mensajes si ella misma falla** (`MODERATION_FAIL_OPEN=true` por defecto). → Para la demo se puede poner en `false`, y además Santiago revisa antes de proyectar.

## Decisión de avance (31/01)

Si la prueba con 60 navegadores no da al menos 95 % de respuestas correctas con p95 por debajo de 8 s (el mismo umbral de `PRUEBAS_DE_CARGA.md`), la participación del público se limita a dictar preguntas (nivel 1) y la demo se hace desde la pantalla.

## Para comprobar en el primer ensayo

- [ ] Login y widget en Android y en iPhone, con datos móviles.
- [ ] Que el clic en la fuente abra el informe (VIS-05, #546).
- [ ] Cuánto tarda en indexarse el PDF sembrado. Si pasa de 1 minuto, achicarlo.
- [ ] Que la pregunta sembrada caiga en vacíos: similitud menor a 0,4 o el modelo dice que no sabe (`gaps/recorder.py`).
- [ ] Que el quiz acepte un tema del informe (umbral de 0,5, `QUIZ_TOPIC_MIN_SIMILARITY`).
- [ ] Que el flujo funcione con los datos del alumno en tablas de Moodle (DATA-05 y DATA-06).
- [ ] Respuesta ensayada a la inyección de prompts.
