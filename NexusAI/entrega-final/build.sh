#!/usr/bin/env bash
# ----------------------------------------------------------------------------
# Compila todos los .md de entrega-final/ a un único PDF usando Pandoc.
#
# Output: entrega-final-NexusAI.pdf en la raíz de entrega-final/.
#
# Requisitos:
#   - pandoc 3.x
#   - LaTeX (xelatex). En macOS: brew install --cask basictex
#   - mermaid-filter (opcional, para renderizar diagramas Mermaid en PDF):
#       npm install -g mermaid-filter
#
# Uso:
#   ./build.sh         # genera PDF
#   ./build.sh check   # solo cuenta páginas estimadas + valida sin compilar
# ----------------------------------------------------------------------------

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

OUTPUT="entrega-final-NexusAI.pdf"

# Orden de los archivos — IMPORTANTE: respetar para que el PDF salga ordenado.
FILES=(
    "00_caratula.md"
    "01_resumen_ejecutivo.md"
    "02_introduccion.md"
    "03_alcance.md"
    "04_requerimientos.md"
    "05_historias_usuario.md"
    "06_wbs.md"
    "07_cronograma.md"
    "08_estimaciones.md"
    "09_costos.md"
    "10_riesgos.md"
    "11_metricas.md"
    "12_sprints/sprint_0_setup.md"
    "12_sprints/sprint_1.md"
    "12_sprints/sprint_2.md"
    "12_sprints/sprint_3.md"
    "12_sprints/sprint_4_mvp.md"
    "13_arquitectura.md"
    "14_stack_tecnologico.md"
    "15_modelo_datos.md"
    "16_api_endpoints.md"
    "17_mockups_ui.md"
    "18_manual_instalacion.md"
    "19_manual_usuario.md"
    "20_adrs.md"
    "21_testing.md"
    "22_deploy.md"
    "23_retrospectivas.md"
    "24_conclusiones.md"
    "99_anexos.md"
)

# ----- modo "check" — solo estimación de páginas sin generar PDF -----
if [[ "${1:-}" == "check" ]]; then
    echo "Capítulos:"
    total_lines=0
    for f in "${FILES[@]}"; do
        if [[ -f "$f" ]]; then
            lines=$(wc -l < "$f")
            total_lines=$((total_lines + lines))
            printf "  %-40s %5d líneas\n" "$f" "$lines"
        else
            printf "  %-40s FALTA\n" "$f"
        fi
    done
    pages_estimate=$((total_lines / 40))
    echo ""
    echo "Total líneas: $total_lines"
    echo "Estimación páginas: ~$pages_estimate (asumiendo 40 líneas/página)"
    echo "Target: 80+ páginas"
    exit 0
fi

# ----- chequear pandoc -----
if ! command -v pandoc &> /dev/null; then
    echo "ERROR: pandoc no está instalado."
    echo "  macOS:  brew install pandoc"
    echo "  Linux:  apt install pandoc"
    exit 1
fi

# ----- chequear motor PDF (tectonic preferido, xelatex como fallback) -----
PDF_ENGINE=""
if command -v tectonic &> /dev/null; then
    PDF_ENGINE="tectonic"
elif command -v xelatex &> /dev/null; then
    PDF_ENGINE="xelatex"
else
    echo "ERROR: ni tectonic ni xelatex están instalados."
    echo "  Rápido (macOS):  brew install tectonic"
    echo "  Oficial (macOS): brew install --cask basictex"
    echo "  Linux:           apt install texlive-xetex texlive-fonts-recommended"
    exit 1
fi
echo "Motor PDF: $PDF_ENGINE"

# ----- opcional: mermaid-filter -----
MERMAID_FILTER=""
if command -v mermaid-filter &> /dev/null; then
    MERMAID_FILTER="--filter=mermaid-filter"
    echo "✓ mermaid-filter detectado, los diagramas Mermaid se renderizarán."
else
    echo "⚠  mermaid-filter no instalado — diagramas Mermaid quedarán como bloques de código."
    echo "  Para habilitar: npm install -g mermaid-filter"
fi

# ----- compilar -----
echo ""
echo "Compilando $OUTPUT..."

pandoc \
    --pdf-engine="$PDF_ENGINE" \
    --metadata-file=meta.yml \
    $MERMAID_FILTER \
    --top-level-division=chapter \
    --toc \
    --number-sections \
    -V colorlinks=true \
    -V geometry:margin=2.5cm \
    "${FILES[@]}" \
    -o "$OUTPUT"

echo ""
echo "✓ PDF generado: $OUTPUT"
echo ""
echo "Tamaño:"
ls -lh "$OUTPUT" | awk '{print "  " $5}'
echo ""
echo "Para contar páginas reales:"
echo "  mdimport -t -d2 $OUTPUT 2>&1 | grep PageCount"
echo "  o abrir el PDF y mirar el footer"
