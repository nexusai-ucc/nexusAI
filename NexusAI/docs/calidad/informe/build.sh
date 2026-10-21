#!/usr/bin/env bash
# Genera informe-tp-calidad.pdf desde INFORME_TP_CALIDAD.md (TPC-11, #583).
# Requiere pandoc y un motor LaTeX: tectonic (recomendado, `brew install
# tectonic`) o xelatex.
set -euo pipefail
cd "$(dirname "$0")"

if command -v tectonic >/dev/null 2>&1; then
    ENGINE=tectonic
elif command -v xelatex >/dev/null 2>&1; then
    ENGINE=xelatex
else
    echo "Falta tectonic o xelatex (brew install tectonic)." >&2
    exit 1
fi

pandoc INFORME_TP_CALIDAD.md \
    -o informe-tp-calidad.pdf \
    --pdf-engine="$ENGINE" \
    --number-sections \
    -V geometry:margin=2.2cm \
    -V mainfont=texgyreheros \
    -V mainfontoptions="Extension=.otf,UprightFont=*-regular,BoldFont=*-bold,ItalicFont=*-italic,BoldItalicFont=*-bolditalic" \
    -V fontsize=10pt \
    -V colorlinks=true \
    -V linkcolor=blue \
    -V urlcolor=blue \
    -V toccolor=black

echo "OK -> $(pwd)/informe-tp-calidad.pdf"
