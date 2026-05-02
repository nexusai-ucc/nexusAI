# Competidores directos e indirectos

> **Resumen:** Asistentes académicos IA fuera del ecosistema Moodle. Sirve como contexto para la defensa — mostramos que conocemos el panorama y por qué nuestro enfoque es distinto.

---

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
- **Fortalezas:** ya conectado a los videos y transcripciones.
- **Limitaciones:** cerrado, solo Coursera. Sin apertura a contenido externo.
- **Diferencia con NexusAI:** Moodle es el LMS dominante en universidades argentinas; Coursera no.

### 3. NotebookLM (Google)

- **Qué es:** Q&A sobre documentos que subís manualmente.
- **Fortalezas:** buen RAG, cita fuentes.
- **Limitaciones:** el alumno sube los docs uno a uno. No integrado con el aula virtual.
- **Diferencia con NexusAI:** NexusAI indexa automáticamente lo que el docente ya subió a Moodle. Cero fricción para el alumno.

### 4. Microsoft Copilot for Education

- **Qué es:** suite de productividad con IA para educación.
- **Fortalezas:** integración con Teams, Word, OneNote.
- **Limitaciones:** ecosistema Microsoft-céntrico. No integración nativa con Moodle.
- **Diferencia con NexusAI:** las universidades argentinas usan Moodle, no Teams.

### 5. ChatGPT Edu

- **Qué es:** ChatGPT con planes institucionales.
- **Fortalezas:** potencia máxima del modelo.
- **Limitaciones:** sin integración nativa con Moodle. El alumno tiene que pegar el contexto. Sin analytics para docentes.
- **Diferencia con NexusAI:** nosotros integramos donde el alumno ya está.

## Asistentes en otros LMS (para contexto)

- **Canvas Intelligence Suite** — solo Canvas.
- **Blackboard AI Design Assistant** — solo Blackboard.
- **Sakai + AI plugins** — ecosistema pequeño.

Ninguno apunta a Moodle como plataforma principal.

## Matriz de posicionamiento

| Producto | Integra con Moodle | RAG sobre material del docente | Open source | Analytics docente |
|---|---|---|---|---|
| Khanmigo | ❌ | ❌ | ❌ | ⚠ limitado |
| Coursera Coach | ❌ | ✅ (en Coursera) | ❌ | ⚠ |
| NotebookLM | ❌ | ✅ (manual) | ❌ | ❌ |
| MS Copilot Edu | ❌ | ⚠ (con plugins) | ❌ | ⚠ |
| ChatGPT Edu | ❌ | ❌ | ❌ | ❌ |
| **NexusAI** | **✅** | **✅ (automático)** | **✅** | **✅ post-MVP** |

## Dónde NexusAI gana

1. **Integración nativa con Moodle** — el alumno lo ve sin cambiar de pestaña.
2. **RAG automático sobre material existente** — cero trabajo manual para alumnos y docentes.
3. **Open source + self-hostable** — las universidades quieren control sobre los datos.
4. **Herramientas docente integradas** — analytics, generación de evaluaciones, detección de lagunas.
5. **Contexto local argentino** — pensado para UCC, fácil de adaptar a UBA/UNC/otras.

## Dónde NexusAI **no** gana (honestidad)

- **Calidad pedagógica pura:** Khanmigo tiene años de investigación pedagógica atrás. Nosotros recién empezamos.
- **Performance del modelo base:** ChatGPT Edu con GPT-4 completo > nuestro GPT-4o-mini.
- **Ecosistema de contenido:** Khan, Coursera ya tienen cursos armados. Nosotros dependemos del material que suba el docente.

## Abierto / pendiente

- [ ] Captura de pantalla de cada producto para la slide comparativa.
- [ ] Investigar si hay trabajos académicos sobre RAG en LMS (papers 2024-2026).
- [ ] Benchmark cualitativo: misma pregunta a NexusAI y a Khanmigo / NotebookLM, comparar respuestas.
- [ ] Revisar si aparecieron competidores nuevos en 2025-2026.

## Referencias

- [Khanmigo](https://www.khanmigo.ai/)
- [Coursera Coach — announcement](https://about.coursera.org/press/2024/coursera-coach)
- [Google NotebookLM](https://notebooklm.google/)
- [Microsoft Copilot for Education](https://www.microsoft.com/en-us/education/ai)
- [OpenAI — ChatGPT Edu](https://openai.com/chatgpt/education/)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
