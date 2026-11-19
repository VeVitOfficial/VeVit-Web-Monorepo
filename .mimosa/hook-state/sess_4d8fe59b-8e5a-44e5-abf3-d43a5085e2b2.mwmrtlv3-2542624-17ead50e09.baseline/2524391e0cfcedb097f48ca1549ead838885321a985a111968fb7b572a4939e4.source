#!/usr/bin/env bash
# Local-only benchmark: converts the PDF corpus with pdf2docx (AGPL-3.0, via PyMuPDF) so the
# metrics can be compared with ours. pdf2docx is NEVER part of the product or CI; install it in
# a throwaway venv outside the repo:  python3 -m venv /tmp/p2d && /tmp/p2d/bin/pip install pdf2docx
#   PDF2DOCX_PY=/tmp/p2d/bin/python tests/converter/tools/bench-pdf2docx.sh
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
py="${PDF2DOCX_PY:?set PDF2DOCX_PY to the venv python}"
out="$here/out/pdf2docx"; mkdir -p "$out"
for f in "$here"/corpus/pdf/*.pdf; do
  n="$(basename "$f" .pdf)"
  s=$(date +%s%N)
  "$py" -W ignore -c "import sys; from pdf2docx import Converter; c=Converter(sys.argv[1]); c.convert(sys.argv[2]); c.close()" "$f" "$out/$n.docx" >/dev/null 2>&1 || echo "$n: pdf2docx failed"
  echo "$n $(( ($(date +%s%N)-s)/1000000 ))" >> "$out/times.txt"
done
