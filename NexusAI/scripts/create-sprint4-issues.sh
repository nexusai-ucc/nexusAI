#!/usr/bin/env bash
# ----------------------------------------------------------------------------
# Crea las 6 issues de Sprint 4 — MVP en GitHub, las asocia al milestone,
# las cierra como completed y referencia el commit que las implementa.
#
# Idempotente: si una issue ya existe (mismo título), no la duplica.
#
# Requiere: gh CLI autenticado en el repo nexusai-ucc/nexusAI.
#
# Uso:  ./scripts/create-sprint4-issues.sh
#       DRY_RUN=1 ./scripts/create-sprint4-issues.sh   # solo imprime lo que haría
# ----------------------------------------------------------------------------

set -euo pipefail

REPO="nexusai-ucc/nexusAI"
MILESTONE="Sprint 4 — MVP"
DRY_RUN="${DRY_RUN:-0}"

# Helper: corre el comando o lo imprime en dry-run.
run() {
    if [[ "$DRY_RUN" == "1" ]]; then
        printf '\n[DRY-RUN] '; printf '%q ' "$@"; echo
    else
        "$@"
    fi
}

# Helper: busca el número de issue por título exacto (devuelve "" si no existe).
find_issue_by_title() {
    local title="$1"
    gh issue list --repo "$REPO" --state all --search "\"$title\" in:title" --json number,title \
        --jq ".[] | select(.title == \"$title\") | .number" | head -1
}

# Helper: crea o reusa una issue, agrega labels, asocia milestone, comenta commit y cierra.
create_and_close() {
    local title="$1"
    local body="$2"
    local commit_sha="$3"
    local labels="$4"      # comma-separated

    echo ""
    echo "─── $title ───"

    local existing
    existing="$(find_issue_by_title "$title")"

    if [[ -n "$existing" ]]; then
        echo "Issue ya existe: #$existing — actualizando labels/cierre."
        local num="$existing"
    else
        echo "Creando issue nueva..."
        local url num
        url="$(run gh issue create --repo "$REPO" \
            --title "$title" \
            --body "$body" \
            --milestone "$MILESTONE" \
            --label "$labels")"
        if [[ "$DRY_RUN" == "1" ]]; then
            echo "(dry-run, sin URL real)"
            return
        fi
        num="${url##*/}"
        echo "Creada: $url (#$num)"
    fi

    # Comentar el commit que la implementa.
    run gh issue comment "$num" --repo "$REPO" \
        --body "Implementada en commit ${commit_sha}.

Ver diff completo: https://github.com/${REPO}/commit/${commit_sha}"

    # Cerrar como completed.
    run gh issue close "$num" --repo "$REPO" --reason completed
}

# ============================================================================
# Definición de cada Feature → issue
# ============================================================================

read -r -d '' FEAT_A_BODY <<'EOF' || true
## [MVP-A] Buscador semántico (Feature A)

Endpoint y UI que realiza retrieval puro sobre pgvector — devuelve los fragmentos más relevantes del material del curso a una consulta del alumno, **sin pasar por el LLM**.

### Lo implementado
- [x] Backend: `POST /api/v1/search` con HMAC (`services/api/app/search/router.py`)
- [x] Retrieval con threshold `min_similarity=0.25` (más permisivo que el chat)
- [x] PHP External Function `local_nexusai_search_query` registrada en `db/services.php`
- [x] React: nueva pestaña **Buscador** con cards por resultado (`react/src/components/SearchPanel.jsx`)
- [x] Score de similaridad coloreado por nivel (verde/naranja/gris)
- [x] Bundle React rebuildeado y bumpeado a `0.4.0`

### Argumento para defensa
Útil para que el alumno encuentre EN QUÉ archivo está un tema, sin gastar tokens de LLM. Cierra una necesidad pedagógica concreta y demuestra que el retrieval funciona independiente del generador.
EOF

read -r -d '' FEAT_B_BODY <<'EOF' || true
## [MVP-B] Chat multi-curso (Feature B)

Modo opcional del chat que permite al alumno consultar el material indexado de **todos los cursos donde está enrollado**, no solo el actual. El LLM cita la materia de la que proviene cada fragmento.

### Lo implementado
- [x] Backend `retrieve_context()` acepta `course_ids: list[int]` y usa `Document.course_id.in_(ids)` (`services/api/app/documents/retriever.py`)
- [x] `RetrievedChunk` ahora incluye `course_id` para anotar la materia
- [x] `ChatRequest` schema con campos opcionales `course_ids` + `course_names`
- [x] System prompt diferenciado con flag `is_multicourse` que pide citar materia
- [x] PHP: `backend_client::send_message_multicourse()` resuelve cursos del alumno con `enrol_get_users_courses()`
- [x] React: toggle 📚/🌐 en el header del chat; al activar limpia historial y cambia el status visual

### Argumento para defensa
Permite asistencia transversal entre materias (ej: "esto que vimos en Cálculo aplica también en Programación"). Mantiene aislamiento por curso por default — la decisión es del alumno.
EOF

read -r -d '' FEAT_C_BODY <<'EOF' || true
## [MVP-C] Chat con streaming SSE (Feature C)

La respuesta del asistente aparece **token-por-token** en lugar de en bloque al final. Mantiene el patrón Hybrid PHP Proxy (ADR-001) — el HMAC sigue siendo server-to-server.

### Lo implementado
- [x] Backend Python: nuevo endpoint `POST /api/v1/chat/stream` con `StreamingResponse` y `media_type="text/event-stream"`
- [x] `LLMProvider.chat_completion_stream()` yieldea `StreamToken` por chunk y `StreamUsage` al final (con `include_usage=True`)
- [x] PHP proxy: nuevo endpoint regular `plugin/local/nexusai/chat_stream.php` con `CURLOPT_WRITEFUNCTION` que forwardea SSE sin buffering
- [x] React: `sendMessageStream()` usa `fetch` + `ReadableStream` para parsear SSE incrementalmente
- [x] UI: caret azul parpadeante mientras se está escribiendo, TypingIndicator se oculta cuando llega el primer token
- [x] Persistencia DB: mensaje del asistente se guarda completo al final del stream con token counts reales

### Argumento para defensa
Latencia perceived dramáticamente menor (primer token en ~1s vs respuesta completa en ~8s). Pattern arquitectónico defendible: no rompe ADR-001 (HMAC nunca llega al browser).
EOF

read -r -d '' FEAT_D_BODY <<'EOF' || true
## [MVP-D] Citas clickeables con preview del fragmento (Feature D)

Las pills "Fuentes:" debajo de cada respuesta ahora son interactivas: al clickear se expande inline el **fragmento exacto** del material que se usó, con score de similaridad.

### Lo implementado
- [x] Backend `/chat/stream` envía `sources` (chunks reales con `document_filename`, `chunk_index`, `content`, `similarity`, `course_id`) en el evento `meta`
- [x] React `sendMessageStream` propaga sources al callback `onMeta`
- [x] `ChatApp.jsx` guarda sources en el mensaje del asistente streaming
- [x] `MessageBubble.jsx` reemplaza el regex de extracción por sources estructuradas cuando están disponibles (backwards-compatible)
- [x] Pills clickeables con badge de % de similaridad
- [x] Panel expandido inline con animación, contenido del chunk, archivo y número de fragmento
- [x] Fix de prompt LLM: ya no copia el ejemplo `apunte-derivadas.pdf` literalmente, ahora cita usando los archivos reales del bloque del material

### Argumento para defensa
Cierra el loop visual del RAG: la respuesta del LLM es **trazable a un fragmento concreto** del material. Refuta el argumento de alucinación.
EOF

read -r -d '' FEAT_E_BODY <<'EOF' || true
## [MVP-E] Historial de conversaciones (Feature E)

Dropdown 🕐 en el header del chat con las sesiones previas del alumno, ordenadas por última actividad. Click en una → carga sus mensajes y permite continuar la conversación.

### Lo implementado
- [x] Backend: `POST /api/v1/chat/sessions/list` y `POST /api/v1/chat/sessions/messages` con verificación de ownership (un usuario no puede leer sesiones ajenas)
- [x] Cada item incluye preview del primer mensaje, `message_count` y `updated_at`
- [x] PHP: External Functions `local_nexusai_chat_sessions_list` y `local_nexusai_chat_session_messages`
- [x] React: componente `HistoryDropdown` con toggle "Este curso" vs "Todos mis cursos"
- [x] Lazy load: la lista solo se pide cuando el dropdown se abre
- [x] Tiempos relativos en español/inglés ("5min", "2h", "1d")
- [x] Sesión actual marcada visualmente

### Argumento para defensa
Mejora la experiencia de estudio: el alumno puede retomar sesiones de repaso anteriores sin reformular preguntas. Es un patrón que ChatGPT, Claude, etc. ya consolidaron como esperado.
EOF

read -r -d '' FEAT_F_BODY <<'EOF' || true
## [MVP-F] Quiz generator de opción múltiple (Feature F)

Nueva pestaña "Quiz" que genera preguntas de práctica desde el material indexado del curso. Cada pregunta tiene 4 opciones, feedback inmediato con explicación + archivo fuente, y score final.

### Lo implementado
- [x] Backend: `POST /api/v1/quiz/generate` (módulo nuevo `app/quiz/`)
- [x] Modo con tema: usa `retrieve_context()` para sacar 10 chunks relevantes
- [x] Modo sin tema: random sample de 12 chunks (`ORDER BY random() LIMIT`) para variedad
- [x] LLM con `response_format={"type":"json_object"}` (Gemini OpenAI-compat)
- [x] Validación Pydantic por pregunta — graceful degradation (saltea malformadas en vez de tirar 503)
- [x] Shuffle de opciones después del parse (los LLMs tienden a poner la correcta en index 0)
- [x] PHP: External Function `local_nexusai_quiz_generate` registrada
- [x] React: `QuizPanel` con máquina de estados (setup → loading → playing → finished → error)
- [x] Estados visuales: opción correcta en verde, errada en rojo, explicación + archivo de origen
- [x] Pantalla final con emoji según %, score y botón "Nuevo quiz"

### Argumento para defensa
Genera material de autoevaluación basado **solo** en lo que el docente subió — no inventa contenido. Es el caso de uso más solicitado por estudiantes (autotest antes de un parcial).
EOF

# ============================================================================
# Ejecutar
# ============================================================================

echo "Repo:      $REPO"
echo "Milestone: $MILESTONE"
echo "Dry run:   $DRY_RUN"

create_and_close \
    "[MVP-A] Buscador semántico" \
    "$FEAT_A_BODY" \
    "ef44ad6" \
    "mvp,epica:buscador,epica:asistente,prio:alta,resp:delfina,sprint:4,tipo:desarrollo"

create_and_close \
    "[MVP-B] Chat multi-curso" \
    "$FEAT_B_BODY" \
    "ef44ad6" \
    "mvp,epica:asistente,prio:alta,resp:delfina,sprint:4,tipo:desarrollo"

create_and_close \
    "[MVP-C] Chat con streaming SSE" \
    "$FEAT_C_BODY" \
    "6a15cd7" \
    "mvp,epica:asistente,prio:alta,resp:delfina,sprint:4,tipo:desarrollo"

create_and_close \
    "[MVP-D] Citas clickeables con preview" \
    "$FEAT_D_BODY" \
    "27ef377" \
    "mvp,epica:asistente,prio:alta,resp:delfina,sprint:4,tipo:desarrollo"

create_and_close \
    "[MVP-E] Historial de conversaciones" \
    "$FEAT_E_BODY" \
    "9b426b9" \
    "mvp,epica:asistente,prio:media,resp:delfina,sprint:4,tipo:desarrollo"

create_and_close \
    "[MVP-F] Quiz generator" \
    "$FEAT_F_BODY" \
    "5f9f6c5" \
    "mvp,epica:study-planner,epica:asistente,prio:alta,resp:delfina,sprint:4,tipo:desarrollo"

echo ""
echo "✓ Listo."
