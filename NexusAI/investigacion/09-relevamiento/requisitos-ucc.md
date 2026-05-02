# Requisitos técnicos y políticos de UCC

> **Resumen:** Qué restricciones impone la UCC para instalar un plugin en Moodle. Esta información hay que confirmarla con el técnico de Moodle de la facu. El PI original fue presentado asumiendo ciertos supuestos — acá los documentamos explícitamente y los validamos.

---

## Contexto

Sin la bendición del área de IT/Tecnología de la facu, el plugin no corre en producción y no hay beta con alumnos reales. Este doc es la checklist de preguntas a evacuar **antes** del Sprint 3.

## Preguntas pendientes al técnico de Moodle de UCC

### Infraestructura

1. ¿Qué versión de Moodle corre UCC en producción? (4.1 LTS, 4.2, 4.3, 4.4, 4.5 LTS)
2. ¿En qué SO corre? (Linux distro, versión).
3. ¿Qué versión de PHP?
4. ¿Qué base de datos? (PostgreSQL, MariaDB, MySQL).
5. ¿Tienen instancia **staging**?
6. ¿Access a shell / SFTP del server, o solo vía interfaz admin?

### Política de plugins

7. ¿Proceso formal para solicitar instalación de plugin nuevo?
8. ¿Plazo típico de aprobación? (la literatura sugiere 2-8 semanas en universidades).
9. ¿Hacen auditoría de código? ¿Con qué herramientas? (¿local_codechecker?)
10. ¿`$CFG->disableupdateautodeploy = true`? (probable sí — significa que instalamos vía SSH/SFTP)

### Red y seguridad

11. ¿Proxy saliente? ¿`$CFG->proxyhost` configurado?
12. ¿Puertos de salida permitidos? (esperamos 80 y 443 solamente)
13. ¿Whitelist de dominios externos? Si sí, ¿cómo se solicita agregar `api.nexusai.example.com`?
14. ¿Firewalls bloquean WebSockets / SSE? (crítico para streaming)

### Privacidad y cumplimiento

15. ¿Qué marco de privacidad aplica? (¿ley 25.326 de Argentina? ¿GDPR por alumnos UE?)
16. ¿Existe comité de ética o privacidad que revise apps de IA?
17. ¿Qué acuerdo formal hay que firmar con OpenAI como procesador de datos?
18. ¿Se puede implementar con **consentimiento informado del alumno** por curso?

### Operación

19. ¿Ventana de mantenimiento para desplegar plugin nuevo?
20. ¿Quién es responsable de backups de Moodle? ¿Incluyen los datos del plugin?

## Supuestos actuales (a validar)

| Supuesto | Nivel de confianza |
|---|---|
| Moodle 4.4 o 4.5 LTS | Media |
| PostgreSQL | Media |
| Sin shell access directo (SFTP solo) | Alta |
| Instalación vía SSH/SFTP manual | Alta |
| Plazo aprobación ~4-6 semanas | Media |
| Salida HTTPS sin restricciones | Baja-Media |

## Estrategia de mitigación

Dado que la aprobación institucional puede demorar:

### Plan A — Aprobación institucional

- Pedir instalación en staging apenas tengamos plugin estable (fin Sprint 2).
- Objetivo: beta con 1 curso real en Sprint 4 / post-MVP.

### Plan B — Demo local (para defensa)

Independientemente del timing institucional:

- **Moodle Docker local** (ya instalado, Moodle 4.4). Es donde corre el demo para el jurado.
- Dataset propio de apuntes (2-3 materias de Leandro).
- Simulación con 5-10 "alumnos" (integrantes del equipo + voluntarios).

Esto **garantiza demo funcional** sin depender de UCC.

### Plan C — Piloto con docente único

Si IT UCC demora, probar con Leandro en **Moodle externo** (nuestro o Railway):

- Leandro sube material a una instancia Moodle self-hosted nuestra.
- Alumnos voluntarios (3-5) prueban la herramienta.
- Se recolecta feedback sin tocar infra UCC.

## Datos que salen del sistema — para IT

Preparamos el diagrama y la planilla para defender la privacy:

### Datos que llegan a OpenAI

| Dato | Justificación | Mitigación |
|---|---|---|
| Texto de la pregunta del alumno | Necesario para que la IA responda. | TOS de OpenAI API — no se usan para entrenar modelos. |
| Chunks del material del curso | Contexto para RAG. | Los PDFs del curso ya son públicos para sus alumnos. |
| `user_id` (hasheado) | Rate limiting, contexto de conversación. | Hasheo en PHP antes de enviar. OpenAI no lo liga a identidad real. |
| `course_id` | Namespace de la colección. | Public info en el sistema. |

### Datos que **no** salen del sistema

- Nombre, apellido, email del alumno.
- Notas / calificaciones.
- Historial académico.
- Datos personales del perfil Moodle.

### Datos que NexusAI persiste en Moodle

- `{local_nexusai_messages}`: historial de chat, solo accesible por el alumno dueño y el docente del curso.
- `{local_nexusai_usage}`: contador de consultas para rate limiting.

## Decisiones tomadas para NexusAI

- **Plan B (demo Docker local) es la base no negociable** para la defensa.
- **Contacto con técnico Moodle UCC** es el próximo paso (Leandro conecta).
- **Privacy API completa desde Sprint 1** — no se deja para el final.
- **Diagrama de flujo de datos + matriz de datos** preparados antes de la reunión con IT.

## Abierto / pendiente

- [ ] Agendar reunión con técnico Moodle UCC (vía Leandro).
- [ ] Completar respuestas de este doc después de la reunión.
- [ ] Preparar un "paquete de compliance" (diagrama + matriz + checklist Privacy API) para presentar a IT.
- [ ] Investigar ley 25.326 específicamente — qué requiere para datos personales de estudiantes.
- [ ] Revisar términos de OpenAI API para procesamiento de datos educativos.

## Referencias

- [Guía técnica base — sección "Despliegue en universidades"](../recursos/referencias.md)
- [Moodle — `$CFG->disableupdateautodeploy`](https://moodledev.io/docs/guides/deployment)
- [OpenAI API data usage](https://openai.com/policies/api-data-usage-policies)
- Ley 25.326 — Protección de Datos Personales (Argentina)

---

*Última actualización: 2026-04-24 — Delfina*
