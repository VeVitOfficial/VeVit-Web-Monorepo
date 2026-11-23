#!/usr/bin/env bash
# Builds the DOCX → PDF engine (wasm/docx-pdf) and vendors it into
# public/tools/assets/js/lib/converter/docx-pdf/ (D1, D6 in docs/converter/DECISIONS.md).
# Needs: a VeVit-office checkout next to this repo (../VeVit-office), rustup target
# wasm32-unknown-unknown, wasm-bindgen 0.2.129 and wasm-opt (binaryen ≥ 121).
#   WASM_BINDGEN=… WASM_OPT=… scripts/converter/build-wasm.sh
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
crate="$root/wasm/docx-pdf"
out="$root/public/tools/assets/js/lib/converter/docx-pdf"
target="${CARGO_TARGET_DIR:-$root/.cache/wasm-target}"
bindgen="${WASM_BINDGEN:-$(command -v wasm-bindgen || echo "$HOME/.cache/trunk/wasm-bindgen-0.2.129/wasm-bindgen")}"
opt="${WASM_OPT:-$(command -v wasm-opt || echo "$HOME/.cache/trunk/wasm-opt-version_131/bin/wasm-opt")}"
[ -d "$root/../VeVit-office/apps/vetext" ] || { echo "VeVit-office checkout not found at $root/../VeVit-office" >&2; exit 1; }

(cd "$crate" && CARGO_TARGET_DIR="$target" cargo build --release --locked --offline --target wasm32-unknown-unknown)
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
"$bindgen" --target web --no-typescript --out-dir "$tmp" "$target/wasm32-unknown-unknown/release/vevit_docx_pdf.wasm"
mkdir -p "$out"
"$opt" -Os --enable-bulk-memory --enable-nontrapping-float-to-int --enable-sign-ext --enable-mutable-globals \
  "$tmp/vevit_docx_pdf_bg.wasm" -o "$out/vevit_docx_pdf_bg.wasm"
cp "$tmp/vevit_docx_pdf.js" "$out/vevit_docx_pdf.js"
# Content hash for cache busting (the engine URL carries ?v=<hash>, assets are immutable-cached).
hash="$(sha256sum "$out/vevit_docx_pdf_bg.wasm" | cut -c1-16)"
raw="$(stat -c %s "$out/vevit_docx_pdf_bg.wasm")"
br="$(brotli -q 11 -c "$out/vevit_docx_pdf_bg.wasm" | wc -c)"
printf '{"version":"%s","vetext":"%s","wasmBytes":%s,"brotliBytes":%s}\n' "$hash" "$(git -C "$root/../VeVit-office" rev-parse --short HEAD 2>/dev/null || echo unknown)" "$raw" "$br" > "$out/build.json"
ls -la "$out"
