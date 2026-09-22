# NexusAI — Cambio de modelo de IA en staging, de cara a la demo

> Anuncio original compartido por el equipo el 22/09/2026, para que quede
> como referencia y no se pierda en el chat. Ver también el addendum en
> [ADR-004](../adr/004-gemini-mvp-openai-prod.md#actualización--2026-09-22)
> y la sección 3.1 de [`ESTADO_DEL_PROYECTO.md`](../ESTADO_DEL_PROYECTO.md).

## El problema

Gemini gratis (el que se usaba en staging como modelo de texto principal)
está saturado: a veces tardaba hasta 45 segundos en responder, y en el
peor caso medido se registraron picos de hasta 147 segundos, con
respuestas típicas de ~13-30 segundos. Para una demo en vivo eso es un
riesgo grande.

## Qué se cambió

Se pasó el modelo principal de staging a **OpenAI `gpt-4o-mini`**, con
crédito prepago de USD 10 (auto-recharge apagado, no se puede gastar más
que eso sin intervención manual — es plata del equipo, avisar antes de
probar mucho).

Cadena de respaldo si OpenAI falla:

1. **OpenAI `gpt-4o-mini`** (principal)
2. **Groq** (gratis) como fallback automático

Los embeddings (la búsqueda semántica del RAG) siguen en **Gemini
gratis** — ahí no se tocó nada.

## Cómo mejoró

Medido con el mismo prompt en los dos proveedores:

| | Primera palabra | Respuesta completa | Errores |
|---|---|---|---|
| **OpenAI gpt-4o-mini** | 0.8 – 1.6 seg | ~2.5 seg | Ninguno |
| **Gemini gratis** | similar en el mejor caso | típico 13-30 seg | Picos de hasta 147 seg |

La ganancia no es tanto "más rápido siempre" sino que ahora es
**estable**, sin los cuelgues intermitentes de antes.

Ya se probó contra staging: chat, quiz, examen, resumen y foro — todo
responde en 2-12 segundos según la herramienta.

## Para probarlo

No hace falta cambiar nada del lado del Moodle local: si ya apunta a
staging (`https://api-staging.146.181.62.67.nip.io`), ya está usando el
modelo nuevo automáticamente.

Se cargaron 3 cursos de prueba en staging, con contenido y ya "usados"
(chat, quiz, flashcards, examen, foro, calendario, todo con historial),
para ver las herramientas funcionando sin tener que armar nada:

- **Programación I (Demo)**
- **Contabilidad Básica (Demo)**
- **Marketing Digital (Demo)**

Cada curso tiene su propio usuario docente y alumno
(`<docente.demo.XXX>` / `<alumno.demo.XXX>`, siguiendo el patrón de los
nombres de curso), con una clave compartida para todos. Las credenciales
reales se comparten por canal directo del equipo, no acá — mismo criterio
que ya se viene usando en
[`MARKETPLACE_SUBMISSION_STATUS.md`](../MARKETPLACE_SUBMISSION_STATUS.md)
y [`REVIEWER_TESTING.md`](../REVIEWER_TESTING.md) para no dejar logins
reales en texto plano en git.

## Nota

Cualquier cosa rara que se vea en staging en estos días probablemente sea
porque se está afinando algo antes de la demo.

---

*Pendiente: hay un artifact adicional compartido junto con este anuncio
(`claude.ai/artifact/8Jve99PPjrMmG3tP5Qkcgh`) con detalle que todavía no
se pudo incorporar acá — completar cuando esté disponible.*
