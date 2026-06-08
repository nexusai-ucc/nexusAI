# Estrategia de testing

## Filosofía

NexusAI sigue una pirámide de testing clásica: muchos tests unitarios
baratos en la base, tests de integración para los flujos críticos, y tests
end-to-end manuales (no automatizados) para validar la experiencia completa
en Moodle real.

```
        ▲
       /E2E\        Manual, pocos casos, alto valor
      /-----\
     / Integ \     Integraciones críticas (RAG end-to-end, HMAC, upload)
    /---------\
   /   Unit    \   Rápidos, baratos, cubren lógica pura
  /_____________\
```

El énfasis está en los **boundaries críticos**: autenticación HMAC, pipeline
RAG (chunking + embedding + retrieval), y el contrato entre el plugin
Moodle y el backend.

## Tests del backend Python (pytest)

El backend tiene **37 tests automatizados** distribuidos en 4 archivos en
`services/api/tests/`:

| Archivo | Cantidad de tests | Foco |
|---|---|---|
| `test_hmac.py` | 10 | Auth HMAC: firma válida, replay attack, timestamp expirado, body tampering, nonce reuse |
| `test_chunker.py` | 13 | Splitter de texto a chunks: tamaño, overlap, tokenización con `cl100k_base`, edge cases (texto vacío, párrafos largos) |
| `test_retriever.py` | 8 | `retrieve_context` con pgvector: filtrado por curso, threshold de similaridad, top-k, multi-curso (Feature B), course_id en `RetrievedChunk` |
| `test_extractor.py` | 6 | Extracción de texto desde PDF (`pdfplumber`): texto plano, rechazo de PDFs escaneados sin OCR, manejo de PDFs corruptos |

Adicionalmente, hay archivos de tests más amplios sin contar:

- `test_providers.py` — mock de LLMProvider y EmbeddingProvider para tests deterministas.
- `test_documents_router.py` — endpoints de documentos con TestClient + fixtures de DB.
- `test_pipeline.py` — pipeline completo upload → chunks indexados, end-to-end con DB real.
- `conftest.py` — fixtures compartidas (session async, override de dependencias, DB ephemeral).
- `golden_set.md` — set de preguntas + respuestas esperadas para regression manual.

### Casos de prueba destacados

**HMAC:**

- Firma válida con timestamp actual → 200 OK.
- Firma con timestamp >5 min de antigüedad → 401.
- Mismo nonce dos veces (replay) → 401 en la segunda.
- Body modificado entre firma y request → 401.

**RAG retrieval:**

- Búsqueda en curso con material indexado → top-5 chunks ordenados por similaridad descendente.
- Búsqueda en curso vacío → lista vacía (no 404).
- Multi-curso (Feature B) con `course_ids=[42, 51]` → chunks de ambos cursos mezclados por similaridad.
- Threshold `min_similarity=0.3` filtra chunks irrelevantes.

**Chunking:**

- Texto de 1.000 tokens con chunks de 512 + overlap 64 → 2 chunks con solapamiento.
- Texto exactamente del tamaño de un chunk → 1 chunk sin overlap.
- Tokenizador maneja UTF-8 (acentos, emojis) sin perder caracteres.

## Tests del frontend (manual)

El bundle React no tiene tests unitarios automatizados en MVP. La estrategia
de validación es:

- **Smoke tests manuales** después de cada `npm run build`: abrir el chat,
  hacer una pregunta, verificar que la respuesta aparece con citas.
- **Visual regression manual** comparando screenshots de las features clave
  (Search, Quiz, Gaps).
- **Backwards-compat checks**: verificar que mensajes antiguos sin
  `sources` estructurados siguen mostrando pills via el fallback regex de
  `MessageBubble.jsx`.

Tests automatizados de React están planificados para post-MVP con Vitest +
React Testing Library.

## Tests del plugin Moodle (PHPUnit + Behat)

El plugin tiene la estructura base preparada para tests con el framework
oficial de Moodle, pero al cierre del MVP se priorizó cobertura del backend
(donde vive la lógica de RAG y HMAC) sobre el plugin (que es principalmente
proxy).

Tests planificados para post-MVP:

- PHPUnit: validación de External Functions (`chat_send`, `document_upload`,
  `search_query`, etc.) con `external_api::validate_parameters`.
- Behat: smoke E2E navegando Moodle como alumno y como docente.

## CI/CD — GitHub Actions

El repositorio tiene cuatro workflows en `.github/workflows/`:

### `backend-ci.yml`

Se dispara en cada PR y push a `main` que toque `services/api/**`. Tiene dos
jobs:

- **Lint + type check** — Ruff + mypy. Falla rápido sin levantar servicios.
- **Tests** — levanta PostgreSQL + pgvector + Redis en services del runner,
  corre `pytest -v --cov` con cobertura mínima del 70%.

Tiempo total típico: ~90 segundos. Con `concurrency.cancel-in-progress: true`
cancela runs viejas si se pushean commits nuevos al mismo PR.

### `frontend-ci.yml`

Build del bundle React en cada PR que toque `plugin/local/nexusai/react/**`.
Falla si el build no compila o si el bundle excede 500KB (umbral configurado
en `webpack.config.js`).

### `moodle-ci.yml`

Análisis estático del plugin PHP con `moodle-plugin-ci` (el linter oficial
de Moodle): PHP Lint, PHPMD, Moodle Code Checker, PHPDoc Checker, validate,
savepoints, Mustache Lint, Grunt. No corre PHPUnit/Behat todavía (planificado
post-MVP).

### Despliegue a Railway

El despliegue del backend a Railway se hace por integración nativa entre
Railway y GitHub: cada push a `main` que modifique `services/api/**` dispara
automáticamente un build + redeploy del container. Pasos del flujo
automatizado:

1. Railway detecta el push vía webhook.
2. `docker build` desde `services/api/Dockerfile`.
3. Rolling update: el container nuevo levanta antes de bajar el viejo.
4. Migraciones Alembic corren al startup del container vía `scripts/entrypoint.sh`.
5. Verificación de health check post-deploy: `GET /health` debe devolver `200 OK`.
6. Si el health check falla, Railway hace rollback automático al container anterior.

Tiempo total típico: ~3-5 minutos desde el push al deploy final.

## Testing manual estructurado

Adicionalmente a los smoke tests rápidos, el equipo elaboró un **checklist
formal de 51 casos de testing manual** distribuido en 9 áreas funcionales.
Cada caso especifica: rol del usuario, navegación esperada, pasos exactos,
resultado esperado e indicador de bug.

### Distribución de los casos por área

| Área | Casos | Foco principal |
|---|---|---|
| 1. Subida de documentos | 11 | PDFs, DOCX, TXT, duplicados, archivos corruptos, formatos no soportados, magic bytes, archivos vacíos, drag & drop, concurrencia |
| 2. Indexación — estados y errores | 3 | Progreso visible, errores de indexación, polling se detiene al completar |
| 3. Eliminación de documentos | 3 | Borrado normal, CASCADE de chunks, último documento del curso |
| 4. Chat | 11 | Pregunta in-scope / out-of-scope, multi-turno, chips de fuente, modo multi-curso, sugerencias, typing indicator, error de red, historial, curso vacío |
| 5. Quiz | 13 | Generación aleatoria, con tema válido / inválido, selector de cantidad, respuestas correctas / incorrectas, bloqueo post-verificación, score final por rango, error de backend, aleatorización de opciones |
| 6. Búsqueda | 9 | Por nombre, semántica, sin resultados, parcial, toggle scope, descarga de archivo, límite de caracteres, snippet |
| 7. Gaps detectados | 5 | Visualización, actualización tras pregunta, deduplicación, ordenamiento por frecuencia, panel vacío |
| 8. Diferencias de rol | 4 | Acceso docente, alumno sin acceso, URL protegida, toggle scope solo alumno |
| 9. Casos borde | 10 | Curso vacío, caracteres especiales, queries largas, nombres con special chars, múltiples pestañas, campo vacío, sesskey inválido, reconexión durante streaming |
| **Total** | **51 casos** | |

### Estructura de cada caso

```
N.M [Nombre]
- Rol: Docente / Alumno
- Navegación: ruta para llegar
- Pasos: a, b, c …
- Resultado esperado: descripción del comportamiento correcto
- Indicaría bug: señales que delatan un problema
```

### Ejemplos representativos

**1.4 Archivo duplicado (mismo nombre, ya indexado)**

- **Rol:** Docente
- **Pasos:** Subir un archivo ya indexado en el curso.
- **Resultado esperado:** Toast amarillo *"Este documento ya se encuentra
  indexado en este curso."* desaparece a los 3 segundos. No se crea
  duplicado.
- **Indicaría bug:** Se acepta sin advertencia, error 500, o aparece dos
  veces en la lista.

**4.2 Pregunta fuera del scope del material**

- **Rol:** Alumno
- **Pasos:** Preguntar algo ajeno al material (ej: "¿Cuál es la capital de
  Francia?" en un curso de programación).
- **Resultado esperado:** El LLM responde que no puede responder con el
  material disponible. No aparecen chips de fuente. La pregunta queda
  registrada como gap potencial.
- **Indicaría bug:** El LLM inventa una respuesta sin contenido del
  material; aparecen chips de fuente falsos.

**5.3 Generar quiz con tema inválido / fuera del material**

- **Rol:** Alumno
- **Pasos:** Escribir un tema completamente ajeno al material y generar
  quiz.
- **Resultado esperado:** Error 422. Mensaje inline en el campo (no en
  modal genérico). El input muestra borde rojo.
- **Indicaría bug:** Se genera un quiz con preguntas inventadas.

**7.3 Deduplicación de preguntas similares (gaps)**

- **Rol:** Docente (verifica) + Alumno (genera)
- **Pasos:** Mismo pregunta repetida desde el chat varias veces. Revisar
  el panel de gaps.
- **Resultado esperado:** La pregunta aparece **una sola vez** con `count
  > 1`. No entradas duplicadas.
- **Indicaría bug:** Cada pregunta idéntica aparece separada; el count
  siempre es 1.

**9.2 Caracteres especiales en búsqueda**

- **Rol:** Alumno / Docente
- **Pasos:** Buscar queries como `O'Brien & Associates`, `SELECT * FROM
  users; --`, `<script>alert(1)</script>`, `héroe, ñoño, über`.
- **Resultado esperado:** En todos los casos la búsqueda se procesa
  correctamente o devuelve "sin resultados". Ninguna genera error 500 ni
  ejecuta código. Los caracteres especiales no rompen la UI.
- **Indicaría bug:** Cualquier query genera 500; HTML escapado en
  resultados; `<script>` se ejecuta (XSS).

### Estado de ejecución al cierre del MVP

- ✅ **49 de 51 casos** pasaron en la última ronda de testing manual.
- ⚠️ **2 casos** con observaciones menores (no bloqueantes):
  - **2.2 Estado de error en indexación** — el mensaje de error se ve en
    tooltip, pero falta un botón explícito de "reintentar indexación" para
    el docente. Pendiente para post-MVP.
  - **9.10 Reconexión tras pérdida de red durante streaming** — la UI
    muestra el error pero el mensaje parcial recibido queda en pantalla.
    Comportamiento aceptable pero podría mejorarse con un botón explícito
    de "descartar respuesta parcial".

El checklist completo con los 51 casos detallados se incluye en el
pendrive como anexo separado.

## Smoke tests rápidos pre-release

Antes de cada release se corre un checklist resumido:

- [ ] Backend levanta sin errores (`./scripts/dev.sh up && curl /health`).
- [ ] Migraciones aplican limpias (`alembic upgrade head` en DB vacía).
- [ ] Login en Moodle, ir a un curso con material indexado.
- [ ] Abrir chat, hacer una pregunta, verificar respuesta con citas clickeables.
- [ ] Activar multi-curso, preguntar algo cross-curso.
- [ ] Pestaña Buscador con query, resultados con scores.
- [ ] Pestaña Quiz: generar 5 preguntas, responder, ver score final.
- [ ] Vista docente, tab Gaps, verificar que aparecen preguntas no respondidas.
- [ ] Logout, re-login, historial muestra sesiones previas.

## Cobertura actual

Cobertura medida por `pytest --cov` en el último build de CI:

| Módulo | Cobertura |
|---|---|
| `app/auth/` (HMAC) | ~95% |
| `app/documents/` (pipeline RAG) | ~85% |
| `app/chat/` (router + retriever) | ~80% |
| `app/search/`, `app/quiz/`, `app/gaps/` | ~70% (módulos recientes) |
| **Total backend** | **~80%** |

El frontend y el plugin PHP están fuera del cálculo de cobertura por la
estrategia manual mencionada.


