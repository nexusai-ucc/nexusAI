# Plan de pruebas con usuarios reales — NexusAI
## TEST-01 · Issue #264

> **Estado:** pendiente de ejecución  
> **Rama:** `docs/264-265-test-01-test-02-plan-pruebas`  
> **Responsables:** Marcos, Santiago, Delfina  
> **Fecha objetivo:** antes del cierre de sprint post-C (2026-08-30)

---

## 1. Objetivos

1. Verificar que los flujos principales de alumno y docente se completan sin asistencia.
2. Detectar problemas de usabilidad en la navegación del widget y las features de IA.
3. Medir satisfacción general con el instrumento SUS (System Usability Scale).
4. Obtener observaciones cualitativas para priorizar mejoras antes de la entrega final.

---

## 2. Alcance — features a evaluar

| # | Feature | Rol |
|---|---|---|
| 1 | Navegación: abrir el widget desde la navbar | Alumno + Docente |
| 2 | Chat con IA (preguntas sobre el material) | Alumno |
| 3 | Buscador semántico + filtros de sección | Alumno |
| 4 | Quiz de práctica (MC, dificultad media) | Alumno |
| 5 | Plan de estudio personalizado | Alumno |
| 6 | Alertas configurables de calendario (CAL-02) | Alumno |
| 7 | Foros: detector de discusiones similares | Alumno |
| 8 | Foros: sugerencia de respuesta con RAG | Alumno |
| 9 | Subir material al curso (drag-and-drop) | Docente |
| 10 | Preguntas frecuentes de alumnos (DOC-D02) | Docente |
| 11 | Dashboard de métricas del curso (ANALYTICS-02) | Docente |
| 12 | Generador de examen con exportación GIFT (DOC-D04) | Docente |

---

## 3. Participantes

### Cantidad y perfil

| Rol | Cantidad | Perfil |
|---|---|---|
| Alumno | 3–5 | Estudiante universitario UCC, usuario habitual de Moodle, sin experiencia previa con NexusAI |
| Docente | 1–2 | Docente UCC que usa Moodle para su materia, sin experiencia previa con NexusAI |

### Criterios de inclusión

- Alumnos: cursar o haber cursado una materia que usa Moodle en UCC.
- Docentes: tener al menos una comisión activa en Moodle UCC.
- Ambos: disponibilidad para una sesión de 50–60 minutos.

### Criterios de exclusión

- Integrantes del equipo NexusAI (Marcos, Santiago, Delfina).
- Personas que participaron en el diseño o desarrollo de alguna feature.

### Reclutamiento

- Contactar a compañeros de carrera o alumnos de otras materias.
- Docentes: contactar a través de la cátedra o de coordinación académica.
- Compensación: ninguna requerida (contexto académico, participación voluntaria).

---

## 4. Metodología

| Ítem | Decisión |
|---|---|
| Tipo de sesión | Moderada (el facilitador observa y puede intervenir si el participante se bloquea más de 2 min) |
| Protocolo | Think-aloud (el participante habla en voz alta mientras usa el sistema) |
| Modalidad | Presencial preferida; videollamada con pantalla compartida como alternativa |
| Duración | 50–60 minutos por sesión |
| Grabación | Con consentimiento del participante (ver formulario en `test-02-guia-sesion.md`) |
| Entorno | Sistema corriendo en entorno de demo/staging, no en producción |

---

## 5. Entorno y preparación previa

Antes de cada sesión, el facilitador debe verificar:

- [ ] Sistema levantado: `./scripts/nexus_marcos.sh start`
- [ ] Moodle accesible en http://localhost:8080 (o la URL de staging)
- [ ] Plugin NexusAI configurado: Backend URL, API key, Shared secret
- [ ] Curso de prueba preparado:
  - Al menos 3 PDFs indexados (estado `indexed`)
  - Al menos 2 discusiones previas en el foro
  - Al menos 1 evento próximo en el calendario (entrega o examen)
- [ ] Usuario de alumno de prueba creado (distinto del admin)
- [ ] Usuario de docente de prueba creado con permisos de `manager` en el curso
- [ ] Guía de sesión impresa o en pantalla secundaria (`test-02-guia-sesion.md`)
- [ ] Formulario de resultados abierto para tomar notas (`test-02-resultados.md`)

---

## 6. Métricas a capturar

| Métrica | Descripción | Cómo se mide |
|---|---|---|
| Tasa de completitud por tarea | % de tareas completadas sin ayuda del facilitador | Observación directa |
| Tiempo por tarea | Segundos desde que se presenta la tarea hasta que el participante la declara completa | Cronómetro del facilitador |
| Errores por tarea | Acciones incorrectas o caminos erróneos antes de completar la tarea | Observación directa |
| Solicitudes de ayuda | Cuántas veces el participante pidió orientación | Registro del facilitador |
| Puntaje SUS | Escala 0–100 de usabilidad percibida | Encuesta post-sesión (10 ítems) |
| Comentarios cualitativos | Observaciones del think-aloud y preguntas de cierre | Notas del facilitador |

---

## 7. Escenarios y tareas

Ver detalle completo de cada tarea en `test-02-guia-sesion.md`, sección "Tareas".

**Resumen de tareas por rol:**

### Alumno (8 tareas)

| # | Tarea | Feature | Tiempo estimado |
|---|---|---|---|
| A1 | Abrir el widget NexusAI y hacer una pregunta al chat sobre el material del curso | Chat RAG | 5 min |
| A2 | Buscar un concepto específico usando el buscador semántico | BUS-01 / BUS-05 | 4 min |
| A3 | Generar un quiz de 5 preguntas de opción múltiple y responderlo completo | Quiz MC | 7 min |
| A4 | Revisar el plan de estudio personalizado y arrancar a practicar un tema | STUDY-01 | 4 min |
| A5 | Configurar una alerta para el próximo examen del calendario | CAL-02 | 4 min |
| A6 | Ir al foro del curso e intentar crear una nueva discusión sobre un tema ya existente | Foros: detector | 5 min |
| A7 | Pedir una sugerencia de respuesta para un hilo del foro | Foros: sugerencia | 4 min |
| A8 | Generar un resumen del material antes del parcial | BUS-04 / STUDY-01 | 5 min |

### Docente (4 tareas)

| # | Tarea | Feature | Tiempo estimado |
|---|---|---|---|
| D1 | Subir un nuevo PDF al material del curso desde el widget | Gestión docs | 5 min |
| D2 | Ver qué preguntas hacen más los alumnos en el chat | DOC-D02 |4 min |
| D3 | Generar un banco de preguntas para un parcial y exportarlo en GIFT | DOC-D04 | 7 min |
| D4 | Revisar las métricas de uso del curso (actividad, puntajes de quiz, vacíos) | ANALYTICS-02 | 4 min |

---

## 8. Criterios de éxito

El sistema se considera listo para entrega si al finalizar todas las sesiones:

| Criterio | Umbral mínimo |
|---|---|
| Tasa de completitud global | ≥ 75% de tareas completadas sin ayuda |
| Puntaje SUS promedio | ≥ 65 (aceptable) — objetivo: ≥ 70 |
| Bugs bloqueantes encontrados | 0 (bugs que impidan completar una tarea crítica) |
| Bugs de usabilidad graves | ≤ 3 (confusión repetida en más de 2 participantes) |

---

## 9. Timeline

| Fase | Actividad | Responsable | Fecha objetivo |
|---|---|---|---|
| Preparación | Armar entorno de demo, crear usuarios de prueba | Marcos | 2026-08-05 |
| Reclutamiento | Contactar y confirmar participantes | Todos | 2026-08-10 |
| Sesiones | 4–7 sesiones de 50–60 min | Marcos (facilitador) | 2026-08-11 al 2026-08-22 |
| Análisis | Completar `test-02-resultados.md` con hallazgos | Marcos | 2026-08-23 al 2026-08-25 |
| Mejoras | Abrir issues para bugs críticos encontrados | Marcos + equipo | 2026-08-26 |
| Cierre TEST-02 | PR con resultados y cierre del issue #265 | Marcos | 2026-08-28 |

---

## 10. Roles en las sesiones

| Rol | Responsabilidad |
|---|---|
| Facilitador | Presenta las tareas, observa, toma tiempo, no da pistas |
| Observador (opcional) | Toma notas de comentarios del think-aloud y errores |
| Participante | Realiza las tareas en voz alta |
