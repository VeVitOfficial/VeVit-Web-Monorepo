#!/usr/bin/env bash
# Linuxový kontejner má jako systémové písmo jen DejaVu Sans. Stránky, které
# používají `system-ui` / `ui-sans-serif` (Edu, Account), by na záběrech
# vypadaly jinak než na běžném Macu či Windows. Pro natáčení proto nainstalujeme
# Geist (značkové písmo VeVitu, OFL) a nastavíme ho jako výchozí sans-serif.
# Aplikace se nemění – jde jen o prostředí prohlížeče, který natáčí.
set -euo pipefail
CACHE="$(cd "$(dirname "$0")/.." && pwd)/.cache/fonts"
FONT_DIR="$HOME/.local/share/fonts/geist"
mkdir -p "$CACHE" "$FONT_DIR" "$HOME/.config/fontconfig"
if [ ! -d "$CACHE/package" ]; then
  (cd "$CACHE" && npm pack geist@1.7.2 --silent >/dev/null && tar xzf geist-1.7.2.tgz)
fi
cp "$CACHE"/package/dist/fonts/geist-sans/Geist-{Light,Regular,Medium,SemiBold,Bold,Black}.ttf "$FONT_DIR/"
cp "$CACHE"/package/dist/fonts/geist-mono/GeistMono-{Regular,Medium,SemiBold,Bold}.ttf "$FONT_DIR/" 2>/dev/null || true
cat > "$HOME/.config/fontconfig/fonts.conf" <<'XML'
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <alias binding="strong"><family>sans-serif</family><prefer><family>Geist</family></prefer></alias>
  <alias binding="strong"><family>system-ui</family><prefer><family>Geist</family></prefer></alias>
  <alias binding="strong"><family>monospace</family><prefer><family>Geist Mono</family></prefer></alias>
</fontconfig>
XML
fc-cache -f "$FONT_DIR" >/dev/null
echo "Geist nastaven jako výchozí sans-serif: $(fc-match sans-serif)"
