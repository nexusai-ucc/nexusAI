"""Proveedor LLM simulado para las pruebas de carga (TPC-09, #581).

Imita la API compatible con OpenAI que usa NexusAI (`AsyncOpenAI` con
`base_url`), para medir la capacidad del backend sin gastar cuota ni medir al
proveedor:

  POST /v1/chat/completions  respuesta con latencia configurable y uso de tokens.
                             Si piden `response_format=json_object` (la
                             moderación vía LLM), devuelve {"flagged": false}.
  POST /v1/embeddings        vectores de 768 dimensiones por *feature hashing*
                             de las palabras: deterministas, y dos textos con
                             palabras en común quedan cerca (el retrieval
                             encuentra los chunks como con un modelo real).
  GET  /health

Variables de entorno:
  MOCK_LLM_LATENCY_MS         latencia media del chat (default 1500, como un
                              modelo flash con la respuesta corta)
  MOCK_LLM_JITTER_MS          variación uniforme ± (default 500)
  MOCK_LLM_JSON_LATENCY_MS    latencia de la moderación (default 300)
  MOCK_EMBEDDING_LATENCY_MS   latencia de los embeddings (default 150)

Uso: uvicorn mock_llm:app --host 0.0.0.0 --port 9000
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import math
import os
import random
import re
import time

from fastapi import FastAPI, Request

LATENCY_MS = int(os.getenv("MOCK_LLM_LATENCY_MS", "1500"))
JITTER_MS = int(os.getenv("MOCK_LLM_JITTER_MS", "500"))
JSON_LATENCY_MS = int(os.getenv("MOCK_LLM_JSON_LATENCY_MS", "300"))
EMBEDDING_LATENCY_MS = int(os.getenv("MOCK_EMBEDDING_LATENCY_MS", "150"))
DIMENSIONS = 768

ANSWER = (
    "Una pila es una estructura de datos LIFO: el último elemento que entra es "
    "el primero que sale. Sus operaciones básicas son push y pop [1]."
)

app = FastAPI(title="mock-llm")


async def _sleep(mean_ms: int, jitter_ms: int = 0) -> None:
    await asyncio.sleep(max(0, mean_ms + random.randint(-jitter_ms, jitter_ms)) / 1000)


def _tokens(text: str) -> int:
    return max(1, len(text) // 4)


def _embed(text: str) -> list[float]:
    vector = [0.0] * DIMENSIONS
    for word in re.findall(r"\w+", text.lower()):
        digest = hashlib.sha256(word.encode()).digest()
        index = int.from_bytes(digest[:4], "big") % DIMENSIONS
        vector[index] += 1.0 if digest[4] % 2 else -1.0
    norm = math.sqrt(sum(v * v for v in vector)) or 1.0
    return [v / norm for v in vector]


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/v1/chat/completions")
async def chat_completions(request: Request) -> dict:
    body = await request.json()
    prompt = " ".join(str(m.get("content", "")) for m in body.get("messages", []))
    wants_json = (body.get("response_format") or {}).get("type") == "json_object"

    if wants_json:
        await _sleep(JSON_LATENCY_MS, JSON_LATENCY_MS // 3)
        content = json.dumps({"flagged": False, "categories": []})
    else:
        await _sleep(LATENCY_MS, JITTER_MS)
        content = ANSWER

    prompt_tokens, completion_tokens = _tokens(prompt), _tokens(content)
    return {
        "id": f"chatcmpl-mock-{time.time_ns()}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": body.get("model", "mock-llm"),
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
        },
    }


@app.post("/v1/embeddings")
async def embeddings(request: Request) -> dict:
    body = await request.json()
    inputs = body.get("input", [])
    if isinstance(inputs, str):
        inputs = [inputs]
    await _sleep(EMBEDDING_LATENCY_MS, EMBEDDING_LATENCY_MS // 3)
    tokens = sum(_tokens(t) for t in inputs)
    return {
        "object": "list",
        "model": body.get("model", "mock-embedding"),
        "data": [
            {"object": "embedding", "index": i, "embedding": _embed(text)}
            for i, text in enumerate(inputs)
        ],
        "usage": {"prompt_tokens": tokens, "total_tokens": tokens},
    }
