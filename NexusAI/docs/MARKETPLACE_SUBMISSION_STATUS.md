# Estado de la publicación en Moodle Marketplace

> Última actualización: 2026-09-21. Para compartir con el equipo — resume qué se validó, qué se hizo, qué se encontró al simular ser reviewer y qué falta antes de subir el ZIP.

## Contexto

Se validó el repo del plugin (`moodle-local_nexusai`) contra las [Plugin
Submission Guidelines](https://moodle.atlassian.net/wiki/external/ODRhYjAyNTY4NDVmNGJlNjljN2ViMzkwYzdmYmIwMGI)
de Moodle Marketplace y después se simuló ser el reviewer con la **Opción A**
(backend alojado) sobre un Moodle 4.5 limpio, para ver el plugin como lo va a
ver quien lo evalúa y sacar las capturas en inglés.

## Qué se hizo

| PR | Qué | Estado |
|---|---|---|
| #495 | Textos y comentarios del plugin en inglés, CI con MySQL y PostgreSQL, self-host del backend para reviewers | mergeada |
| #496 | Fix de `$_GET` (`optional_param`), beta, publicación de la imagen desde `nexusai-backend`, `lang/es` fuera del ZIP | mergeada |
| #497 | `docker-compose.selfhost.yml` y `.env.example` servidos desde `nexusai-backend` | mergeada |
| #499 | Instrucciones de la Opción B para Linux, macOS y Windows | mergeada |
| #498, #500 | Lo anterior llevado a `staging` (`development → staging`) | mergeadas |
| #502 | La raíz del ZIP se llama `nexusai` (Moodle la exige así) | mergeada |
| #503 | La pantalla de Materiales fallaba en instalaciones nuevas (`lib.php` no se cargaba) | mergeada |
| #504 | Backend: la IA responde en el idioma del material | mergeada |
| #505 | Plugin: textos de foros y chat según el idioma de Moodle; todo el código en inglés | mergeada |

`development` del monorepo ya tiene todo y quedó sincronizado a
`moodle-local_nexusai` y `nexusai-backend` (release `0.18.1`, beta).

## Qué se encontró al simular ser reviewer

Cosas que el CI no ve y un reviewer sí:

- **Materiales fallaba en un sitio nuevo** (`Call to undefined function
  local_nexusai_frontend_lang()`): en un sitio ya usado otro camino dejaba
  `lib.php` cargado. Arreglado en #503.
- **Botones y paneles de foro en español** con el sitio en inglés: los textos
  estaban escritos en el JavaScript. Arreglado en #505, junto con otros textos
  fijos (marcador de pegado del chat, GIFT exportado) y comentarios en español
  que viajaban en el ZIP.
- **La IA respondía en español con material en inglés** (resumen de hilo,
  sugerencia de respuesta, quizzes, chat): los prompts están en español y el
  modelo sigue el idioma de las instrucciones. Arreglado en #504 detectando el
  idioma del material y pidiéndolo de forma explícita.
- **Lint de los módulos AMD**: tenían 8 errores que el CI no detectaba (el paso
  Grunt tiene `continue-on-error`). Ahora pasan sin errores.
- **El panel de admin dice "Connected" sin validar credenciales**: solo llama a
  `GET /health`, que no requiere autenticación. Decisión del equipo si vale la
  pena una verificación autenticada.
- **El backend no separa los datos por sitio de Moodle**: `forum_post_id` es
  único en todo el backend y las consultas filtran solo por `course_id`. Si
  varios reviewers usan el mismo backend alojado, sus datos se pisan (pasó en
  la simulación: los ids 1–3 de foro ya tenían datos de otras pruebas y se
  sobrescribieron). No se verificó si documentos y chat tienen el mismo
  problema. **Decisión pendiente para la Opción A.**

## Estado de cada pieza

| Pieza | Estado |
|---|---|
| Código del plugin (`development`) | ✅ 0.18.1 beta, CI en verde (Moodle 4.1 / 4.5 × PostgreSQL / MySQL) |
| `moodle-local_nexusai` `main` | 🟡 sigue en 0.18.0 — falta la promoción `development → main` |
| ZIP | 🟡 el de 0.18.0 **no debe enviarse**; falta armar el 0.18.1 |
| Imagen de Docker (`ghcr.io/nexusai-ucc/nexusai-backend`) | ✅ **pública** (pull anónimo verificado el 2026-09-21). Es la del `main` de `nexusai-backend`, todavía sin el fix de idioma (#504) |
| Backend de staging | 🟡 va atrás de `development`: no tiene el fix de idioma |
| Opción A (backend alojado) | 🟡 funciona; falta decidir credenciales (producción vs staging) y el aislamiento por sitio |
| Opción B (self-host) | 🟡 documentada para Linux, macOS y Windows; **sin probar de punta a punta** con la imagen pública |
| Capturas en inglés | 🟡 hechas: instalación, ajustes, Connected, Materiales. Faltan: chat con fuente, quiz, foro (duplicado y resumen), Analytics, calendario, Course review, Exam generator |

## Decisión tomada: `lang/es/` se queda en el repo, no en el ZIP

La guía es explícita: "Only English strings should be included in the plugin"
(las traducciones se suben después vía AMOS). `lang/es/` queda intacto en
`moodle-local_nexusai` para uso local en español, y
`package-plugin-from-repo.sh` lo excluye solo al armar el ZIP.

## Cómo se arma el ZIP

`./scripts/package-plugin-from-repo.sh [rama]` — clona `moodle-local_nexusai`
(default: `main`) y empaqueta desde ahí, no desde el working tree del monorepo,
para que el ZIP sea exactamente lo que cualquiera ve en el repo público. La
carpeta raíz del ZIP es `nexusai` (Moodle la exige así; corregido en #502) y el
archivo se llama `local_nexusai-vX.Y.Z.zip`. No necesita Node: los bundles ya
vienen commiteados.

## Falta antes de subir el ZIP (en orden)

1. **Cadena hasta `main`**
   1. Mergear la PR que actualiza `CHANGES.md` y este documento.
   2. Promover `development → main` en `moodle-local_nexusai`.
   3. Armar el ZIP 0.18.1 y comprobarlo: raíz `nexusai`, sin `lang/es`, versión
      0.18.1, `MATURITY_BETA`.
2. **Backend**
   1. PR `development → staging` del monorepo para que staging tenga el fix de
      idioma (no hay workflow de deploy en el repo: lo aplica quien opera la VM).
   2. Promover `development → main` en `nexusai-backend` para que la imagen
      pública lleve el fix.
3. **Volver a simular al reviewer con el ZIP final** (ver plan de pruebas).
4. **Decidir la Opción A**: credenciales de producción o de staging (ambas
   exponen historial de chat real; ver `reviewer-simulation/HALLAZGOS.md`) y si
   se aísla por sitio o se atiende a un reviewer a la vez.
5. **Formulario de Marketplace**
   (https://marketplace.moodle.com/plugins/submit/step1?type=free): descripciones
   en inglés, link al issue tracker
   (https://github.com/nexusai-ucc/moodle-local_nexusai/issues) y las notas para
   el reviewer de `docs/REVIEWER_TESTING.md` con las credenciales pegadas en el
   propio formulario (no en el repo).

## Plan de pruebas antes de enviar

Sobre un sitio **nuevo** (`down -v` y volver a levantar), como lo haría el
reviewer:

1. **Instalación del ZIP final** desde la interfaz: validación del paquete
   (nombre `nexusai`, versión 0.18.1, aviso de beta), ajustes, "Connected".
2. **Curso completo** (guía de carga): materiales indexados, foro, quizzes y
   entregas con fechas, usuarios.
3. **Actividad de alumnos**: 10 preguntas con respuesta en el material citando
   la fuente y 3 sin respuesta (deben generar *content gaps*); quiz de práctica,
   flashcards, búsqueda, calendario, 👍/👎.
4. **Foros con IA en inglés**: aviso de discusión similar, resumen de un hilo
   largo y sugerencia de respuesta — con el fix de idioma ya en staging.
5. **Vista del docente**: Analytics, Student questions, Exam generator (en
   inglés), Course review, exportación de datos de privacidad.
6. **Idioma**: repetir 4 con el usuario en español y confirmar que nada aparece
   como `[[clave]]`.
7. **Opción B**: `docker pull` anónimo, `docker compose` con los archivos de
   `nexusai-backend` y el plugin apuntando al backend local. Probada al menos en
   Linux; macOS y Windows siguen sin probar.
8. **Capturas** de cada paso, con ancho de ventana fijo y sin mostrar la URL del
   backend.
