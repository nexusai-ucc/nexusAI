================================================================
  NEXUSAI — PROYECTO INTEGRADOR
  Universidad Católica de Córdoba · Ingeniería en Sistemas · 2026
================================================================

Equipo:
  - Santiago Tricherri (Project Manager · Backend & AI)
  - Delfina Salinas (Scrum Master · Frontend & RAG)


CONTENIDO DEL PENDRIVE
----------------------

01_Documentacion_Final.pdf
    Documento principal de la entrega final.
    ~94 páginas con 29 capítulos: resumen ejecutivo, introducción,
    alcance, análisis de requerimientos, historias de usuario, WBS,
    cronograma, estimaciones, costos, riesgos, métricas, documentación
    por sprint, arquitectura técnica, stack tecnológico, modelo de
    datos, API, mockups, manuales de instalación y uso, ADRs, testing,
    deploy, retrospectivas, conclusiones y anexos.

02_Presentacion/
    Presentación de defensa (15 minutos, 14 slides).
    - index.html → presentación completa en HTML estilo shadcn/ui.
      Abrir en cualquier navegador moderno (Chrome, Safari, Firefox).
      Atajos: → / ← para navegar, F = fullscreen, Esc = overview, P = PDF.
    - README.md → guía de uso de la presentación.

03_Anteproyecto.pdf
    Anteproyecto original presentado al inicio del proyecto.
    Contexto, objetivos, alcance, cronograma planificado, referencias.

04_WBS_y_Backlog/
    - WBS.pdf → Work Breakdown Structure visual.
    - Backlog_Resumen.pdf → resumen del backlog.
    - Backlog_Excel.xlsx → backlog completo con todas las historias,
      story points, responsables y estado.

05_Historias_Usuario.xlsx
    Listado completo de todas las historias de usuario del proyecto
    con sus criterios de aceptación, agrupadas por épica y sprint.
    (Mismo contenido que 04_WBS_y_Backlog/Backlog_Excel.xlsx)

06_Codigo_Fuente/
    Código fuente del MVP en dos formatos:
    - nexusAI-source.zip → snapshot completo del repositorio.
      Incluye backend Python, plugin Moodle, frontend React, tests,
      migraciones, scripts y toda la documentación técnica.
    - local_nexusai-plugin-v0.9.3.zip → plugin Moodle listo para
      instalar en cualquier Moodle 4.1 LTS a 4.5.
      Instalación: Site administration → Plugins → Install plugins.

07_Acceso_Sistema.pdf  (también .md para edición)
    Documento con URLs y credenciales para acceder al sistema:
    - URL del backend en producción (Railway)
    - API key y shared secret para configurar el plugin
    - Pasos para reproducir el sistema en una nueva instalación

08_Sprints_y_Reviews/
    - Sprint_0_Setup.pdf → planificación detallada del Sprint 0.
    - Sprint_Reviews.html → reviews ejecutadas durante los sprints.


ACCESOS RÁPIDOS
---------------

Backend en producción (online 24/7):
    https://nexusai-production-e414.up.railway.app
    https://nexusai-production-e414.up.railway.app/docs (Swagger)

Repositorio GitHub:
    https://github.com/nexusai-ucc/nexusAI

Release del plugin:
    https://github.com/nexusai-ucc/nexusAI/releases/latest


VERIFICACIÓN RÁPIDA POR EL TRIBUNAL
------------------------------------

Para verificar que el sistema está realmente en producción:

    curl https://nexusai-production-e414.up.railway.app/health

Devuelve un JSON tipo:
    { "status": "ok", "version": "0.9.3", "env": "production", ... }


CHECKLIST DE ENTREGABLES SEGÚN EL SYLLABUS
--------------------------------------------

[✓] Sprints desde el 0 hasta el último implementado.
    → Cubierto en 01_Documentacion_Final.pdf (caps 7, 12)
      y en 08_Sprints_y_Reviews/.

[✓] Análisis de requerimientos, riesgos, costos, métricas,
    cronograma e informes del MVP.
    → Cubierto en 01_Documentacion_Final.pdf (caps 4, 7, 9, 10, 11).

[✓] Código fuente del MVP.
    → 06_Codigo_Fuente/nexusAI-source.zip

[✓] Documento con link y credenciales para acceder al sistema.
    → 07_Acceso_Sistema.pdf

[✓] Listado de historias de usuario con criterios de aceptación.
    → 05_Historias_Usuario.xlsx
      También en 01_Documentacion_Final.pdf (cap 5).

[✓] Presentación de la entrega.
    → 02_Presentacion/index.html


CONTACTO
--------

Para dudas o consultas sobre el contenido:
    - Santiago Tricherri
    - Delfina Salinas

================================================================
