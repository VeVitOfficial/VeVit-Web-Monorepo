"use client";

// Myšlenková mapa — radiální strom z odsazeného textu (SVG), čistě client-side. Port legacy mind-map.js.
// Komponenta renderuje pouze vnitřní tělo .tool-tool — shell dodává stránka.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

interface MmNode {
  label: string;
  depth: number;
  children: MmNode[];
  angle: number;
  r: number;
  x: number;
  y: number;
}

const NS = "http://www.w3.org/2000/svg";
const COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#22d3ee", "#fb7185", "#4ade80"];

const DEFAULT_TREE = "Projekt\n  Analýza\n    Požadavky\n    Konkurence\n  Vývoj\n    Backend\n    Frontend\n  Testování\n  Deployment\n    Staging\n    Produkce";
const SAMPLE = "Plán roku\n  Cíle\n    Osobní\n    Pracovní\n  Finance\n    Příjmy\n    Úspory\n    Investice\n  Zdraví\n    Sport\n    Jídelníček\n    Spánek";

// Převod tabulátorů na 2 mezery, hloubka = floor(indent/2). Prázdné řádky se ignorují.
function parse(text: string): MmNode[] {
  const roots: MmNode[] = [];
  const stack: { node: MmNode; depth: number }[] = [];
  text.split("\n").forEach((raw) => {
    const m = raw.match(/^(\s*)(.*)$/);
    if (!m) return;
    const indent = m[1].replace(/\t/g, "  ");
    const depth = Math.floor(indent.length / 2);
    const label = m[2].trim();
    if (!label) return;
    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    const node: MmNode = { label, depth, children: [], angle: 0, r: 0, x: 0, y: 0 };
    if (stack.length) stack[stack.length - 1].node.children.push(node);
    else roots.push(node);
    stack.push({ node, depth });
  });
  return roots;
}

function countLeaves(n: MmNode): number {
  return n.children.length ? n.children.reduce((s, c) => s + countLeaves(c), 0) : 1;
}

function assign(node: MmNode, s: number, e: number, depth: number, cx: number, cy: number, DR: number): void {
  node.depth = depth;
  node.r = depth * DR;
  if (!node.children.length) {
    node.angle = (s + e) / 2;
  } else {
    const leaves = countLeaves(node);
    let cur = s;
    node.children.forEach((c) => {
      const cl = countLeaves(c);
      const w = (e - s) * (cl / leaves);
      assign(c, cur, cur + w, depth + 1, cx, cy, DR);
      cur += w;
    });
    node.angle = (node.children[0].angle + node.children[node.children.length - 1].angle) / 2;
  }
  node.x = cx + node.r * Math.cos(node.angle);
  node.y = cy + node.r * Math.sin(node.angle);
}

function layout(roots: MmNode[], cx: number, cy: number, DR: number): void {
  const totalLeaves = roots.reduce((s, r) => s + countLeaves(r), 0) || 1;
  let start = -Math.PI / 2;
  const gap = roots.length > 1 ? 0.12 : 0;
  const span = Math.PI * 2 - gap * roots.length;
  roots.forEach((r) => {
    const cl = countLeaves(r);
    const w = span * (cl / totalLeaves);
    assign(r, start, start + w, 0, cx, cy, DR);
    start += w + gap;
  });
}

function maxDepthOf(roots: MmNode[]): number {
  let md = 0;
  const walk = (n: MmNode) => { md = Math.max(md, n.depth); n.children.forEach(walk); };
  roots.forEach(walk);
  return md;
}

// Sestaví SVG elementy (odkazy + uzly) z roots po layoutu. Vrací null pro prázdný vstup.
function buildSvg(roots: MmNode[]): SVGSVGElement | null {
  if (!roots.length) return null;
  const md = maxDepthOf(roots);
  const DR = 130;
  const cx = (md + 0.7) * DR;
  const cy = (md + 0.7) * DR;
  const R = (md + 0.7) * DR * 2;
  layout(roots, cx, cy, DR);

  const el = (name: string, attrs: Record<string, string>): SVGElement => {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };

  const svg = el("svg", { viewBox: `0 0 ${R} ${R}`, width: String(R), height: String(R), style: "max-width:100%;height:auto;background:transparent" }) as unknown as SVGSVGElement;

  const drawLinks = (node: MmNode) => {
    node.children.forEach((c) => {
      svg.appendChild(el("path", { d: `M${node.x},${node.y} L${c.x},${c.y}`, stroke: "rgba(255,255,255,0.18)", "stroke-width": "1.5", fill: "none" }));
      drawLinks(c);
    });
  };
  roots.forEach(drawLinks);

  const drawNode = (node: MmNode) => {
    const color = COLORS[node.depth % COLORS.length];
    if (node.depth === 0) {
      svg.appendChild(el("circle", { cx: String(node.x), cy: String(node.y), r: "30", fill: color, opacity: "0.9" }));
    } else {
      const w = Math.max(40, node.label.length * 7.5 + 16);
      svg.appendChild(el("rect", { x: String(node.x - w / 2), y: String(node.y - 13), width: String(w), height: "26", rx: "13", fill: "rgba(31,41,55,0.85)", stroke: color, "stroke-width": "1.5" }));
    }
    const t = el("text", {
      x: String(node.x),
      y: String(node.y + (node.depth === 0 ? 5 : 4)),
      "text-anchor": "middle",
      "font-size": node.depth === 0 ? "13" : "12",
      "font-family": "inherit",
      fill: node.depth === 0 ? "#0b1220" : "#e5e7eb",
    });
    t.textContent = node.label.length > 22 ? node.label.slice(0, 21) + "…" : node.label;
    svg.appendChild(t);
    node.children.forEach(drawNode);
  };
  roots.forEach(drawNode);
  return svg;
}

export default function MindMap({ locale }: ToolComponentProps) {
  void locale;
  const [text, setText] = useState(DEFAULT_TREE);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Vykreslí SVG imperativně do wrapRef (věrně legacy render() — staví SVG DOM).
  // useMemo aby se SVG přepočítalo jen při změně textu; effect jej mountuje do DOM.
  const svg = useMemo(() => buildSvg(parse(text)), [text]);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.replaceChildren();
    if (svg) wrap.appendChild(svg);
  }, [svg]);

  const onDownload = useCallback(() => {
    const node = wrapRef.current?.querySelector("svg");
    if (!node) return;
    const xml = new XMLSerializer().serializeToString(node);
    const blob = new Blob(['<?xml version="1.0"?>\n' + xml], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mind-map.svg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  const onSample = useCallback(() => setText(SAMPLE), []);

  return (
    <div className="stack" style={{ maxWidth: "64rem", margin: "0 auto" }}>
      <p className="muted" style={{ fontSize: "0.8rem" }}>Pište odsazený seznam (2 mezery nebo Tab na úroveň). Každý řádek = uzel. Náhled se kreslí živě jako radiální strom.</p>
      <div className="two-col" style={{ gap: "1rem", alignItems: "start" }}>
        <div className="stack-sm">
          <label className="field-label" htmlFor="mm-in">Struktura (odsazený text)</label>
          <textarea className="textarea mono" id="mm-in" rows={16} spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="stack-sm">
          <span className="field-label">Náhled</span>
          <div ref={wrapRef} id="mm-svg-wrap" style={{ borderRadius: "0.75rem", overflow: "auto", maxHeight: "32rem" }} />
        </div>
      </div>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        <button className="btn btn-secondary" id="mm-svg-dl" type="button" onClick={onDownload}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
          Stáhnout SVG
        </button>
        <button className="btn btn-ghost" id="mm-sample" type="button" onClick={onSample}>Vzor</button>
      </div>
      <p className="muted" style={{ fontSize: "0.8rem" }}>Vizualizace běží lokálně (SVG). Strukturu zadáváte textem — nic se neodesílá.</p>
    </div>
  );
}