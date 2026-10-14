# Épica TPC — TP Integrador Calidad de Software

> Creado: 13/10/2026 · Entrega: **26/10/2026** · Épica: [#584](https://github.com/nexusai-ucc/nexusAI/issues/584) · Milestone: "TP Calidad de Software"

## Qué pide el TP

El TP Integrador de Calidad de Software pide aplicar a la Tesis (NexusAI) un proceso de calidad completo, que acompañe el desarrollo hasta la entrega en vez de agregarse al final. Al cierre hay que demostrar tres cosas:

1. el sistema se prueba automáticamente en cada despliegue;
2. las integraciones externas (proveedor LLM, Moodle web services) funcionan o están controladas;
3. las decisiones de calidad se apoyan en datos.

Hay un eje por cada tema de la materia, más uno transversal de documentación:

| Tema | Qué hay que mostrar |
|---|---|
| Introducción a la calidad | Objetivos medibles (usuario, equipo, organización), prácticas de proceso, contingencia ante la caída de una dependencia crítica |
| Fundamentos del testing | Unitarias AAA, criterio de aceptación fijado antes de ejecutar, defecto real rojo/verde, los 7 principios aplicados |
| Modelos de calidad y niveles | Matriz ISO/IEC 25010 (8 características) con evidencia, top 3 justificado, mapa de niveles, despliegue verificado en cada instancia |
| Métricas y análisis estático | Análisis estático, tabla de métricas interpretadas, una métrica de proceso y una de proyecto, mejora antes/después |
| Pruebas dinámicas | Clases de equivalencia, valores límite, tablas de decisión; cobertura de sentencia y de decisión |
| Aseguramiento de la calidad | Plan de pruebas, riesgos P×I, QA vs QC, plantillas de caso y de defecto con trazabilidad |
| Automatización | Pirámide, pruebas de API e integración externa, smoke en cada deploy, CI/CD, regresión por cada defecto corregido |
| Herramientas del ecosistema | Mapa de herramientas, herramienta nueva con el proceso de 5 pasos, registro de defectos, stress y esfuerzo sostenido |

### Metas por nivel

| Aspecto | Nivel 2 | Nivel 3 |
|---|---|---|
| Pipeline | compilación, pruebas, análisis estático, cobertura, quality gate, reporte automático | igual |
| Quality gate | bloquea bugs críticos, duplicación > 5 %, cobertura de código nuevo < 80 % | igual |
| Cobertura sobre código existente | 60 % | 80 % |
| Smoke test | ejecutado por el pipeline tras el despliegue | igual |
| Integración externa | una probada contra entorno real | flujo E2E automatizado en cada despliegue |
| Stress y esfuerzo sostenido | ejecutado, con resultados y umbrales | igual |

El nivel se declara en TPC-01, después de medir la cobertura real.

## Punto de partida (13/10/2026)

**Lo que ya existe:**

- `backend-ci.yml`: pip-audit, ruff, mypy, pytest con `--cov` contra Postgres y Redis reales, build de Docker.
- `frontend-ci.yml`: `npm audit`, Vitest, build y control del tamaño del bundle.
- `moodle-ci.yml`: phplint, phpmd, phpcs, phpdoc, validate, savepoints, mustache, grunt, PHPUnit y Behat, en matriz PostgreSQL/MySQL.
- Unos 38 archivos de test en `services/api/tests`, más PHPUnit/Behat en el plugin y Vitest en `react/`.
- Fallback del proveedor LLM (OpenAI `gpt-4o-mini` → Groq; embeddings en Gemini): base para el plan de contingencia.
- Defectos reales ya corregidos para el registro y el contraste rojo/verde, por ejemplo `add_from_sql()` en la Privacy API y MMR-301.

**Lo que falta:**

- Quality gate que bloquee por duplicación y por cobertura de código nuevo.
- CD a staging + smoke después del deploy (hoy el deploy a Oracle es manual).
- Prueba de la integración externa contra el entorno real.
- Pruebas de stress y de esfuerzo sostenido.
- Registro formal de defectos con trazabilidad.
- Toda la documentación: plan de pruebas, ISO 25010, riesgos, casos con técnicas de caja negra, métricas, informe.
- Medición base de cobertura (sentencia y decisión).

## Subtareas

Línea base medida en TPC-01: [`LINEA_BASE.md`](LINEA_BASE.md).

| Issue | Código | Tarea | Fechas | Depende de |
|---|---|---|---|---|
| [#573](https://github.com/nexusai-ucc/nexusAI/issues/573) | TPC-01 | Medición base de calidad y declaración de nivel | 13/10 – 14/10 | — |
| [#574](https://github.com/nexusai-ucc/nexusAI/issues/574) | TPC-02 | Herramienta nueva: SonarCloud + quality gate en el pipeline | 14/10 – 16/10 | TPC-01 |
| [#575](https://github.com/nexusai-ucc/nexusAI/issues/575) | TPC-03 | Plan de pruebas versionado: objetivos, riesgos e ISO 25010 | 14/10 – 17/10 | — |
| [#576](https://github.com/nexusai-ucc/nexusAI/issues/576) | TPC-04 | Casos de prueba dinámicos y trazabilidad requisito → caso → defecto | 16/10 – 19/10 | TPC-03 |
| [#577](https://github.com/nexusai-ucc/nexusAI/issues/577) | TPC-05 | Pruebas unitarias AAA y cobertura al nivel declarado | 15/10 – 20/10 | TPC-01 |
| [#578](https://github.com/nexusai-ucc/nexusAI/issues/578) | TPC-06 | Registro de defectos, defecto real rojo/verde y ejecución fallida del pipeline | 17/10 – 20/10 | TPC-04 |
| [#579](https://github.com/nexusai-ucc/nexusAI/issues/579) | TPC-07 | Integración externa: contrato, dobles de prueba y entorno real | 16/10 – 20/10 | TPC-01 |
| [#580](https://github.com/nexusai-ucc/nexusAI/issues/580) | TPC-08 | CD a staging + smoke test después del despliegue | 18/10 – 21/10 | TPC-07 |
| [#581](https://github.com/nexusai-ucc/nexusAI/issues/581) | TPC-09 | Pruebas de stress y de esfuerzo sostenido | 19/10 – 22/10 | TPC-08 |
| [#582](https://github.com/nexusai-ucc/nexusAI/issues/582) | TPC-10 | Métricas interpretadas y mejora medida antes/después | 21/10 – 23/10 | TPC-02, TPC-05 |
| [#583](https://github.com/nexusai-ucc/nexusAI/issues/583) | TPC-11 | Informe PDF y demo con despliegue nuevo | 23/10 – 26/10 | todas |

TPC-03 (documentación) no depende del código, así que puede avanzar en paralelo con TPC-01/02.

## Entregables (checklist final)

- [ ] Plan de pruebas versionado, con matriz ISO 25010 y trazabilidad — TPC-03, TPC-04
- [ ] Pruebas unitarias, integración, smoke, stress y esfuerzo, ejecutables con un comando — TPC-01, 05, 07, 08, 09
- [ ] Pipeline como archivo en el repo, con una ejecución completa en verde y una fallida que detectó un problema real — TPC-02, TPC-06
- [ ] Reportes automáticos de cobertura, análisis estático y stress generados por el pipeline — TPC-02, TPC-09
- [ ] Documentación de la integración externa — TPC-07
- [ ] Registro de defectos con datos completos — TPC-06
- [ ] Documento de la herramienta incorporada y matriz de decisión — TPC-02
- [ ] Informe PDF: nivel declarado, metas cumplidas y no cumplidas, evolución de métricas, análisis crítico, conclusiones — TPC-11
- [ ] Demostración con un despliegue nuevo — TPC-11

## Reglas de trabajo

- Una subtarea a la vez, con plan antes de implementar.
- Flujo git del equipo: rama de feature → PR a `development`.
- Los números del informe salen siempre de ejecuciones del pipeline o de la herramienta de análisis, nunca a mano.
- Las pruebas de carga van contra **staging**, nunca contra prod, y con el LLM mockeado salvo una corrida chica con el proveedor real (cuota y costo).
- Sin credenciales reales en documentos versionados.
- Aporte individual trazable: cada integrante tiene que poder explicar cualquier parte del trabajo.
- Toda la documentación del TP va en `NexusAI/docs/calidad/`.
