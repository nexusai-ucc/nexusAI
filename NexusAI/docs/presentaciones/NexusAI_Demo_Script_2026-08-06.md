# NexusAI — Guion de demo en vivo (06/08/2026)

Script paso a paso para mostrar cada épica sobre el curso de demo real,
epica por epica, sin profundizar de más.

## Antes de arrancar

- **URL**: `http://localhost:8090`, curso **"Sistemas Inteligentes (Demo)"**, `courseid=4`.
- **Contraseña única para todos los usuarios**: `NexusAI2026!`
- **Usuarios**: `admin` (docente) y 6 alumnos: `demo_ana`, `demo_bruno`, `demo_carla`, `demo_diego`, `demo_elena`, `demo_facundo`.
- ⚠️ **Riesgo real**: el generador de exámenes y el resumen pre-parcial hacen varias llamadas al LLM seguidas, y esta semana se agotó la cuota gratuita de Gemini dos veces. Si podés, hacé un **dry-run corto antes de la charla** (una sola vez, no varias) solo para esas dos partes. Si se corta en vivo, tenés screenshots de cuando funcionó como plan B.

---

## Épica 1 — Asistente Académico (Chat)
**Login:** `demo_carla`
1. Curso → ícono ✧ arriba → se abre el widget.
2. Preguntá algo nuevo, ej: *"¿Qué es el aprendizaje por refuerzo?"* → responde citando `01-intro-ia-ml.md`.
3. Mostrá las fuentes clickeables abajo de la respuesta.

## Épica 2 — Buscador y Resumen
**Login:** mismo usuario, mismo widget
1. Ir a → Search.
2. Buscar *"coeficiente de silueta"* → aparece el fragmento resaltado, sin IA generando texto (instantáneo).
3. (Opcional, gasta cuota) Ir a → Study Mode → Plan → "Generar resumen" → resumen multi-documento con fuentes citadas.

## Épica 3 — Study Planner
**Login:** `demo_carla` (tiene errores de quiz reales cargados)
1. Ir a → Study Mode → **Plan**: se ve el tema débil "Clustering y evaluación no supervisada" con motivo real (2 errores de quiz).
2. Tab **Practicar**: generá un quiz nuevo en vivo (elegí tema/dificultad).
3. Tab **Repaso**: mostrá el historial de errores.

## Épica 4 — Herramientas Docentes
**Login:** `admin`, ir a `documents.php?courseid=4` ("NexusAI · Materials")
1. Tab **Material**: 6 archivos indexados.
2. Tab **Gaps detectados**: 6 preguntas sin responder (de las off-topic que mandaron los alumnos).
3. Tab **Analytics**: uso diario, histograma de scores (los 5 buckets poblados), ratio de gaps.
4. Tab **Preguntas frecuentes**: temas agrupados por IA.
5. Tab **Generar examen** (gasta cuota): elegí 2 archivos → Generar → **Exportar como GIFT**.

## Épica 5 — Calendario
**Login:** cualquier alumno, widget → Ir a → **Calendar**
1. Se ven las 3 tareas con fecha (6/13/22 de agosto) y el selector "Alert me".

## Épica 6 — Foros con IA
**Login:** `admin` o cualquier alumno, ir al foro **"Consultas del curso"** (link en el bloque General del curso)
1. Mostrá las 3 discusiones reales (Random Forest, K-Means, pre-entrenamiento/fine-tuning).
2. Entrá a la de Random Forest (4 posts) — ahí debería verse la opción de **resumir el hilo**.
3. En la de pre-entrenamiento/fine-tuning (1 post sin responder) — probá la **sugerencia de respuesta**.

⚠️ Estas dos las probé por API directamente, no clickeando la UI del foro en el navegador — conviene un click-through rápido antes para confirmar dónde aparece el botón exacto en pantalla.

## Épica 7 — Integración Moodle / Deploy
No hay nada para clickear acá — contar el estado: plugin instalado y funcionando (todo lo de arriba), deploy propio en Oracle Cloud con cuenta ya creada, plan técnico casi aprobado.
