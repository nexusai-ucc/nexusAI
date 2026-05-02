# Competidores directos e indirectos

Resumen: Asistentes académicos IA fuera del ecosistema Moodle. Sirve como contexto para la defensa — mostramos que conocemos el panorama y por qué nuestro enfoque es distinto.

## Contexto

Los docentes preguntan: "¿por qué no usan ChatGPT directamente?". Este documento responde eso con evidencia.

## Productos analizados

### 1. Khanmigo (Khan Academy)

- **Qué es:** tutor AI integrado en la plataforma Khan Academy.
- **Fortalezas:** muy pulido pedagógicamente, modo socrático, privacidad de menores.
- **Limitaciones:**
  - No se integra con Moodle.
  - Responde sobre contenido de Khan Academy — no sobre el material de la materia.
  - Enfocado en K-12 y matemática, no universitario.
- **Diferencia con NexusAI:** nosotros respondemos sobre los apuntes reales del docente, no un currículo enlatado.

### 2. Coursera Coach

- **Qué es:** asistente dentro de cursos Coursera.
- **Fortalezas:** ya conectado a los videos y transcripciones del curso.
- **Limitaciones:** cerrado, solo Coursera. Sin apertura a contenido externo.
- **Diferencia con NexusAI:** Moodle es el LMS dominante en universidades argentinas; Coursera no. NexusAI vive donde el alumno ya está.

### 3. NotebookLM (Google)

- **Qué es:** Q&A sobre documentos que subís manualmente.
- **Fortalezas:** buen RAG, cita fuentes con precisión.
- **Limitaciones:** el alumno sube los docs uno a uno. No integrado con el aula virtual. Los datos van a servidores de Google.
- **Diferencia con NexusAI:** NexusAI indexa automáticamente lo que el docente ya subió a Moodle. Cero fricción para el alumno. Los datos permanecen en el servidor de la institución.

### 4. Microsoft Copilot for Education

- **Qué es:** suite de productividad con IA para educación.
- **Fortalezas:** integración con Teams, Word, OneNote.
- **Limitaciones:** ecosistema Microsoft-céntrico. Sin integración nativa con Moodle.
- **Diferencia con NexusAI:** las universidades argentinas usan Moodle, no Teams.

### 5. ChatGPT Edu

- **Qué es:** ChatGPT con planes institucionales.
- **Fortalezas:** potencia máxima del modelo base.
- **Limitaciones:** sin integración nativa con Moodle. El alumno tiene que pegar el contexto manualmente. Sin analytics para docentes. Datos en servidores de OpenAI.
- **Diferencia con NexusAI:** nosotros integramos donde el alumno ya está, con RAG automático y datos self-hosted.

## Asistentes en otros LMS (para contexto)

- **Canvas Intelligence Suite** — solo Canvas.
- **Blackboard AI Design Assistant** — solo Blackboard.
- **Sakai + AI plugins** — ecosistema pequeño.

Ninguno apunta a Moodle como plataforma principal.

## Matriz de posicionamiento

| Producto | Integra con Moodle | RAG sobre material del docente | Self-hosted | Open source | Analytics docente |
|---|---|---|---|---|---|
| Khanmigo | ❌ | ❌ | ❌ | ❌ | ⚠ limitado |
| Coursera Coach | ❌ | ✅ (en Coursera) | ❌ | ❌ | ⚠ |
| NotebookLM | ❌ | ✅ (manual) | ❌ | ❌ | ❌ |
| MS Copilot Edu | ❌ | ⚠ (con plugins) | ❌ | ❌ | ⚠ |
| ChatGPT Edu | ❌ | ❌ | ❌ | ❌ | ❌ |
| **NexusAI** | ✅ | ✅ (automático) | ✅ | ✅ | ✅ post-MVP |

## Dónde NexusAI gana

- **Integración nativa con Moodle** — el alumno lo ve sin cambiar de pestaña.
- **RAG automático sobre material existente** — cero trabajo manual para alumnos y docentes.
- **Self-hosted + open source** — las universidades quieren control sobre sus datos académicos. Ningún competidor ofrece esto combinado con RAG real.
- **Herramientas docente integradas** — analytics, generación de evaluaciones, detección de lagunas (post-MVP).
- **Contexto local argentino** — pensado para UCC, fácil de adaptar a UBA/UNC/otras.
- **Agnóstico de proveedor LLM** — no dependencia de un único proveedor. En MVP usa Gemini (gratuito); en producción escala a GPT-4o-mini u equivalente con solo cambiar variables de entorno.

## Dónde NexusAI no gana (honestidad)

- **Calidad pedagógica pura:** Khanmigo tiene años de investigación pedagógica atrás. NexusAI recién empieza.
- **Performance del modelo base:** ChatGPT Edu con GPT-4 completo supera a GPT-4o-mini en razonamiento puro. Mitigación: para Q&A sobre contexto conocido (RAG), GPT-4o-mini es suficiente.
- **Ecosistema de contenido:** Khan, Coursera ya tienen cursos armados. NexusAI depende del material que suba el docente — lo cual también es su fortaleza (contexto real de la materia).

## Abierto / pendiente

- [ ] Captura de pantalla de cada producto para la slide comparativa.
- [ ] Investigar si hay trabajos académicos sobre RAG en LMS (papers 2024–2026).
- [ ] Benchmark cualitativo: misma pregunta a NexusAI y a NotebookLM, comparar respuestas.
- [ ] Revisar si aparecieron competidores nuevos en 2025–2026 (el mercado está evolucionando rápido).

## Referencias

- [Khanmigo](https://www.khanacademy.org/khan-labs)
- [Coursera Coach — announcement](https://blog.coursera.org/coursera-launches-coach/)
- [Google NotebookLM](https://notebooklm.google/)
- [Microsoft Copilot for Education](https://www.microsoft.com/en-us/education/products/copilot)
- [OpenAI — ChatGPT Edu](https://openai.com/chatgpt/education/)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
