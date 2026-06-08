# Alcance del proyecto

## Producto esperado

Un plugin funcional instalable en Moodle 4.1–4.5 que permita a los
estudiantes consultar el contenido de su materia en lenguaje natural y
recibir respuestas contextualizadas basadas en los materiales reales del
curso, validado mediante pruebas con usuarios reales de la UCC.

## In scope — funcionalidades del MVP

### Plugin Moodle

- Desarrollo del plugin tipo `local` instalable en Moodle 4.1 LTS hasta 4.5.
- Integración con el entorno existente sin modificar el core de Moodle.
- Compatibilidad con el sistema de capabilities estándar (`local/nexusai:use`, `:manage`, `:viewanalytics`).
- Privacy API declarada (`null_provider` en MVP).
- Soporte de internacionalización (es / en).

### Backend FastAPI

- Implementación del backend Python con integración a modelos de lenguaje
  de gran escala (LLM) a través de una API de IA generativa.
- Sistema RAG con base de datos vectorial (pgvector sobre PostgreSQL)
  para indexación y búsqueda semántica de materiales.
- Auth HMAC SHA-256 server-to-server entre plugin y backend.
- Rate limiting por usuario.
- Logging estructurado JSON.

### Interfaz de chat

- Widget de chat embebido en las páginas del curso, accesible vía FAB
  flotante.
- Streaming token-por-token de las respuestas del LLM (Server-Sent
  Events).
- Citas clickeables con preview del fragmento usado.
- Historial de conversaciones del alumno por sesión.

### Gestión de material por parte del docente

- Carga de archivos PDF al backend con indexación automática asíncrona.
- Visualización del estado de cada documento (`pending` → `indexing` →
  `indexed` | `error`).
- Borrado de documentos con cascade sobre los chunks vectorizados.
- Detección de uploads duplicados por hash SHA-256.

### Funcionalidades complementarias del MVP

- Buscador semántico (retrieval puro sin LLM) sobre el material
  indexado.
- Chat multi-curso opcional con citas que incluyen el nombre de la
  materia.
- Quiz generator de opción múltiple a partir del material del curso, con
  feedback inmediato + explicación + archivo fuente.
- Dashboard básico para el docente con detección de gaps (preguntas no
  respondidas por el material).

### Calidad y operación

- Tests automatizados en backend (cobertura ≥70%).
- CI/CD en GitHub Actions para backend, frontend y plugin PHP.
- Deploy automático del backend a Railway desde la rama `main`.
- Distribución del plugin como ZIP descargable en GitHub Releases.

### Validación

- Realización de pruebas con usuarios reales y recolección de feedback.

## Out of scope — explícitamente descartado del MVP

Los siguientes ítems fueron evaluados y **conscientemente excluidos** del
alcance del MVP para no diluir el foco. Algunos están planificados para
post-MVP:

| Ítem fuera de alcance | Razón |
|---|---|
| Soporte multi-institución (multi-tenant nativo) | Cada institución debe hostear su propio backend. Multi-tenant con aislamiento estricto requiere `tenant_id` en cada tabla y auth más compleja. |
| Integración con WhatsApp | Fuera del foco académico. Reduce el problema de dispersión hacia adentro de Moodle. |
| Integración con sistemas administrativos de la universidad | Excede el alcance de un MVP. Requiere acuerdos institucionales. |
| Generación o análisis de contenido multimedia (audio, video, imágenes) | Limitado a texto en MVP por restricciones de costo del LLM y complejidad. |
| Calendario, alertas y notificaciones | Funcionalidad nativa de Moodle. Duplicarla no agrega valor diferencial. |
| Foros mejorados con IA | Planificado post-MVP. Requiere integración con módulo `mod_forum` de Moodle. |
| Study Planner avanzado (planes personalizados) | Planificado post-MVP. Requiere modelar progreso del alumno, no solo responder consultas. |
| Resúmenes automáticos de materiales completos | Planificado post-MVP. El quiz generator cubre parcialmente esa necesidad. |
| Tutoría conversacional con seguimiento longitudinal | Fuera de alcance. Requiere infraestructura más compleja de modelado del alumno. |
| Análisis automático de sesgo en el material | Tema sensible, fuera del MVP. Mencionado como línea futura. |

## Usuarios objetivo

### Rol primario: alumno

- Universitario de UCC en cualquier carrera que use Moodle.
- Edad 18-30 típica.
- Acceso a la plataforma vía navegador (desktop o mobile).
- Capability requerida: `local/nexusai:use` en el curso.

### Rol secundario: docente

- Profesor o auxiliar docente con responsabilidad de gestionar el
  material de un curso.
- Capability requerida: `local/nexusai:manage` en el curso.

### Rol terciario: administrador de Moodle

- Persona responsable de instalar el plugin y configurar el endpoint del
  backend, la API key y el shared secret.

## Restricciones del proyecto

| Restricción | Valor |
|---|---|
| Equipo | 2 personas (Santiago Tricherri + Delfina Salinas) |
| Presupuesto operativo | $0 USD reales (uso de tier gratuito Gemini + GitHub Student Pack) |
| Versión Moodle soportada | 4.1 LTS hasta 4.5 |
| Idiomas | Español + inglés |
| Tipo de archivo soportado en MVP | PDF (DOCX y TXT están en el roadmap) |
| Tamaño máximo de archivo | 20 MB por documento |
| LLM en MVP | Gemini 2.5 Flash (tier gratuito) |
| LLM en producción | OpenAI GPT-4o-mini |


