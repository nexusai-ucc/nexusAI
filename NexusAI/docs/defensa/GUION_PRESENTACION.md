# Guion de la presentación

> Borrador v0.1, 05/11/2026. Primera versión para corregir entre los tres: el texto es para hablar, no para leer. Asume 15 minutos y el reparto de [PLAN_DEFENSA.md](PLAN_DEFENSA.md), ambos a confirmar. Reemplaza a `entrega-final/presentacion/script-defensa.md`, que es del MVP: habla de Railway, deja afuera a Marcos y sus números ya no valen.

| Bloque | Min | Quién | Diapositivas |
|---|---|---|---|
| 1. Problema | 2 | Delfina | 2 o 3 |
| 2. Solución y arquitectura | 2 | Santiago | 2 |
| 3. Demo en vivo | 6 | Delfina y Marcos, con Santiago en el plan B | 1 |
| 4. Ingeniería | 3 | Marcos | 3 |
| 5. Resultados y costos | 1,5 | Santiago | 2 |
| 6. Cierre | 0,5 | Delfina | 1 |

## 1. Problema · Delfina (2 min)

> Los alumnos ya estudian con IA: los 88 que respondieron esa pregunta de nuestra encuesta usan alguna herramienta. Pero esas herramientas no conocen el material de la materia.
>
> Al mismo tiempo, el 80,7 % de 166 estudiantes percibe que la información de sus materias está dispersa: el campus, WhatsApp, Drive.
>
> Del otro lado, el docente no se entera de qué están preguntando sus alumnos. Y encuestamos a 17 docentes: el 88,2 % le delegaría tareas a una IA integrada al campus, pero casi la mitad solo si puede revisar antes de publicar.
>
> Entonces la pregunta fue: ¿se puede tener un asistente que responda con el material real, dentro del campus, y que además le sirva al docente?

*Cuidado con el dato de los 88: el formulario no ofrecía una opción negativa, y el informe pide interpretarlo con cautela. Usarlo como contexto y no como prueba. Ver [PREGUNTAS_TRIBUNAL.md](PREGUNTAS_TRIBUNAL.md).*

## 2. Solución y arquitectura · Santiago (2 min)

> NexusAI es un plugin de Moodle. No es una app aparte: el alumno lo usa dentro del curso, y está publicado en el directorio oficial de plugins de Moodle.
>
> Usa RAG: en lugar de responder de memoria, busca en el material indexado y responde citando la fuente. Si no encuentra, lo dice.
>
> Son tres capas. El navegador nunca habla directo con el backend: todo pasa por el plugin, que firma cada pedido con HMAC. Así la clave del proveedor de IA nunca llega al navegador.
>
> Todo vive en una sola base, PostgreSQL con pgvector, y el proveedor de IA se cambia por configuración.
>
> Pero esto se entiende mejor funcionando.

**Diapositiva:** diagrama de 3 capas (`docs/diagrams/architecture.md`).

## 3. Demo en vivo (6 min)

Ver [GUION_DEMO.md](GUION_DEMO.md). La diapositiva anterior nombra lo que no se va a mostrar: voz, foros, calendario, flashcards, resumen semanal.

## 4. Ingeniería · Marcos (3 min)

> Lo que vieron no es un prototipo armado para hoy. Tiene un proceso atrás.
>
> **Calidad.** Cada cambio pasa por pruebas en tres lenguajes y por un quality gate. La cobertura subió del 56,6 % al 83,6 %. En SonarCloud pasamos de 26 bugs y 14 vulnerabilidades a cero, con calificación A en confiabilidad, seguridad y mantenibilidad.
>
> Registramos 10 defectos reales. El que más nos enseñó: con 40 usuarios simultáneos, el chat colapsaba porque cada pedido retenía una conexión a la base mientras esperaba al modelo. Ninguna prueba funcional lo mostraba: lo encontró la prueba de carga. Después del arreglo, el backend aguanta 100 usuarios simultáneos con un p95 de 2,5 segundos, medido con el modelo simulado para aislar nuestro código.
>
> **Seguridad y privacidad.** Hicimos una auditoría OWASP Top 10, y el plugin implementa la Privacy API de Moodle. Los datos del alumno ahora viven en las tablas de Moodle, no en el backend.
>
> **Accesibilidad.** Auditamos el widget y el panel docente contra WCAG 2.2 y corregimos los hallazgos.
>
> **Marketplace.** Moodle revisa cada plugin antes de publicarlo. Nos marcó 16 puntos, los corregimos y hoy está publicado.

*Fuentes:* `docs/calidad/METRICAS.md`, `REGISTRO_DEFECTOS.md` (DEF-09), `PRUEBAS_DE_CARGA.md`, `docs/security/owasp-audit-2026-08.md`, `docs/calidad/accesibilidad/AUDITORIA_ACCESIBILIDAD.md`, informe §Publicación en Moodle Marketplace.

*A confirmar:* si para febrero se hizo el corte de datos en producción (`docs/CORTE_DATOS_MOODLE.md`). Si no, decir "el plugin ya está preparado para".

## 5. Resultados y costos · Santiago (1,5 min)

> El MVP se entregó en fecha en junio, y después sumamos las funciones que acaban de ver y otras. De los objetivos específicos, [completar: cuáles se cumplieron. La evaluación con usuarios reales depende del piloto].
>
> En costos: estimamos unos 2.900 dólares al año para 500 alumnos, incluido el mantenimiento. Son 5,81 dólares por alumno por año. Es una estimación, porque todavía no operó a esa escala.
>
> Y hay límites que queremos decir: [completar con el resultado del piloto, o con lo que no se llegó a validar]. La calidad de la respuesta depende del material y de un proveedor externo, y eso lo vimos: la latencia de ese proveedor es lo que más varía.

*Fuentes:* informe §Impacto económico. **No usar los números del guion viejo** (420 h a $25 o "$100 por mes"): la versión vigente es 840 h a ~$12 y ~$2.906 al año.

## 6. Cierre · Delfina (30 s)

> Arrancamos con alumnos que le preguntaban a una IA que no conocía su materia, y docentes que no se enteraban de nada. Hoy esa pregunta se responde con el material del curso, y cuando el material no alcanza, el docente lo sabe. Gracias.

## Criterios para el deck

- Una idea por diapositiva y poco texto: el discurso está en este guion.
- Sin capturas de texto largo: lo que importa se ve en la demo.
- Una diapositiva de respaldo por tema probable del tribunal, después del cierre: arquitectura detallada, costos, resultados de carga y privacidad.
- Reutilizar lo que sirva de `entrega-final/presentacion/index.html`, pero con los datos de este guion.
