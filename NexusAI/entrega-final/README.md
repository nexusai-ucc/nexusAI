# Entrega Final — Administración de Proyectos de Software

Documentación de tesis del proyecto **NexusAI** — Universidad Católica de Córdoba.

## Estructura

Esta carpeta contiene la documentación completa del proyecto en archivos Markdown modulares.
Al compilar se genera un único PDF de ~80 páginas listo para entregar en pendrive.

```
entrega-final/
├── 00_caratula.md
├── 01_resumen_ejecutivo.md
├── 02_introduccion.md
├── 03_alcance.md
├── 04_requerimientos.md
├── 05_historias_usuario.md
├── 06_wbs.md
├── 07_cronograma.md
├── 08_estimaciones.md
├── 09_costos.md
├── 10_riesgos.md
├── 11_metricas.md
├── 12_sprints/
│   ├── sprint_0_setup.md
│   ├── sprint_1.md
│   ├── sprint_2.md
│   ├── sprint_3.md
│   └── sprint_4_mvp.md
├── 13_arquitectura.md
├── 14_stack_tecnologico.md
├── 15_modelo_datos.md
├── 16_api_endpoints.md
├── 17_mockups_ui.md
├── 18_manual_instalacion.md
├── 19_manual_usuario.md
├── 20_adrs.md
├── 21_testing.md
├── 22_deploy.md
├── 23_retrospectivas.md
├── 24_conclusiones.md
├── 99_anexos.md
├── meta.yml                       # metadata Pandoc (autor, fecha, etc.)
├── build.sh                       # compila todo a PDF
└── assets/
    ├── images/                    # screenshots, capturas
    └── diagrams/                  # diagramas exportados (PNG/SVG)
```

## Cómo compilar a PDF

```bash
./build.sh
```

Genera `entrega-final-NexusAI.pdf` con índice automático, numeración y portada.

## Convenciones

- Cada archivo `.md` empieza con `# Capítulo N — Título` (level 1).
- Sub-secciones usan `##` (level 2) y `###` (level 3).
- Imágenes en `assets/images/` y se referencian con paths relativos.
- Diagramas Mermaid se renderizan automáticamente al compilar.
- Convenciones académicas: tablas tienen título, figuras tienen pie de figura.

## Estado de cada capítulo

Ver `STATUS.md` para el tracking de progreso.
