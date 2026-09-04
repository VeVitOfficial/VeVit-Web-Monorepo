"use client";

// UUID generátor (v4 + v7) — port legacy uuid-gen.js.
// crypto.randomUUID s fallbackem na getRandomValues. Čistě client-side.
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon } from "@/components/tools/tool-runtime";

function hexify(b: Uint8Array): string {
  const h = Array.from(b, (x) => ("0" + x.toString(16)).slice(-2));
  return h.slice(0, 4).join("") + "-" + h.slice(4, 6).join("") + "-" + h.slice(6, 8).join("") + "-" + h.slice(8, 10).join("") + "-" + h.slice(10, 16).join("");
}

function uuidV4(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return hexify(b);
}

function uuidV7(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  const ts = Date.now();
  b[0] = (ts / 0x10000000000) & 0xff;
  b[1] = (ts / 0x100000000) & 0xff;
  b[2] = (ts / 0x1000000) & 0xff;
  b[3] = (ts / 0x10000) & 0xff;
  b[4] = (ts / 0x100) & 0xff;
  b[5] = ts & 0xff;
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  return hexify(b);
}

export default function UuidGen({ locale }: ToolComponentProps) {
  const { copied, copy } = useCopy(locale);
  const [count, setCount] = useState(5);
  const [ids, setIds] = useState<string[] | null>(null);
  const [flashIdx, setFlashIdx] = useState<number | null>(null);

  const generate = (version: 4 | 7) => {
    const n = Math.min(100, Math.max(1, count || 5));
    setCount(n);
    const out: string[] = [];
    for (let i = 0; i < n; i++) out.push(version === 7 ? uuidV7() : uuidV4());
    setIds(out);
  };

  const onCopy = async (id: string, idx: number) => {
    const ok = await copy(id);
    if (ok) { Promise.resolve().then(() => setFlashIdx(idx)); setTimeout(() => setFlashIdx(null), 2000); }
  };

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <div className="row" style={{ gap: "0.5rem" }}>
          <span className="muted" style={{ fontSize: "0.875rem" }}>Počet:</span>
          <input className="input" style={{ width: "5rem" }} type="number" min={1} max={100} value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10) || 5)} />
        </div>
        <button className="btn btn-primary" onClick={() => generate(4)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
          Generovat UUID v4
        </button>
        <button className="btn btn-secondary" onClick={() => generate(7)}>Generovat UUID v7</button>
      </div>
      <div className="stack-sm" id="uuid-list">
        {ids && ids.length === 0 ? null : !ids ? (
          <p className="muted" style={{ fontSize: "0.875rem" }}>Klikněte na tlačítko pro generování UUID.</p>
        ) : (
          ids.map((id, idx) => (
            <div className="uuid-row" key={idx}>
              <span>{id}</span>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => void onCopy(id, idx)}>
                {flashIdx === idx ? <Icon name="Check" size={14} /> : <Icon name="Copy" size={14} />}
              </button>
            </div>
          ))
        )}
      </div>
      {copied ? null : null}
    </div>
  );
}