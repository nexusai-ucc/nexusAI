# Brief para el Canva

> v0.1, 05/11/2026. Para que Delfina arme la presentación. Son 25 diapositivas más el respaldo y suman 30 minutos. El texto completo está en [GUION_PRESENTACION.md](GUION_PRESENTACION.md).

## Criterios

- **Poco texto:** un título que afirma algo, no un tema (por ejemplo, "El 80,7 % encuentra la información dispersa" en vez de "Encuesta"), y como mucho 3 renglones.
- **Legible desde el fondo:** letra de 28 pt o más y contraste alto. En el informe, el widget ya pasó la auditoría WCAG.
- **Sin diapositiva de índice ni de "gracias".**
- **Una figura por diapositiva cuando se pueda**, reutilizando `informe-ipi/img/` y los diagramas de `docs/diagrams/`. Los Mermaid se exportan a imagen.
- **Exportar a PDF y a PPTX** y llevar las dos copias en un pendrive, para no depender de Canva online ni del wifi. Los videos de respaldo van como archivos aparte, no embebidos desde internet.
- **Numerar las diapositivas**, así el tribunal puede pedir "volvé a la 14".

## Diapositivas

| # | Min | Quién | Título (afirmación) | Visual | Fuente del dato |
|---|---|---|---|---|---|
| 1 | 0:00 | Delfina | La misma pregunta, dos respuestas | Dos columnas: chat general / NexusAI con su fuente | Captura del ensayo |
| 2 | 1:30 | Delfina | Y si el material no lo cubre, el profesor se entera | Captura del panel de vacíos | `img/docente-gaps.png` |
| 3 | 2:30 | Delfina | NexusAI · Delfina, Santiago, Marcos · UCC 2026 | Portada sobria | — |
| 4 | 3:00 | Delfina | 166 estudiantes y 17 docentes nos contaron cómo estudian | Íconos con los dos números | Informe, Relevamiento |
| 5 | 4:00 | Delfina | El 80,7 % encuentra la información dispersa | Una barra grande, con campus, WhatsApp y Drive alrededor | Informe, Encuesta a estudiantes |
| 6 | 5:00 | Delfina | Los docentes quieren IA, pero revisando antes | 88,2 % delegaría · 47,1 % con revisión previa | Informe, Encuesta a docentes |
| 7 | 6:00 | Santiago | Una IA que responde con tu material y le avisa al docente lo que falta | La idea clave sola, en grande | — |
| 8 | 7:00 | Santiago | Cuatro aportes | Los 4 aportes y **el QR grande** con "Saquen el celular" | — |
| 9 | 8:00 | Demo | (Pantalla de Moodle) | QR en una esquina + "No escriban datos personales" | — |
| 10 | 17:00 | Santiago | Así viajó su pregunta | Diagrama de 3 capas: navegador → plugin → backend | `docs/diagrams/architecture.md` |
| 11 | 18:00 | Santiago | Buscar, decidir, responder citando | Flujo RAG en 4 pasos | `docs/diagrams/rag-flow.md` |
| 12 | 19:00 | Santiago | La clave nunca llega al celular | Secuencia del chat con HMAC | `docs/diagrams/sequence-chat.md` |
| 13 | 20:00 | Marcos | Cada decisión, con su alternativa | Tabla de 6 filas: decisión / alternativa / motivo | Guion, Decisiones |
| 14 | 21:00 | Marcos | Los datos del alumno viven en Moodle | Antes y después: backend / tablas de Moodle | ADR-014 |
| 15 | 22:00 | Marcos | Ningún cambio entra sin pasar el gate | Pipeline: pruebas en 3 lenguajes → quality gate → merge | `docs/calidad/PLAN_DE_PRUEBAS.md` |
| 16 | 22:45 | Marcos | De 56,6 % a 83,6 % de cobertura y de 40 problemas a 0 | Antes y después: cobertura, bugs y vulnerabilidades | `docs/calidad/METRICAS.md` |
| 17 | 23:30 | Marcos | Con 40 alumnos el chat colapsaba: lo encontró la prueba de carga | Gráfico p95 por escalón, antes y después de DEF-09 | `docs/calidad/PRUEBAS_DE_CARGA.md` §2 |
| 18 | 24:15 | Marcos | Seguro y accesible | OWASP Top 10 + WCAG 2.2 AA | `docs/security/`, `docs/calidad/accesibilidad/` |
| 19 | 25:00 | Santiago | Scrum, 260+ PRs y un pivote real | Línea de tiempo: MVP 1/6 → post-MVP → Oracle → Marketplace | Informe, Gestión del proyecto |
| 20 | 25:45 | Santiago | Moodle nos revisó 16 puntos. Hoy está publicado | Ficha del Marketplace | `img/moodle-marketplace-listing.png` |
| 21 | 26:30 | Santiago | Lo que cumplimos y lo que no | Objetivos con estado: cumplido / parcial / no cumplido | Informe, Objetivos + piloto |
| 22 | 27:30 | Santiago | US$ 5,81 por alumno por año | Desglose: infraestructura, IA, mantenimiento | Informe, Impacto económico |
| 23 | 28:15 | Santiago | Sus límites | 3 límites honestos | Informe, Conclusión |
| 24 | 29:00 | Delfina | La alumna del principio | Vuelve la captura de la diapositiva 1, ahora con la fuente resaltada | — |
| 25 | 29:30 | Delfina | Aportes | Los 4 aportes de la diapositiva 8, cerrando la charla | — |

## Respaldo, después de la 25

| # | Para la pregunta | Visual | Fuente |
|---|---|---|---|
| R1 | ¿Cómo es el modelo de datos? | Diagrama entidad-relación | `docs/diagrams/er-tablas.md` |
| R2 | ¿Dónde corre? | Despliegue en Oracle: staging y producción | `docs/diagrams/deployment.md` |
| R3 | ¿Cuántos alumnos aguanta? | Tabla de escenarios de carga, con la aclaración del LLM simulado | `PRUEBAS_DE_CARGA.md` |
| R4 | ¿Qué hacen si se cae el proveedor? | Cadena de fallback + historial de la prueba contra Gemini | `INTEGRACION_EXTERNA.md` |
| R5 | ¿Y la privacidad? | Qué sale y qué no sale de la institución | Informe, Privacidad |
| R6 | ¿Por qué no un producto existente? | Matriz comparativa | Informe, Opciones similares en el mercado |
| R7 | Los 10 defectos | Tabla DEF-01 a DEF-10 con la técnica que encontró cada uno | `REGISTRO_DEFECTOS.md` |
| R8 | El resto de las funciones | Grilla con capturas: calendario, foros, flashcards, exámenes | `img/` |
| R9 | ¿Qué sigue? | Roadmap: CURSO-01, COST-02 a 04, INFRA-04 | Issues del Sprint G y del backlog |

## Para revisar antes de cerrar el Canva

- [ ] Los números de las diapositivas 16, 17 y 19 recontados con datos de febrero.
- [ ] La diapositiva 21 completa con el resultado del piloto.
- [ ] Ensayo cronometrado: si la diapositiva 13 lleva más de 1 minuto, pasar dos filas al respaldo.
