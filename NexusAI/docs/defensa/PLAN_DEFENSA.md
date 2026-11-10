# Plan de la defensa oral de la tesis

> Borrador v0.3, 05/11/2026. Propuesta para discutir en equipo.
> Issues: [PI-06 #249](https://github.com/nexusai-ucc/nexusAI/issues/249) (presentación) · [PI-07 #250](https://github.com/nexusai-ucc/nexusAI/issues/250) (last check) · [TEST-01 #264](https://github.com/nexusai-ucc/nexusAI/issues/264) y [TEST-02 #265](https://github.com/nexusai-ucc/nexusAI/issues/265) (usuarios reales).

## Lo definido

- **Fecha:** 20 a 27/02/2027 (el día exacto, a confirmar).
- **Duración:** ~30 minutos de exposición con la demo adentro; las preguntas del tribunal van aparte.
- **Demo en vivo con el público**, que la usa desde el celular. Se espera que la usen entre 30 y 60 personas a la vez.
- **Material del curso de la demo:** la propia tesis.
- **Presentación:** la arma Delfina en Canva. Se puede pagar lo que haga falta para la demo.
- **Parte técnica:** 10 minutos (16–26), bien técnica, con los parámetros reales del código. La demo queda en 8.
- **Servidor:** DigitalOcean. **Modelo:** OpenAI `gpt-4o-mini`.

## Documentos

| Documento | Qué tiene |
|---|---|
| [INVESTIGACION_DEFENSA.md](INVESTIGACION_DEFENSA.md) | Qué recomiendan guías y rúbricas universitarias, con fuentes y límites |
| [GUION_PRESENTACION.md](GUION_PRESENTACION.md) | Los 30 minutos, bloque por bloque, con el texto |
| [BRIEF_CANVA.md](BRIEF_CANVA.md) | 27 diapositivas + 9 de respaldo, con visual, tiempo, orador y fuente |
| [GUION_DEMO.md](GUION_DEMO.md) | La demo con el público, infraestructura, riesgos y plan B |
| [SERVIDOR_DEMO.md](SERVIDOR_DEMO.md) | Paso a paso de las cuentas a crear: DigitalOcean, OpenAI y dominio |
| [PREGUNTAS_TRIBUNAL.md](PREGUNTAS_TRIBUNAL.md) | Preguntas difíciles y cómo responderlas |
| [PRE_ENTREGA.md](PRE_ENTREGA.md) | La pre-entrega con 3 profes (30/11–2/12): 30 minutos más 5 de margen, la demo con roles, el reparto y qué les vamos a preguntar |
| [novedades-check2/](novedades-check2/) | El PDF que el docente sube en vivo en la pre-entrega (borrador; la versión final se cierra el 20/11) |
| [ORDEN_REPO.md](ORDEN_REPO.md) | Propuesta para ordenar issues, PRs, README y CHANGELOG antes de la pre-entrega |

## Lo que falta averiguar con la cátedra

No hay reglamento de la UCC publicado. Mensaje propuesto para Porrini, Carreño y Juarez:

> Hola. Estamos preparando la defensa oral de NexusAI y queremos confirmar algunos puntos:
>
> 1. ¿Qué día y horario tenemos? ¿Los ~30 minutos de exposición incluyen la demo? ¿Cuánto tiempo hay para preguntas?
> 2. ¿Quiénes integran el tribunal? ¿Hay alguien externo?
> 3. ¿Se evalúa a cada integrante por separado? ¿Hay una rúbrica que podamos ver?
> 4. ¿La defensa es abierta al público? Queremos hacer una demo en la que el público use el sistema desde el celular: ¿hay algún inconveniente?
> 5. ¿En qué sala es? ¿Hay proyector con HDMI, enchufes y señal de celular? ¿Podemos probar antes?
> 6. ¿Qué hay que entregar antes y en qué formato?
> 7. ¿Cuándo sería el last check?
>
> Gracias.

**Para confirmar en el equipo:** qué pasó con el Check 2 del 03/11.

## Reparto propuesto

Los tres hablan: así lo pide, por ejemplo, el reglamento de la UNT, y lo más probable es que la UCC también.

| Responsable | En la exposición | Preparación |
|---|---|---|
| **Delfina** | Apertura, problema, cierre. En la demo maneja la pantalla | Canva, guion de la demo, coordinación de ensayos |
| **Santiago** | Objetivo, cómo funciona, proceso, resultados. En la demo, control y plan B | Servidor de la demo, configuración del modelo, acceso a la VM (la cuenta de Oracle hoy es personal) |
| **Marcos** | Decisiones y calidad. En la demo narra | Moodle y curso de la demo, cuentas, PDF sembrado, prueba de carga a través de Moodle |

## Presupuesto (a confirmar con cotizaciones reales)

| Concepto | Estimado | Cuándo |
|---|---|---|
| Droplet de DigitalOcean: 2 vCPU / 4 GB en diciembre, 4 vCPU / 8 GB en enero y febrero | ~US$ 24 + 2 × 48 ≈ US$ 120 (o crédito del Student Pack, a confirmar) | Desde el 14/12 |
| Dominio | ~US$ 12 | Diciembre |
| Créditos del modelo (ensayos, prueba de carga y demo) con tope de gasto | US$ 50 | Diciembre |
| Tarjetas impresas para el público | Poco | Febrero |

Los precios del servidor salen de sitios de terceros; los del modelo, de la documentación de OpenAI. Hay que confirmarlos antes de contratar. El entorno ya está automatizado en `NexusAI/deploy/demo/` (PR aparte). En local, con el LLM simulado, se comprobó la instalación, las 71 cuentas, el informe indexado y el chat de un invitado a través de Caddy hasta el evento `done`. Falta ver el texto en streaming con el modelo real: el simulado no hace streaming.

## Riesgos

| Riesgo | Qué hacemos |
|---|---|
| **No se cumplió el objetivo de evaluar con usuarios reales**: está en el informe y #264/#265 siguen abiertas | Piloto en noviembre, antes de que terminen las clases. Si no se llega, decirlo tal cual en Resultados |
| La interacción no aguanta 60 personas: nunca se probó la carga a través de Moodle | Prueba con 60 navegadores en enero. Decisión de avance el 31/01 ([GUION_DEMO.md](GUION_DEMO.md)) |
| El público escribe algo inapropiado y se proyecta | Moderación activa, y Santiago revisa antes de proyectar |
| Falla la red del público | Moodle público: cada uno usa sus datos. Si falla, la demo sigue en la pantalla |
| Falla el modelo | Modelo pago con fallback configurado |
| Números viejos en la presentación | Cada número del brief tiene su fuente; se recuentan en febrero |
| Nadie más que Santiago puede operar las VMs | Darle acceso a otro integrante o documentar el procedimiento |

## Cronograma

| Cuándo | Qué | Responsable |
|---|---|---|
| Semana del 09/11 | Mensaje a la cátedra. Reunión de equipo. Rotar las credenciales de Railway si se reutilizaron (§Urgente) | Todos / Santiago |
| Noviembre | Piloto con usuarios reales | A definir |
| Hasta 14/12 | Cierre del Sprint G y congelamiento de funcionalidades. Primer borrador del Canva | Todos / Delfina |
| Hasta 20/12 | Servidor contratado; Moodle, curso, cuentas y PDF sembrado listos | Santiago, Marcos |
| Enero | Prueba de carga con 60 navegadores. Primer ensayo con amigos y sus celulares. Correcciones del informe | Marcos / Todos |
| 31/01 | Decisión de avance sobre la interacción del público | Todos |
| 01/02 | PI-06: Canva y speech listos, 2 ensayos | Todos |
| 01 a 07/02 | PI-07: last check | Todos |
| 08 a 19/02 | 3 ensayos cronometrados: uno con 30 o más personas reales, uno con el plan B forzado y uno frente a alguien externo. Grabar el video de respaldo | Todos |
| Día anterior | Prueba punta a punta en la sala. No se cambia nada más | Todos |
| Después | Apagar el servidor, borrar las cuentas, rotar claves | Santiago |

## Correcciones del informe antes de la defensa

**El informe vigente es `informe-ipi/informe-ipi.docx`** (23/10, 110 páginas en PDF), no el `.md`. El `.md` quedó como versión anterior, según `informe-ipi/README.md`. Una versión previa de este plan listaba bloques `PENDIENTE`, una Conclusión desactualizada y la Figura 2a: todo eso salía del `.md` viejo. El `.docx` no tiene esos problemas.

Lo que de verdad falta está en la tabla de resultados de 8.6. Son dos filas marcadas "Pendiente", y son las que dejan "Parcial" el objetivo 6 en la Tabla 21 de la Conclusión:

- **Latencia hasta el primer token (RNF-06, meta < 2 s):** no se midió por separado. Se mide en el servidor de la demo con el modelo real.
- **Fidelidad y honestidad de la evaluación automatizada:** solo se pudieron medir 2 de 8 y 0 de 4 casos, porque se agotó la cuota de Gemini. Hay que volver a correr `services/api/scripts/eval_rag.py` con OpenAI.

Las dos dependen de la key de OpenAI (PRE-01) y se siguen en PRE-08 (#686). La evaluación con usuarios reales (#264, #265) sigue siendo una decisión del equipo.

## Urgente, fuera de la defensa

`pendrive/07_Acceso_Sistema.md` y `entrega-final/99_anexos.md` tienen una API key y un shared secret del backend de Railway, y **el repo es público**. Railway ya responde 404. Hay que comprobar si esos valores se reutilizaron en Oracle y rotarlos si coinciden.
