#!/usr/bin/env bash
# Compila informe-ipi.md a PDF con pandoc.
# Motor LaTeX: usa tectonic si está disponible (no requiere instalar TeX completo),
# si no, cae a xelatex.
set -euo pipefail
cd "$(dirname "$0")"

if command -v tectonic >/dev/null 2>&1; then
  ENGINE=tectonic
elif command -v xelatex >/dev/null 2>&1; then
  ENGINE=xelatex
else
  echo "ERROR: no se encontró tectonic ni xelatex. Instalá uno:"
  echo "  brew install tectonic     # recomendado (liviano)"
  echo "  brew install --cask mactex # o una distro TeX completa"
  exit 1
fi

echo "Compilando con pandoc + $ENGINE ..."
pandoc informe-ipi.md \
  -o informe-ipi.pdf \
  --pdf-engine="$ENGINE" \
  --number-sections \
  -V geometry:margin=2.5cm \
  -V lang=es \
  -V colorlinks=true

echo "OK -> informe-ipi.pdf"
