# Orden del repo antes de la pre-entrega

> v0.1, 06/11/2026 (PRE-09, #687). **Es una propuesta: no se cerró nada ni se tocó ningún PR.** Los datos salen de `gh` y de `origin/development` al 06/11. Cada issue que se cierre lleva un comentario con el PR que la resolvió.

**Por qué ahora:** el profe Carreño es colaborador del repo y la cátedra puede mirarlo antes de la pre-entrega. Hoy tenemos:
- 46 issues abiertas además de las PRE;
- muchas de esas issues tienen el trabajo mergeado hace más de un mes;
- un README que todavía anuncia el Check 2 como próximo hito.

## 1. Issues abiertas con el trabajo ya mergeado: cerrar

Las crucé con los PRs mergeados que las nombran. Antes de cerrar cada una, el responsable revisa los criterios de aceptación.

### Informe (PI-08 a PI-25): todas mergeadas entre el 15 y el 21/10

| Issue | PR que la resolvió |
|---|---|
| #606 PI-08 Relevamiento | #622 |
| #607 PI-09 Estado del arte | #625 |
| #608 PI-10 Arquitectura del backend | #629 |
| #609 PI-11 Arquitectura del plugin | #631 |
| #610 PI-12 Seguridad y cumplimiento | #634 |
| #611 PI-13 Anexo de ADRs | #627 |
| #612 PI-14 Despliegue | #636 |
| #613 PI-15 Marketplace | #620 |
| #614 PI-16 Pruebas reales | #637 |
| #615 PI-17 Gestión del proyecto | #626 |
| #616 PI-18 Diseño de interfaz | #639 |
| #617 PI-19 Reflexiones del equipo | #641 |
| #618 PI-20 Anexos B y D | #642 |
| #619 PI-21 Ensamblado final | #657 |
| #638 PI-22 Figuras 2a–2d | #650 (la referencia faltante a la Figura 2a está en el punto 3) |
| #655 PI-25 Plugin aprobado en el Marketplace | #656 |

### Visibilidad, datos, curso y consumo: todo mergeado entre el 26/09 y el 01/10

| Issue | PR |
|---|---|
| #536 VIS-01 | #542 |
| #537 VIS-02 | #543 |
| #538 VIS-03 | #544 |
| #539 VIS-04 | #545 |
| #540 VIS-05 | #546 |
| #541 VIS-06 | #547 |
| #518 DATA-01 (ADR-014) | #532 |
| #522 DATA-02 | #548 |
| #523 DATA-03 | #549 |
| #524 DATA-04 | #550 |
| #525 DATA-05 | #551 |
| #526 DATA-06 | #552 |
| #519 COST-01 | #533 |
| #520 CURSO-01 | #534 |
| #521 COST-02 | #535 |

**Ojo:** VIS-06, DATA-02 a DATA-06 están en el milestone "Backlog / Roadmap Post-Defensa", pero ya se hicieron. Al cerrarlas, conviene pasarlas a "Post-MVP Sprint G" para que el milestone diga la verdad.

## 2. Issues para revisar antes de decidir

| Issue | Qué pasa | Propuesta |
|---|---|---|
| #318 DEPLOY-02 Oracle Cloud | Ya está desplegado: #338 agregó el overlay y #458 documentó los dos ambientes | Cerrar si Santiago confirma que se cumplen los criterios |
| #402 RDS-03 Modo estudio integrado | #411 lo hizo y #412 revirtió una parte, la del motor del quiz | Revisar qué quedó. Cerrar con una nota o reabrir el alcance que falta |
| #403 RDS-04 Enter con IME | No hay PR | Es 1 punto. Hacerlo o pasarlo al backlog |
| #517 INFRA-04 Backups cifrados | Solo lo menciona #552, que no hace backups | Sigue abierta. Si no se hace antes de febrero, mencionarlo como límite |
| #530 DATA-08 Limpieza del backend | #550 la menciona, pero no borra tablas | Sigue abierta (post-defensa) |
| #249 PI-06 PPT y speech, #250 PI-07 Last check | Son de la defensa y las fechas son de febrero | Dejarlas en el milestone "Defensa Final" y enlazarlas a los documentos de `docs/defensa/` |
| #264 TEST-01, #265 TEST-02 Usuarios reales | Es un objetivo específico del informe que no se cumplió | Siguen abiertas: hay que decidir el plan (lo pregunta [PRE_ENTREGA.md](PRE_ENTREGA.md)) |
| COST-03/04, DATA-07/09, INT-01, INV-15 | Backlog sin PR | Siguen abiertas en el roadmap post-defensa |

## 3. PRs abiertos y un commit suelto

| Qué | Estado | Propuesta |
|---|---|---|
| **#661** `chore(api)`: versión 0.2.0 | Abierto desde el 22/10. Era el cambio que se iba a mergear en vivo en la demo del TP de Calidad. Pasa `app_version` de 0.1.0 a 0.2.0 y agrega una entrada al CHANGELOG | **Mergear.** Producción y staging siguen diciendo 0.1.0 en `/health`, y el backend cambió mucho desde entonces. Si se mergea, la entrada del CHANGELOG del punto 4 lo tiene en cuenta |
| **#676** `docs(calidad)`: los 10 defectos como issues | Abierto desde el 24/10. Solo documentación. Deja el registro de defectos coherente con lo que dice el informe del TP | **Que lo revise Marcos o Santiago y mergearlo.** Es el que respalda "10 defectos registrados" en la parte técnica |
| **Commit `9905d10`** | Agrega en el informe la frase que menciona la Figura 2a y el PDF regenerado. Quedó en `docs/corregir-fatales-autocorreccion` después de que se mergeara #660, así que nunca llegó a `development` | **Llevarlo a PRE-08** (#686). Se hace cherry-pick del cambio al `.md` en una rama nueva y el PDF se regenera con el resto de las correcciones, para no pelear con el binario |

## 4. README y CHANGELOG

### README (`README.md`)

| Línea aprox. | Dice | Tiene que decir |
|---|---|---|
| 9 | Badge `version-0.17.8` | `0.19.0` (`plugin/local/nexusai/version.php`) |
| 30, 77–78, 91 | Gemini en el MVP y GPT-4o-mini en producción; embeddings `text-embedding-3-small` **1536d** en producción | Hoy staging y producción usan `gemini-2.5-flash`. Si se usa OpenAI, los embeddings van **en 768 dimensiones**, porque las migraciones 009 y 017 fijan `vector(768)`: 1536 rompe el índice |
| 36–43 | Fase actual "Sprint D (hasta 14 Dic)"; próximo hito "Check 2 PI, antes del 3 Nov" | Fase: preparación de la defensa. Próximo hito: pre-entrega (30/11–2/12). Después, la defensa final (20–27/02/2027) |
| 46–50, 227 | "mergeado a `main`" | La rama de integración es `development` |
| 192–205 (cronograma) | Sprint B "en cierre", Sprint D "en curso", Entrega Final con el Check 2 | Marcar lo cumplido. Agregar el TP de Calidad (26/10), el Check 2 (03/11) y la pre-entrega |
| (falta) | No hay link al directorio de plugins de Moodle | Agregar el link y la insignia "aprobado". Es un aporte de la tesis |

### CHANGELOG (`CHANGELOG.md`)

El CHANGELOG del repo termina en **v0.17.8 (08/09)**. El del plugin (`plugin/local/nexusai/CHANGES.md`) sí está al día hasta 0.19.0. No hace falta copiarlo entero. Propuesta de entrada, para arriba de v0.17.8:

```markdown
## [v0.19.0] — 2026-10-14 a 2026-10-23 — Publicación en Moodle, calidad y accesibilidad

Detalle del plugin en `NexusAI/plugin/local/nexusai/CHANGES.md`.

### Agregado
- Visibilidad: el asistente solo usa el material de las actividades que el usuario puede ver, y las fuentes se abren por la actividad (VIS-01 a VIS-06).
- Datos del alumno en tablas nativas de Moodle, con Privacy API, y backend sin estado del alumno (ADR-014, DATA-01 a DATA-06).
- NexusAI se activa por curso, apagado por defecto (CURSO-01); registro de tokens por llamada y presupuesto por rol (COST-01, COST-02).
- CD a staging con verificación del commit y smoke de punta a punta (TPC-08); pruebas de carga con k6 en el pipeline (TPC-09).

### Corregido
- DEF-09: el chat colapsaba con ~15 chats simultáneos por retener conexiones del pool (#644).
- Hallazgos de SonarCloud: de 26 bugs y 14 vulnerabilidades a 0 (#646).
- Accesibilidad WCAG 2.2 AA del widget y del panel docente (#665).
- Cambios pedidos en la revisión del directorio de plugins de Moodle (MMR-301): privacidad de foros, streaming con `\curl`, i18n.
```

El texto definitivo lo revisa quien haga el PR. Si se mergea #661, va una línea más para la API 0.2.0.

## Orden sugerido

1. Cerrar las issues del punto 1, con un comentario cada una. Es un trabajo de 30 minutos.
2. Mergear #676 y #661 después de que alguien del equipo los revise.
3. Hacer un PR `docs/readme-changelog-pre-entrega` con el punto 4.
4. Pasar el commit `9905d10` a PRE-08.
5. Decidir sobre las issues del punto 2 en la reunión de equipo.
