# ADR-014: Datos del alumno en tablas nativas de Moodle (opción C híbrida)

| | |
|---|---|
| **Estado** | ✅ Aceptada |
| **Fecha** | 2026-09-26 |
| **Autor/es** | Marcos Bugliotti |
| **Decididores** | Marcos Bugliotti |
| **Reemplaza** | [ADR-006](006-privacy-strategy.md) en dónde viven los datos personales |
| **Acota** | [ADR-002](002-pgvector.md): pgvector queda solo para el índice del material del curso |

---

## Contexto

Hoy NexusAI usa dos bases separadas, unidas solo por `course_id` y `user_id` enteros:

- **Backend** (PostgreSQL 16 + pgvector 0.8, VM de Oracle con 1 OCPU y 1 GB de RAM): 14 tablas con todo lo del alumno y del curso. Entre ellas están `chat_sessions`, `messages`, `interaction_logs`, `quiz_attempts`, `quiz_errors`, `flashcards`, `unanswered_questions` y `calendar_alerts`, además del índice del material (`documents`, `chunks`, `forum_post_embeddings`).
- **Moodle**: solo `local_nexusai_placeholder` (vacía) y algunas `user_preferences` del plugin (onboarding, subidas pendientes, token del feed de calendario).

Consecuencias de ese diseño, relevadas el 25/09/2026:

- **Privacidad por HTTP e incompleta.** El export y el borrado no cubren `unanswered_questions` ni `calendar_alerts`. El hash del usuario en las métricas es SHA-256 sin sal de un entero, así que se revierte probando todos los ids. Al borrar un curso o un usuario en Moodle, sus datos quedan huérfanos en el backend.
- **Fuera de las herramientas de Moodle.** El backup de Moodle no incluye nada de NexusAI y no hay reportes nativos.
- **El backend no tiene backups** en ningún ambiente ([`docs/DEPLOY_ORACLE.md`](../DEPLOY_ORACLE.md) §7).
- **Muchas llamadas entre servidores.** 48 de las 55 funciones externas del plugin llaman al backend. Mediciones del 25/09:
  - lectura nativa en la base de Moodle: 0,23 ms (mediana);
  - la misma lectura vía backend en la misma máquina: 4,7 ms;
  - cada llamada al backend de producción: ~135 ms (TCP ~40 ms y TLS ~50 ms, con una conexión nueva por pedido).
- **Sin resiliencia.** Si el backend se cae, falla todo el panel, incluido el historial.

Además:

- La UCC usa **Moodle 5.0** y, al actualizar, tiene en cuenta las tablas de los plugins. El motor de base de la UCC no está confirmado.
- Moodle 5.x soporta PostgreSQL, MySQL, MariaDB, SQL Server y Aurora MySQL. pgvector solo existe en PostgreSQL.
- Desde 4.5, Moodle guarda de forma nativa los datos de su propio subsistema de IA (`core_ai`: `ai_action_register`, `ai_action_generate_text`, con prompt, respuesta, tokens, `userid` y `contextid`). No tiene almacén de vectores.

## Decisión

Los datos del alumno pasan a **tablas nativas `local_nexusai_*`** creadas con XMLDB. El plugin en PHP es su dueño y las lee y escribe con la API de base de Moodle (`$DB`).

El backend deja de guardar datos del alumno. Conserva:

- el índice del material: `documents`, `chunks` y `forum_post_embeddings`;
- el registro de consumo de tokens, sin personas;
- las cachés de contenido: resúmenes y respuestas.

El backend nunca se conecta a la base de Moodle: recibe en cada pedido lo que necesita (historial, errores recientes) y devuelve resultados.

En Moodle quedan 16 tablas:

- **11 que vienen del backend:** sesiones de chat, mensajes, interacciones, votos, gaps, intentos y errores de quiz, flashcards y sus repasos, alertas de calendario y webhooks de foros.
- **5 nuevas:** consumo por alumno, banco de preguntas, uso del banco, exámenes del docente y configuración por curso.

La versión mínima del plugin pasa a **Moodle 4.5 LTS**.

## Alternativas evaluadas

### Alternativa A — Todo en el backend (como hoy)

**Pros:**
- No depende del motor de base de Moodle.
- Las métricas usan SQL propio de PostgreSQL.
- No hay nada que migrar.

**Contras:**
- Todos los problemas del contexto: privacidad incompleta y por HTTP, sin backup ni reportes de Moodle, 48 funciones dependiendo del backend, y el panel entero cae si cae el backend.

**Por qué no:** los datos quedan fuera de las herramientas que la UCC ya usa para gestionar Moodle.

### Alternativa B — Mismo servidor PostgreSQL de la UCC

El backend usa una base o un schema aparte en el servidor PostgreSQL de Moodle. Era la arquitectura objetivo original ([`docs/diagrams/deployment.md`](../diagrams/deployment.md)).

**Pros:**
- Una sola operación de base de datos para la UCC.

**Contras:**
- Exige Moodle sobre PostgreSQL y permiso de superusuario para `CREATE EXTENSION vector`.
- Exige el backend dentro de la red de la UCC, o una conexión entrante al puerto 5432, que choca con la política de salida solo por 443.
- La construcción del índice HNSW y las búsquedas vectoriales compiten con Moodle en los picos de examen.
- Las actualizaciones de PostgreSQL quedan acopladas a las de pgvector.
- No resuelve privacidad, backup de curso, reportes ni cantidad de llamadas: los datos siguen fuera de las tablas de Moodle.

**Por qué no:** mejora la operación de la base pero no la integración con Moodle, y depende de tres condiciones de la UCC que no están confirmadas. Queda como complemento posible para el índice vectorial (ver "Cuándo revisar").

### Alternativa C1 — Tablas nativas, con el PHP como dueño ✅ ELEGIDA

Descripta en la Decisión.

### Alternativa C2 — El backend escribe directo en la base de Moodle

**Contras:**
- Saca las credenciales de la base de Moodle fuera de la UCC y abre el puerto de la base.
- Se saltea las cachés, los eventos y las validaciones de Moodle.
- Ata el backend al esquema y al prefijo de tablas de cada instalación.

**Por qué no:** los mismos problemas de red que B, más acoplamiento con cada instalación.

### Alternativa D — Todo en Moodle, incluidos los vectores

**Por qué no:** solo PostgreSQL con pgvector hace búsqueda vectorial, y la API de base de Moodle no expone esos operadores (ver ADR-002).

## Consecuencias

### Positivas

- **Privacy API nativa y completa:** export, borrado y lista de usuarios por SQL sobre tablas propias.
- **Herramientas de Moodle:** el backup de Moodle incluye los datos, se pueden sumar al backup de curso, y hay Report Builder y eventos en el log estándar.
- **Menos llamadas:** unas 24 de las 48 funciones que hoy llaman al backend pasan a leer la base de Moodle.
- **Resiliencia:** si el backend se cae siguen andando historial, flashcards, alertas y dashboard; falla solo lo que usa IA.
- **Cualquier motor:** funciona con todas las bases que soporta Moodle.
- **Encaja con las actualizaciones de la UCC:** Moodle crea y actualiza las tablas con `upgrade.php`.
- **Backend más liviano:** saca la mayor parte de las escrituras de la VM de 1 GB.

### Negativas / trade-offs aceptados

- **Lógica en dos lenguajes.** SM-2, racha, dificultad sugerida, agrupamiento de gaps y dashboard pasan a PHP, y el resto queda en Python.
- **Migración de datos:** hay que migrar los datos existentes.
- **SQL portable obligatorio:** sin `date_trunc`, `FILTER`, `array_agg`, `random()` ni `GROUP BY` sobre textos.
- **Crecimiento:** la base de Moodle crece entre 50 y 250 MB por mes con 500 alumnos (estimado).
- **Respuestas en vuelo:** si el proceso PHP termina a mitad de una respuesta del chat, se podría perder el mensaje.
- **Dos sistemas de migraciones:** XMLDB en el plugin y Alembic en el backend.

### Cómo se mitigan

- **Contratos intactos.** Cada tabla nativa tiene un id público `uuid`, así no cambian los contratos de las funciones externas ni React. Las 55 funciones mantienen sus firmas.
- **Paridad con Python.** La lógica portada se prueba contra los mismos casos que los tests de Python.
- **Migración segura:**
  1. backups previos (#517);
  2. ensayo en staging con una copia de producción;
  3. verificación de conteos y sumas de tokens por curso y mes;
  4. tablas viejas archivadas 60 días antes de borrarlas.
- **SQL probado en dos motores:** PHPUnit en PostgreSQL y en MySQL.
- **Crecimiento bajo control:** retención configurable por el admin y documentación de las tablas para IT.
- **Respuestas en vuelo:** la pregunta se guarda antes de llamar al backend, y se usa `ignore_user_abort`.
- **Despliegue gradual:** NexusAI viene apagado por defecto en cada curso (#520).

## Cuándo revisar esta decisión

| Trigger | Acción esperada |
|---|---|
| La UCC confirma PostgreSQL y acepta alojar el backend | Evaluar B solo para el índice vectorial; no cambia C |
| El crecimiento de la base de Moodle supera lo que acepta IT | Ajustar la retención y resumir las interacciones viejas |
| NexusAI pasa a atender varias instituciones con un backend compartido | Revisar la identificación de clientes en el registro de consumo |
| Moodle incorpora almacenamiento vectorial nativo | Evaluar mover también el índice del material |

## Referencias

- Plan de implementación: issues #517 a #531 y PR #516 (presupuesto de tokens por rol).
- [ADR-002: pgvector sobre PostgreSQL](002-pgvector.md)
- [ADR-005: Autenticación PHP↔Python con HMAC](005-hmac-php-python.md)
- [ADR-006: Estrategia de Privacy API](006-privacy-strategy.md) (reemplazada por este ADR)
- [ADR-011: Deploy self-hosted en Oracle Cloud](011-deploy-self-hosted-oracle.md)
- [`docs/diagrams/deployment.md`](../diagrams/deployment.md)
- [`investigacion/09-relevamiento/requisitos-ucc.md`](../../investigacion/09-relevamiento/requisitos-ucc.md)
- [Moodle Developer — Privacy API](https://moodledev.io/docs/apis/subsystems/privacy/)

---

*Última actualización: 2026-09-26*
