# Auditoría de seguridad — OWASP Top 10 + dependency scanning

| | |
|---|---|
| **Estado** | ✅ Completada |
| **Fecha** | 2026-08-08 |
| **Autor** | Santiago Tricherri |
| **Issue** | [SEC-01 / #317](https://github.com/nexusai-ucc/nexusAI/issues/317) |

---

## 1. Dependency scanning

### Backend (`pip-audit` sobre `services/api/requirements.txt`)

**Antes:** 43 vulnerabilidades conocidas en 11 paquetes.
**Después:** 12 vulnerabilidades en 3 paquetes.

| Acción | Paquetes | Resultado |
|---|---|---|
| Removidos (no usados en el código) | `python-jose[cryptography]`, `python-multipart` | -10 CVEs. HMAC usa `hmac` de la stdlib, no JWT. Los uploads son JSON+base64, no multipart (comentado explícitamente en `app/documents/router.py`). Verificado con `grep` en todo `app/` antes de sacarlos — cero referencias. |
| Bumpeado | `Pillow` 10.4.0 → 12.3.0 | -16 CVEs. Uso real pero mínimo (`Image.open()` en `app/documents/extractor.py`, pipeline de OCR sobre archivos subidos) — API estable entre versiones, sin riesgo de romper el extractor. |
| **Aceptado, documentado, con CI ignorándolos explícitamente por ID** | `starlette` 0.38.6, `pdfminer-six` 20231228, `pytest` 8.3.3 | 12 CVEs restantes. Ver detalle abajo. |

**Por qué los 3 restantes quedan aceptados en vez de arreglados:**

- **`starlette`** — pineado por `fastapi==0.115.0` (`starlette<0.39.0,>=0.37.2`). Arreglarlo implica bumpear FastAPI, que toca todos los routers del backend. Requiere una migración dedicada con testing completo, no un fix de una línea.
- **`pdfminer-six`** — pineado transitivamente por `pdfplumber==0.11.4`. Es el corazón del pipeline de extracción de PDFs (RAG). Bumpear `pdfplumber` sin testing dedicado del pipeline de extracción es un riesgo real de romper la feature principal del producto.
- **`pytest`** — solo se usa en desarrollo/CI, nunca se shipea a producción (no está en el `Dockerfile` de runtime). El bump 8→9 es una migración de major version del framework de testing, con su propio riesgo de romper la config de `pytest-asyncio`/`pytest.ini`. Menor urgencia por ser dev-only.

Los 3 quedan con IDs específicos ignorados en `backend-ci.yml` (`--ignore-vuln <ID>` para cada uno) — **no se silencia el scanner entero**, así que cualquier vulnerabilidad nueva en cualquier otro paquete sigue rompiendo el build. Revisar este documento y esos `--ignore-vuln` cuando se decida abordar alguno de los tres (típicamente: al bumpear FastAPI o pdfplumber por otro motivo, aprovechar y sacar el ignore correspondiente).

### Frontend (`npm audit` sobre `plugin/local/nexusai/react/`)

**Antes:** 6 vulnerabilidades (1 low, 1 moderate, 4 high) — `@babel/core`, `@babel/plugin-transform-modules-systemjs`, `dompurify`, `fast-uri`, `nanoid`, `postcss`.
**Después:** 0. Todas resueltas con `npm audit fix` (sin `--force`, sin bumps de major version rotos). Particularmente importante: `dompurify` es la librería que sanitiza las respuestas del asistente antes de renderizarlas como HTML (`MessageBubble.jsx`) — bumpearla cierra vulnerabilidades reales en la única superficie de XSS del widget.

Bundle regenerado con Node 20 (mismo runtime que CI) para que el `chatwidget-lazy.min.js` commiteado coincida exactamente con lo que el check de CI espera.

### CI

- `backend-ci.yml`: nuevo job `dependency-scan` (`pip-audit`, falla en cualquier vulnerabilidad no explícitamente ignorada por ID).
- `frontend-ci.yml`: nuevo step `npm audit --audit-level=high` dentro del job existente.

**Hallazgo aparte, corregido porque bloqueaba directamente esta tarea:** `frontend-ci.yml` apuntaba a `plugin/local/nexusai/package.json`, que no existe — el package.json real vive en `plugin/local/nexusai/react/`. El check de "skip si no existe" siempre daba `true`, así que el job de frontend **nunca corrió de verdad** en ningún PR anterior, solo hacía skip en silencio. Se corrigieron los paths. De paso, los steps de "ESLint" y "Jest" que ese workflow tenía se sacaron: no hay config de ESLint ni de Jest en el proyecto, ni las dependencias instaladas — el workflow los referenciaba pero nunca existieron, y con el path corregido hubieran empezado a fallar de verdad (`Missing script`). **Configurar lint y tests del frontend queda como gap aparte, no resuelto acá** — ver sección 4.

---

## 2. Checklist OWASP Top 10 (aplicado a este proyecto puntual)

| # | Categoría | Estado | Nota |
|---|---|---|---|
| A01 | Broken Access Control | ✅ Mitigado | Todo endpoint del backend requiere `verify_hmac` (regla invariante del proyecto). Del lado Moodle, cada external function valida `context_course::instance()` + `require_capability('local/nexusai:use', ...)` antes de delegar al backend. El `user_id` que llega al backend es siempre `$USER->id` real de la sesión de Moodle — nunca un parámetro que el alumno pueda manipular (verificado explícitamente en PRIV-01/#310). |
| A02 | Cryptographic Failures | ✅ Mitigado | HMAC-SHA256 (3 capas: Bearer API key + firma + anti-replay con nonce en Redis) para el canal Moodle↔backend. Secrets generados con `openssl rand -hex 32`, nunca commiteados (`.gitignore`). |
| A03 | Injection | ✅ Mitigado | SQLAlchemy ORM con queries parametrizadas en todo el backend — no hay SQL crudo con interpolación de strings. Los parámetros de las external functions de Moodle están tipados por el propio framework (`PARAM_INT`, etc.), que rechaza tipos inesperados antes de llegar al backend. |
| A03b | Cross-Site Scripting (XSS) | ✅ Mitigado | Mensajes del alumno se renderizan como texto plano (React escapa automático). Respuestas del asistente pasan por `marked.parse()` + `DOMPurify.sanitize()` con allow-list restrictiva antes de `dangerouslySetInnerHTML` (`MessageBubble.jsx`) — closeado explícitamente en esta auditoría bumpeando DOMPurify (ver sección 1). |
| A04 | Insecure Design | ⚠️ Parcial, gaps documentados | Ver sección 3 — límite diario de mensajes no implementado, sin moderación de contenido. No son bugs de este código, son features que faltan. |
| A05 | Security Misconfiguration | ✅ Mitigado | Postgres/Redis no expuestos a internet en producción (`docker-compose.prod.yml`, `ports: !reset []`). CORS solo habilitado en dev (`ENV=development`). |
| A06 | Vulnerable and Outdated Components | ✅ Mitigado (esta issue) | Ver sección 1 — de 43 CVEs a 12 documentados/aceptados en backend, de 6 a 0 en frontend. CI scanea automáticamente de acá en más. |
| A07 | Identification and Authentication Failures | ✅ Mitigado | HMAC anti-replay con nonce en Redis (TTL = ventana de tolerancia) — una request capturada no se puede reenviar. `compare_digest` en las comparaciones de secrets (evita timing attacks). |
| A08 | Software and Data Integrity Failures | ✅ Mitigado | El pipeline de CI valida que el bundle JS commiteado coincida con el generado desde el source (`frontend-ci.yml`) — evita que un bundle manipulado a mano llegue a producción sin pasar por el build real. |
| A09 | Security Logging and Monitoring Failures | ⚠️ Parcial | Hay logging estructurado de acceso (`RequestIDMiddleware`, JSON con method/path/status/latency) y logs de fallback LLM (`app.providers.llm`). **Confirmado explícitamente en esta auditoría: no se loguea contenido de chat/mensajes en texto plano en ningún lado** (buscado en todo `app/chat/`, `app/quiz/`, `app/forums/` y en el middleware de access log). No hay alertas automáticas ni dashboard — visibilidad es 100% manual vía `docker logs`. |
| A10 | Server-Side Request Forgery (SSRF) | ✅ No aplica | El backend no hace requests salientes a URLs provistas por el usuario (los links que un alumno pega en el chat van al LLM como texto, nunca se fetchean del lado del servidor). |

---

## 3. Gaps encontrados (no resueltos en esta issue — quedan para issues nuevas)

Encontrados durante una auditoría previa del chat widget en esta misma sesión de trabajo, confirmados acá contra el checklist OWASP formal:

- **Rate limiting diario** (`RATE_LIMIT_PER_USER_DAILY`): la env var existe pero ningún código la lee — confirmado también por el propio `services/api/README.md` ("Implementación pendiente Sprint 2", nunca se hizo). El rate limit por minuto (`RATE_LIMIT_PER_USER_MINUTE=20`) sí está implementado y aplicado (Redis, ventana fija, 429 + `Retry-After`) en `/messages` y `/stream`.
- **Moderación de contenido**: cero cobertura — no hay wordlist, no hay llamada a ninguna API de moderación (OpenAI moderation, Perspective API, etc.), nada que filtre insultos o contenido inapropiado antes de guardar/reenviar.
- **Indicador de límite de caracteres en el input**: ya trackeado en issue #375 (abierta), no es un gap nuevo.
- **Testing de frontend (ESLint + Jest)**: descubierto en esta auditoría al arreglar `frontend-ci.yml` — no existe config de ninguno de los dos, ni las dependencias instaladas. El workflow los referenciaba pero nunca corrieron. No es parte del scope de SEC-01, queda como gap de infraestructura de testing aparte.

---

## 4. Criterios de aceptación de la issue — estado

- [x] CI falla si se introduce una dependencia con vulnerabilidad conocida de severidad alta/crítica — `pip-audit`/`npm audit --audit-level=high` en los dos workflows, verificados localmente contra el estado real del repo.
- [x] Checklist OWASP Top 10 documentado con el estado de cada ítem para este proyecto puntual — sección 2 de este documento.
