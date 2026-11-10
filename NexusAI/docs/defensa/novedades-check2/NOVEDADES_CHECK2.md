---
title: "NexusAI: novedades desde el Check 2"
subtitle: "Proyecto Integrador de Ingeniería en Sistemas, UCC. Delfina Salinas, Santiago Tricherri y Marcos Bugliotti"
date: "Borrador del 06/11/2026. La versión final se cierra el 20/11/2026"
lang: es
---

<!--
NOTA PARA EL EQUIPO (no sale en el PDF). PRE-04, #682.

Este documento es la fuente de la pregunta sembrada de la pre-entrega: "¿Qué cambió desde el Check 2?".
- NO se sube al curso antes de la demo: lo sube el profe que hace de docente, en vivo.
- El informe no menciona el Check 2. Por eso, antes de subir este PDF, la pregunta cae en vacíos.
- Cada sección empieza nombrando "el Check 2", así el fragmento que se recupera tiene contexto aunque se lea suelto (chunks de 512 tokens).
- Antes del 20/11, hay que reemplazar todos los [COMPLETAR] y borrar lo que no se haya hecho. Este documento lo lee el asistente y se lo muestra a los profes: no puede decir nada que no sea cierto.
- Generar el PDF con ./build.sh. El nombre del archivo, novedades-check2.pdf, no lleva espacios ni acentos para que la píldora de la fuente lo reconozca.
-->

# Resumen

Desde el Check 2 del Proyecto Integrador, el 3 de noviembre de 2026, el equipo de NexusAI trabajó en tres frentes:

1. dejar listo un entorno de demostración público, con un modelo de IA pago, para que cualquier persona pueda usar NexusAI desde su celular;
2. preparar la defensa oral de la tesis de febrero de 2027;
3. cerrar las correcciones pendientes del informe y ordenar el repositorio.

Esta pre-entrega es el primer ensayo de esa demostración.

# Lo que presentamos en el Check 2

[COMPLETAR por el equipo: qué se entregó y qué se mostró en el Check 2. Por ejemplo, el informe en su versión final con las correcciones de la autocorrección de la cátedra, la auditoría de accesibilidad WCAG 2.2 AA del plugin, la aprobación del plugin en el directorio oficial de Moodle y el cierre del TP de Calidad de Software. Y qué devolución tuvimos.]

# Novedad 1: un entorno de demostración público

Hasta el Check 2, NexusAI corría en dos lugares:

- un ambiente de *staging*, que se despliega solo con cada cambio;
- un servidor de Oracle Cloud de 1 GB de memoria, que alcanza para el backend pero no para Moodle.

No había un Moodle público donde alguien de afuera del equipo pudiera usar el asistente.

Desde el Check 2 armamos un entorno de demostración completo, que se levanta en un solo servidor con dos scripts. Incluye:

- Moodle 4.5;
- el plugin `local_nexusai`;
- el backend en FastAPI;
- PostgreSQL con pgvector y Redis;
- un proxy Caddy que obtiene el certificado HTTPS solo.

El único puerto público es el del proxy. El backend solo se puede alcanzar desde la red interna.

El servidor es de DigitalOcean y usa un modelo pago de OpenAI:

- **Chat:** `gpt-4o-mini`.
- **Embeddings:** `text-embedding-3-small`, pedido en 768 dimensiones para que sea compatible con el índice vectorial existente.
- **Por qué uno pago:** la prueba diaria contra la capa gratuita de Gemini falló casi todos los días de octubre por alta demanda, y en una demostración en vivo no podemos depender de eso.

[COMPLETAR con PRE-03: dirección del servidor, tiempo de la primera respuesta medido desde un celular con datos móviles.]

# Novedad 2: cuentas y tarjetas para el público

Para que el público use NexusAI desde el celular sin registrarse, desde el Check 2 agregamos un script que genera las cuentas y las tarjetas:

- crea una cuenta de alumno por persona (`invitado01`, `invitado02` y así);
- crea una cuenta de docente;
- imprime tarjetas con un código QR que lleva directo al curso.

Las cuentas tienen límites a propósito:

- son solo de ese curso;
- no tienen mensajería;
- no pueden editar el perfil ni ver a los otros participantes.

Cada cuenta tiene su propio límite de consultas. La moderación de contenido está configurada para que, si ella misma falla, el mensaje no pase.

El curso de la demostración se llama "NexusAI: la tesis" y su material es el propio informe del proyecto.

# Novedad 3: la preparación de la defensa oral

Desde el Check 2 empezamos a preparar la defensa de febrero de 2027. Para eso:

- **Investigamos** cómo se organizan las defensas de tesis de Ingeniería en Sistemas en universidades de Argentina y de afuera.
- **Definimos el orden de la presentación:** se empieza con un ejemplo concreto, la idea principal aparece en los primeros minutos y se cierra con los aportes.
- **Armamos una parte técnica de 10 minutos.** Sigue una pregunta real del público desde el celular hasta la respuesta: arquitectura, indexación, búsqueda, detección de vacíos, seguridad, resiliencia, el defecto de concurrencia DEF-09 y el proceso de calidad.
- **Diseñamos una demostración** en la que el público usa NexusAI sobre la tesis y ve en vivo cómo el docente detecta un vacío del material y lo completa.

Esta pre-entrega es un ensayo general de esa defensa: tiene la misma duración y la misma parte técnica.

# Novedad 4: correcciones del informe y orden del repositorio

Desde el Check 2 también ordenamos el repositorio del proyecto:

- cerramos 31 issues cuyo trabajo ya estaba terminado, cada una con el *pull request* que la resolvió;
- pusimos al día el README y el CHANGELOG con la versión 0.19.0 del plugin, la publicada en el directorio oficial de Moodle.

[COMPLETAR con PRE-08: los resultados de las dos mediciones que faltaban en el informe. Son la latencia hasta el primer token, con meta menor a 2 segundos, y la fidelidad y honestidad de las respuestas, que antes no se pudieron medir porque se agotó la cuota de Gemini.]

# Lo que falta hasta la defensa

Desde el Check 2 tenemos identificado lo que falta hasta la defensa de febrero:

- **Evaluación con usuarios reales.** [COMPLETAR: plan acordado, fechas y cantidad de personas.]
- **Prueba de carga a través de Moodle,** con unos 60 navegadores a la vez y el modelo real. Es para confirmar que la demostración con público aguanta. Hasta ahora la carga se midió directo contra el backend y con un modelo simulado.
- **Ensayos de la defensa completa,** con la presentación, la demo y las preguntas.
