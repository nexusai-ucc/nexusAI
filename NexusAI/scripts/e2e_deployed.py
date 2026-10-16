#!/usr/bin/env python3
"""E2E contra un backend de NexusAI desplegado (TPC-07 #579, lo usa TPC-08).

Recorre la integración completa desde afuera, como lo hace el plugin:

  1. GET /health                          → el servicio está arriba.
  2. POST /api/v1/chat/messages firmado   → HMAC + Postgres/pgvector + LLM real
                                             devuelven una respuesta no vacía.
  3. El mismo request otra vez             → el anti-replay (nonce en Redis)
                                             lo rechaza con 401.

Solo usa la biblioteca estándar (corre en cualquier runner o VM).

USO
    # Solo health (no gasta tokens ni toca datos): sirve contra producción.
    python3 scripts/e2e_deployed.py --base-url https://api.159.112.139.166.nip.io --health-only

    # Flujo completo (staging): las credenciales salen de variables de entorno,
    # nunca de argumentos (quedarían en el historial del shell o en los logs).
    NEXUSAI_E2E_API_KEY=... NEXUSAI_E2E_SHARED_SECRET=... \\
        python3 scripts/e2e_deployed.py --base-url https://api.146.181.62.67.nip.io --course-id 2

Sale con 0 si todo pasa, 1 si algo falla. Imprime el tiempo de cada paso.
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import secrets
import ssl
import sys
import time
import urllib.error
import urllib.request

TIMEOUT_S = 60

try:  # Algunos Python (p. ej. el instalador de python.org en macOS) no traen las CA del sistema.
    import certifi

    _SSL = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    _SSL = ssl.create_default_context()


def _request(method: str, url: str, body: bytes | None = None, headers: dict | None = None) -> tuple[int, dict]:
    req = urllib.request.Request(url, data=body, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S, context=_SSL) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as err:
        raw = err.read()
        try:
            return err.code, json.loads(raw)
        except ValueError:
            return err.code, {"raw": raw.decode("utf-8", "replace")[:300]}


def signed_headers(api_key: str, secret: str, body: bytes, nonce: str | None = None) -> dict:
    """Headers de autenticación iguales a los de backend_client.php."""
    timestamp = str(int(time.time()))
    nonce = nonce or secrets.token_hex(16)
    signature = hmac.new(secret.encode(), (timestamp + nonce).encode() + body, hashlib.sha256).hexdigest()
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "X-Timestamp": timestamp,
        "X-Nonce": nonce,
        "X-Signature": signature,
        "X-NexusAI-Role": "system",
    }


class Run:
    def __init__(self) -> None:
        self.failed = False

    def step(self, name: str, ok: bool, detail: str, elapsed: float) -> None:
        mark = "OK  " if ok else "FAIL"
        print(f"[{mark}] {name} ({elapsed:.2f} s) {detail}")
        self.failed |= not ok


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--health-only", action="store_true")
    parser.add_argument("--course-id", type=int, default=2)
    parser.add_argument("--question", default="¿De qué trata el material de este curso? Respondé en una oración.")
    args = parser.parse_args()
    base = args.base_url.rstrip("/")
    run = Run()

    # 1. Health.
    start = time.perf_counter()
    try:
        status, data = _request("GET", f"{base}/health")
        ok = status == 200 and data.get("status") == "ok"
        detail = f"HTTP {status} env={data.get('env')} model={data.get('llm_model')}"
    except (urllib.error.URLError, TimeoutError, OSError) as err:
        ok, detail = False, f"sin respuesta: {err}"
    run.step("health", ok, detail, time.perf_counter() - start)
    if args.health_only or run.failed:
        return 1 if run.failed else 0

    api_key = os.environ.get("NEXUSAI_E2E_API_KEY", "")
    secret = os.environ.get("NEXUSAI_E2E_SHARED_SECRET", "")
    if not api_key or not secret:
        print("[FAIL] faltan NEXUSAI_E2E_API_KEY / NEXUSAI_E2E_SHARED_SECRET para el flujo completo")
        return 1

    # 2. Chat firmado (el mismo camino que local\chat_turn del plugin).
    body = json.dumps(
        {"course_id": args.course_id, "user_id": 1, "question": args.question, "history": []},
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    headers = signed_headers(api_key, secret, body)
    start = time.perf_counter()
    status, data = _request("POST", f"{base}/api/v1/chat/messages", body, headers)
    answer = (data.get("answer") or "").strip() if isinstance(data, dict) else ""
    metrics = data.get("metrics") or {} if isinstance(data, dict) else {}
    run.step(
        "chat firmado",
        status == 200 and bool(answer),
        f"HTTP {status} model={metrics.get('model')} fallback={metrics.get('fallback')} chunks={metrics.get('chunks_retrieved')}",
        time.perf_counter() - start,
    )

    # 3. Replay: mismos headers (mismo nonce) → 401.
    start = time.perf_counter()
    status, data = _request("POST", f"{base}/api/v1/chat/messages", body, headers)
    run.step("anti-replay", status == 401, f"HTTP {status} {data.get('detail', '')}", time.perf_counter() - start)

    return 1 if run.failed else 0


if __name__ == "__main__":
    sys.exit(main())
