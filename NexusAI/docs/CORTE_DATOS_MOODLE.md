# Corte de los datos del alumno a Moodle (DATA-06)

Guía para pasar los datos del alumno que hoy guarda el backend a las tablas
del plugin en Moodle, y dejar de guardarlos en el backend. Es el paso final de
la Fase 1 de la opción C ([ADR-014](adr/014-datos-alumno-en-moodle.md)): issue #526.

Se hace **una vez por ambiente**: primero el ensayo en staging, después la
producción en una ventana de mantenimiento.

## Qué se mueve

| Backend (PostgreSQL) | Moodle | Cómo se relaciona |
|---|---|---|
| `chat_sessions` | `local_nexusai_chat_sessions` | `uuid` = id del backend |
| `messages` | `local_nexusai_messages` | sesión por `uuid` |
| `interaction_logs` | `local_nexusai_interactions` | usuario por la conversación o por el hash |
| `message_feedback` | `local_nexusai_msg_feedback` | mensaje por `uuid`, usuario por el hash |
| `unanswered_questions` | `local_nexusai_gaps` | `uuid` = id del backend |
| `quiz_attempts` | `local_nexusai_quiz_attempts` | `uuid` = id del backend |
| `quiz_errors` | `local_nexusai_quiz_errors` | `uuid` = id del backend |
| `flashcards` | `local_nexusai_flashcards` | `uuid`; `sourcecmid` sale de `documents.cmid` |
| `flashcard_reviews` | `local_nexusai_fc_reviews` | flashcard por `uuid` |
| `calendar_alerts` | `local_nexusai_cal_alerts` | `uuid` = id del backend |
| `forum_webhook_configs` | `local_nexusai_forum_webhooks` | uno por curso |

Se conserva el id del backend en la columna `uuid`, así que el frontend sigue
viendo los mismos ids de conversación, intento o flashcard.

**No se mueve:** el material indexado (`documents`, `chunks`), el registro de
consumo (`llm_usage`, sigue en el backend) y las cachés.

**Filas que se omiten** (y se cuentan): las de usuarios borrados o que no
existen en ese Moodle, las de cursos que ya no existen, y lo que cuelga de
ellas (mensajes de una conversación omitida, repasos de una flashcard
omitida). También un recordatorio o una flashcard repetidos, porque Moodle
guarda uno por usuario y evento, y uno por curso y contenido. La verificación
los suma como movidos, así que los conteos igual tienen que cerrar.

## Las herramientas

**En Moodle** (`local/nexusai/cli/migrate_from_backend.php`):

```bash
php local/nexusai/cli/migrate_from_backend.php            # migra y verifica
php local/nexusai/cli/migrate_from_backend.php --verify   # solo verifica
php local/nexusai/cli/migrate_from_backend.php --status   # avance guardado
php local/nexusai/cli/migrate_from_backend.php --reset    # olvida el avance
```

- Pide al backend tabla por tabla, en orden de creación y de a 500 filas
  (`--limit`). Cada página se escribe en una transacción junto con el cursor
  de la siguiente: **si se corta, se vuelve a correr y sigue donde quedó.**
- Correrlo de nuevo no duplica: reconoce lo ya importado por `uuid` (y las
  interacciones y votos, que no tienen, por curso, usuario y fecha).
- Al final compara con el backend: filas por tabla y, por curso y mes, filas y
  tokens de mensajes e interacciones. **Sale con código 0 solo si todo
  coincide**; si no, lista cada diferencia.
- Si las tablas del plugin ya tienen filas antes de empezar, se niega
  (`--force` para seguir igual: la verificación va a mostrar esas filas de más).
- Al terminar avisa qué cursos con conversaciones tienen NexusAI apagado.

**En el backend:**

- `MIGRATION_EXPORT_ENABLED=true` prende `GET /api/v1/migration/export` y
  `/export/summary` (firmados con HMAC). Apagado por defecto: entrega en bloque
  los datos de todos los alumnos, así que se prende solo durante el corte.
- `scripts/archive_student_tables.py` mueve las 11 tablas al esquema
  `archive` (`--apply`) o las devuelve a `public` (`--restore`). Sin opciones
  solo muestra cuántas filas tiene cada una.

## Requisitos

- [ ] **Backups funcionando** (#517) y una restauración de prueba con los
      mismos conteos por tabla.
- [ ] Backend con DATA-04 (#524) y plugin con DATA-05 (#525) y DATA-06 (#526)
      en la rama del ambiente.
- [ ] Moodle 4.5 o posterior y acceso a la línea de comandos de Moodle. En
      producción el Moodle es de la UCC: **coordinar con IT** quién corre el
      CLI y el backup de la base de Moodle.

## Ensayo en staging

El objetivo es medir el tiempo con datos reales y ver que la verificación
cierre antes de tocar producción.

1. Restaurar en la base de staging un `pg_dump` reciente de producción
   (procedimiento de restauración de #517).
2. Desplegar `staging` con `MIGRATION_EXPORT_ENABLED=true` en el `.env` de la
   VM y reiniciar la API (sección 3 de [DEPLOY_ORACLE.md](DEPLOY_ORACLE.md)).
3. En el Moodle de prueba que apunta a staging: actualizar el plugin y correr
   `php local/nexusai/cli/migrate_from_backend.php`.
4. Anotar el tiempo total y por tabla (lo imprime el CLI) y las filas
   omitidas. Para estimar la ventana de producción, sumar el tiempo de
   desplegar y de las pruebas de humo.
5. Probar con un alumno que tenía historial: ve sus conversaciones viejas,
   sus intentos de quiz y sus flashcards.
6. `scripts/archive_student_tables.py --apply`, probar que el chat sigue
   andando, y `--restore` para dejar staging como estaba.

| Ambiente | Fecha | Filas leídas | Omitidas | Tiempo de la migración | Verificación |
|---|---|---|---|---|---|
| Local (Moodle 5.2, datos de desarrollo) | 01/10/2026 | 82 | 6 | 0,4 s | cierra (descontando las filas previas) |
| Staging (dump de producción) | | | | | |

## Corte en producción

Con la ventana de mantenimiento avisada a los docentes.

1. **Moodle en mantenimiento**, para que nadie escriba mientras se migra:
   `php admin/cli/maintenance.php --enable`.
2. **Backup verificado** de PostgreSQL (`scripts/backup_postgres.sh`, #517) y
   de la base de Moodle (IT UCC).
3. **Desplegar el backend** (`staging → main`) con
   `MIGRATION_EXPORT_ENABLED=true` en el `.env`.
4. **Actualizar el plugin** en Moodle (`admin/cli/upgrade.php`).
5. **Migrar y comparar:** `php local/nexusai/cli/migrate_from_backend.php`.
   Si se corta, correrlo de nuevo. Tiene que terminar con
   *"Row counts and token sums per course and month match"*. Si lista
   diferencias, **no seguir**: ver "Volver atrás".
6. **Archivar las tablas viejas:**
   `sudo docker exec nexusai-api python scripts/archive_student_tables.py --apply`.
7. **Apagar el export y dejar de guardar usuarios en el registro de consumo:**
   en el `.env`, `MIGRATION_EXPORT_ENABLED=false` y
   `USAGE_LEDGER_STORE_USER_ID=false` (el consumo por persona ya queda en
   `local_nexusai_usage`); reiniciar la API.
8. **Sacar el mantenimiento** (`maintenance.php --disable`) y probar con un
   alumno: historial viejo, chat nuevo, quiz y flashcards.
9. **Encender los cursos** que lo pidan con `cli/enable_course.php`: el CLI de
   la migración lista los que tienen conversaciones y están apagados.
10. Publicar la **release 0.20.0**.

## Volver atrás

- **Antes del paso 6** (las tablas del backend siguen en `public`): restaurar
  la base de Moodle del backup del paso 2 y volver a desplegar la versión
  anterior del plugin. Moodle no permite instalar una versión más vieja del
  plugin encima de una más nueva, por eso hace falta el backup.
- **Después del paso 6:** además, devolver las tablas con
  `scripts/archive_student_tables.py --restore` y desplegar la versión
  anterior del backend.

## Después del corte

- Las rutas viejas del backend que leen esas tablas (chat con estado, panel de
  admin del backend) dejan de responder: el plugin ya no las usa. Se borran,
  junto con el export y las tablas archivadas, en la limpieza del backend
  (DATA-08, #530), 60 días después del corte y con backup verificado.
- El respaldo de los datos del alumno pasa a ser el backup de Moodle.
