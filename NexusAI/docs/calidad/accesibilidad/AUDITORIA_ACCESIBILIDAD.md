# Auditoría de accesibilidad — NexusAI

Fecha: 23/10/2026. Rama `fix/contraste-color-primario` (PR #665), comparada con `development`.

## Alcance y método

- **Qué se auditó:**
  - El widget del chat, como alumno y como docente. Son 9 vistas: Chat con una conversación, Modo Estudio, Buscar, Calendario, Revisión del curso y Resumen del foro.
  - El panel docente "NexusAI · Materiales", en sus 6 pestañas.
  - Cada vista se probó en modo claro y en modo oscuro: 30 vistas en total.
- **Cómo:**
  - Los bundles compilados (`amd/src/*-lazy.js`) se cargaron con RequireJS en una página de prueba, sin backend y en modo demostración.
  - Las páginas de prueba reproducen la estructura de Moodle: un `h1` en el encabezado y el disparador del chat en la barra de navegación.
  - Navegador: Google Chrome 155 headless, controlado con Puppeteer.
- **Pruebas automáticas:** axe-core 4.14 con las reglas WCAG 2.0, 2.1 y 2.2 de nivel A y AA, más las *best practices*. En promedio se evaluaron 36 reglas aplicables por vista.
- **Pruebas programadas aparte**, porque axe no las cubre:
  - Teclado: secuencia de tabulación, foco al abrir y al cerrar, Enter, Ctrl+K, Escape e indicador de foco visible.
  - Reflow a 320 px de ancho, que equivale a 1280 px al 400 % (WCAG 1.4.10).
  - Zoom al 200 %: una ventana de 640 × 450 px (WCAG 1.4.4).
  - Espaciado de texto con los valores de WCAG 1.4.12: interlineado 1,5, letras 0,12 em, palabras 0,16 em y párrafos 2 em.
  - Movimiento reducido con `prefers-reduced-motion: reduce` (WCAG 2.3.3).
  - Anuncio de la respuesta a lectores de pantalla (WCAG 4.1.3).

## Resultados

| Prueba | Antes (`development`) | Después (PR #665) |
|---|---|---|
| axe-core: vistas con fallos WCAG | 30 de 30 | 0 de 30 |
| Contraste insuficiente (1.4.3) | 214 elementos | 0 |
| Nombre accesible ≠ texto visible (2.5.3) | 12 elementos (calendario) | 0 |
| Encabezado de tabla vacío | 2 | 0 |
| Orden de encabezados (*best practice*) | 18 vistas | 0 |
| Foco al abrir el chat (2.4.3) | queda en el disparador | va a la caja de pregunta |
| Foco al cerrar con Escape (2.4.3) | se pierde (`body`) | vuelve al disparador |
| Indicador de foco visible (2.4.7) | todos los controles | todos los controles |
| Respuesta anunciada al lector de pantalla (4.1.3) | no | sí (`aria-live="polite"`) |
| Reflow a 320 px, panel docente (1.4.10) | scroll horizontal (378 px) | sin scroll horizontal |
| Reflow a 320 px y zoom 200 %, widget | sin scroll horizontal | sin scroll horizontal |
| Espaciado de texto (1.4.12) | sin texto recortado | sin texto recortado |
| Movimiento reducido (2.3.3) | 3 animaciones siguen activas | ninguna |
| Pestaña activa del panel docente | sin `aria-current` | `aria-current="page"` |

En el panel docente, la tabla de materiales se desplaza dentro de su propio contenedor a 320 px. WCAG 1.4.10 lo admite para tablas de datos.

## Cambios que resolvieron los hallazgos

1. **Color primario:** pasa de `#6366f1` a `#4f46e5`. El texto blanco sobre ese fondo sube de 4,47:1 a 6,29:1.
   - Se agregó un token `--nexusai-primary-solid` para los fondos con texto blanco. En modo oscuro, el índigo claro `#818cf8` daba 2,98:1.
2. **Grises de texto secundario:** se ajustaron en ambos modos, con un mínimo de 4,5:1 sobre todos los fondos del widget. Además, los colores fijos de Calendario, Revisión del curso y Resumen del foro se reemplazaron por tokens.
3. **Panel docente en modo oscuro:** ahora tiene un fondo propio. Antes, parte del texto claro quedaba sobre la página blanca de Moodle.
4. **Foco:** al abrir el chat se mueve a la caja de pregunta y al cerrarlo vuelve al elemento que lo abrió.
5. **Región `aria-live`:** anuncia la respuesta cuando termina. El *stream* no se anuncia token por token.
6. **Movimiento reducido:** con esa preferencia activa no hay animaciones ni transiciones, y el desplazamiento automático no se anima.
7. **Panel docente angosto:** por debajo de 720 px, la barra lateral pasa arriba del contenido.
8. **Ajustes menores:**
   - Los eventos del calendario toman el nombre accesible del texto visible.
   - La columna de acciones tiene un encabezado para lectores de pantalla.
   - La pestaña activa del panel docente tiene `aria-current`.
   - El título del panel del chat pasa a ser `h2`.

Los tests del frontend pasan (275, entre ellos 2 nuevos sobre el foco y el anuncio). El CI de la PR corre las pruebas de Moodle 4.5 a 5.3.

## Limitaciones

- **No se probó dentro de Moodle.** El Moodle local no estaba disponible, así que se usaron páginas de prueba con la misma estructura de encabezados y landmarks. Conviene repetir la auditoría en staging después del despliegue.
- **Las herramientas automáticas detectan una parte de los problemas.** Las estimaciones habituales hablan del 30 % al 50 % de los criterios WCAG. No se hicieron pruebas con lectores de pantalla reales (NVDA, VoiceOver, TalkBack) ni con usuarios con discapacidad.
- **Datos de demostración.** Las respuestas y los datos de las pestañas son los del modo demo. El contenido generado por el modelo, como el Markdown o las fórmulas, puede tener otros problemas; por ejemplo, encabezados dentro de las respuestas.

## Marco normativo

- **WCAG 2.2** (W3C, 2023), nivel AA, es la referencia técnica que se usó. Es compatible hacia atrás: cumplir WCAG 2.2 AA implica cumplir WCAG 2.0 AA, que es la versión que adopta la norma argentina.
- **Ley 26.653** de Accesibilidad de la Información en las Páginas Web (Argentina, 2010), su Decreto Reglamentario 656/2019 y la Disposición 6/2019 de la ONTI. Esta última fija las pautas técnicas en base a WCAG 2.0.
  - El artículo 1 obliga al Estado nacional, sus organismos descentralizados o autárquicos (entre ellos, las universidades nacionales) y las empresas concesionarias o contratistas del Estado.
  - El artículo 2 extiende la obligación a las organizaciones de la sociedad civil que reciben subsidios o donaciones del Estado o contratan con él.
  - Una universidad privada como la UCC queda alcanzada solo si está en el supuesto del artículo 2. En cualquier caso, cumplir las pautas permite adoptar NexusAI en universidades públicas y es una buena práctica de inclusión.
- **Ley 25.573** (2002, modificatoria de la Ley de Educación Superior 24.521): exige que las instituciones de educación superior garanticen la accesibilidad para estudiantes con discapacidad.

## Cómo repetirla

La carpeta `script/` tiene lo necesario: la página de prueba del chat (`harness.html`), la del panel docente (`docs.html`) y el script (`full.mjs`). Requiere Node 22 y Google Chrome en `/usr/bin/google-chrome`.

```bash
cd script
npm ci                                    # puppeteer-core y axe-core
P=<repo>/NexusAI/plugin/local/nexusai/amd/src
cp $P/chatwidget-lazy.js new.js           # bundle a auditar
cp $P/documents-manager-lazy.js docnew.js
cp <moodle>/public/lib/requirejs/require.min.js .
node full.mjs > salida.txt                # resultados en full-results.json y capturas en shots/
```

Para auditar otra versión, copiá sus bundles como `old.js` y `docold.js` y corré:

```bash
CHAT=old DOC=docold OUT=full-results-old.json node full.mjs
```

## Archivos

- `resultados/`: el JSON completo de cada corrida (`resultados-development.json` y `resultados-pr665.json`) y su salida resumida.
- `capturas/`: el chat en modo claro y oscuro, el panel docente en modo oscuro y las vistas a 320 px.
