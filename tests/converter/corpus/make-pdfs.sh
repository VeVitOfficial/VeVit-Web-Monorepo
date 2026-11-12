#!/usr/bin/env bash
# Builds the PDF side of the corpus from the DOCX fixtures:
#   ref-lo/<name>.pdf  reference DOCX → PDF export by desktop LibreOffice (isolated font set,
#                      see ../fonts/fonts.conf). Marked "ref: LO desktop" in the metrics (D3).
#   pdf/<name>.pdf     PDF → DOCX inputs: the LO exports (tagged) + faktura-2026001.pdf + scan.
# Needs: soffice, python3 with Pillow, pdftoppm.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
export FONTCONFIG_FILE="$here/../fonts/fonts.conf"
profile="$(mktemp -d)"
trap 'rm -rf "$profile"' EXIT
mkdir -p "$here/ref-lo" "$here/pdf"

filter='pdf:writer_pdf_Export:{"UseTaggedPDF":{"type":"boolean","value":"true"},"ExportBookmarks":{"type":"boolean","value":"true"},"EmbedStandardFonts":{"type":"boolean","value":"true"}}'
soffice -env:UserInstallation="file://$profile" --headless --convert-to "$filter" --outdir "$here/ref-lo" "$here"/docx/*.docx >/dev/null

for f in "$here"/ref-lo/*.pdf; do cp "$f" "$here/pdf/$(basename "$f")"; done
cp "$here/faktura-2026001.pdf" "$here/pdf/faktura-2026001.pdf"

# Scanned document: two-column page rasterised at 200 DPI, slightly rotated, with noise,
# saved as a JPEG-only PDF (no text layer).
tmp="$(mktemp -d)"
pdftoppm -r 200 -gray -f 1 -l 1 -png "$here/ref-lo/dva-sloupce.pdf" "$tmp/scan"
python3 -I - "$tmp/scan-1.png" "$here/pdf/sken.pdf" <<'PY'
import sys, random
from PIL import Image, ImageFilter
random.seed(2026001)
img = Image.open(sys.argv[1]).convert("L").rotate(0.6, resample=Image.BICUBIC, fillcolor=255)
img = img.filter(ImageFilter.GaussianBlur(0.6))
px = img.load()
w, h = img.size
for _ in range(w * h // 400):
    x, y = random.randrange(w), random.randrange(h)
    px[x, y] = max(0, px[x, y] - random.randrange(60, 160))
img.save(sys.argv[2], "PDF", resolution=200.0, quality=80)
PY
rm -rf "$tmp"
ls -la "$here/pdf"
