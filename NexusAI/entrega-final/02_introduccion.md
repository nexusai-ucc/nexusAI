# Introducción y contexto

## Contexto

La adopción de inteligencia artificial generativa en la educación
universitaria avanza más rápido que la integración formal de estas
herramientas en las plataformas educativas. Mientras los alumnos usan
ChatGPT y otros asistentes generales para resolver dudas académicas, las
plataformas LMS institucionales como Moodle siguen funcionando como
repositorios documentales, sin integración con la IA.

Esto genera dos problemas estructurales:

1. **Los docentes pierden visibilidad** sobre qué preguntan los alumnos
   sobre su material, porque las consultas suceden afuera del LMS.
2. **Los alumnos reciben respuestas genéricas** de modelos entrenados
   sobre internet abierto, no sobre el material específico de su curso —
   con riesgo de respuestas plausibles pero incorrectas en el contexto de
   esa materia particular.

## Motivación

El equipo del proyecto realizó un relevamiento informal entre estudiantes
de la Universidad Católica de Córdoba (UCC) sobre el uso del campus
virtual. Los hallazgos motivaron el proyecto:

- Más del 70% reportó **dificultades para encontrar información** que
  estaba dispersa entre el campus, WhatsApp grupales y Google Drive
  personales.
- La mayoría declaró usar ChatGPT u otros asistentes generales como
  primer recurso ante una duda, **antes** que el campus virtual.
- Los docentes encuestados expresaron interés en herramientas que les
  permitan ver qué temas resultan más confusos para sus alumnos.

A partir de ese diagnóstico, el equipo propuso un plugin de Moodle que:

- Mantiene a los alumnos en el campus virtual (donde está el material
  real).
- Responde sobre **el material específico del curso**, no sobre internet.
- Genera datos accionables para el docente.

## Objetivos del proyecto

### Objetivo general

Desarrollar un plugin para Moodle que incorpore un asistente académico
basado en inteligencia artificial, capaz de responder consultas en
lenguaje natural sobre el contenido real de cada materia, generar
ejercicios de práctica personalizados y proveer herramientas de analytics
al docente, mejorando la experiencia educativa dentro del aula virtual de
la UCC.

### Objetivos específicos

- Identificar y documentar las problemáticas del uso actual del campus
  virtual mediante relevamiento a estudiantes y docentes de la UCC.
- Diseñar e implementar un plugin tipo `local` para Moodle que se
  integre al entorno existente sin modificarlo.
- Desarrollar un prototipo funcional (MVP) con un asistente conversacional
  basado en técnicas de Retrieval-Augmented Generation (RAG) e
  integración con modelos de lenguaje de gran escala, validado con
  usuarios reales.
- Implementar un sistema de generación de quizzes, flashcards y
  ejercicios de práctica con corrección automática e IA.
- Proveer al docente un dashboard de analytics sobre las consultas de sus
  alumnos y herramientas de detección de gaps en el material.
- Evaluar el impacto de la solución mediante pruebas con usuarios reales
  y métricas de calidad de respuesta.
- Documentar el proceso completo de diseño, desarrollo e implementación
  para su presentación y defensa ante la cátedra.

## Alcance de este documento

Este documento es la **entrega final** del proyecto correspondiente al
Proyecto Integrador de la carrera Ingeniería en Sistemas (UCC, 2026).
Cubre:

- La gestión completa del proyecto desde el Sprint 0 (setup e
  investigación) hasta el Sprint 4 (cierre del MVP).
- La documentación técnica del producto: arquitectura, stack, modelo de
  datos, API, decisiones arquitectónicas, testing y deploy.
- Los manuales de instalación y de uso para alumnos y docentes.
- Análisis de costos, riesgos y métricas del proyecto.
- Retrospectivas por sprint y conclusiones del equipo.

Cada capítulo es autocontenido y referencia material complementario del
repositorio público del proyecto en GitHub.

## Equipo

| Integrante | Rol |
|---|---|
| **Santiago Tricherri** | Project Manager · Backend & AI Developer |
| **Delfina Salinas** | Scrum Master · Frontend & RAG Developer |

## Universidad e institución

- **Universidad:** Universidad Católica de Córdoba
- **Facultad:** Facultad de Ingeniería
- **Carrera:** Ingeniería en Sistemas
- **Año académico:** 2026


