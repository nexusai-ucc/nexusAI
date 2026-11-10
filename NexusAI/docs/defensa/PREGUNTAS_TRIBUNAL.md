# Preguntas probables del tribunal

> Borrador v0.2, 05/11/2026. Complementa `docs/contexto-demo-preguntas.md`, que explica cómo está hecha cada función y sigue vigente. Esto cubre las preguntas difíciles que ese documento no toca. Las marcadas con **[completar]** dependen de algo que todavía no pasó.

**Regla general:** si algo no se hizo, se dice. Una limitación explicada suma; un número que no se sostiene ante una repregunta resta.

## Validación

**¿Lo probaron con usuarios reales?**
**[completar con el piloto]** Hoy: TEST-06 (mayo) sumó feedback de 3 a 5 compañeros de la UCC. El protocolo formal (#264, #265) sigue pendiente, y el informe lo declara como limitación. No se puede afirmar una mejora del aprendizaje: lo que tenemos es una necesidad relevada y un sistema probado técnicamente.

**El objetivo decía evaluar el impacto con usuarios reales. ¿Lo cumplieron?**
**[completar con el piloto]** Es un objetivo específico del informe, así que no alcanza con mencionarlo como limitación: hay que decir qué se hizo, qué no y por qué.

**¿Cómo saben que las respuestas son correctas?**
Hay citas para verificar cada respuesta y una evaluación automatizada con *golden set*. El informe la marca como incompleta: falta re-correr *faithfulness* y ampliar a 30 a 50 preguntas con un docente real. **[completar si se hace antes de febrero]**

**¿Los beneficios del informe están medidos?**
No. Están redactados como beneficios esperados. La medición es trabajo futuro, salvo lo que aporte el piloto.

**¿El 100 % de los alumnos usa IA? ¿No es un sesgo de la encuesta?**
Sí, hay que reconocerlo. Son los 88 que vieron esa pregunta, y el formulario no ofrecía una opción negativa: el propio informe lo aclara. El dato más sólido es el 80,7 % sobre dispersión de la información (n=166).

## Escala y rendimiento

**¿Cuántos alumnos aguanta?**
Con el modelo simulado, en un backend efímero de CI: 100 usuarios simultáneos, 99,95 % de éxito, p95 de 2,52 s. Esa prueba mide nuestro código. Con el modelo real en staging se probó poco volumen: 2 usuarios, p95 de 4 a 5 s. **No decir que producción soporta 100 alumnos:** la VM tiene 1 GB de RAM y la cuota del proveedor también limita. **[completar con la prueba de enero: 60 navegadores a través de Moodle, con el modelo real]** Lo que vieron en la demo es lo más cercano a uso real que tenemos.

**¿Y si se cae el proveedor de IA?**
Hay una cadena de fallback configurable y el proveedor se cambia por variable de entorno. La prueba diaria contra Gemini falló casi siempre desde octubre, por alta demanda y timeouts. Esa prueba existe para detectar esto. Por eso, una institución debería usar un modelo pago con SLA. Si hay que cambiar el modelo de embeddings por otro de distinta dimensión, hay que reindexar el material.

## Privacidad

**¿Los datos salen de la universidad?**
Los datos del alumno y el material quedan en la infraestructura de la institución. **La pregunta y los fragmentos del material sí van al proveedor del LLM**, sin la identidad del alumno. Hay que decirlo completo: "no salen" a secas es falso. Una institución que no quiera ni eso necesitaría un modelo autohospedado. **[confirmar: el informe no registra que se haya probado]**

**¿Por qué pasaron los datos del alumno a Moodle?**
Para que el backend sea sin estado respecto del alumno y que la institución tenga los datos en su propio sistema, con la Privacy API, el backup y los permisos de Moodle (ADR-014). **[completar: confirmar si el corte se hizo en producción]**

**¿Cumplen la ley de datos personales?**
Ver informe §Estrategia de privacidad y cumplimiento normativo (Ley 25.326 y RGPD). El informe plantea coordinarlo con el área legal de la universidad. **[confirmar si se hizo: si no, aclarar que el análisis es nuestro]**

## Costos

**¿Cuánto cuesta en serio?**
Estimado: ~$2.906 al año para 500 alumnos ($5,81 por alumno), con ~$1.296 de IA y ~$1.440 de mantenimiento. Hoy es casi gratis porque usamos capas gratuitas, y eso no se sostiene en producción. El registro de consumo por llamada (`llm_usage`) permite medir el costo real: **[completar con un dato real del piloto si hay]**.

**¿Qué pasa si un alumno abusa?**
Hay rate limiting por usuario: en la prueba de carga, de 30 preguntas simultáneas de un alumno se respondieron 20 y se cortaron 10 con 429. El widget también tiene una barra de consumo (`BudgetBar`). **[verificar cómo funciona antes de afirmarlo]**

## Decisiones

**¿Por qué no usar el asistente de IA de Moodle o un producto comercial?**
El informe tiene la matriz comparativa (§Opciones similares en el mercado). Lo central: RAG automático sobre el material del curso, citas, vacíos para el docente y autohospedaje.

**¿Por qué no entrenaron un modelo?**
Habría que reentrenar por materia y cada vez que cambia el material. RAG incorpora material nuevo sin tocar el modelo, y permite citar. Lo vieron en la demo.

**¿Por qué pgvector y no una base vectorial?**
Una sola base para datos y vectores, menos operación y suficiente para esta escala (ADR-002).

**¿Por qué un monolito?**
Equipo de 3, sin necesidad de escalar partes por separado (ADR-001). Está organizado en módulos.

**¿Qué cambiaron respecto del plan?**
Lo más grande: no estuvo disponible la infraestructura de la UCC, así que pasamos a Oracle Always Free (ADR-011), y el proyecto siguió bastante más allá del MVP.

## Proceso y equipo

**¿Qué hizo cada uno?**
**[completar entre los tres]** Cada uno debería poder explicar también el trabajo de los otros, a nivel general. Conviene preguntarse esto entre nosotros en un ensayo.

**¿Usaron IA para desarrollar?**
**[acordar la respuesta en equipo]** Es muy probable en un proyecto de IA. Tiene que ser honesta y consistente entre los tres, y cada uno tiene que poder defender su código.

**¿Qué harían distinto?**
**[completar entre los tres]** Candidatos con evidencia: empezar la validación con usuarios antes; las pruebas de carga llegaron tarde y encontraron DEF-09; el deploy de producción sigue siendo manual.

**¿Qué sigue?**
CURSO-01 (activar por curso), caché y banco de preguntas para bajar costos (COST-02 a 04), backups automáticos (INFRA-04) y una prueba piloto institucional. **[actualizar al 14/12]**

## En la demo

**¿Esto es producción?**
Hay que decir exactamente qué están viendo. Es un servidor exclusivo para la demo, con Moodle 4.5, el plugin publicado en el directorio de Moodle y el backend, configurado con un modelo pago. **[verificar que la versión coincida con la publicada]** El ambiente de producción del proyecto es otro (Oracle).

**¿Qué pasa con lo que escribimos recién?**
Las cuentas no tienen datos personales y se borran después de la defensa, junto con el servidor de la demo. Las preguntas se enviaron al proveedor del modelo, igual que en el uso normal.

**Alguien intentó romperlo con una inyección de prompts. ¿Qué pasó?**
Hay moderación de entrada y un guardrail en el prompt del sistema (`_meta_guard` en `chat/router.py`): responde solo sobre el material. Ningún guardrail es perfecto, y por eso las respuestas citan la fuente: se pueden verificar.

**¿Por qué el quiz no lo hicimos todos?**
Cada quiz lo genera el modelo. Con 60 a la vez, la demo dependería de la cuota del proveedor sin probar nada nuevo. En uso real, cada alumno genera el suyo cuando lo necesita.
