# Resumen ejecutivo

## Problema

Las plataformas LMS (Learning Management Systems) como Moodle son
fundamentales en la educación universitaria, pero en la práctica se usan
como **repositorios estáticos**: los estudiantes descargan archivos y
entregan trabajos, sin un acompañamiento real al proceso de aprendizaje.

Un relevamiento realizado a estudiantes de la Universidad Católica de
Córdoba (UCC) identificó tres problemáticas recurrentes:

- **Dispersión de información** entre el campus virtual, WhatsApp y Google
  Drive — más del 70% de los estudiantes encuestados reportó dificultades
  para encontrar lo que necesita.
- **Dificultad para organizar el estudio** y planificar repasos antes de
  evaluaciones.
- **Uso pasivo del campus virtual**, sin interacción significativa con el
  material académico cargado por los docentes.

## Solución propuesta

**NexusAI** es un plugin para Moodle que integra un **asistente académico
basado en inteligencia artificial**, capaz de:

- Responder consultas en lenguaje natural sobre el contenido real de cada
  materia, usando Retrieval-Augmented Generation (RAG) sobre el material
  indexado del curso.
- Citar explícitamente el archivo y fragmento del que proviene cada
  respuesta — sin alucinaciones inventadas.
- Generar quizzes de práctica de opción múltiple a partir del material del
  docente.
- Detectar automáticamente qué temas consultan los alumnos que el material
  del curso no logra responder, generando feedback accionable para el
  docente.
- Mantener historial de conversación por sesión para que el alumno pueda
  retomar el estudio donde lo dejó.

La solución **no reemplaza Moodle ni al docente**: agrega una capa de
inteligencia sobre la plataforma existente.

## Diferenciadores técnicos

- **RAG auténtico con citas trazables**: cada respuesta del asistente
  enlaza al fragmento exacto del material del curso usado para generarla.
  Las pills clickeables del frontend expanden el chunk con su porcentaje
  de similaridad — trazabilidad como mitigación de alucinación.
- **Multi-provider LLM**: el backend abstrae el proveedor del modelo
  (Gemini en MVP, OpenAI en producción, Ollama local opcional) detrás de
  variables de entorno. Sin vendor lock-in.
- **Self-hosted, datos en la institución**: el patrón Hybrid PHP Proxy
  garantiza que la API key del LLM nunca llega al navegador y que los
  datos académicos no salen de la infraestructura de la institución.
- **Multi-curso opcional**: el alumno puede consultar el material de
  todos sus cursos a la vez, con respuestas que citan la materia de cada
  fragmento.
- **Feedback loop al docente**: el sistema mide su propia ceguera —
  registra preguntas que no pudo responder y se las muestra al docente
  para mejorar el material.

## Estado del proyecto al cierre del MVP

- **7 features deployadas** en el Sprint 4 (junio 2026): buscador
  semántico, chat multi-curso, streaming SSE, citas clickeables,
  historial, quiz generator, detección de gaps.
- **Backend FastAPI** deployado en Railway con autodeploy desde GitHub
  Actions.
- **Plugin Moodle** distribuido como ZIP descargable en GitHub Release,
  compatible con Moodle 4.1 LTS hasta 4.5.
- **37 tests automatizados** en backend Python con cobertura ~80%.
- **Documentación técnica completa** — 6 ADRs, 5 diagramas Mermaid, 47
  documentos de investigación previa, manuales de usuario y administrador.

## Próximos pasos post-MVP

- Submission del plugin al Moodle Plugin Directory oficial para
  defendibilidad académica adicional.
- Implementación del módulo de analytics para el alumno (no solo para el
  docente).
- Switch de Gemini a OpenAI GPT-4o-mini en producción.
- Pilotos con cursos reales de la UCC para recolectar métricas de uso e
  impacto pedagógico.


