# Guion de la presentación: 30 minutos

> v0.2, 05/11/2026. Primera versión para corregir entre los tres. El texto es para decirlo con palabras propias, no para leerlo. El diseño diapositiva por diapositiva está en [BRIEF_CANVA.md](BRIEF_CANVA.md) y el porqué del orden, en [INVESTIGACION_DEFENSA.md](INVESTIGACION_DEFENSA.md). El reparto es una sugerencia.
>
> Reemplaza a `entrega-final/presentacion/script-defensa.md`, que es del MVP: habla de Railway, no incluye a Marcos y sus números ya no valen.

**Idea clave**, la frase que el tribunal tiene que llevarse: **la IA responde con el material del curso, y lo que no sabe se lo avisa al docente.**

| Min | Bloque | Quién |
|---|---|---|
| 0–3 | Apertura | Delfina |
| 3–6 | Problema | Delfina |
| 6–8 | Objetivo y aportes | Santiago |
| 8–17 | Demo con el público | Delfina, Marcos y Santiago |
| 17–20 | Cómo funciona | Santiago |
| 20–22 | Decisiones | Marcos |
| 22–25 | Calidad | Marcos |
| 25–26:30 | Proceso | Santiago |
| 26:30–29 | Resultados | Santiago |
| 29–30 | Aportes | Delfina |

## 0–3 · Apertura · Delfina

Sin índice y sin "buenas tardes, somos el grupo…". Arranca con la escena.

> Una alumna de Sistemas Inteligentes tiene parcial mañana y le pregunta a un chat de IA cómo se evalúa un clustering. La respuesta es correcta, pero no es la de su materia: no usa la notación del profesor, no dice en qué apunte está y, si se equivoca, ella no tiene forma de saberlo.
>
> La misma pregunta, dentro de su campus [captura de NexusAI]: responde con el material de la cátedra y dice de dónde lo sacó.
>
> Y si el material no lo cubre, pasa algo más: el profesor se entera.

Mientras la diapositiva muestra las dos respuestas: "Somos Delfina, Santiago y Marcos, y esto es NexusAI".

## 3–6 · Problema · Delfina

> No lo supusimos: lo medimos. Encuestamos a 166 estudiantes y 17 docentes de la UCC.
>
> El 80,7 % de los estudiantes percibe que la información de sus materias está dispersa: el campus, WhatsApp, Drive.
>
> Los 88 que respondieron la pregunta sobre IA ya la usan para estudiar. El problema es que no conoce su materia.
>
> Y del lado docente, el 88,2 % le delegaría tareas a una IA integrada al campus. Pero casi la mitad pone una condición: poder revisar antes. Quieren estar en el circuito, no afuera.

*Cuidado:* el dato de la IA no tiene opción negativa en el formulario. Se usa como contexto, no como prueba (ver [PREGUNTAS_TRIBUNAL.md](PREGUNTAS_TRIBUNAL.md)).

## 6–8 · Objetivo y aportes · Santiago

> Nos propusimos un asistente dentro de Moodle que responda solo con el material de cada curso, citando la fuente, y que le devuelva al docente lo que el material no cubre.
>
> Los aportes, que vamos a demostrar en los próximos minutos:
> 1. Un plugin publicado en el directorio oficial de Moodle, que se instala como cualquier otro.
> 2. RAG con citas verificables y que admite lo que no sabe.
> 3. Un circuito con el docente: los vacíos del material le llegan.
> 4. Un proceso de ingeniería medido: pruebas, calidad, seguridad y accesibilidad.

En esta diapositiva aparece el QR: "Saquen el celular: van a ser los alumnos".

## 8–17 · Demo con el público

Ver [GUION_DEMO.md](GUION_DEMO.md).

## 17–20 · Cómo funciona · Santiago

> Volvamos a una de las preguntas que hicieron recién: [la que eligió el tribunal].

Se sigue el recorrido de esa pregunta real:
1. El navegador la manda al plugin de Moodle, nunca directo al backend. El plugin la firma con HMAC, así que la clave del proveedor de IA nunca llega al celular.
2. El backend la convierte en un vector y busca los fragmentos más parecidos del material en PostgreSQL con pgvector (similitud coseno, top 5).
3. Si la similitud es baja o el modelo dice que no está en el material, queda registrada como vacío: eso es lo que vieron en el panel.
4. Con esos fragmentos, el modelo responde en streaming citando la fuente.

En la pantalla, sobre el diagrama, se puede abrir en el panel docente **Buscar** con esa misma pregunta: muestra los fragmentos que encontró el sistema, que es el paso 2 en vivo.

## 20–22 · Decisiones · Marcos

Cada decisión con su alternativa descartada:

| Decisión | Alternativa | Por qué |
|---|---|---|
| Plugin `local` | Bloque de Moodle | Con el tema Boost, los bloques quedan escondidos y cada docente tendría que agregarlo curso por curso |
| RAG | Reentrenar un modelo | Reentrenar por materia es caro y no cita. RAG suma material nuevo en un minuto, como acaban de ver |
| PostgreSQL con pgvector | Una base vectorial aparte | Una sola base para datos y vectores, menos operación (ADR-002) |
| Proxy firmado con HMAC | Llamar directo desde el navegador | La clave nunca sale del servidor y no hay problemas de CORS (ADR-005) |
| Proveedor intercambiable | Atarse a uno | Se cambia por configuración, con cadena de fallback (ADR-003). Lo usamos: Google retiró un modelo sin aviso |
| Datos del alumno en Moodle | Guardarlos en el backend | Privacidad, backup y permisos de Moodle (ADR-014) |

## 22–25 · Calidad · Marcos

> - Cada cambio pasa por pruebas en tres lenguajes y un quality gate que bloquea el merge.
> - La cobertura pasó del 56,6 % al 83,6 %. En SonarCloud, de 26 bugs y 14 vulnerabilidades a cero, con calificación A en todo.
> - Registramos 10 defectos reales. El que más nos enseñó: con 40 usuarios a la vez el chat colapsaba, porque cada pedido retenía una conexión mientras esperaba al modelo. Ninguna prueba funcional lo mostraba; lo encontró la prueba de carga. Después del arreglo, el backend sostiene 100 usuarios simultáneos con p95 de 2,5 s, medido con el modelo simulado para aislar nuestro código.
> - Seguridad: auditoría OWASP Top 10. Accesibilidad: auditoría WCAG 2.2 y hallazgos corregidos.
> - Y lo de hoy: [completar con el resultado de la prueba con 60 navegadores de enero].

*Fuentes:* `docs/calidad/METRICAS.md`, `REGISTRO_DEFECTOS.md` (DEF-09), `PRUEBAS_DE_CARGA.md`, `docs/security/owasp-audit-2026-08.md`, `docs/calidad/accesibilidad/AUDITORIA_ACCESIBILIDAD.md`.

## 25–26:30 · Proceso · Santiago

> - Trabajamos con Scrum, con cada tarea como issue: más de 260 PRs mergeados.
> - Nos pasó lo que pasa en proyectos reales: la infraestructura de la universidad no estuvo disponible y migramos a Oracle Cloud (ADR-011).
> - Y pasamos la revisión de Moodle: nos marcó 16 puntos, los corregimos y hoy el plugin está publicado.

*Antes del deck:* recontar los PRs e issues con datos de febrero.

## 26:30–29 · Resultados · Santiago

Contra los objetivos específicos del informe, uno por uno. Se dicen tal cual están: cumplido, parcial o no cumplido.
- Relevamiento: cumplido (166 estudiantes y 17 docentes).
- Plugin `local` sin modificar el núcleo: cumplido y publicado.
- Asistente RAG, validado con usuarios reales: [completar según el piloto].
- Quizzes con corrección: cumplido.
- Panel docente y vacíos: cumplido.
- Evaluación del impacto con usuarios reales: [completar según el piloto].

> Costos: estimamos unos US$ 2.900 por año para 500 alumnos, incluido el mantenimiento. Son US$ 5,81 por alumno por año. Es una estimación: todavía no operó a esa escala.
>
> Límites: depende de un proveedor externo de IA, cuya latencia es lo que más varía, y la calidad de la respuesta depende de la calidad del material.

## 29–30 · Aportes · Delfina

> La alumna del principio tiene una respuesta de su materia, que puede verificar. Su profesor sabe qué no estaba cubierto. Y el sistema que lo hace está publicado y probado.

La última diapositiva muestra **los 4 aportes**. No hay diapositiva de "gracias": se termina con los aportes y se pasa a las preguntas.
