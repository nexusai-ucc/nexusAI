#!/usr/bin/env bash
# Genera novedades-check2.pdf desde NOVEDADES_CHECK2.md (PRE-04, #682).
# Es el PDF que el docente sube en vivo en la demo de la pre-entrega.
# Requiere pandoc y tectonic (brew install tectonic) o xelatex.
set -euo pipefail
cd "$(dirname "$0")"

if grep -q '\[COMPLETAR' NOVEDADES_CHECK2.md && [ "${BORRADOR:-0}" != "1" ]; then
    echo "Quedan [COMPLETAR] en NOVEDADES_CHECK2.md. Para generar el borrador igual: BORRADOR=1 ./build.sh" >&2
    exit 1
fi

if command -v tectonic >/dev/null 2>&1; then
    ENGINE=tectonic
elif command -v xelatex >/dev/null 2>&1; then
    ENGINE=xelatex
else
    echo "Falta tectonic o xelatex (brew install tectonic)." >&2
    exit 1
fi

pandoc NOVEDADES_CHECK2.md \
    -o novedades-check2.pdf \
    --pdf-engine="$ENGINE" \
    -V geometry:margin=2.5cm \
    -V mainfont=texgyreheros \
    -V mainfontoptions="Extension=.otf,UprightFont=*-regular,BoldFont=*-bold,ItalicFont=*-italic,BoldItalicFont=*-bolditalic" \
    -V fontsize=11pt

echo "OK -> $(pwd)/novedades-check2.pdf"
