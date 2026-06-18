# Informe de Proyecto Integrador (IPI) — NexusAI

Informe final del Proyecto Integrador siguiendo la **plantilla oficial UCC v2.1 - 2026**.

## Archivos

- `informe-ipi.md` — documento único, autocontenido. Es el archivo que se edita.
- `build.sh` — compila el `.md` a `informe-ipi.pdf` (pandoc + tectonic/xelatex).

## Cómo compilar el PDF

```bash
cd informe-ipi
./build.sh
```

Requiere `pandoc` y un motor LaTeX (`tectonic`, recomendado, o `xelatex`).
En macOS: `brew install pandoc tectonic`.

## Estructura (según plantilla IPI)

Resumen/Abstract · Presentación del tema · Glosario · Diagnóstico · Objetivos
(con tabla de trazabilidad) · Marco teórico · Propuesta de solución (alcance /
diseño / implementación / pruebas) · Beneficios · Impacto económico · Impacto
social · Impacto ambiental · Conclusión · Bibliografía (APA v7) · Anexos.

## Reglas de formato aplicadas

- Redacción impersonal / 3ª persona (sin "yo / nosotros").
- Citas y bibliografía en **norma APA v7**.
- Texto justificado (por defecto en LaTeX) e interlineado 1,5.
- Figuras: referenciadas en el texto + pie con número, descripción, fuente y texto
  alternativo.

## Pendientes de completar

El borrador reutiliza y reescribe contenido de `../entrega-final/`. Buscar los
marcadores `⚠️ COMPLETAR` en `informe-ipi.md` para lo que falta:

- Datos de portada: nombres de directores, fecha y logo UCC.
- Figuras reales: diagramas (componentes, secuencia, pipeline) y capturas de pantalla.
- Resultados consolidados del relevamiento y de las pruebas con usuarios.
- Completar la bibliografía APA v7 (Moodle, pgvector, productos comparados).

## Fuentes de contenido reutilizadas

`../entrega-final/`: `01_resumen_ejecutivo`, `02_introduccion`, `03_alcance`,
`04_requerimientos`, `09_costos`, `13_arquitectura`, `14_stack_tecnologico`,
`15_modelo_datos`, `24_conclusiones`; e `../investigacion/02-rag` y `../investigacion/08-estado-del-arte`.
