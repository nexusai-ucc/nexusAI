#!/usr/bin/env python3
"""Análisis por ventana de una corrida de k6 (TPC-09, #581).

El resumen de k6 da percentiles de TODA la corrida, que en un stress mezcla
los escalones tranquilos con los saturados. Esto lee la salida cruda
(`k6 run --out json=raw.json.gz`) y arma, por ventana de tiempo:
VUs, pedidos por segundo, p50/p95 del chat y tasa de error. Marca el
**punto de quiebre**: la primera ventana en que el p95 supera el SLA o los
errores pasan el 1 %.

Uso:
    python3 analyze_k6.py raw.json.gz [--window 30] [--sla-ms 8000] > analisis.md

Solo usa la biblioteca estándar.
"""

from __future__ import annotations

import argparse
import gzip
import json
import math
import re
from collections import defaultdict
from datetime import datetime


def _percentile(values: list[float], pct: float) -> float:
    ordered = sorted(values)
    k = max(0, math.ceil(pct / 100 * len(ordered)) - 1)
    return ordered[k]


def _ts(raw: str) -> float:
    # k6 escribe RFC 3339 con nanosegundos: fromisoformat acepta hasta microsegundos.
    match = re.match(r"^(.+?)(?:\.(\d+))?(Z|[+-]\d\d:\d\d)$", raw)
    if not match:
        raise ValueError(f"timestamp inesperado: {raw}")
    base, frac, zone = match.groups()
    zone = "+00:00" if zone == "Z" else zone
    return datetime.fromisoformat(f"{base}.{(frac or '0')[:6]:0<6}{zone}").timestamp()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("raw")
    parser.add_argument("--window", type=int, default=30, help="segundos por ventana")
    parser.add_argument("--sla-ms", type=float, default=8000)
    parser.add_argument("--max-error-rate", type=float, default=0.01)
    args = parser.parse_args()

    opener = gzip.open if args.raw.endswith(".gz") else open
    durations: dict[int, list[float]] = defaultdict(list)
    oks: dict[int, list[float]] = defaultdict(list)
    reqs: dict[int, int] = defaultdict(int)
    vus: dict[int, float] = defaultdict(float)
    start = None

    with opener(args.raw, "rt", encoding="utf-8") as fh:
        for line in fh:
            point = json.loads(line)
            if point.get("type") != "Point":
                continue
            data = point["data"]
            t = _ts(data["time"])
            start = t if start is None else min(start, t)
            bucket = int(t // args.window)
            metric = point["metric"]
            if metric == "chat_duration":
                durations[bucket].append(data["value"])
            elif metric == "chat_ok":
                oks[bucket].append(data["value"])
            elif metric == "http_reqs":
                reqs[bucket] += 1
            elif metric == "vus":
                vus[bucket] = max(vus[bucket], data["value"])

    buckets = sorted(set(durations) | set(vus))
    if not buckets or start is None:
        print("Sin datos en la salida de k6.")
        return 1

    first = int(start // args.window)
    rows, breaking = [], None
    for b in buckets:
        d, ok = durations.get(b, []), oks.get(b, [])
        if not d:
            continue
        p95 = _percentile(d, 95)
        error_rate = 1 - (sum(ok) / len(ok)) if ok else 0.0
        broken = p95 > args.sla_ms or error_rate > args.max_error_rate
        row = {
            "t": (b - first) * args.window,
            "vus": int(vus.get(b, 0)),
            "rps": reqs.get(b, 0) / args.window,
            "chats": len(d),
            "p50": _percentile(d, 50),
            "p95": p95,
            "err": error_rate,
            "broken": broken,
        }
        rows.append(row)
        if broken and breaking is None:
            breaking = row

    print(f"#### Análisis por ventana de {args.window} s (SLA del chat: p95 < {args.sla_ms / 1000:.0f} s)\n")
    print("| t (s) | VUs | pedidos/s | chats | p50 chat | p95 chat | errores | |")
    print("|---|---|---|---|---|---|---|---|")
    for r in rows:
        mark = "🔴" if r["broken"] else "🟢"
        print(
            f"| {r['t']} | {r['vus']} | {r['rps']:.1f} | {r['chats']} | {r['p50'] / 1000:.2f} s | "
            f"{r['p95'] / 1000:.2f} s | {r['err'] * 100:.1f} % | {mark} |"
        )
    print()
    if breaking:
        print(
            f"**Punto de quiebre:** a los {breaking['t']} s, con **{breaking['vus']} VUs** "
            f"({breaking['rps']:.1f} pedidos/s): p95 del chat {breaking['p95'] / 1000:.2f} s, "
            f"errores {breaking['err'] * 100:.1f} %."
        )
        healthy = [r for r in rows if not r["broken"] and r["t"] < breaking["t"]]
        if healthy:
            best = max(healthy, key=lambda r: r["vus"])
            print(f"\n**Último escalón sano:** {best['vus']} VUs ({best['rps']:.1f} pedidos/s, p95 {best['p95'] / 1000:.2f} s).")
    else:
        top = max(rows, key=lambda r: r["vus"])
        print(
            f"**Sin quiebre:** hasta {top['vus']} VUs ({top['rps']:.1f} pedidos/s) el p95 del chat "
            f"se mantuvo bajo el SLA y los errores bajo {args.max_error_rate * 100:.0f} %."
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
