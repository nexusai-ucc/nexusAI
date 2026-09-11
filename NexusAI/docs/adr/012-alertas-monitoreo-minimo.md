# ADR-012: Alertas mínimas viables — sin nueva infraestructura de monitoreo

| | |
|---|---|
| **Estado** | ✅ Aceptada |
| **Fecha** | 2026-09-11 |
| **Autor/es** | Santiago Tricherri |
| **Decididores** | Equipo NexusAI |

---

## Contexto

El backend ya emite logging estructurado en varios puntos (`app/main.py`, `app/shared/middleware.py` —línea de acceso JSON por request—, `app/analytics/logger.py`, `app/chat/router.py`), pero la visibilidad es 100% manual: alguien tiene que entrar a mirar logs o pegarle a `/health` a mano. No hay ninguna alerta automática. Es un gap ya documentado (ver `docs/DEPLOY_ORACLE.md` y las secciones de logging del código).

El backend corre en dos VMs de Oracle Cloud Always Free (1 core / 1GB RAM cada una, ver ADR-011), con deploy manual por SSH. Cualquier solución de monitoreo tiene que entrar cómoda en esos recursos — un stack tipo Prometheus + Grafana + Alertmanager corriendo aparte no se justifica para un piloto con esta escala de tráfico, y compite por RAM con el propio backend y Postgres.

Los eventos que más importan en un piloto, por impacto directo en la experiencia del alumno o del docente:

1. El backend cae o deja de responder.
2. Tasa de errores 5xx elevada en un período corto.
3. El proveedor LLM empieza a fallar o a tardar excesivamente.
4. Se agota (o se acerca a agotar) la cuota/presupuesto del proveedor de IA.

## Decisión

Se implementan alertas mínimas por **email vía SMTP de Gmail** (configurable por variables de entorno `ALERT_SMTP_USER` / `ALERT_SMTP_PASSWORD` / `ALERT_EMAIL_TO`, con `ALERT_SMTP_HOST`/`ALERT_SMTP_PORT` con default `smtp.gmail.com:465` pero reutilizables para cualquier SMTP con auth), sin agregar ningún servicio ni proceso adicional persistente más allá de un script de cron ya-existente-en-espíritu (la VM ya corre tareas periódicas simples). `smtplib` es stdlib de Python — no suma ninguna dependencia nueva. La cuenta remitente necesita una **App Password** de Google (no la contraseña normal — Gmail bloquea login SMTP directo desde 2022), generada en Cuenta de Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones.

- **Backend caído** (evento 1): `scripts/health_check_alert.py`, un script standalone sin dependencias de terceros (solo `urllib` + `smtplib` de la stdlib), pensado para correr por **cron cada 1 minuto** — deliberadamente AFUERA del proceso de FastAPI, porque si el proceso muere nada adentro puede avisar de su propia caída. Cuenta fallas consecutivas de `/health` en un archivo de estado local (cada invocación de cron es un proceso nuevo) y alertea al cruzar un umbral configurable (default: 3 fallas seguidas), con una única alerta por racha de caída y una notificación de recuperación cuando vuelve a responder.

- **Tasa de 5xx elevada** (evento 2): `app/shared/error_monitoring.py::record_5xx_and_maybe_alert`, llamado desde `RequestIDMiddleware` (`app/shared/middleware.py`) por cada response con status ≥ 500. Reusa el patrón de ventana fija en Redis de `app/shared/rate_limit.py` (mismo `INCR` + `EXPIRE` por bucket de tiempo) — no el mismo código, porque acá no hace falta lanzar una `HTTPException` sino contar y, opcionalmente, disparar un webhook.

- **LLM fallando o lento** (evento 3): instrumentado en `app/chat/router.py` (el call-site principal del LLM — el que afecta directamente la experiencia del alumno), no dentro de `LLMProvider` (`app/providers/llm.py`). Dos señales separadas porque no son el mismo problema:
  - **Falla**: cuando `llm.chat_completion` / `llm.chat_completion_stream` propaga una excepción (la cadena de fallback completa —primario + intermedios + secundario, ver ADR-003 y el docstring de `providers/llm.py`— se agotó). En el endpoint streaming esto NO se ve como 5xx (la response SSE ya arrancó en 200), así que el contador de 5xx del punto anterior no lo captura — de ahí la necesidad de una señal propia.
  - **Lento**: se mide la latencia de la llamada al LLM (no del request completo, que incluye retrieval/DB) y se cuenta si supera un umbral (default 15s) — una respuesta lenta sigue siendo un 200, así que tampoco la ve el contador de 5xx.

- **Cuota agotada** (evento 4): dentro de la misma falla del LLM, si la excepción final es `openai.RateLimitError` (429 — cuota agotada tanto en OpenAI como en el shim compatible de Gemini), se dispara una alerta separada y más específica ("revisar cuota/billing del proveedor"), con umbral bajo (1, por defecto) porque implica que ya no queda ningún eslabón de la cadena de fallback disponible.

Todas las alertas comparten el mecanismo de `app/shared/alerting.py::record_event_and_maybe_alert`: ventana fija en Redis + una bandera `SET NX` con el mismo TTL para no floodear la casilla de correo mientras el problema persiste (una sola alerta por ventana, no una por request). El envío en sí (`send_alert`) corre `smtplib.SMTP_SSL` dentro de `asyncio.to_thread` para no bloquear el event loop de FastAPI, ya que `smtplib` es una librería síncrona.

## Alternativas evaluadas

### Alternativa A — Prometheus + Grafana + Alertmanager

Stack estándar de observabilidad self-hosted.

**Pros:**
- Dashboards históricos, alertas configurables con reglas ricas (PromQL), estándar de la industria.
- Escala bien si el proyecto crece.

**Contras:**
- Grafana + Prometheus + Alertmanager corriendo full-time consumen fácilmente 300-500MB de RAM combinados — una porción grande de 1GB total en una VM que ya corre Postgres, Redis y el propio backend.
- Requiere exponer/instrumentar métricas (client library, `/metrics` endpoint) y mantener 3 servicios nuevos con sus propios configs, en un entorno de deploy manual por SSH sin orquestador.

**Por qué no:** desproporcionado para un piloto con tráfico bajo en un tier gratuito de 1 core/1GB. Es la opción correcta si el proyecto migra a infraestructura con más recursos (ver "Cuándo revisar" en ADR-011).

### Alternativa B — SaaS de monitoreo externo (UptimeRobot, Better Uptime, Pingdom, etc.)

Servicio externo que pinguea `/health` y alertea.

**Pros:**
- Cero infraestructura propia, detecta caída de la VM completa (no solo del proceso), interfaz lista.
- Resuelve mejor el caso "la VM entera está caída" que un cron corriendo en la propia VM (que también se cae con ella).

**Contras:**
- Solo cubre el evento 1 (caída/health). Los eventos 2, 3 y 4 (tasa de error, salud del LLM, cuota) necesitan lógica de aplicación que un servicio externo genérico no tiene sin exponer métricas propias.
- Depende de una cuenta de terceros y sus límites de free tier.

**Por qué no ahora, pero no se descarta:** queda anotado como complemento futuro para el chequeo de `/health` específicamente (ver "Cuándo revisar"), corriendo en paralelo al script de cron — no lo reemplaza para los otros 3 eventos.

### Alternativa C — Webhook a Slack/Discord + contadores en Redis

Primera versión de este ADR: notificar por un webhook entrante (Slack Incoming Webhook o Discord), con el mismo mecanismo de ventana fija en Redis.

**Pros:**
- Casi cero setup: crear un webhook es un solo paso en la UI de Slack/Discord, sin cuentas nuevas ni contraseñas de aplicación.
- Push casi instantáneo a un canal, sin depender de que alguien revise una bandeja de entrada.

**Contras:**
- Requiere que el equipo ya use Slack o Discord como canal de trabajo — para un piloto de una persona, es una herramienta más a chequear.
- El destino queda atado a un workspace/servidor de terceros en vez de algo tan personal y ya-revisado-a-diario como el propio email.

**Por qué no:** se prefirió un canal que el responsable del piloto ya revisa constantemente sin fricción — el propio correo — antes que sumar el hábito de mirar un canal de Slack/Discord dedicado. Queda documentada por si el equipo crece y conviene centralizar en un canal compartido (ver "Cuándo revisar").

### Alternativa D — Email vía SMTP de Gmail (elegida)

Descripta en la Decisión. Mismo mecanismo de conteo/umbral que la Alternativa C, cambiando el transporte de notificación.

**Pros:**
- Cero servicios nuevos: reusa Redis (ya desplegado, ver `app/infrastructure/redis_client.py`), un script de cron (mecanismo que la VM ya soportaría sin cambios), y `smtplib` de la stdlib — ninguna dependencia nueva en `requirements.txt`.
- El destino es el correo personal del responsable del piloto, que ya revisa sin necesidad de sumar un canal nuevo.
- Cada pieza sigue siendo ~50-100 líneas de Python testeables sin mocks pesados (se mockea `smtplib.SMTP_SSL`, no un servicio externo real).

**Contras:**
- Requiere una App Password de Google (un paso de setup manual, ver Decisión) — más fricción inicial que crear un webhook.
- Sin dashboards ni histórico — igual que la Alternativa C, solo notificación puntual al cruzar un umbral.
- El chequeo de `/health` por cron en la misma VM no detecta la caída de la VM entera (si la VM muere, el cron también) — esto no cambia según el transporte de notificación elegido.
- Gmail impone límites de envío (~500/día en cuentas normales) — muy por encima de lo que un piloto con pocos usuarios concurrentes puede generar, así que no es una restricción real hoy.

**Por qué sí:** cierra los 4 gaps del contexto con el presupuesto de recursos disponible, sin comprometer a nada que haya que desmontar si más adelante se adopta la Alternativa A o B, y entrega la notificación al lugar donde hoy se la va a leer.

## Consecuencias

### Positivas

- Los 4 eventos del piloto generan una notificación sin intervención humana, sin agregar procesos persistentes nuevos (el único proceso adicional es el script de cron, que corre unos milisegundos por minuto).
- El destino es configurable por variable de entorno (`ALERT_SMTP_USER`, `ALERT_SMTP_PASSWORD`, `ALERT_EMAIL_TO`) — sin credenciales hardcodeadas, y sin esas tres variables configuradas el sistema no rompe: solo loguea con `WARNING`.
- La lógica de umbral (`record_event_and_maybe_alert`) es genérica y reusable — agregar un quinto evento a futuro (p. ej. fallos de indexación de documentos) es una función nueva de ~10 líneas, no un mecanismo nuevo. Cambiar el transporte de notificación (por ejemplo, sumar Slack más adelante) tampoco toca esa lógica: solo `send_alert`.

### Negativas / trade-offs aceptados

- No hay dashboard ni métricas históricas — solo se sabe que algo pasó en el momento en que se cruza el umbral, no se puede graficar la tendencia de los últimos 30 días.
- "Se acerca al límite de cuota" no se detecta de forma proactiva (no hay integración con la API de billing/uso del proveedor) — solo se detecta la cuota YA agotada (`RateLimitError` propagada). Los proveedores usados (Gemini vía shim OpenAI-compat, OpenAI) no exponen un endpoint simple de "% de cuota usada" para consultar proactivamente.
- El chequeo de `/health` corre en cron en la misma infraestructura que monitorea — si la VM completa se cae (no solo el proceso), el cron tampoco corre y no hay alerta.
- Las alertas se pierden si Redis está caído en el momento del evento (el contador no se puede incrementar) — se loguea el fallo pero no hay alerta de respaldo sin Redis.
- Si Gmail cambia su política de App Passwords, o la cuenta remitente queda bloqueada/sospechada de spam, el envío se corta silenciosamente (queda solo el log de `WARNING`) hasta que alguien note la ausencia de alertas.

### Cómo se mitigan

- El histórico se puede reconstruir a mano desde los logs JSON existentes (`app/shared/middleware.py`, `app/analytics/logger.py`) mientras no se justifique un dashboard — no se pierde el dato, solo la visualización automática.
- La cuota agotada reactiva sigue siendo la señal más accionable en un piloto pequeño: con pocos usuarios concurrentes, el margen entre "cerca del límite" y "agotado" es chico.
- El chequeo de `/health` puede correr en la OTRA VM de Oracle (apuntando a la URL pública en vez de `localhost`) para no depender de que la VM caída sea la que hace el chequeo — queda como configuración de despliegue, no como cambio de código.
- El fallback "solo logueo si Redis está caído" es aceptable porque Redis caído ya es, en sí mismo, un problema grave que debería verse por otros medios (rate limiting y sesiones de chat dependen de él).

## Cuándo revisar esta decisión

- Si el volumen de alertas por email se vuelve ruidoso (falsos positivos frecuentes) — ajustar umbrales antes de agregar herramientas nuevas.
- Si el equipo crece y conviene centralizar las alertas en un canal compartido en vez del correo de una sola persona — volver a la Alternativa C (webhook Slack/Discord) o sumarla como transporte adicional.
- Si se necesita histórico/tendencias (no solo "pasó algo ahora") — momento de evaluar Alternativa A, cuando el presupuesto de RAM de las VMs lo permita o se migre de infraestructura (ver ADR-011).
- Si se quiere detectar la caída de la VM completa, no solo del proceso — agregar un SaaS externo (Alternativa B) como complemento al script de cron, sin reemplazar el resto.
- Si un proveedor de IA expone una API de uso/cuota consultable — reemplazar la detección reactiva (`RateLimitError`) por un chequeo proactivo de porcentaje de cuota usada.

## Referencias

- `app/shared/rate_limit.py` — patrón de ventana fija en Redis del que se reusa el estilo.
- `app/shared/middleware.py` — logging estructurado existente, punto de instrumentación del evento 2.
- `app/providers/llm.py` — cadena de fallback multi-proveedor (ADR-003, ADR-004), fuente de los eventos 3 y 4.
- ADR-011 (`011-deploy-self-hosted-oracle.md`) — restricciones de infraestructura (Oracle Always Free, deploy manual por SSH).

---

*Última actualización: 2026-09-11*
