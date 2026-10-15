# Pruebas unitarias AAA y los 7 principios del testing (TPC-05)

> Issue [#577](https://github.com/nexusai-ucc/nexusAI/issues/577) · Épica [#584](https://github.com/nexusai-ucc/nexusAI/issues/584)
> PRs de tests: [#603](https://github.com/nexusai-ucc/nexusAI/pull/603) (plugin) y [#604](https://github.com/nexusai-ucc/nexusAI/pull/604) (frontend)

NexusAI está en el **nivel 3**, que exige **80 % de cobertura sobre el código existente** ([LINEA_BASE.md](LINEA_BASE.md)). La línea base era **56,6 %**. Este documento cubre tres cosas:
- cómo se escribieron las pruebas nuevas: formato AAA y criterio de aceptación fijado antes de ejecutar;
- cuánto subió la cobertura;
- cómo se aplicaron los 7 principios del testing al proyecto, con ejemplos concretos.

## 1. Convención: Arrange–Act–Assert y criterio previo

Cada test nuevo cumple tres reglas:

1. **Criterio de aceptación escrito antes de ejecutar.** Va en el docblock (PHP) o en el nombre del test (JS) y dice qué resultado se espera, no qué hace el código.
2. **Las tres fases separadas y marcadas** con `// Arrange.`, `// Act.` y `// Assert.`. Cuando la acción y la verificación son inseparables, por ejemplo al esperar una excepción, se marca `// Act and assert.`.
3. **Un comportamiento por test.** Cuando se prueban varias clases de equivalencia de una misma entrada, van juntas en un test con nombre explícito, o en una tabla (`it.each`).

Ejemplo del plugin, en `tests/external/search_query_test.php`:

```php
/**
 * Criterion (equivalence classes of the query): blank and longer than 500
 * characters are rejected before reaching the backend.
 */
public function test_rejects_a_blank_or_too_long_query(): void {
    // Arrange.
    $data = $this->setup_course();
    $courseid = (int) $data->course->id;

    // Act and assert.
    $this->assert_call_fails('errorqueryempty', search_query::class, ['   ', $courseid]);
    $this->assert_call_fails('errorquerytoolong', search_query::class, [str_repeat('a', 501), $courseid]);
}
```

Ejemplo del frontend, en `react/src/documents/TeacherInsights.test.jsx`:

```js
it("archivar saca la pregunta de la lista y descuenta el total", async () => {
    // Arrange.
    listGaps.mockResolvedValue({ total: 2, items: [gap("A"), gap("B")] });
    archiveGap.mockResolvedValue({ affected: 1 });
    render(<GapsPanel courseId={4} />);
    await screen.findByText("Preguntas sin respuesta (2)");

    // Act.
    await user.click(screen.getByRole("button", { name: "Archivar la pregunta: A" }));

    // Assert.
    expect(archiveGap).toHaveBeenCalledWith(4, ["id-A"], true);
    expect(await screen.findByText("Preguntas sin respuesta (1)")).toBeInTheDocument();
});
```

### Dobles de prueba usados

| Doble | Dónde | Qué reemplaza | Por qué |
|---|---|---|---|
| `\curl::mock_response()` (de Moodle) | `tests/external/external_testcase.php` | la respuesta HTTP del backend | `backend_client` corre de verdad (firma HMAC, headers, JSON) sin red. Así se pudieron testear los 56 web services del plugin, que antes estaban en 0–25 % |
| `core/ajax` falso | `react/src/test-utils/moodleAjax.js` | el AJAX de Moodle en el navegador | los clientes `api/*.js` corren su camino real (el de dentro de Moodle) y se verifica qué web service llaman y con qué argumentos |
| `vi.mock` de los módulos de API | tests de componentes React | la capa de red completa | un componente se prueba por su comportamiento en pantalla, no por el transporte |
| Postgres + Redis reales | `services/api/tests` | — | el backend ya se probaba contra servicios reales en CI (sin cambios en TPC-05) |

## 2. Cobertura: antes y después

| Componente | Antes (LINEA_BASE, 14/10) | Después (TPC-05) | Fuente del "después" |
|---|---|---|---|
| Backend: líneas / decisiones | 84,1 % / 72,8 % | 84,2 % / 72,8 % (sin cambios) | Quality Gate de `development` |
| Frontend: líneas / sentencias / decisiones | 41,9 % / 40,0 % / 34,9 % | **78,9 % / 77,0 % / 67,4 %** | `npm run test:coverage` sobre el PR #604 (257 tests) |
| Plugin: sentencias | 41,8 % | **85,5 %** | artifact `qg-plugin-coverage` del PR #603 ([run 38796605471](https://github.com/nexusai-ucc/nexusAI/actions/runs/38796605471)) |
| **Total ponderado por líneas** | **56,6 %** | **≈ 83,6 %** (estimado) | backend 3804 + frontend ≈2155 + plugin 4854 sobre 12.931 |

**El número que vale es el del pipeline.** El total final se mide con el Quality Gate de `development` después de mergear #603 y #604, con el mismo método que la línea base, y se completa en la versión 1.1 de este documento. La estimación ya supera el **80 % del nivel 3**.

## 3. Los 7 principios aplicados a NexusAI

### 1. El testing muestra la presencia de defectos, no su ausencia

El backend tenía 84 % de cobertura y todo el CI en verde. Aun así, al escribir los tests del frontend con un `core/ajax` falso **apareció un defecto real** que ningún test veía:
- `suggestDifficulty`, `getFlashcardsSummary` y `getStudyStreak` (`api/quiz.js`), y `getForumWebhook`/`saveForumWebhook` (`api/forumDigest.js`), hacen `const [response] = await ajax.call(...)`;
- `ajax.call()` devuelve un **array de promesas**, así que `response` queda como promesa sin resolver;
- en consecuencia, dentro de Moodle esas funciones devuelven siempre los valores por defecto: racha 0, flashcards 0/0, webhook `null`.

Que la suite pase no prueba que no haya defectos: solo prueba que los casos escritos no los encontraron. El defecto se registra y se corrige en TPC-06, con el ciclo rojo/verde.

### 2. El testing exhaustivo es imposible

En lugar de probar todos los valores, se eligieron **clases de equivalencia y valores límite**:

| Entrada | Clases y límites probados | Test |
|---|---|---|
| Consulta de búsqueda | vacía · válida · > 500 caracteres | `search_query_test` |
| `days` de gaps, analíticas y FAQ | 0 → se ajusta a 1 · 9999 → 365 | `chat_history_functions_test`, `study_functions_test` |
| Archivo subido | tipo no admitido · contenido que no coincide con el tipo · vacío · > 20 MB (límite) | `document_functions_test`, `documents/api.test.js` |
| Tamaño en `formatBytes` | 1023 B · 1024 B (límite) · 1 MB | `documents/api.test.js` |
| Historial de chat | 20 conversaciones (límite inicial) → ofrece "Cargar más" | `StudentHistory.test.jsx` |
| Intento de quiz | `correctcount` mayor que `totalquestions` → se ajusta | `quiz_functions_test` |

### 3. Probar temprano ahorra tiempo y dinero

- El **quality gate** (TPC-02) corre en cada PR y bloquea el merge si el código nuevo baja del 80 % de cobertura. El costo de testear se paga cuando el cambio es chico, no al final.
- Los tests de TPC-05 se escribieron en PRs separados y cada tanda pasó por el CI antes de seguir. Una tanda rompió un test que ya existía (ver principio 5), y se detectó y corrigió en minutos, no después del merge.

### 4. Los defectos se agrupan

- **El código sin probar estaba concentrado:** casi todo lo que faltaba del plugin eran los web services de `classes/external/` (unos 25 en 0–25 %), y en el frontend, los clientes `api/*.js` y 6 paneles.
- **El defecto encontrado también se agrupa:** es el mismo patrón repetido en 5 funciones de 2 archivos. `api/calendar.js` tiene un comentario que explica exactamente esta trampa, y ahí sí está bien resuelto. Cuando aparece un defecto, conviene buscar el mismo patrón en el resto del código.

### 5. Los tests se desgastan (paradoja del pesticida)

- **Behat sigue con 0 escenarios.** La suite de aceptación del plugin existe en el CI pero no prueba nada, así que repetirla no encuentra defectos nuevos.
- **`document_list_test.php` solo verificaba la estructura de la respuesta**, no el web service ejecutándose. Los tests nuevos ejercitan `execute()` de punta a punta.
- **Los tests también pueden fallar por el entorno.** Las respuestas encoladas con `\curl::mock_response()` son estáticas: si un test dejaba una sin usar, contestaba el primer request de un test posterior y rompía `sync_forum_post_test`, que esperaba un fallo de red. Ahora `external_testcase::tearDown()` vacía la cola en cada test. Los tests sumados también hay que mantenerlos.

### 6. El testing depende del contexto

Cada componente se prueba con lo que corresponde a su entorno:

| Componente | Contexto | Cómo se prueba |
|---|---|---|
| Backend FastAPI | servicio con Postgres/pgvector y Redis | pytest contra servicios reales; el LLM se mockea porque no es determinista y cuesta dinero |
| Plugin Moodle | código dentro de Moodle, con BD, capacidades y matrícula | PHPUnit con el generador de datos de Moodle y BD real, en 7 combinaciones de Moodle/PHP/BD |
| Widget React | navegador, dentro y fuera de Moodle | Vitest + jsdom + Testing Library; se prueba lo que ve y hace el usuario |

### 7. La ausencia de errores es una falacia

- **Una suite al 84 % no garantiza que NexusAI sea útil.** Que el chat responda sin errores no dice si la respuesta es correcta o si cita el material indicado. Eso se evalúa aparte: `services/api/scripts/eval_rag.py` y el flujo E2E contra el entorno real (TPC-07).
- **El defecto del principio 1 lo muestra.** Los paneles de racha y de flashcards nunca fallaban: mostraban un 0 válido. Faltaba el valor correcto, no aparecía ningún error.

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 15/10/2026 | Convención AAA, dobles de prueba, cobertura antes/después (estimada), 7 principios |
