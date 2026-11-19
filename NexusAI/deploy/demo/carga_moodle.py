#!/usr/bin/env python3
"""Prueba de carga de la demo pasando por Moodle, como el público desde el celular.

La prueba de k6 (scripts/load/) le pega directo al backend con la firma HMAC.
Esta entra a Moodle con las cuentas de las tarjetas y pregunta por
local/nexusai/chat_stream.php, el mismo camino que el widget: así mide también
a Apache/PHP, que retienen un proceso por cada respuesta en streaming.

Cada usuario virtual: entra con su tarjeta, saca el sesskey del curso y hace
sus preguntas una tras otra. Todos arrancan juntos (el momento de "pregunten").

Uso (desde NexusAI/deploy/demo/):
  .venv/bin/python carga_moodle.py --url http://localhost:8088 --usuarios 10 30 60
  .venv/bin/python carga_moodle.py --url https://TU-DOMINIO --usuarios 60 --preguntas 3

Las cuentas salen de outputs/cuentas.csv (las de invitadoNN). Ojo: con el
modelo real cada pregunta gasta tokens de verdad (~4 k cada una).
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import json
import re
import statistics
import time
from dataclasses import dataclass, field
from pathlib import Path

import httpx

PREGUNTAS = [
    "¿Qué base de datos usa NexusAI y por qué?",
    "¿Cómo evita NexusAI inventar respuestas?",
    "¿Qué es RAG y cómo lo usa el sistema?",
    "¿Cómo se comunica el plugin con el backend?",
    "¿Cuánto cuesta NexusAI por alumno?",
]


@dataclass
class Resultado:
    ok: bool
    ttft: float | None = None  # hasta el primer token
    total: float | None = None  # hasta el evento done
    error: str = ""


@dataclass
class Escalon:
    usuarios: int
    listos: int = 0
    login_fallidos: int = 0
    resultados: list[Resultado] = field(default_factory=list)


async def entrar(client: httpx.AsyncClient, url: str, usuario: str, clave: str, curso: int) -> str:
    """Login como en el navegador; devuelve el sesskey de la página del curso."""
    r = await client.get(f"{url}/login/index.php")
    token = re.search(r'name="logintoken" value="([^"]+)"', r.text)
    data = {"username": usuario, "password": clave}
    if token:
        data["logintoken"] = token.group(1)
    await client.post(f"{url}/login/index.php", data=data)
    r = await client.get(f"{url}/course/view.php", params={"id": curso})
    sesskey = re.search(r'"sesskey":"([^"]+)"', r.text)
    if not sesskey or "login/index.php" in str(r.url):
        raise RuntimeError(f"login fallido para {usuario}")
    return sesskey.group(1)


async def preguntar(client: httpx.AsyncClient, url: str, sesskey: str, curso: int,
                    pregunta: str, sesion: str | None) -> tuple[Resultado, str | None]:
    data = {"sesskey": sesskey, "question": pregunta, "courseid": str(curso)}
    if sesion:
        data["sessionid"] = sesion
    inicio = time.perf_counter()
    ttft = None
    try:
        async with client.stream(
            "POST", f"{url}/local/nexusai/chat_stream.php", data=data,
            headers={"Accept": "text/event-stream"},
        ) as r:
            if r.status_code != 200:
                cuerpo = (await r.aread()).decode(errors="replace")[:120]
                return Resultado(False, error=f"HTTP {r.status_code}: {cuerpo}"), sesion
            async for linea in r.aiter_lines():
                if not linea.startswith("data: "):
                    continue
                try:
                    evento = json.loads(linea[6:])
                except json.JSONDecodeError:
                    continue
                tipo = evento.get("type")
                if tipo == "meta" and evento.get("session_id"):
                    sesion = evento["session_id"]
                elif tipo == "token" and ttft is None:
                    ttft = time.perf_counter() - inicio
                elif tipo == "done":
                    return Resultado(True, ttft, time.perf_counter() - inicio), sesion
                elif tipo == "error":
                    return Resultado(False, error=str(evento.get("detail") or evento)[:120]), sesion
        return Resultado(False, error="el stream terminó sin done"), sesion
    except httpx.HTTPError as exc:
        return Resultado(False, error=f"{type(exc).__name__}: {exc}"[:120]), sesion


async def usuario_virtual(url: str, usuario: str, clave: str, curso: int, preguntas: int,
                          arranque: asyncio.Event, escalon: Escalon, timeout: float) -> None:
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        try:
            sesskey = await entrar(client, url, usuario, clave, curso)
        except Exception:  # noqa: BLE001 - cualquier falla de login cuenta igual
            escalon.login_fallidos += 1
            return
        escalon.listos += 1
        await arranque.wait()
        sesion = None
        for i in range(preguntas):
            res, sesion = await preguntar(client, url, sesskey, curso, PREGUNTAS[i % len(PREGUNTAS)], sesion)
            escalon.resultados.append(res)


def p95(valores: list[float]) -> float:
    if len(valores) < 2:
        return valores[0] if valores else float("nan")
    return statistics.quantiles(valores, n=20)[18]


async def correr_escalon(url: str, cuentas: list[tuple[str, str]], n: int, curso: int,
                         preguntas: int, timeout: float) -> Escalon:
    escalon = Escalon(n)
    arranque = asyncio.Event()
    tareas = [
        asyncio.create_task(usuario_virtual(url, u, c, curso, preguntas, arranque, escalon, timeout))
        for u, c in cuentas[:n]
    ]
    # Todos preguntan a la vez recién cuando terminaron (o fallaron) los logins.
    while escalon.listos + escalon.login_fallidos < n:
        await asyncio.sleep(0.2)
    arranque.set()
    await asyncio.gather(*tareas)
    return escalon


def resumen(e: Escalon) -> str:
    ok = [r for r in e.resultados if r.ok]
    total = len(e.resultados)
    pct = 100 * len(ok) / total if total else 0
    ttfts = [r.ttft for r in ok if r.ttft is not None]
    totales = [r.total for r in ok if r.total is not None]
    errores: dict[str, int] = {}
    for r in e.resultados:
        if not r.ok:
            errores[r.error] = errores.get(r.error, 0) + 1
    linea = (
        f"| {e.usuarios} | {total} | {pct:.1f} % | "
        f"{p95(ttfts):.2f} s | {p95(totales):.2f} s | {max(totales, default=float('nan')):.2f} s | "
        f"{e.login_fallidos} |"
    )
    if errores:
        linea += "\n    errores: " + "; ".join(f"{k} (×{v})" for k, v in errores.items())
    return linea


async def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--url", required=True, help="URL de Moodle, sin / al final")
    ap.add_argument("--usuarios", type=int, nargs="+", default=[10, 30, 60], help="escalones")
    ap.add_argument("--preguntas", type=int, default=2, help="preguntas por usuario en cada escalón")
    ap.add_argument("--curso", type=int, default=2, help="id del curso de la demo")
    ap.add_argument("--cuentas", default="outputs/cuentas.csv")
    ap.add_argument("--timeout", type=float, default=90.0, help="segundos por pedido")
    args = ap.parse_args()

    with Path(args.cuentas).open(newline="", encoding="utf-8") as fh:
        cuentas = [(row["username"], row["password"]) for row in csv.DictReader(fh)
                   if row["username"].startswith("invitado")]
    if max(args.usuarios) > len(cuentas):
        raise SystemExit(f"Hay {len(cuentas)} cuentas de invitado y se pidieron {max(args.usuarios)}")

    print(f"Moodle: {args.url} · {args.preguntas} preguntas por usuario\n")
    print("| Usuarios | Preguntas | OK | p95 primer token | p95 total | Máx. total | Logins fallidos |")
    print("|---|---|---|---|---|---|---|")
    for n in args.usuarios:
        escalon = await correr_escalon(args.url, cuentas, n, args.curso, args.preguntas, args.timeout)
        print(resumen(escalon), flush=True)
        await asyncio.sleep(3)


if __name__ == "__main__":
    asyncio.run(main())
