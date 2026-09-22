# ADR-013: Que cada alumno conecte su propia API key de IA (BYOK)

| | |
|---|---|
| **Estado** | 📝 Propuesta — investigación de viabilidad, sin decisión tomada |
| **Fecha** | 2026-09-22 |
| **Autor/es** | Investigación a pedido de Delfina Salinas |
| **Decididores** | Pendiente (equipo NexusAI) |

---

## Contexto

Surgió la idea de que cada alumno pueda conectar su propia API key paga de
OpenAI o Anthropic/Claude a NexusAI, para que el asistente use la cuota
de ESE alumno en vez de (o además de) la cuota compartida institucional
configurada por NexusAI. Motivación de negocio: alumnos que ya pagan un
plan de IA no dependerían del límite gratuito/compartido, y la
institución no tendría que costear el uso de quien no lo necesita.

Este documento es el resultado de investigar **si es viable y qué
implicaría** — no es una decisión de implementar. Se investigó tanto el
lado técnico (arquitectura actual) como el lado legal (términos de
servicio de los proveedores).

## Hallazgo legal — no es solo una feature, puede ser un requisito

- **OpenAI:** sus términos no dicen nada explícito sobre BYOK en apps de
  terceros — zona gris, pero práctica común y tolerada (GitHub Copilot
  SDK, Warp, otras herramientas ya lo hacen así).
- **Anthropic (Claude): posición mucho más restrictiva.** Sus términos
  **prohíben explícitamente** que una app agrupe uso de Claude bajo una
  key compartida y lo revenda/intermedie a usuarios finales — "cada
  usuario final debe autenticarse con su propia API key, plan de
  suscripción Claude, o credencial de un proveedor de inferencia
  tercero". Anthropic ha actuado activamente contra herramientas que
  violan esto (ver el caso "OpenClaw").

**Consecuencia práctica:** si en algún momento se quiere ofrecer Claude
como proveedor (hoy NexusAI usa Gemini/OpenAI/Groq, no Claude), hacerlo
con una key institucional compartida podría no ser compliant con los
términos de Anthropic — BYOK dejaría de ser "una mejora" y pasaría a ser
la única forma correcta de integrar Claude. Para OpenAI, en cambio, el
modelo actual (key institucional compartida) es aceptable tal cual está.

## Hallazgo técnico — qué tan grande sería el cambio

Investigado contra el código real (`services/api/app/`), no de memoria:

**Lo que ya está a favor:**
- `LLMProvider.__init__` (`providers/llm.py`) **ya acepta** `api_key`,
  `base_url` y `model` como parámetros opcionales — el diseño de ADR-003
  (SDK compatible con OpenAI, key/base_url intercambiables) ya lo
  contempla, aunque hoy nadie lo usa así.
- `user_id` **ya llega** al handler del chat (`chat/router.py`) antes de
  necesitar el LLM — no hay que agregar ningún dato nuevo al flujo, ya
  viaja hasta donde hace falta.

**Lo que falta construir (3 frentes reales):**

1. **Dejar de usar el provider como singleton global.** Hoy
   `get_llm_provider()` está cacheado con `@lru_cache(maxsize=1)` — la
   primera llamada crea UNA instancia que sirve a TODOS los usuarios y
   TODAS las requests del proceso. Para BYOK hay que resolver el
   provider dentro del handler (después de leer `payload.user_id`),
   no como dependency inyectada de antemano.
2. **Guardar la key del alumno, cifrada.** No existe hoy ningún lugar
   para esto. El backend (Postgres) no tiene ninguna tabla de
   configuración por-usuario — haría falta una nueva. Del lado Moodle
   existe el patrón `user_preferences` (ya usado para el dismissal del
   onboarding y el token del feed de calendario), pero ese precedente
   guarda su secreto **sin cifrar** — aceptable para un token de bajo
   valor y revocable, no para una API key paga de verdad. No hay ninguna
   primitiva de cifrado de secretos por-usuario en el proyecto hoy, ni
   en Moodle ni en el backend — hay que construirla.
3. **Desacoplar 3 mecanismos que hoy asumen "una sola cuota
   institucional":**
   - **Rate limiting** (20/min, 50/día por alumno): pensado para no
     agotar la cuota compartida. Si el alumno paga la suya, este límite
     ya no tiene sentido de negocio para él — habría que hacerlo
     condicional.
   - **Moderación de contenido:** cuando no hay `MODERATION_API_KEY`
     configurada (caso Gemini), la moderación reutiliza el mismo
     `LLMProvider` del chat. Con BYOK, la moderación pasaría a gastar
     tokens de la cuota PERSONAL del alumno para un paso de seguridad
     que debería ser transparente — conviene mantener la moderación
     siempre en la cuota institucional, separada.
   - **Cadena de fallback:** si la key del alumno se queda sin cuota, el
     fallback (hoy siempre institucional) entraría en juego en
     silencio — exactamente el problema que BYOK buscaría evitar (el
     alumno cree que usa su propia cuota, pero en un fallo empieza a
     gastar la institucional sin que nadie lo note). Hay que decidir
     explícitamente el comportamiento.

## Alternativas evaluadas

### Alternativa A — BYOK completo (key del alumno reemplaza la institucional)

El alumno carga su key, todo su uso corre 100% con su cuota.

**Pros:** resuelve el problema de costo por completo para quien lo activa; compliant con Anthropic si algún día se suma Claude.
**Contras:** todo el trabajo de los 3 frentes de arriba; UX de onboarding para pedirle al alumno que consiga y pegue una API key (fricción real para un alumno no técnico).
**Por qué considerar:** es la única opción que resuelve el problema de fondo (costo institucional) de raíz.

### Alternativa B — BYOK opcional, con fallback institucional como red

El alumno puede cargar su key; si no la carga o se queda sin cuota, sigue funcionando con la cuota compartida (como hoy).

**Pros:** no rompe la experiencia para quien no quiere/sabe configurar una key propia; migración incremental.
**Contras:** hay que ser explícito con el alumno sobre cuándo está usando su cuota vs. la institucional, para que BYOK no termine siendo decorativo.
**Por qué considerar:** más realista para el alcance de un Proyecto Integrador — no hace falta resolver los 3 frentes con la misma rigurosidad de entrada (ej. el fallback institucional como red de contención simplifica el frente 3, a costa de tener que comunicarlo bien).

### Alternativa C — No implementar, dejarlo documentado como investigación

Quedarse con el modelo actual (key institucional única) y no construir nada.

**Pros:** cero costo de desarrollo, cero riesgo nuevo de seguridad (guardar secretos de alumnos es una superficie de ataque nueva).
**Contras:** no resuelve el problema de costo compartido; si algún día se quiere sumar Claude como proveedor, este mismo problema vuelve a aparecer, ahora con una restricción legal real de por medio.
**Por qué considerar:** válido como decisión de corto plazo dado el tiempo limitado hasta la defensa — este ADR queda como base para retomarlo después, sin tener que re-investigar desde cero.

## Cuándo revisar esta decisión

- Si se evalúa sumar Claude/Anthropic como proveedor (el hallazgo legal
  se vuelve más urgente, no solo una mejora).
- Si el costo de la cuota institucional (hoy ~USD 0.22/alumno/mes según
  ADR-004, a escala de producción) se vuelve un problema real de
  presupuesto.
- Si un alumno o docente pide esto explícitamente como feature.

## Referencias

- [ADR-003: arquitectura multi-provider](003-multi-provider-llm.md) — confirma que el diseño actual asume una key por instalación, no contempla BYOK como alcance previsto.
- [ADR-004: Gemini MVP / OpenAI producción](004-gemini-mvp-openai-prod.md)
- [OpenAI — Service terms](https://openai.com/policies/service-terms/)
- Búsqueda sobre política de Anthropic respecto a "wrappers"/reventa de uso vs. BYOK (septiembre 2026) — ver discusión pública sobre el caso "OpenClaw" y el bloqueo de Anthropic a herramientas de terceros que intermedian credenciales de Claude.

---

*Última actualización: 2026-09-22*
