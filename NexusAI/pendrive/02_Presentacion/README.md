# Presentación NexusAI

Presentación HTML para la defensa de Proyecto Integrador (15 minutos).

## Cómo abrirla

```bash
open index.html
```

O doble click sobre el archivo. Funciona en cualquier navegador moderno
(Chrome, Safari, Firefox, Edge). Las dependencias se cargan vía CDN
(Tailwind, Inter font, Mermaid).

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `→` o `Espacio` o `PgDn` | Siguiente slide |
| `←` o `PgUp` | Slide anterior |
| `Home` / `End` | Primer / último slide |
| `F` | Fullscreen (entrada/salida) |
| `Esc` | Overview de todos los slides |
| `P` | Imprimir / exportar a PDF |
| Click derecha de la pantalla | Siguiente |
| Click izquierda de la pantalla | Anterior |

## Estructura

14 slides + 1 overview escondido.

| # | Título | Quién | Tiempo aprox |
|---|---|---|---|
| 1 | Portada | Delfina abre | 30s |
| 2 | El problema | Delfina | 1 min |
| 3 | Evidencia · relevamiento UCC | Delfina | 1 min |
| 4 | La solución | Delfina → Santi | 1 min |
| 5 | Arquitectura (diagrama Mermaid) | Santi | 1 min |
| 6 | Stack tecnológico | Santi | 30s |
| 7 | Demo · intro | Ambos | 30s |
| 8 | Demo · flujo (guion) | Ambos | 4.5 min |
| 9 | Sprints + métricas Scrum | Santi | 1 min |
| 10 | Deploy (Railway + GitHub Release) | Santi | 30s |
| 11 | Métricas del MVP | Delfina | 1 min |
| 12 | Lecciones aprendidas | Delfina | 1 min |
| 13 | Trabajo futuro | Delfina | 30s |
| 14 | Cierre + Q&A | Ambos | 30s |
| **Total** | | | **~15 min** |

Los slides 7-8 son el plato fuerte: ahí hace la demo en vivo del MVP
contra el Moodle local + backend en Railway.

## Exportar a PDF

Apretás `P` con el deck abierto — Chrome/Safari abren diálogo de impresión
y elegís "Save as PDF". Cada slide queda como una página A4 horizontal.

## Diseño

- Tipografía: Inter (Google Fonts)
- Paleta: zinc neutral + primary `#4A7FD4` (mismo del plugin)
- Iconos: lucide-style SVG inline (sin emojis)
- Estilo: shadcn/ui — bordes hairline, radius consistente, fondo blanco

## Editar contenido

Cada slide es un `<section class="slide">` con `data-slide` numerado.
Cambiar texto es directo en el HTML.

Si agregás un slide:

1. Copiá una `<section class="slide">` existente.
2. Cambiá `data-slide` y el contenido.
3. Actualizá el contador `xx / 14` al pie de todos los slides afectados.
4. Listo — el contador del overview se autocalcula.
