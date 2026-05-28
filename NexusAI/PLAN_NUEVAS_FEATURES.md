# Plan de implementación — Feature A + Feature B
## NexusAI · Sprint 4 MVP

---

## Contexto del proyecto

NexusAI es un plugin Moodle con un asistente académico basado en IA. El stack es:

- **Frontend:** React (bundle AMD embebido en Moodle vía `before_footer()`)
- **Plugin Moodle:** PHP — tipo `local`, External Functions expuestas vía `core/ajax`
- **Backend IA:** Python FastAPI en `services/api/`
- **Base de datos:** PostgreSQL en Supabase con extensión **pgvector** (NO ChromaDB)
- **LLM:** Gemini 2.0 Flash vía endpoint compatible OpenAI
- **Embeddings:** gemini-embedding-001 (768 dimensiones)
- **Autenticación backend:** HMAC SHA-256 entre PHP y Python

### Estructura del repo relevante

```
NexusAI/
├── services/api/
│   ├── app/
│   │   ├── main.py                          ← registra todos los routers
│   │   ├── chat/
│   │   │   ├── router.py                    ← POST /api/v1/chat/messages
│   │   │   └── schemas.py                   ← ChatRequest / ChatResponse
│   │   ├── documents/
│   │   │   ├── retriever.py                 ← retrieve_context() con pgvector
│   │   │   └── router.py                    ← upload/list/delete documentos
│   │   ├── courses/
│   │   │   └── router.py                    ← GET /api/v1/courses/{id}/stats
│   │   ├── db/
│   │   │   ├── models.py                    ← Document, Chunk, ChatSession, Message
│   │   │   └── session.py                   ← AsyncSession factory
│   │   ├── providers/
│   │   │   ├── llm.py                       ← LLMProvider (Gemini)
│   │   │   └── embeddings.py                ← EmbeddingProvider (Gemini)
│   │   ├── auth/hmac.py                     ← verify_hmac dependency
│   │   └── shared/
│   │       ├── config.py                    ← Settings (pydantic-settings)
│   │       └── rate_limit.py                ← check_rate_limit()
│   └── migrations/versions/
│       ├── 001_initial_schema.py
│       ├── 002_hnsw_index.py
│       └── 003_message_token_counts.py
└── plugin/local/nexusai/
    ├── classes/external/
    │   ├── backend_client.php               ← cliente HTTP con HMAC
    │   ├── chat_send.php                    ← External Function del chat
    │   ├── document_upload.php
    │   └── document_list.php
    ├── db/services.php                      ← registro de External Functions
    ├── react/src/
    │   ├── ChatApp.jsx                      ← componente principal del chat
    │   ├── api/chat.js                      ← llama a local_nexusai_chat_send
    │   └── components/
    │       ├── MessageBubble.jsx
    │       ├── ChatInput.jsx
    │       └── TypingIndicator.jsx
    └── react/webpack.config.js
```

### Schema de base de datos relevante

```sql
-- documents: un registro por archivo subido por el docente
documents (
  id UUID PK,
  course_id INT NOT NULL,   -- ID del curso de Moodle
  uploader_id INT NOT NULL,
  filename VARCHAR(255),
  mime_type VARCHAR(100),
  status VARCHAR(20),       -- 'pending' | 'indexing' | 'indexed' | 'error'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- chunks: fragmentos de texto de cada documento con su embedding
chunks (
  id UUID PK,
  document_id UUID FK → documents.id CASCADE,
  content TEXT,
  chunk_index INT,
  token_count INT,
  embedding vector(768),    -- pgvector, índice HNSW en migración 002
  created_at TIMESTAMPTZ
)

-- chat_sessions: una sesión por conversación (usuario + curso)
chat_sessions (
  id UUID PK,
  user_id INT,
  course_id INT,            -- 0 = sesión multi-curso
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- messages: mensajes de cada sesión
messages (
  id UUID PK,
  session_id UUID FK → chat_sessions.id CASCADE,
  role VARCHAR(20),         -- 'user' | 'assistant'
  content TEXT,
  token_count_prompt INT,
  token_count_completion INT,
  created_at TIMESTAMPTZ
)
```

### Cómo funciona el HMAC

Cada request del plugin PHP al backend Python lleva estos headers:
- `Authorization: Bearer <NEXUSAI_API_KEY>`
- `X-Timestamp: <unix epoch>`
- `X-Nonce: <16 bytes hex>`
- `X-Signature: HMAC_SHA256(secret, timestamp + nonce + body_raw)`

El backend Python verifica la firma en `app/auth/hmac.py`. La dependency `verify_hmac` se inyecta en todos los endpoints. **Nunca omitir este parámetro en nuevos endpoints.**

### Cómo funciona el retrieve_context actual

```python
# services/api/app/documents/retriever.py
async def retrieve_context(
    question: str,
    course_id: int,           # ← ESTE es el parámetro que cambia en Feature B
    db: AsyncSession,
    embeddings: EmbeddingProvider,
    top_k: int = 5,
    min_similarity: float = 0.3,
) -> List[RetrievedChunk]:
    question_vector = await embeddings.embed(question)
    stmt = (
        select(Chunk.content, Chunk.chunk_index, Document.filename,
               Chunk.embedding.cosine_distance(question_vector).label("distance"))
        .join(Document, Chunk.document_id == Document.id)
        .where(Document.course_id == course_id)   # ← filtra por UN curso
        .where(Document.status == "indexed")
        .where(Chunk.embedding.is_not(None))
        .order_by("distance")
        .limit(top_k)
    )
    # ...
```

### Cómo funciona la External Function PHP actual (chat)

```php
// plugin/local/nexusai/classes/external/chat_send.php
// execute() recibe: question, courseid, userid (ignorado), sessionid
// Llama a: $client->send_message($courseid, $USER->id, $question, $sessionid)
// backend_client::send_message() construye el JSON y lo POST-ea con HMAC
```

### Cómo funciona el cliente React actual

```js
// plugin/local/nexusai/react/src/api/chat.js
// sendMessage({ question, courseId, userId, sessionId })
// → core/ajax → local_nexusai_chat_send (External Function PHP)
// → backend_client → FastAPI /api/v1/chat/messages
```

---

## FEATURE A — Buscador Semántico

### Descripción

Un endpoint de búsqueda pura sin LLM: el usuario escribe una consulta, el sistema vectoriza la pregunta y devuelve los fragmentos de texto más relevantes del material del curso con su archivo de origen y score de similitud. No genera texto, no tiene historial, no usa sesiones.

**Endpoint:** `POST /api/v1/search`

**UI:** Una pestaña o sección separada del chat dentro del mismo panel flotante.

---

### Cambios Backend

#### 1. Crear `services/api/app/search/` (directorio nuevo)

Crear `services/api/app/search/__init__.py` (vacío).

#### 2. Crear `services/api/app/search/router.py`

```python
"""
Buscador semántico — Feature A.

POST /api/v1/search
  Recibe una consulta en lenguaje natural y devuelve los fragmentos
  del material del curso más similares semánticamente, sin generar
  texto con el LLM. Es retrieval puro sobre pgvector.

  Útil para:
  - Encontrar en qué archivo/sección está un tema
  - Ver el fragmento exacto del material sin pasar por el chat
  - Verificar qué material tiene el curso indexado
"""

from __future__ import annotations

from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.hmac import verify_hmac
from app.db.session import get_db
from app.documents.retriever import retrieve_context
from app.providers.embeddings import EmbeddingProvider, get_embedding_provider

router = APIRouter()


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    course_id: int = Field(gt=0)
    user_id: int = Field(gt=0)
    top_k: int = Field(default=5, ge=1, le=10)


class SearchResult(BaseModel):
    document_filename: str
    chunk_index: int
    content: str          # fragmento de texto (primeros 400 chars)
    similarity: float     # 0.0 a 1.0


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total: int


@router.post("", response_model=SearchResponse)
async def search(
    payload: SearchRequest,
    _body: Annotated[bytes, Depends(verify_hmac)],
    db: AsyncSession = Depends(get_db),
    embeddings: EmbeddingProvider = Depends(get_embedding_provider),
) -> SearchResponse:
    """
    Búsqueda semántica en el material del curso.

    Devuelve los fragmentos más relevantes sin pasar por el LLM.
    Si el curso no tiene material indexado, devuelve lista vacía (no 404).
    """
    try:
        chunks = await retrieve_context(
            question=payload.query,
            course_id=payload.course_id,
            db=db,
            embeddings=embeddings,
            top_k=payload.top_k,
            min_similarity=0.25,  # un poco más permisivo que el chat (0.3)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El servicio de búsqueda no está disponible temporalmente",
        ) from exc

    results = [
        SearchResult(
            document_filename=chunk.document_filename,
            chunk_index=chunk.chunk_index,
            content=chunk.content[:400].strip(),
            similarity=round(chunk.similarity, 3),
        )
        for chunk in chunks
    ]

    return SearchResponse(
        query=payload.query,
        results=results,
        total=len(results),
    )
```

#### 3. Modificar `services/api/app/main.py`

Agregar después de los imports de routers existentes:

```python
from app.search.router import router as search_router   # noqa: E402

app.include_router(search_router, prefix="/api/v1/search", tags=["search"])
```

**Eso es todo en el backend para Feature A. No hay migraciones.**

---

### Cambios PHP Plugin

#### 4. Agregar método a `plugin/local/nexusai/classes/external/backend_client.php`

Agregar el siguiente método público a la clase `backend_client`, después de `send_message()`:

```php
/**
 * Busca fragmentos relevantes en el material indexado del curso.
 *
 * @param int    $courseid ID del curso de Moodle.
 * @param int    $userid   $USER->id del usuario que busca.
 * @param string $query    Consulta de búsqueda (1..500 chars).
 * @param int    $topk     Número máximo de resultados (1..10, default 5).
 * @return array{query:string, results:array, total:int}
 *
 * @throws \moodle_exception Si el backend devuelve no-2xx o falla la red.
 */
public function search(int $courseid, int $userid, string $query, int $topk = 5): array {
    $payload = [
        'query'     => $query,
        'course_id' => $courseid,
        'user_id'   => $userid,
        'top_k'     => $topk,
    ];
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($body === false) {
        throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
    }
    return $this->post('/api/v1/search', $body);
}
```

#### 5. Crear `plugin/local/nexusai/classes/external/search_query.php`

```php
<?php
/**
 * External function `local_nexusai_search_query`.
 *
 * Proxy entre React y el endpoint /api/v1/search del backend Python.
 * Devuelve fragmentos del material del curso relevantes a la consulta,
 * sin pasar por el LLM (retrieval puro).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class search_query extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'query'    => new \external_value(PARAM_RAW, 'Consulta de búsqueda', VALUE_REQUIRED),
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'topk'     => new \external_value(PARAM_INT, 'Cantidad de resultados', VALUE_OPTIONAL, 5),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'query'   => new \external_value(PARAM_RAW, 'Consulta original'),
            'total'   => new \external_value(PARAM_INT, 'Total de resultados'),
            'results' => new \external_multiple_structure(
                new \external_single_structure([
                    'document_filename' => new \external_value(PARAM_TEXT, 'Nombre del archivo'),
                    'chunk_index'       => new \external_value(PARAM_INT, 'Índice del fragmento'),
                    'content'           => new \external_value(PARAM_RAW, 'Texto del fragmento'),
                    'similarity'        => new \external_value(PARAM_FLOAT, 'Score de similitud 0-1'),
                ])
            ),
        ]);
    }

    public static function execute(string $query, int $courseid, int $topk = 5): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'query'    => $query,
            'courseid' => $courseid,
            'topk'     => $topk,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $cleanquery = trim($params['query']);
        if ($cleanquery === '') {
            throw new \invalid_parameter_exception('Query cannot be empty');
        }
        if (mb_strlen($cleanquery) > 500) {
            throw new \invalid_parameter_exception('Query too long (max 500 characters)');
        }

        $topk = max(1, min(10, (int) $params['topk']));

        $client   = new backend_client();
        $response = $client->search((int)$params['courseid'], (int)$USER->id, $cleanquery, $topk);

        if (!isset($response['results'], $response['total'])) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'Invalid search response');
        }

        return [
            'query'   => (string)($response['query'] ?? $cleanquery),
            'total'   => (int)$response['total'],
            'results' => array_map(
                static fn(array $r) => [
                    'document_filename' => (string)($r['document_filename'] ?? ''),
                    'chunk_index'       => (int)($r['chunk_index'] ?? 0),
                    'content'           => (string)($r['content'] ?? ''),
                    'similarity'        => (float)($r['similarity'] ?? 0.0),
                ],
                $response['results']
            ),
        ];
    }
}
```

#### 6. Modificar `plugin/local/nexusai/db/services.php`

Agregar la nueva función al array `$functions` (al lado de las existentes):

```php
'local_nexusai_search_query' => [
    'classname'    => 'local_nexusai\external\search_query',
    'methodname'   => 'execute',
    'description'  => 'Búsqueda semántica en el material del curso (retrieval sin LLM)',
    'type'         => 'read',
    'ajax'         => true,
    'loginrequired'=> true,
],
```

---

### Cambios React

#### 7. Crear `plugin/local/nexusai/react/src/api/search.js`

```js
/**
 * Cliente API del buscador semántico.
 * Llama a local_nexusai_search_query vía core/ajax.
 */

const MOCK_RESULTS = [
    {
        document_filename: "apunte-estructuras.pdf",
        chunk_index: 3,
        content: "Los árboles binarios de búsqueda (BST) son estructuras de datos donde cada nodo tiene como máximo dos hijos...",
        similarity: 0.87,
    },
    {
        document_filename: "tp2-enunciado.pdf",
        chunk_index: 1,
        content: "El trabajo práctico consiste en implementar una tabla hash con resolución de colisiones por encadenamiento...",
        similarity: 0.74,
    },
];

async function getMoodleAjax() {
    if (typeof window === "undefined" || !window.M?.cfg) return null;
    try {
        return await new Promise((resolve, reject) =>
            window.require(["core/ajax"], resolve, reject)
        );
    } catch { return null; }
}

/**
 * Busca fragmentos del material del curso.
 *
 * @param {Object} params
 * @param {string} params.query     Consulta de búsqueda.
 * @param {number} params.courseId  ID del curso de Moodle.
 * @param {number} [params.topK]    Cantidad de resultados (default 5).
 * @returns {Promise<{query:string, total:number, results:Array}>}
 */
export async function searchMaterial({ query, courseId, topK = 5 }) {
    if (!query?.trim()) throw new Error("La búsqueda no puede estar vacía");

    const ajax = await getMoodleAjax();

    if (!ajax) {
        // Mock fuera de Moodle
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
        return { query, total: MOCK_RESULTS.length, results: MOCK_RESULTS };
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_search_query",
        args: { query: query.trim(), courseid: courseId, topk: topK },
    }]);

    return response;
}
```

#### 8. Crear `plugin/local/nexusai/react/src/components/SearchPanel.jsx`

```jsx
/**
 * SearchPanel — panel de búsqueda semántica en el material del curso.
 *
 * Muestra resultados como cards con: nombre del archivo, fragmento de texto
 * relevante y badge con el score de similitud.
 */

import { useState } from "react";
import { searchMaterial } from "../api/search.js";

export default function SearchPanel({ courseId, lang = "es" }) {
    const [query, setQuery]     = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        setResults(null);
        try {
            const data = await searchMaterial({ query: query.trim(), courseId });
            setResults(data);
        } catch (err) {
            setError(err.message || "Error en la búsqueda");
        } finally {
            setLoading(false);
        }
    };

    const similarityColor = (s) => {
        if (s >= 0.75) return "#16a34a";
        if (s >= 0.5)  return "#d97706";
        return "#6b7280";
    };

    return (
        <div className="nexusai-search">
            <form onSubmit={handleSearch} className="nexusai-search__form">
                <input
                    type="text"
                    className="nexusai-search__input"
                    placeholder={lang === "es"
                        ? "Buscá un tema en el material del curso..."
                        : "Search in course material..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                />
                <button
                    type="submit"
                    className="nexusai-search__btn"
                    disabled={loading || !query.trim()}
                >
                    {loading ? "..." : (lang === "es" ? "Buscar" : "Search")}
                </button>
            </form>

            {error && (
                <div className="nexusai-error" role="alert">
                    <p className="nexusai-error__text">{error}</p>
                </div>
            )}

            {results && results.total === 0 && (
                <p className="nexusai-search__empty">
                    {lang === "es"
                        ? "No encontré fragmentos relacionados en el material del curso."
                        : "No relevant fragments found in the course material."}
                </p>
            )}

            {results && results.results.map((r, i) => (
                <div key={i} className="nexusai-search__result">
                    <div className="nexusai-search__result-header">
                        <span className="nexusai-search__filename">
                            📄 {r.document_filename}
                        </span>
                        <span
                            className="nexusai-search__score"
                            style={{ color: similarityColor(r.similarity) }}
                        >
                            {Math.round(r.similarity * 100)}% relevante
                        </span>
                    </div>
                    <p className="nexusai-search__content">{r.content}</p>
                </div>
            ))}
        </div>
    );
}
```

#### 9. Modificar `plugin/local/nexusai/react/src/ChatApp.jsx`

Agregar el buscador como una segunda pestaña dentro del panel flotante.

**Imports a agregar al inicio del archivo:**
```jsx
import { useState as useTabState } from "react"; // ya está importado el useState, solo agregar SearchPanel
import SearchPanel from "./components/SearchPanel.jsx";
```

**Dentro del componente `ChatApp`, agregar estado de pestaña activa:**
```jsx
const [activeTab, setActiveTab] = useState("chat"); // "chat" | "search"
```

**Dentro del JSX, reemplazar la apertura del `<div className="nexusai-panel__body">` y lo que está antes, agregando las pestañas:**

Después del cierre del `</header>` y antes del `<div className="nexusai-panel__body">`, agregar:

```jsx
{/* Pestañas: Chat / Buscador */}
<div className="nexusai-tabs">
    <button
        type="button"
        className={`nexusai-tab ${activeTab === "chat" ? "nexusai-tab--active" : ""}`}
        onClick={() => setActiveTab("chat")}
    >
        {lang === "es" ? "Chat" : "Chat"}
    </button>
    <button
        type="button"
        className={`nexusai-tab ${activeTab === "search" ? "nexusai-tab--active" : ""}`}
        onClick={() => setActiveTab("search")}
    >
        {lang === "es" ? "Buscador" : "Search"}
    </button>
</div>
```

Luego, el cuerpo del panel queda así:

```jsx
{activeTab === "chat" ? (
    <>
        <div className="nexusai-panel__body">
            {/* ... contenido existente del chat sin cambios ... */}
        </div>
        <ChatInput ... />
        <footer className="nexusai-panel__footer"> ... </footer>
    </>
) : (
    <div className="nexusai-panel__body">
        <SearchPanel courseId={courseid} lang={lang} />
    </div>
)}
```

#### 10. Agregar estilos en `plugin/local/nexusai/react/src/styles.css`

Agregar al final:

```css
/* ── Pestañas ── */
.nexusai-tabs {
    display: flex;
    border-bottom: 1px solid #e2e8f0;
    padding: 0 12px;
    background: #fff;
}
.nexusai-tab {
    flex: 1;
    padding: 8px 0;
    font-size: 13px;
    font-weight: 500;
    color: #94a3b8;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: color .15s, border-color .15s;
}
.nexusai-tab--active {
    color: #4A7FD4;
    border-bottom-color: #4A7FD4;
}

/* ── Buscador ── */
.nexusai-search { padding: 12px; }
.nexusai-search__form {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}
.nexusai-search__input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    outline: none;
}
.nexusai-search__input:focus { border-color: #4A7FD4; }
.nexusai-search__btn {
    padding: 8px 14px;
    background: #4A7FD4;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
}
.nexusai-search__btn:disabled { opacity: .5; cursor: not-allowed; }
.nexusai-search__empty {
    font-size: 13px;
    color: #94a3b8;
    text-align: center;
    padding: 24px 0;
}
.nexusai-search__result {
    background: #f7f8fc;
    border: 1px solid #e8edf5;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 8px;
}
.nexusai-search__result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}
.nexusai-search__filename {
    font-size: 12px;
    font-weight: 600;
    color: #1E2761;
}
.nexusai-search__score {
    font-size: 11px;
    font-weight: 600;
}
.nexusai-search__content {
    font-size: 12px;
    color: #5a6a7a;
    line-height: 1.5;
    margin: 0;
}
```

#### 11. Rebuild del bundle

```bash
cd plugin/local/nexusai/react
npm install
npm run build
```

Luego copiar el bundle al contenedor Moodle:
```bash
cp -r plugin/local/nexusai/ <path-a-moodle>/local/nexusai/
```

---

## FEATURE B — Chat Multi-Curso

### Descripción

El chat actualmente busca material solo en el curso donde está el alumno. Con esta feature, si el alumno está inscripto en múltiples materias, el asistente busca en el material indexado de **todos sus cursos** y responde citando de qué materia viene cada fragmento.

**Comportamiento implícito:** el alumno no elige en qué cursos buscar — el sistema consulta automáticamente todos sus cursos con material indexado.

---

### Cambios Backend

#### 1. Modificar `services/api/app/documents/retriever.py`

**Cambio 1:** Agregar `course_id` al dataclass `RetrievedChunk`:

```python
@dataclass(frozen=True)
class RetrievedChunk:
    content: str
    document_filename: str
    chunk_index: int
    distance: float
    course_id: int = 0      # ← AGREGAR ESTE CAMPO (default 0 para compat)

    @property
    def similarity(self) -> float:
        return max(0.0, min(1.0, 1.0 - self.distance / 2.0))
```

**Cambio 2:** Cambiar la firma de `retrieve_context` para aceptar una lista de course_ids:

```python
async def retrieve_context(
    question: str,
    course_id: int,                          # ← mantener para compat
    db: AsyncSession,
    embeddings: EmbeddingProvider,
    top_k: int = 5,
    min_similarity: float = 0.3,
    course_ids: list[int] | None = None,     # ← AGREGAR: si viene, tiene prioridad
) -> List[RetrievedChunk]:
    if not question or not question.strip():
        raise ValueError("question must be non-empty")
    if top_k <= 0:
        raise ValueError("top_k must be positive")

    # Resolver qué course_ids usar
    ids_to_query = course_ids if course_ids else [course_id]
    ids_to_query = [i for i in ids_to_query if i > 0]  # filtrar ids inválidos
    if not ids_to_query:
        return []

    question_vector = await embeddings.embed(question)

    stmt = (
        select(
            Chunk.content,
            Chunk.chunk_index,
            Document.filename,
            Document.course_id,              # ← AGREGAR para saber de qué materia vino
            Chunk.embedding.cosine_distance(question_vector).label("distance"),
        )
        .join(Document, Chunk.document_id == Document.id)
        .where(Document.course_id.in_(ids_to_query))   # ← IN en lugar de ==
        .where(Document.status == "indexed")
        .where(Chunk.embedding.is_not(None))
        .order_by("distance")
        .limit(top_k)
    )

    result = await db.execute(stmt)
    rows = result.all()

    chunks = [
        RetrievedChunk(
            content=row.content,
            document_filename=row.filename,
            chunk_index=row.chunk_index,
            distance=float(row.distance),
            course_id=int(row.course_id),    # ← AGREGAR
        )
        for row in rows
    ]
    return [c for c in chunks if c.similarity >= min_similarity]
```

**Cambio 3:** Actualizar `format_context_for_prompt` para incluir la materia cuando hay multi-curso:

```python
def format_context_for_prompt(
    chunks: List[RetrievedChunk],
    course_names: dict[int, str] | None = None,  # ← AGREGAR: {course_id: nombre}
) -> str:
    if not chunks:
        return ""

    parts = []
    for i, chunk in enumerate(chunks, start=1):
        content = chunk.content.strip()
        if len(content) > 800:
            content = content[:800] + "..."

        # Incluir nombre de materia si está disponible
        course_label = ""
        if course_names and chunk.course_id in course_names:
            course_label = f", materia: {course_names[chunk.course_id]}"

        parts.append(
            f'FRAGMENTO {i} (de "{chunk.document_filename}"{course_label}, '
            f'chunk #{chunk.chunk_index}):\n{content}'
        )

    return "\n\n".join(parts)
```

#### 2. Modificar `services/api/app/chat/schemas.py`

Agregar el nuevo campo `course_ids` a `ChatRequest`:

```python
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    course_id: int = Field(gt=0)             # ← mantener para compat con clientes viejos
    user_id: int = Field(gt=0)
    session_id: Optional[UUID] = None
    course_ids: Optional[List[int]] = None   # ← AGREGAR: lista de cursos para multi-curso
    course_names: Optional[dict] = None      # ← AGREGAR: {str(course_id): nombre} para citas
```

#### 3. Modificar `services/api/app/chat/router.py`

**Cambio 1:** En la función `_get_or_create_session`, manejar `course_id=0` para sesiones multi-curso:

```python
async def _get_or_create_session(
    db: AsyncSession,
    payload: ChatRequest,
) -> ChatSession:
    if payload.session_id is not None:
        result = await db.execute(
            select(ChatSession).where(ChatSession.id == payload.session_id)
        )
        session = result.scalar_one_or_none()
        if session is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        return session

    # Si hay múltiples cursos, usar course_id=0 como sesión global
    session_course_id = 0 if (payload.course_ids and len(payload.course_ids) > 1) else payload.course_id
    session = ChatSession(user_id=payload.user_id, course_id=session_course_id)
    db.add(session)
    await db.flush()
    return session
```

**Cambio 2:** En `_build_system_prompt`, actualizar para mencionar multi-curso:

```python
def _build_system_prompt(retrieved_context: str, is_multicourse: bool = False) -> str:
    base_instructions = (
        "Sos un asistente académico de NexusAI. Respondé en el mismo idioma "
        "que el alumno (español o inglés)."
    )

    if retrieved_context:
        source_label = "de tus materias" if is_multicourse else "del curso del alumno"
        return (
            base_instructions
            + "\n\n"
            + f"Tenés acceso a fragmentos del material {source_label}. "
            "Usá esos fragmentos como tu fuente principal de información. "
            "Cuando los uses, citá explícitamente el archivo del que vienen "
            '(ej: "según apunte-derivadas.pdf..."). '
            + ("Cuando el fragmento viene de una materia específica, mencionala "
               '(ej: "en Cálculo I, según apunte.pdf..."). '
               if is_multicourse else "")
            + "Si la pregunta NO se puede responder con los fragmentos disponibles, "
            "decilo explícitamente — no inventes."
            + "\n\n--- MATERIAL DEL CURSO ---\n\n"
            + retrieved_context
            + "\n\n--- FIN DEL MATERIAL ---"
        )

    return (
        base_instructions
        + "\n\n"
        + "El curso del alumno todavía no tiene material indexado en NexusAI. "
        "Si la pregunta requiere conocimiento específico del curso (contenido de "
        "clases, apuntes, trabajos prácticos), decile al alumno que su docente "
        "todavía no subió el material y que puede contactarlo para pedírselo. "
        "Para preguntas generales (saludo, cómo usar el asistente, conceptos "
        "amplios que no dependen del material del curso), respondé normalmente."
    )
```

**Cambio 3:** En el endpoint `messages`, actualizar la llamada a `retrieve_context`:

Buscar el bloque de retrieval RAG y reemplazarlo:

```python
    # ----- Retrieval RAG (Feature B: multi-curso si viene course_ids) -----
    is_multicourse = bool(payload.course_ids and len(payload.course_ids) > 1)
    # Parsear course_names: el payload trae {str(id): nombre}
    course_names_int: dict[int, str] = {}
    if payload.course_names:
        for k, v in payload.course_names.items():
            try:
                course_names_int[int(k)] = str(v)
            except (ValueError, TypeError):
                pass

    try:
        retrieved_chunks = await retrieve_context(
            question=payload.question,
            course_id=payload.course_id,
            course_ids=payload.course_ids,    # ← NUEVO: pasa la lista si existe
            db=db,
            embeddings=embeddings,
            top_k=5,
            min_similarity=0.3,
        )
        context_text = format_context_for_prompt(
            retrieved_chunks,
            course_names=course_names_int if is_multicourse else None,  # ← NUEVO
        )
    except Exception as exc:
        # ... mismo manejo de error existente ...
```

Actualizar la llamada a `_build_system_prompt`:

```python
    llm_messages = [
        {"role": "system", "content": _build_system_prompt(context_text, is_multicourse=is_multicourse)},
    ]
```

**No hay migraciones nuevas.** El campo `course_id=0` en `chat_sessions` ya funciona con el schema existente.

---

### Cambios PHP Plugin

#### 4. Agregar método a `plugin/local/nexusai/classes/external/backend_client.php`

Agregar método `send_message_multicourse()` a la clase:

```php
/**
 * Envía un mensaje al chat con contexto de múltiples cursos.
 *
 * @param array  $courseids   Lista de IDs de cursos a consultar.
 * @param array  $coursenames Mapa {course_id => nombre}, para citas en la respuesta.
 * @param int    $userid      $USER->id del alumno.
 * @param string $question    Pregunta del alumno.
 * @param string|null $sessionid UUID de sesión existente o null.
 * @return array{session_id:string, answer:string, messages:array}
 */
public function send_message_multicourse(
    array $courseids,
    array $coursenames,
    int $userid,
    string $question,
    ?string $sessionid = null
): array {
    // course_id principal = el primero de la lista (para compat con el schema)
    $primarycourseid = !empty($courseids) ? (int)$courseids[0] : 0;

    $payload = [
        'question'     => $question,
        'course_id'    => $primarycourseid,
        'user_id'      => $userid,
        'course_ids'   => array_map('intval', $courseids),
        'course_names' => $coursenames,  // {string(id) => nombre}
    ];
    if (!empty($sessionid)) {
        $payload['session_id'] = $sessionid;
    }

    $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($body === false) {
        throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
    }
    return $this->post('/api/v1/chat/messages', $body);
}
```

#### 5. Modificar `plugin/local/nexusai/classes/external/chat_send.php`

**Cambio 1:** Agregar parámetro `multicourse` en `execute_parameters()`:

```php
'multicourse' => new \external_value(
    PARAM_BOOL,
    'Si true, busca en todos los cursos del alumno con material indexado',
    VALUE_OPTIONAL,
    false
),
```

**Cambio 2:** Actualizar `execute()` para manejar multi-curso:

```php
public static function execute(
    string $question,
    int $courseid,
    ?int $userid = 0,
    ?string $sessionid = '',
    bool $multicourse = false
): array {
    global $USER;

    $params = self::validate_parameters(self::execute_parameters(), [
        'question'    => $question,
        'courseid'    => $courseid,
        'userid'      => $userid ?? 0,
        'sessionid'   => $sessionid ?? '',
        'multicourse' => $multicourse,
    ]);

    $context = \context_course::instance($params['courseid']);
    self::validate_context($context);
    require_capability('local/nexusai:use', $context);

    $cleanquestion = trim($params['question']);
    if ($cleanquestion === '') {
        throw new \invalid_parameter_exception('Question cannot be empty');
    }
    if (mb_strlen($cleanquestion) > 2000) {
        throw new \invalid_parameter_exception('Question too long (max 2000 characters)');
    }

    $cleansessionid = trim($params['sessionid']);
    if ($cleansessionid !== '' && (strlen($cleansessionid) < 8 || strlen($cleansessionid) > 64)) {
        throw new \invalid_parameter_exception('Invalid session id format');
    }
    if ($cleansessionid === '') {
        $cleansessionid = null;
    }

    $client = new backend_client();

    if ($params['multicourse']) {
        // Obtener todos los cursos en los que está inscripto el alumno.
        // enrol_get_users_courses() es función nativa de Moodle, disponible 4.1-4.5.
        $enrolledcourses = enrol_get_users_courses($USER->id, true, ['id', 'shortname', 'fullname']);
        $courseids   = [];
        $coursenames = [];
        foreach ($enrolledcourses as $course) {
            $courseids[]                          = (int)$course->id;
            $coursenames[(string)$course->id]     = $course->fullname ?? $course->shortname ?? 'Materia';
        }
        // Si por algún motivo la lista quedó vacía, caer al curso actual.
        if (empty($courseids)) {
            $courseids   = [$params['courseid']];
            $coursenames = [(string)$params['courseid'] => 'Materia actual'];
        }

        $response = $client->send_message_multicourse(
            $courseids,
            $coursenames,
            (int)$USER->id,
            $cleanquestion,
            $cleansessionid
        );
    } else {
        // Comportamiento original: solo el curso actual
        $response = $client->send_message(
            (int)$params['courseid'],
            (int)$USER->id,
            $cleanquestion,
            $cleansessionid
        );
    }

    if (!isset($response['session_id'], $response['answer'], $response['messages'])) {
        throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'Backend response is missing required fields');
    }

    return [
        'session_id' => (string)$response['session_id'],
        'answer'     => (string)$response['answer'],
        'messages'   => array_map(
            static fn(array $m) => [
                'id'         => (string)($m['id'] ?? ''),
                'role'       => (string)($m['role'] ?? ''),
                'content'    => (string)($m['content'] ?? ''),
                'created_at' => (string)($m['created_at'] ?? ''),
            ],
            $response['messages']
        ),
    ];
}
```

---

### Cambios React

#### 6. Modificar `plugin/local/nexusai/react/src/api/chat.js`

Agregar parámetro `multiCourse` a la función `sendMessage`:

```js
/**
 * @param {Object}  params
 * @param {string}  params.question
 * @param {number}  params.courseId
 * @param {number}  params.userId
 * @param {string}  [params.sessionId]
 * @param {boolean} [params.multiCourse]  Si true, busca en todos los cursos del alumno.
 */
export async function sendMessage({ question, courseId, userId, sessionId, multiCourse = false }) {
    // ... validaciones existentes sin cambios ...

    const fetchMany = await getMoodleAjax();
    if (!fetchMany) {
        return mockSendMessage({ question, sessionId });
    }

    const args = {
        question,
        courseid:    courseId,
        userid:      userId,
        multicourse: multiCourse,   // ← NUEVO
    };
    if (sessionId) {
        args.sessionid = sessionId;
    }

    const [response] = await fetchMany([{
        methodname: "local_nexusai_chat_send",
        args,
    }]);

    return response;
}
```

#### 7. Modificar `plugin/local/nexusai/react/src/ChatApp.jsx`

**Cambio 1:** Agregar estado para modo multi-curso:

```jsx
const [multiCourse, setMultiCourse] = useState(false);
```

**Cambio 2:** Actualizar la llamada a `sendMessage` en la función `send`:

```jsx
const response = await sendMessage({
    question,
    courseId: courseid,
    userId: userid,
    sessionId,
    multiCourse,          // ← NUEVO
});
```

**Cambio 3:** Agregar toggle multi-curso en el header, al lado del botón "Nueva conversación":

```jsx
{/* Toggle multi-curso */}
<button
    type="button"
    className={`nexusai-icon-btn nexusai-multicourse-toggle ${multiCourse ? "nexusai-multicourse-toggle--active" : ""}`}
    onClick={() => {
        setMultiCourse(v => !v);
        clearChat(); // limpiar historial al cambiar modo
    }}
    title={multiCourse
        ? (lang === "es" ? "Buscando en todos tus cursos (click para solo este curso)" : "Searching all courses (click to limit to this course)")
        : (lang === "es" ? "Solo este curso (click para buscar en todos tus cursos)" : "This course only (click to search all courses)")
    }
>
    {multiCourse ? "🌐" : "📚"}
</button>
```

**Cambio 4:** Actualizar el status del header para reflejar el modo:

```jsx
<div className="nexusai-panel__status">
    <span className="nexusai-panel__status-dot" />
    {!isInsideMoodle()
        ? <span className="nexusai-badge">{t.modeMock}</span>
        : multiCourse
            ? (lang === "es" ? "Activo · todos tus cursos" : "Active · all your courses")
            : t.statusActive
    }
</div>
```

#### 8. Agregar estilos en `plugin/local/nexusai/react/src/styles.css`

```css
/* ── Toggle multi-curso ── */
.nexusai-multicourse-toggle {
    opacity: 0.5;
    transition: opacity .15s;
}
.nexusai-multicourse-toggle--active {
    opacity: 1;
    color: #4A7FD4;
}
```

#### 9. Rebuild del bundle

```bash
cd plugin/local/nexusai/react
npm run build
```

---

## Orden de implementación recomendado

1. **Feature B backend** (retriever.py + schemas.py + router.py) — 2-3 horas
2. **Feature B PHP** (backend_client.php + chat_send.php) — 2 horas
3. **Feature B React** (chat.js + ChatApp.jsx) — 1 hora
4. **Test Feature B** end-to-end local — 1 hora
5. **Feature A backend** (search/router.py + main.py) — 1 hora
6. **Feature A PHP** (backend_client.php + search_query.php + services.php) — 1.5 horas
7. **Feature A React** (search.js + SearchPanel.jsx + ChatApp.jsx + styles.css) — 2 horas
8. **Test Feature A** end-to-end local — 1 hora
9. **Push a main** → GitHub Actions despliega automáticamente a Fly.io

**Total estimado: 12-13 horas de trabajo efectivo.**

---

## Notas importantes

- **No hay migraciones nuevas** para ninguna de las dos features. Todo el cambio es en la lógica de queries y en los contratos de API.
- **Backward compat:** el `course_id` existente en `ChatRequest` se mantiene. Los clientes que no manden `course_ids` siguen funcionando exactamente igual.
- **El HMAC no cambia.** Todos los nuevos endpoints y métodos PHP usan el mismo `backend_client::post()` que ya firma correctamente.
- **Purgar caché de Moodle** después de modificar el plugin PHP: `php admin/cli/purge_caches.php` dentro del contenedor.
- **Rebuild obligatorio** después de cambiar cualquier archivo React: `npm run build` en `plugin/local/nexusai/react/`.
