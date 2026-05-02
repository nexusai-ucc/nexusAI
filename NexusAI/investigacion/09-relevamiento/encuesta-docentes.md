# Encuesta a docentes — NexusAI

> **Resumen:** Relevamiento con docentes UCC para validar necesidades y prioridades. Encuesta corregida y enviada a Leandro Juarez (docente PI) para difusión. Este doc consolida preguntas, proceso y resultados cuando estén.

---

## Contexto

Antes de construir, queremos evidencia de qué necesitan los docentes. La encuesta apunta a validar: (a) si NexusAI resuelve un problema real, (b) qué funcionalidad es prioritaria, (c) qué restricciones técnicas/políticas anticipar.

## Proceso

| Paso | Estado | Fecha |
|---|---|---|
| Diseño inicial de encuesta | ✅ Completado | Abr 2026 |
| Revisión con Leandro | ✅ Feedback incorporado | ~13 Abr 2026 |
| Difusión a docentes UCC | ⏳ En curso vía Leandro | — |
| Recolección de respuestas | ⏳ En curso | — |
| Análisis y consolidación | ⏸ Pendiente | — |

## Preguntas (versión final enviada)

> *Pendiente de consolidar la versión final acá. Pegar link al Google Form y transcribir preguntas.*

### Bloque 1 — Perfil del docente

1. Materia/cátedra.
2. Años como docente en UCC.
3. ¿Qué versión de Moodle usás? (si la sabés).
4. ¿Cantidad aproximada de alumnos por cuatrimestre?

### Bloque 2 — Uso actual de IA

5. ¿Usás IA (ChatGPT, Claude, Gemini) en tu práctica docente? ¿Cómo?
6. ¿Permitís que tus alumnos usen IA? ¿Con qué criterio?
7. ¿Detectaste uso de IA por parte de alumnos en exámenes/trabajos?

### Bloque 3 — Problemas actuales

8. ¿Qué preguntas recibís más frecuentemente de tus alumnos sobre el material?
9. ¿Cuánto tiempo por semana dedicás a responder consultas repetitivas?
10. ¿Qué herramienta usás hoy para resolver esto?

### Bloque 4 — Validación de funcionalidades NexusAI

11. Si tuvieras un asistente IA que responde solo sobre tu material subido a Moodle, ¿lo usarías?
12. ¿Qué tan importante es para vos que la IA **cite la fuente** (apunte y página)?
13. ¿Te interesaría ver **analytics** de qué temas consultan más tus alumnos?
14. ¿Usarías una funcionalidad para **generar quizzes** automáticamente desde tu material?
15. ¿Generador de evaluaciones: útil o peligroso?

### Bloque 5 — Confianza y privacidad

16. ¿Qué preocupaciones tenés sobre que los mensajes de los alumnos pasen por OpenAI?
17. ¿Preferís backend local (UCC) aunque implique más setup, o en la nube aunque la data salga?
18. ¿Firmarías consentimiento informado para que alumnos usen la herramienta?

### Bloque 6 — Abierta

19. ¿Qué funcionalidad agregarías?
20. ¿Qué **no** harías con IA en el aula?

## Resultados

> **Pendiente.** Completar cuando cierre la encuesta.

### Métricas a analizar

- N° de respuestas.
- % de docentes que usarían la herramienta (pregunta 11).
- Top 3 funcionalidades priorizadas (preguntas 12-15).
- Principales objeciones (preguntas 16-18).

### Quotes destacables

> *Completar con citas literales relevantes.*

## Decisiones condicionales (según resultados)

| Si los resultados muestran… | Entonces… |
|---|---|
| >70% de docentes priorizan citar fuentes | Citación de fuente (apunte + página) es requisito del MVP. |
| Objeciones fuertes a data saliendo a OpenAI | Investigar self-hosted LLM (descartado en el alcance actual — pero re-evaluamos). |
| >50% interés en generador de evaluaciones | Adelantar esa épica al Sprint 3 en vez de post-MVP. |
| Bajo interés en analytics | Bajar prioridad post-MVP. |

## Abierto / pendiente

- [ ] Pegar link al Google Form una vez que esté live.
- [ ] Transcribir preguntas exactas (la lista de arriba es una aproximación).
- [ ] Definir deadline de cierre de encuesta.
- [ ] Armar plantilla de análisis de resultados.
- [ ] Reunión de revisión de resultados con Santiago + Marcos.

## Referencias

- Reunión con Leandro — [reunion-leandro.md](reunion-leandro.md)
- Documento de requisitos UCC — [requisitos-ucc.md](requisitos-ucc.md)

---

*Última actualización: 2026-04-24 — Delfina*
