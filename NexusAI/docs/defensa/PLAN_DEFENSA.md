# Plan de la defensa final

> Borrador v0.1, 05/11/2026. Propuesta para discutir en equipo: nada de lo que sigue está decidido.
> Issues: [PI-06 #249](https://github.com/nexusai-ucc/nexusAI/issues/249) (presentación y speech) · [PI-07 #250](https://github.com/nexusai-ucc/nexusAI/issues/250) (last check) · [TEST-01 #264](https://github.com/nexusai-ucc/nexusAI/issues/264) y [TEST-02 #265](https://github.com/nexusai-ucc/nexusAI/issues/265) (usuarios reales).

**Fecha:** 20 a 27/02/2027 (día exacto a confirmar).

**Documentos relacionados:** [guion de la presentación](GUION_PRESENTACION.md) · [guion de la demo](GUION_DEMO.md) · [preguntas del tribunal](PREGUNTAS_TRIBUNAL.md).

## 1. Lo que hay que averiguar primero

En el repo no hay ninguna consigna de la cátedra sobre la defensa. Los 15 minutos salen de nuestro WBS (`entrega-final/06_wbs.md`). Todo este plan asume 15 minutos y se reajusta con la respuesta.

**Mensaje propuesto para Porrini, Carreño y Juarez** (lo manda alguien del equipo):

> Hola. Estamos empezando a preparar la defensa final de NexusAI y queremos confirmar algunos puntos:
>
> 1. ¿Qué día y horario tenemos, y cuánto dura la exposición? ¿Cuánto tiempo hay para preguntas?
> 2. ¿La demo en vivo es obligatoria? ¿Tiene un tiempo aparte o entra en la exposición?
> 3. ¿Quiénes integran el tribunal? ¿Hay alguien externo a la cátedra?
> 4. ¿Tienen que hablar los tres integrantes? ¿Se evalúa a cada uno por separado?
> 5. ¿En qué sala es? ¿Hay proyector con HDMI, wifi abierto y enchufes? ¿Podemos probar antes?
> 6. ¿Qué hay que entregar antes y en qué formato (informe, pendrive, presentación)?
> 7. ¿Hay una rúbrica o criterios de evaluación que podamos ver?
> 8. ¿Cuándo sería el last check, y qué esperan ver en esa instancia?
>
> Gracias.

**También para confirmar en el equipo:** si se entregó el Check 2 del 03/11 y qué devolución hubo. El repo no lo registra.

## 2. Decisiones a tomar en la primera reunión

| # | Decisión | Propuesta | Por qué |
|---|---|---|---|
| 1 | Demo en vivo o video | En vivo, con video de respaldo | Es el sistema real. El respaldo baja el riesgo |
| 2 | Modelo de la demo | Modelo pago, sin capa gratuita de Gemini | Integración externa: 1 corrida verde de 19 desde el 19/10, con 503 y hasta 188 s |
| 3 | Dónde corre Moodle | Notebook principal y otra idéntica de respaldo | No hay Moodle desplegado y no entra en la VM de 1 GB (`DEPLOY_ORACLE.md`) |
| 4 | Fecha de congelamiento | 14/12, cierre del Sprint G | Después solo se corrigen errores |
| 5 | Piloto con usuarios reales | Hacerlo en noviembre, aunque sea chico | **Es un objetivo específico del informe** (ver §4), y la pregunta más probable del tribunal |
| 6 | Reparto | El de §3 | Cada uno habla de lo que hizo. A confirmar |

## 3. Reparto propuesto

| Responsable | En la exposición | Preparación |
|---|---|---|
| **Santiago** | Solución y arquitectura, resultados y costos. En la demo vigila el plan B | Backend de demo y acceso a la VM. Cuenta de Oracle: hoy es personal, hay que darle acceso a un segundo integrante o documentar el procedimiento |
| **Delfina** | Problema y cierre. En la demo maneja la pantalla | Guion de la demo, deck, coordinación de ensayos |
| **Marcos** | Ingeniería (calidad, seguridad, accesibilidad, Marketplace). En la demo narra | Moodle de demo, corpus, video de respaldo |

El piloto (#264, #265) y la corrección del informe se reparten en la reunión.

## 4. Riesgos

| Riesgo | Evidencia | Qué hacemos |
|---|---|---|
| El LLM falla o tarda en vivo | Corridas de `integration-external.yml`. Producción usa `gemini-2.5-flash` | Decisión 2. Plan B en [GUION_DEMO.md](GUION_DEMO.md) |
| Falla el Moodle de la demo | El Moodle local de Delfina tiene el plugin 0.17.9 y el repo 0.19.0. Corre en notebook | Armar desde cero con la versión congelada. Segunda notebook |
| Se cambia de proveedor y dejan de servir los vectores | Embeddings de Gemini de 768d contra 1536d de OpenAI | Definir el modelo de embeddings antes de indexar el corpus. Confirmar cuál usa staging |
| **Objetivo sin cumplir: evaluación con usuarios reales** | El informe se propone "evaluar el impacto de la solución mediante pruebas con usuarios reales y métricas de calidad de respuesta". #264 y #265 siguen abiertas; solo existe TEST-06 (3 a 5 compañeros, mayo) | Piloto en noviembre. Si no se llega, decirlo tal cual y ajustar el informe con la cátedra (ver [PREGUNTAS_TRIBUNAL.md](PREGUNTAS_TRIBUNAL.md)) |
| Número mal citado | El guion anterior habla de Railway y de 420 h a $25; el informe, de Oracle y de 840 h a $12 | Cada número del deck sale del informe o de `docs/calidad/`, con fuente anotada |
| Nadie más puede operar la VM | Cuenta de Oracle personal | Ver §3 |

## 5. Cronograma

| Cuándo | Qué | Responsable |
|---|---|---|
| **Semana del 09/11** | Mandar el mensaje a la cátedra. Primera reunión y decisiones de §2 | Todos |
| **Noviembre** | Piloto con usuarios reales. Tiene que ser antes de que terminen las clases: confirmar fechas con el calendario de la UCC | A definir |
| **Hasta 14/12** | Cierre del Sprint G y congelamiento de funcionalidades. Corpus de demo definitivo | Todos |
| **Diciembre** | Primer borrador del deck y primer ensayo interno de la demo | Delfina, Marcos |
| **Enero** | Entorno armado en las 2 notebooks, video de respaldo, informe corregido (§6) | Marcos, Santiago |
| **01/02/2027** | PI-06: deck y speech listos, 2 ensayos hechos | Todos |
| **01 a 07/02** | PI-07: last check e incorporación del feedback | Todos |
| **08 a 19/02** | 3 ensayos cronometrados: uno con plan B forzado y otro frente a alguien externo. En la sala, si se puede | Todos |
| **Día anterior** | Prueba punta a punta. No se mergea nada más | Todos |

El milestone "Post-MVP Entrega Final" vence el 29/11, pero PI-06 y PI-07 son de febrero. Conviene corregir esa fecha.

## 6. Correcciones del informe antes de la defensa

Encontradas al revisar `informe-ipi/informe-ipi.md` en `development`:

- **Quedaron 2 bloques `PENDIENTE`:** en la tabla de trazabilidad de Objetivos ("Evaluación con usuarios reales") y al final de Pruebas (modelo de fallback, *faithfulness*, dataset de 30 a 50 preguntas).
- **La Conclusión está desactualizada:** lista como trabajo futuro la publicación en el directorio de Moodle, los tests de frontend y el agrupamiento semántico de vacíos. Las dos primeras ya están hechas y el código de `gaps/router.py` ya agrupa por embeddings.
- **Falta anunciar la Figura 2a:** el commit `9905d10` lo resolvía pero quedó afuera de `development`.
- **Faltan páginas:** el objetivo son ~100 y el último PDF contado tiene 74, en una versión anterior. Hay que recontar sobre la versión final.

## 7. Fuera de la defensa, pero urgente

`pendrive/07_Acceso_Sistema.md` y `entrega-final/99_anexos.md` tienen una API key y un shared secret del backend de Railway, y **el repo es público**. Railway ya responde 404. Hay que comprobar si esos valores se reutilizaron en Oracle y rotarlos si coinciden. Esos archivos también describen como activo un backend que ya no existe, y el README del pendrive no nombra a Marcos: hay que corregirlo si el pendrive se vuelve a entregar.
