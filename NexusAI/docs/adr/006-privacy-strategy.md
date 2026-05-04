# ADR-006: Estrategia de Privacy API — del `null_provider` al `metadata\provider`

| | |
|---|---|
| **Estado** | ✅ Aceptada |
| **Fecha** | 2026-05-04 |
| **Autor/es** | Delfina Salinas, Marcos Bugliotti |
| **Decididores** | Equipo NexusAI |

---

## Contexto

Moodle 3.5+ exige que **todo plugin** declare formalmente qué datos personales
maneja, mediante la **Privacy API**. El admin de Moodle puede usar esta
declaración para:

- Mostrar al usuario un reporte completo de qué datos de él se almacenan
  (`Site administration → Users → Privacy and policies → Data requests → Export`).
- Borrar todos los datos personales de un usuario que ejerza su derecho al
  olvido (RGPD/Ley argentina 25.326).
- Pasar los plugin checks que `moodle.org` requiere para listar oficialmente
  un plugin.

NexusAI **inevitablemente** va a manejar datos personales en algún momento:
mensajes que el alumno envía al chat, historial de conversaciones, vínculo
entre `user_id` de Moodle y embeddings/sesiones, métricas de uso. La pregunta
arquitectónica es **dónde se almacenan** esos datos:

- **Opción 1 — Todo en el backend Python externo** (Postgres+pgvector que vive
  fuera de Moodle). El plugin solo proxy-ea.
- **Opción 2 — Tablas de Moodle** (`local_nexusai_*` con XMLDB). Marcos lo
  prefería en la propuesta original.
- **Opción 3 — Híbrido:** algunas cosas en Moodle (settings, audit logs),
  otras en el backend (mensajes, embeddings).

La decisión afecta directamente qué `provider` de Privacy API usamos:

- **`\core_privacy\local\metadata\null_provider`** → declaramos formalmente
  que el plugin **NO almacena datos personales en Moodle**. Privacy API queda
  satisfecha con un string explicativo.
- **`\core_privacy\local\metadata\provider` + `core_userlist_provider`** →
  declaramos qué tablas tocamos, implementamos `get_metadata`, `get_users_in_context`,
  `export_user_data`, `delete_data_for_user`. Mucho más código, mucho más
  testing, mucho más mantenimiento.

## Decisión

**Estrategia en dos etapas:**

### Etapa 1 — MVP (hoy hasta junio 2026): `null_provider`

Todo el dato personal (mensajes, sesiones de chat, embeddings derivados de
mensajes del alumno) **vive en el backend NexusAI externo (Postgres+pgvector)**,
NO en tablas de Moodle. El plugin Moodle solo:

- Pasa `userid`, `courseid`, `sesskey` al frontend (datos volátiles, no
  almacenados).
- Hace requests proxyeadas al backend (no persiste el contenido).
- Almacena settings de admin (URL del backend, switch on/off) — esto es
  **configuración del plugin**, NO datos personales del usuario.

Por lo tanto, la Privacy API actual (`classes/privacy/provider.php`) declara
`null_provider` con la razón:

> *"The NexusAI plugin does not store personal data in Moodle. All chat history
> lives in the external NexusAI backend service."*

### Etapa 2 — Post-MVP (cuando se cumpla cualquiera de los triggers de migración)

Migrar a `\core_privacy\local\metadata\provider` con implementación completa
de export/delete cuando ocurra **alguna** de estas condiciones:

| Trigger | Por qué exige migración |
|---|---|
| Almacenamos audit logs de uso en Moodle (ej. tabla `local_nexusai_usage` con `userid`, `courseid`, `timecreated`) | Los logs incluyen metadata personal |
| Cacheamos respuestas LLM en tablas de Moodle por performance | El cache puede contener fragmentos de la conversación |
| Implementamos analytics docente que cruza `userid` con preguntas hechas | Datos personales agregados → sigue siendo personal |
| Guardamos preferencias del alumno (idioma del chat, tema, etc.) en `local_nexusai_user_prefs` | Configuración por usuario es dato personal |
| Submitir el plugin al directorio oficial de moodle.org | Requiere `metadata\provider` real |

## Alternativas evaluadas

### Alternativa A — Implementar `metadata\provider` desde el día 1

Construir desde el principio el provider completo con `get_metadata`,
`get_users_in_context`, `export_user_data`, `delete_data_for_user`, aunque
las tablas estén vacías al inicio.

**Pros:**

- Cuando agreguemos almacenamiento, está todo el scaffolding listo.
- Pasa el plugin checker de moodle.org desde el día 1.
- El equipo se familiariza con la Privacy API temprano.

**Contras:**

- **Código que no se ejecuta** todo el tiempo del MVP — clases con métodos
  que devuelven `[]` o `null`.
- Tests de Privacy API son difíciles de mantener cuando no hay data real.
- Falsa sensación de cumplimiento: si agregamos una tabla nueva y olvidamos
  actualizar `get_metadata`, los métodos vacíos siguen pasando los tests.
- **Costo de mantenimiento ahora**, beneficio incierto en el futuro.

**Por qué no:** YAGNI. La migración de `null_provider` a `metadata\provider`
es un upgrade conocido y bien documentado de Moodle. No vale la pena
construir el andamiaje vacío.

### Alternativa B — Almacenar TODO en Moodle (sin backend Python)

Mover el almacenamiento de mensajes y embeddings a tablas de Moodle
(`local_nexusai_messages`, `local_nexusai_embeddings`). El backend Python
solo procesa pero no persiste.

**Pros:**

- Privacy API se aplica de forma natural — todo el dato vive en Moodle.
- El admin de Moodle tiene control total sobre los datos.
- Cumple "data in your university stays in your university" sin discusión.

**Contras:**

- **No podemos usar pgvector eficientemente** desde Moodle (la integración
  Postgres↔Moodle no expone operadores `<->`, `<=>` para búsqueda vectorial).
  Tendríamos que reescribir el retrieval con SQL crudo y perder los índices
  HNSW de pgvector. Ver ADR-002.
- **Acopla el cron de indexación a Moodle** — las tareas pesadas (procesar
  un PDF de 100 páginas) bloquean el cron de Moodle si no se manejan con
  cuidado.
- **Nos ata a Moodle como única plataforma**. Si el día de mañana queremos
  exponer NexusAI vía Canvas LMS o standalone, hay que mover todo.

**Por qué no:** sacrifica las capacidades de pgvector y la independencia del
backend, que son centrales en ADR-002.

### Alternativa C — `null_provider` ahora, `metadata\provider` cuando se justifique ✅ ELEGIDA

Como en la decisión.

**Pros:**

- **Mínimo código mientras MVP no almacena en Moodle** — provider de 5 líneas.
- **Migración explícitamente planificada** — esto evita la trampa típica de
  "luego lo arreglamos" (el luego nunca llega).
- **Privacy se cumple desde el día 1** porque la declaración (`null_provider`
  con razón) es legítima y precisa.
- **No bloquea nada** — el día que agreguemos audit logs, hacemos el upgrade
  con un PR aislado.

**Contras:**

- Cuando llegue la migración, hay un "salto" de complejidad — de 5 líneas a
  ~150 líneas en `provider.php`.
- El equipo tendrá que aprender la Privacy API en ese momento.

**Por qué sí:** balance correcto entre simplicidad ahora y evolución
controlada después.

## Consecuencias

### Positivas

- **MVP sale más rápido** — no perdemos tiempo en código de Privacy API que
  no se ejecuta.
- **Declaración legal correcta hoy** — el plugin no miente sobre lo que
  almacena en Moodle.
- **Triggers explícitos** evitan la trampa de "agregar una tablita más sin
  actualizar la Privacy API".
- **Backend Python independiente** mantiene las ventajas de pgvector + acceso
  futuro multi-plataforma.

### Negativas / trade-offs aceptados

- **Privacy del backend Python no está cubierta por la Privacy API de Moodle.**
  El admin de Moodle no puede ejercer "borrar todos mis datos" sobre el
  backend NexusAI desde la UI estándar de Moodle. Si un alumno pide su
  derecho al olvido, hay que coordinar manualmente con el admin de NexusAI.
- **Riesgo organizacional:** si NexusAI se despliega externamente (en un
  servidor que NO es de la UCC), el dato personal está en infraestructura
  que la universidad no controla. Esto requiere acuerdo legal con la UCC
  (DPA — Data Processing Agreement).
- **El plugin checker de moodle.org rechaza plugins con `null_provider` si
  detecta tablas con `userid`** o si el código hace `$DB->insert_record('user_*'...)`.
  Si en algún momento queremos publicar oficialmente, hay que migrar primero.

### Cómo se mitigan

- **Privacy del backend:** documentar en el README del plugin y en la página
  de admin que "el contenido del chat se almacena en el servicio NexusAI
  externo. Para ejercer derechos sobre esos datos, contactar al admin del
  servicio". Sprint 4 puede agregar un endpoint `/api/v1/users/{id}` con
  DELETE para que el plugin pueda invocarlo desde Privacy API en la migración.
- **DPA con UCC:** redactar y firmar antes del despliegue real con alumnos.
  Es responsabilidad de Belén Zarazaga (Admin de Proyectos) coordinarlo con
  legal de la UCC. Trackear como issue del Project.
- **Plugin checker:** no submitir a moodle.org hasta que esté el
  `metadata\provider` real. La distribución vía GitHub tarball funciona
  perfectamente para la UCC en el MVP.

## Cuándo revisar esta decisión

Reabrir y migrar a `metadata\provider` cuando se cumpla **cualquiera** de:

| Trigger | Acción técnica concreta |
|---|---|
| Agregamos cualquier tabla `local_nexusai_*` que tenga columna `userid` | Implementar `get_metadata`, `get_users_in_context`, `export_user_data`, `delete_data_for_user` para esa tabla |
| El backend NexusAI expone API de export/delete por user | El plugin la consume desde su nuevo `provider.php` para que la Privacy API de Moodle "vea" los datos remotos |
| Decisión de submitir a moodle.org | Migración completa + tests de Privacy API + entrar en el ciclo de plugin review |
| UCC requiere reporte oficial de cumplimiento RGPD/Ley 25.326 | El admin de Moodle debe poder exportar/borrar — migrar antes del reporte |

## Referencias

- [`plugin/local/nexusai/classes/privacy/provider.php`](../../plugin/local/nexusai/classes/privacy/provider.php) — implementación actual (null_provider)
- [Moodle Developer — Privacy API](https://moodledev.io/docs/apis/subsystems/privacy/)
- [Moodle Developer — Implementing Privacy API](https://moodledev.io/docs/apis/subsystems/privacy/implementing)
- [Moodle Developer — null_provider](https://moodledev.io/docs/apis/subsystems/privacy/implementing#nullproviders)
- [Ley 25.326 — Protección de Datos Personales (Argentina)](http://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/norma.htm)
- [RGPD — Reglamento General de Protección de Datos (UE)](https://gdpr-info.eu/) — referencia internacional ampliamente citada en la documentación de Moodle
- [ADR-002: pgvector sobre PostgreSQL](002-pgvector.md) — explica por qué los embeddings viven fuera de Moodle

---

*Última actualización: 2026-05-04*
