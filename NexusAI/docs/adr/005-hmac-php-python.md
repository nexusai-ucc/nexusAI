# ADR-005: Autenticación PHP↔Python con HMAC SHA-256 en 3 capas

| | |
|---|---|
| **Estado** | ✅ Aceptada |
| **Fecha** | 2026-05-04 |
| **Autor/es** | Delfina Salinas, Santiago Tricherri |
| **Decididores** | Equipo NexusAI |

---

## Contexto

El plugin Moodle (PHP) y el backend NexusAI (FastAPI/Python) son dos servicios
independientes que se comunican vía HTTP. Esta comunicación es el punto crítico
de seguridad del sistema:

- **El navegador NUNCA habla con FastAPI directamente** (ver ADR-001 — patrón
  Hybrid PHP Proxy). Solo PHP, server-to-server, hace requests al backend.
- La API key del proveedor LLM (Gemini en MVP, OpenAI en prod) **vive solo en
  el backend Python**. Si llegara al navegador, cualquier alumno podría
  extraerla y consumir tokens a costa de la UCC.
- Aunque la red entre los dos servicios suele ser interna (mismo Docker network
  o VPC universitaria), no podemos asumir que el tráfico es seguro: en
  desarrollo es localhost sin HTTPS, en algunas producciones se desplegará en
  redes con varios servicios sin TLS interno.

Restricciones del proyecto:

- **Universidades suelen restringir tráfico saliente** (ver
  `investigacion/05-backend-fastapi/autenticacion-hmac.md`). Toda comunicación
  externa es por puerto 443. La autenticación tiene que funcionar sin asumir
  HTTPS interno garantizado.
- **No queremos depender de OAuth o JWT con kid externo** — agregaría
  infraestructura (un IdP, rotación de claves) sin beneficio claro para 2
  servicios bajo el mismo control.
- **El plugin Moodle ya tiene la sesskey/CSRF de Moodle** entre browser↔PHP.
  La pieza que falta proteger es PHP↔Python.

## Decisión

Autenticación de **3 capas** entre PHP y Python, con headers definidos:

```
Authorization: Bearer <NEXUSAI_API_KEY>           ← capa 1: identidad del cliente
X-Timestamp:   <unix epoch en segundos>           ← capa 2a: ventana temporal
X-Nonce:       <UUID v4 único por request>        ← capa 3: anti-replay
X-Signature:   <hex_hmac_sha256(...)>             ← capa 2b: integridad del payload
```

**Capa 1 — Bearer API key.** Identifica al cliente (el plugin) frente al
backend. Si el header falta o no matchea, devolvemos 401 sin procesar nada
más. Verificación con `hmac.compare_digest` para evitar timing attacks.

**Capa 2 — HMAC SHA-256 sobre `(timestamp || nonce || body)`.** La firma se
calcula con un `NEXUSAI_SHARED_SECRET` (32 bytes hex generado con
`openssl rand -hex 32`). Si alguien modifica el body en tránsito, la firma
deja de matchear. El timestamp tiene una ventana de 300 segundos (5 minutos)
para tolerar drift de NTP entre servidores y prevenir requests viejas.

**Capa 3 — Anti-replay con nonce store en Redis.** Cada request trae un UUID
v4 único en `X-Nonce`. El backend lo guarda en Redis con `SET key value NX EX 300`
(operación atómica: o lo crea o falla). Si el nonce ya existe, devolvemos 401
"Replay detected". El TTL coincide con la ventana del timestamp, así Redis se
limpia solo.

Implementación: `services/api/app/auth/hmac.py` como FastAPI Dependency
(`verify_hmac`) que se inyecta en cada endpoint protegido. Cliente PHP en
`plugin/local/nexusai/classes/external/backend_client.php` (implementado en
Sprint 1, verificado end-to-end el 4 May 2026).

## Alternativas evaluadas

### Alternativa A — Solo Bearer API key

Una `Authorization: Bearer xxx` y nada más.

**Pros:**

- Simple, fácil de implementar.
- Es lo que hace el 80% de las APIs HTTP.

**Contras:**

- **Sin integridad del body:** alguien con MITM podría modificar el payload
  manteniendo la API key.
- **Sin protección contra replay:** una request capturada se puede re-ejecutar
  durante toda la vida útil de la API key.
- Si la API key se filtra (logs, dump de memoria, etc.), el atacante tiene
  acceso completo hasta que se rote.

**Por qué no:** queremos defender en profundidad. La API key sola es
suficiente cuando el canal es 100% confiable, pero acá no podemos asumir eso.
HMAC + nonce cuestan ~50 líneas extra y eliminan dos vectores de ataque
completos.

### Alternativa B — JWT firmado con shared secret

Token JWT con claims (`sub`, `iat`, `exp`, payload) firmado con HS256.

**Pros:**

- Estándar muy difundido, hay librerías para todo.
- El payload completo va dentro del token, no separado.

**Contras:**

- **Sobrecargado para nuestro caso:** los JWT están pensados para auth de
  usuarios con claims y sesiones, no para auth servicio↔servicio sin estado.
- **Token grande:** un JWT con payload típico pesa 500B-2KB en el header.
  HMAC + headers separados es ~150B.
- **Mismo nivel de seguridad que HMAC + timestamp** sin agregar nada
  específico. La librería JWT no hace anti-replay built-in tampoco.
- Si Marcos termina escribiendo manualmente la firma del lado PHP (porque la
  lib JWT de Moodle no está vendoreada en core), el riesgo de bug es el mismo
  que con HMAC.

**Por qué no:** no aporta sobre HMAC + timestamp + nonce, y agrega peso al
header. JWT brilla cuando hay claims complejos o cuando los tokens viajan
por sistemas que no comparten secret. Acá no es el caso.

### Alternativa C — mTLS (mutual TLS)

Certificados X.509 en ambos lados, autenticación a nivel de conexión TLS.

**Pros:**

- Auth + cifrado a nivel de transporte.
- Es lo que recomienda zero-trust networking.

**Contras:**

- **Setup complejo:** generar CA, distribuir certificados, manejar rotación.
- **Imposible de testear localmente sin esfuerzo importante** (cada developer
  tendría que generar un cert).
- **No funciona en algunas configs universitarias** donde el tráfico pasa por
  proxies que terminan TLS.
- Para el MVP es overkill. Anthropic / OpenAI / Stripe no hacen mTLS para sus
  APIs, hacen API key + HMAC + ratelimits.

**Por qué no:** nivel de complejidad no justificado para 2 servicios bajo el
mismo control de despliegue. Reabrir si en el futuro montamos NexusAI como
servicio multi-institución (cada universidad sería un cliente con su cert).

### Alternativa D — HMAC + timestamp SIN nonce (✅ era el plan original)

Como la decisión final, pero sin la capa 3 (Redis nonce store).

**Pros:**

- Más simple, no requiere Redis para auth.
- Es lo que muchos servicios SaaS hacen (Slack webhooks, GitHub webhooks).

**Contras:**

- **Replay attack dentro de la ventana de 5 minutos** sigue siendo posible.
  Un atacante que captura una request válida puede re-ejecutarla N veces
  mientras el timestamp esté vigente.
- En sistemas con rate limit por usuario, esto puede usarse para agotar la
  cuota de un alumno o subir un mismo PDF varias veces.

**Por qué no:** el costo de la capa 3 es muy bajo (Redis ya está en el stack
para rate limiting y cache LLM, ver ADR-002 y `.env.example`), y la protección
contra replay vale el esfuerzo. El nonce store es ~10 líneas extra en el
verify y se limpia solo con TTL.

## Consecuencias

### Positivas

- **Defensa en profundidad:** un atacante necesita comprometer la API key Y
  el shared secret Y burlar el nonce store para hacer una request válida.
- **Sin estado del lado del backend** (más allá del nonce store que es Redis,
  efímero) — no hay sesiones, tokens long-lived, ni revocaciones que coordinar.
- **Simétrico y trivial de testear:** ambos lados firman exactamente igual,
  los tests pueden construir firmas válidas con el mismo algoritmo (ver
  `services/api/tests/test_hmac.py`).
- **Aprovecha Redis que ya está en el stack** — no agrega infraestructura.
- **Los headers son legibles en logs** (el body firmado va en el cuerpo,
  separado), facilita debugging.

### Negativas / trade-offs aceptados

- **Drift de NTP entre PHP y Python** puede romper auth si los relojes están
  más de 5 minutos desincronizados. En containers Docker compartiendo host
  esto no debería pasar, pero en producción multi-host puede.
- **Si Redis está caído, no se pueden recibir requests** — el nonce store
  es bloqueante. Es una dependencia adicional.
- **Cambiar el algoritmo es disruptivo** — un upgrade futuro a SHA-512 o a
  un esquema distinto requiere coordinar deploy de PHP y Python a la vez.
- **El body completo se firma**, no solo metadatos. Esto significa que el
  body tiene que llegar idéntico al backend. Si hay un proxy que reformatea
  JSON o re-serializa, la firma falla. PHP `json_encode` y Python `json.loads`
  preservan el body raw, así que en nuestro stack no es problema; pero hay
  que tenerlo presente.

### Cómo se mitigan

- **Drift NTP:** la ventana de 5 minutos es generosa. Loggear cada 401 por
  timestamp expirado con el delta `now - ts` para detectar drift sistemático.
  En containers usar `host` para el reloj.
- **Redis caído:** circuit breaker en el cliente PHP — si el backend devuelve
  503/timeout 3 veces seguidas, mostrar al usuario "El asistente no está
  disponible, intentá en un minuto" en lugar de seguir martillando. (TODO
  Sprint 2.)
- **Rotación del algoritmo:** pensar el deploy como "doble verificación" —
  el backend acepta tanto el método viejo como el nuevo durante una ventana,
  PHP empieza a firmar con el nuevo, después se desactiva el viejo. Mismo
  patrón que rotación de claves JWT.
- **Body identidad PHP↔Python:** el cliente PHP firma EXACTAMENTE el byte
  string que pone en `CURLOPT_POSTFIELDS`. No reformatear ni re-serializar
  entre `json_encode` y `curl_setopt`.

## Cuándo revisar esta decisión

Reabrir si:

| Trigger | Acción esperada |
|---|---|
| NexusAI se vuelve multi-institucional (cada universidad es un cliente) | Evaluar mTLS o OAuth client credentials para identificar tenants distintos |
| Aparece un requisito regulatorio de cifrado en tránsito explícito | Agregar TLS interno entre PHP y Python (no reemplaza el HMAC) |
| Necesitamos delegar requests a otros servicios además de Moodle | Evaluar JWT con `aud`/`iss` claims para distinguir clientes |
| Detectamos abuso interno (un docente con permisos legítimos haciendo cosas raras) | Agregar firma del `userid` en el body con audit log inmutable, no requiere cambiar el HMAC |

## Referencias

- [`investigacion/05-backend-fastapi/autenticacion-hmac.md`](../../investigacion/05-backend-fastapi/autenticacion-hmac.md) — investigación previa del esquema
- [`services/api/app/auth/hmac.py`](../../services/api/app/auth/hmac.py) — implementación Python
- [`services/api/tests/test_hmac.py`](../../services/api/tests/test_hmac.py) — tests de los caminos de fallo
- [ADR-001: Monolito modular](001-monolito-modular.md) — establece el patrón Hybrid PHP Proxy
- [RFC 2104 — HMAC](https://datatracker.ietf.org/doc/html/rfc2104)
- [OWASP — Replay attacks](https://owasp.org/www-community/attacks/Replay_Attack)
- [OWASP API Security Top 10 — Broken Authentication](https://owasp.org/API-Security/editions/2023/en/0xa2-broken-authentication/)

---

*Última actualización: 2026-05-04*
