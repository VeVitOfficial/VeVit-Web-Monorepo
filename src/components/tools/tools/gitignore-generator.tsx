"use client";

// .gitignore generátor — port legacy gitignore-generator.js.
// Statické šablony, kombinace podle výběru. Čistě client-side.
import { useMemo, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon, toastSuccess } from "@/components/tools/tool-runtime";

const TEMPLATES: Record<string, string[]> = {
  "Node": ["node_modules/", "npm-debug.log*", "yarn-debug.log*", "yarn-error.log*", ".npm", ".yarn/", "dist/", "build/"],
  "Python": ["__pycache__/", "*.py[cod]", "*.egg-info/", ".venv/", "venv/", ".pytest_cache/", ".mypy_cache/"],
  "PHP": ["vendor/", "composer.lock", ".env"],
  "Java": ["target/", "*.class", "*.jar", "*.war", ".gradle/"],
  "Go": ["*.exe", "*.exe~", "*.dll", "*.so", "*.dylib", "bin/"],
  "Rust": ["target/", "*.pdb", "Cargo.lock"],
  "Composer": ["vendor/", "composer.lock"],
  "Docker": ["*.pid", ".docker/"],
  "macOS": [".DS_Store", "._*", ".AppleDouble", ".LSOverride"],
  "Windows": ["Thumbs.db", "ehthumbs.db", "Desktop.ini", "$RECYCLE.BIN/"],
  "Linux": ["*~", ".directory", ".Trash-*"],
  "JetBrains": [".idea/", "*.iml", "*.ipr", "*.iws"],
  "VSCode": [".vscode/*", "!.vscode/settings.json"],
  "Env soubory": [".env", ".env.local", "*.secret"],
};

export default function GitignoreGenerator({ locale }: ToolComponentProps) {
  void locale;
  const { copied, copy } = useCopy(locale);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const out = useMemo(() => {
    const lines: string[] = [];
    for (const k of Object.keys(TEMPLATES)) {
      if (!selected[k]) continue;
      lines.push("# " + k);
      lines.push(...TEMPLATES[k]);
      lines.push("");
    }
    return lines.join("\n");
  }, [selected]);

  const onCopy = async () => { if (out) { const ok = await copy(out); if (ok) toastSuccess("Zkopírováno"); } };

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <span className="field-label">Šablony</span>
        <div id="gi-checks" className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
          {Object.keys(TEMPLATES).map((k) => (
            <button key={k} type="button"
              className={selected[k] ? "btn btn-primary" : "btn btn-ghost"}
              onClick={() => setSelected((prev) => ({ ...prev, [k]: !prev[k] }))}>
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="gi-out">.gitignore</label>
        <textarea className="textarea mono" id="gi-out" rows={14} readOnly value={out} placeholder="Vyberte šablony pro vygenerování .gitignore…" />
        <div className="row" style={{ gap: "0.5rem" }}>
          <button className="btn btn-secondary" id="gi-copy" type="button" disabled={!out} onClick={onCopy}>
            {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat
          </button>
          <button className="btn btn-ghost" id="gi-clear" type="button" onClick={() => setSelected({})}>Vyčistit</button>
        </div>
      </div>
    </div>
  );
}