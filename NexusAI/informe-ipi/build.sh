#!/usr/bin/env bash
# Compila informe-ipi.md a PDF con pandoc.
# Motor LaTeX: usa tectonic si está disponible (no requiere instalar TeX completo),
# si no, cae a xelatex.
# mermaid-filter (opcional, para renderizar diagramas Mermaid como imagen):
#   npm install -g mermaid-filter
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

MERMAID_FILTER=""
if command -v mermaid-filter >/dev/null 2>&1; then
  MERMAID_FILTER="--filter=mermaid-filter"
  echo "✓ mermaid-filter detectado, los diagramas Mermaid se renderizarán."
else
  echo "⚠  mermaid-filter no instalado — diagramas Mermaid quedarán como bloques de código."
  echo "  Para habilitar: npm install -g mermaid-filter"
fi

echo "Compilando con pandoc + $ENGINE ..."
pandoc informe-ipi.md \
  -o informe-ipi.pdf \
  --pdf-engine="$ENGINE" \
  $MERMAID_FILTER \
  --number-sections \
  -V geometry:margin=2.5cm \
  -V lang=es \
  -V colorlinks=true

echo "OK -> informe-ipi.pdf"
