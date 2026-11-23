#!/usr/bin/env python3
"""Genera las cuentas del público de la demo y las tarjetas para imprimir.

Salidas (en outputs/, que no se commitea):
  cuentas.csv   username,password,role,firstname,lastname  → lo lee cli/setup_demo.php
  tarjetas.pdf  una tarjeta por persona: QR a la URL del Moodle, usuario y contraseña

Uso:
  python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
  .venv/bin/python generar_cuentas.py --url https://demo.ejemplo.com --cantidad 70

Si cuentas.csv ya existe, reutiliza las contraseñas (para reimprimir sin
invalidar las tarjetas ya repartidas); --nuevas las regenera.
"""

from __future__ import annotations

import argparse
import csv
import secrets
from pathlib import Path

OUTPUTS = Path(__file__).resolve().parent / "outputs"

# Palabras cortas y fáciles de tipear en el celular: sin tildes, sin ñ y sin
# letras que se confunden (l/1, o/0).
WORDS = [
    "vector", "chunk", "moodle", "nexus", "citas", "fuente", "tesis", "curso",
    "indice", "modelo", "prompt", "token", "nube", "docente", "alumno", "examen",
    "quiz", "plan", "foro", "datos", "busca", "mapa", "red", "clave",
]


def password() -> str:
    return f"{secrets.choice(WORDS)}-{secrets.randbelow(900) + 100}"


def build_accounts(cantidad: int, previas: dict[str, dict]) -> list[dict]:
    rows = [{
        "username": "docente",
        "password": previas.get("docente", {}).get("password") or password() + "-" + password(),
        "role": "docente",
        "firstname": "Docente",
        "lastname": "Demo",
    }]
    for i in range(1, cantidad + 1):
        username = f"invitado{i:02d}"
        rows.append({
            "username": username,
            "password": previas.get(username, {}).get("password") or password(),
            "role": "alumno",
            "firstname": "Invitado",
            "lastname": f"{i:02d}",
        })
    return rows


def read_previous(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    with path.open(newline="", encoding="utf-8") as fh:
        return {r["username"]: r for r in csv.DictReader(fh)}


def write_csv(path: Path, rows: list[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=["username", "password", "role", "firstname", "lastname"])
        writer.writeheader()
        writer.writerows(rows)
    path.chmod(0o600)


def write_cards(path: Path, rows: list[dict], url: str) -> None:
    # Imports acá: el CSV se puede generar sin las dependencias del PDF.
    import qrcode
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas

    qr_img = qrcode.make(url, box_size=8, border=1).get_image()
    qr = ImageReader(qr_img)

    page_w, page_h = A4
    cols, rws = 2, 5
    card_w, card_h = 90 * mm, 52 * mm
    margin_x = (page_w - cols * card_w) / 2
    margin_y = (page_h - rws * card_h) / 2

    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle("NexusAI — tarjetas de la demo")
    alumnos = [r for r in rows if r["role"] == "alumno"]
    for idx, row in enumerate(alumnos):
        pos = idx % (cols * rws)
        if idx and pos == 0:
            c.showPage()
        col, line = pos % cols, pos // cols
        x = margin_x + col * card_w
        y = page_h - margin_y - (line + 1) * card_h

        c.setDash(2, 3)
        c.setStrokeGray(0.6)
        c.rect(x, y, card_w, card_h)  # línea de corte
        c.setDash()

        qr_size = 38 * mm
        c.drawImage(qr, x + 5 * mm, y + (card_h - qr_size) / 2, qr_size, qr_size)

        tx = x + 48 * mm
        c.setFillGray(0)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(tx, y + card_h - 12 * mm, "Probá NexusAI")
        c.setFont("Helvetica", 8)
        c.drawString(tx, y + card_h - 17 * mm, "Escaneá el QR y entrá con:")
        c.setFont("Helvetica", 9)
        c.drawString(tx, y + card_h - 25 * mm, "Usuario")
        c.setFont("Courier-Bold", 12)
        c.drawString(tx, y + card_h - 30 * mm, row["username"])
        c.setFont("Helvetica", 9)
        c.drawString(tx, y + card_h - 37 * mm, "Contraseña")
        c.setFont("Courier-Bold", 12)
        c.drawString(tx, y + card_h - 42 * mm, row["password"])
        c.setFont("Helvetica", 6.5)
        c.setFillGray(0.35)
        c.drawString(tx, y + 4 * mm, "No escribas datos personales.")
    c.save()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--url", required=True, help="URL pública del Moodle de la demo (la del QR)")
    parser.add_argument("--cantidad", type=int, default=70, help="cantidad de cuentas del público (default 70)")
    parser.add_argument("--nuevas", action="store_true", help="regenerar todas las contraseñas")
    parser.add_argument("--sin-pdf", action="store_true", help="solo el CSV")
    args = parser.parse_args()

    OUTPUTS.mkdir(exist_ok=True)
    csv_path = OUTPUTS / "cuentas.csv"
    previas = {} if args.nuevas else read_previous(csv_path)
    rows = build_accounts(args.cantidad, previas)
    write_csv(csv_path, rows)
    print(f"{csv_path} — {len(rows)} cuentas (1 docente + {args.cantidad} del público)")

    if not args.sin_pdf:
        pdf_path = OUTPUTS / "tarjetas.pdf"
        write_cards(pdf_path, rows, args.url)
        print(f"{pdf_path} — {args.cantidad} tarjetas, 10 por hoja A4")


if __name__ == "__main__":
    main()
