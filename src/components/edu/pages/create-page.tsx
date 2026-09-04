"use client";

// Vytvořit lekci – port edu/js/pages/create.js. Blokový editor pro vlastní
// lekce (11 typů bloků), autosave přes saveDraft, uložení přes
// addCustomLesson + toast + navigate na dashboard. Třídy identické s legacy.
// Všechna uživatelská pole jdou přes controlled React inputs (auto-escape),
// žádný dangerouslySetInnerHTML.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEduBreadcrumbs } from "../breadcrumbs";
import { useEduLang } from "../i18n";
import { useToast } from "../ui";
import { Icon } from "../blocks/icon";
import {
  addCustomLesson,
  generateSlug,
  saveDraft,
} from "@/lib/edu/custom-lessons";

interface BlockState {
  type: string;
  [key: string]: unknown;
}

const BLOCK_TYPES: { type: string; label: string; icon: string }[] = [
  { type: "heading", label: "Nadpis", icon: "heading" },
  { type: "paragraph", label: "Odstavec", icon: "pilcrow" },
  { type: "list", label: "Seznam", icon: "list" },
  { type: "code", label: "Kód", icon: "code-2" },
  { type: "callout", label: "Callout", icon: "info" },
  { type: "quiz", label: "Kvíz (1 odpověď)", icon: "check-square" },
  { type: "multiple", label: "Více odpovědí", icon: "list-checks" },
  { type: "match", label: "Spojovačka", icon: "link" },
  { type: "order", label: "Seřazovačka", icon: "arrow-up-down" },
  { type: "open", label: "Otevřené cvičení", icon: "pencil" },
  { type: "timeline", label: "Časová osa", icon: "clock" },
];

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  BLOCK_TYPES.map((b) => [b.type, b.label]),
);

function defaultBlock(type: string): BlockState {
  switch (type) {
    case "heading": return { type, level: 2, text: "" };
    case "paragraph": return { type, text: "" };
    case "list": return { type, itemsText: "", ordered: false };
    case "code": return { type, language: "python", code: "" };
    case "callout": return { type, variant: "info", text: "" };
    case "quiz": return { type, question: "", optionsText: "", correctIndex: 0, explanation: "" };
    case "multiple": return { type, question: "", optionsText: "", correctIndicesText: "", explanation: "" };
    case "match": return { type, question: "", pairsText: "" };
    case "order": return { type, question: "", itemsText: "", correctOrderText: "", explanation: "" };
    case "open": return { type, title: "", task: "", description: "", hint: "", keywordsText: "", modelSolution: "" };
    case "timeline": return { type, itemsText: "" };
    default: return { type, text: "" };
  }
}

const INPUT_CLS =
  "w-full rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors";

function lines(t: string): string[] {
  return t.split("\n").map((s) => s.trim()).filter(Boolean);
}

// Převede editační state bloku na finální CustomBlock (parsování textových
// polí na strukturovaná data). Shodně s legacy toCustomBlocks().
function toCustomBlocks(blocks: BlockState[]): unknown[] {
  return blocks.map((b) => {
    switch (b.type) {
      case "heading": return { type: "heading", level: Number(b.level) || 2, text: b.text };
      case "paragraph": return { type: "paragraph", text: b.text };
      case "list": return { type: "list", items: lines(String(b.itemsText || "")), ordered: !!b.ordered };
      case "code": return { type: "code", language: (b.language as string) || "text", code: b.code };
      case "callout": return { type: "callout", variant: (b.variant as string) || "info", text: b.text };
      case "quiz": return { type: "quiz", question: b.question, options: lines(String(b.optionsText || "")), correctIndex: Number(b.correctIndex) || 0, explanation: b.explanation };
      case "multiple": return { type: "multiple", question: b.question, options: lines(String(b.optionsText || "")), correctIndices: (String(b.correctIndicesText || "")).split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n)), explanation: b.explanation };
      case "match": return { type: "match", question: b.question, pairs: lines(String(b.pairsText || "")).map((l) => { const [left, ...r] = l.split("|"); return { left: (left || "").trim(), right: r.join("|").trim() }; }).filter((p) => p.left && p.right) };
      case "order": return { type: "order", question: b.question, items: lines(String(b.itemsText || "")), correctOrder: (String(b.correctOrderText || "")).split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n)), explanation: b.explanation };
      case "open": return { type: "open", title: b.title, task: b.task, description: b.description, hint: (b.hint as string) || undefined, keywords: (String(b.keywordsText || "")).split(",").map((s) => s.trim()).filter(Boolean), modelSolution: (b.modelSolution as string) || undefined };
      case "timeline": return { type: "timeline", items: lines(String(b.itemsText || "")).map((l) => { const [y, ...r] = l.split("|"); return { year: (y || "").trim(), description: r.join("|").trim() }; }).filter((p) => p.year || p.description) };
      default: return null;
    }
  }).filter(Boolean);
}

export function EduCreatePage({ locale }: { locale: string }) {
  void locale;
  const { lang } = useEduLang();
  const { setBreadcrumbs } = useEduBreadcrumbs();
  const { toast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [sourcesRaw, setSourcesRaw] = useState("");
  const [blocks, setBlocks] = useState<BlockState[]>([]);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [autosaveInfo, setAutosaveInfo] = useState<string>("");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  // Breadcrumbs (jednou).
  useEffect(() => {
    setBreadcrumbs([
      { label: "Domů", href: `/${lang}/edu/dashboard/` },
      { label: "Lekce" },
      { label: "Vytvořit vlastní" },
    ]);
  }, [lang, setBreadcrumbs]);

  // Cleanup autosave timer při odmountu.
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  function scheduleAutosave(): void {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveDraft({
        id: `draft-${Date.now()}`,
        slug: generateSlug(title || "Nepojmenovaná lekce"),
        title: title || "Nepojmenovaná lekce",
        description,
        category: "Ostatní",
        blocks: toCustomBlocks(blocks),
        createdAt: new Date().toISOString(),
        author,
        sources: sourcesRaw.split("\n").map((s) => s.trim()).filter(Boolean),
      });
      const last = new Date();
      setAutosaveInfo(`Poslední uložení: ${last.toLocaleTimeString("cs-CZ")}`);
    }, 2000);
  }

  function updateBlock(idx: number, field: string, val: unknown): void {
    setBlocks((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
    scheduleAutosave();
  }

  function addBlock(type: string): void {
    setBlocks((prev) => [...prev, defaultBlock(type)]);
    scheduleAutosave();
    // Scroll k novému bloku (legacy chování).
    setTimeout(() => {
      const el = document.getElementById("block-list");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 0);
  }

  function moveBlock(idx: number, dir: -1 | 1): void {
    setBlocks((prev) => {
      const next = prev.slice();
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
    scheduleAutosave();
  }

  function deleteBlock(idx: number): void {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
    scheduleAutosave();
  }

  function handleSave(): void {
    if (blocks.length === 0) {
      setMsg({ type: "error", text: "Přidej alespoň jeden blok obsahu." });
      return;
    }
    const parsed = toCustomBlocks(blocks).filter((b) => {
      const blk = b as Record<string, unknown>;
      if (blk.type === "paragraph" || blk.type === "heading") return blk.text && String(blk.text).trim();
      if (blk.type === "callout") return blk.text && String(blk.text).trim();
      if (blk.type === "list") return (blk.items as unknown[]).length > 0;
      if (blk.type === "code") return blk.code && String(blk.code).trim();
      if (blk.type === "quiz" || blk.type === "multiple") return blk.question && (blk.options as unknown[]).length > 0;
      if (blk.type === "match") return (blk.pairs as unknown[]).length > 0;
      if (blk.type === "order") return (blk.items as unknown[]).length > 0;
      if (blk.type === "open") return blk.task && String(blk.task).trim();
      if (blk.type === "timeline") return (blk.items as unknown[]).length > 0;
      return false;
    });
    if (parsed.length === 0) {
      setMsg({ type: "error", text: "Lekce nemůže být prázdná." });
      return;
    }
    if (!author.trim()) {
      setMsg({ type: "error", text: "Vyplň autora / tvůrce lekce (povinná doložka)." });
      return;
    }
    const finalTitle = title.trim() || "Nepojmenovaná lekce";
    addCustomLesson({
      id: `custom-${Date.now()}`,
      slug: generateSlug(finalTitle),
      title: finalTitle,
      description: description.trim(),
      category: "Ostatní",
      blocks: parsed,
      createdAt: Date.now(),
      author: author.trim(),
      sources: sourcesRaw.split("\n").map((s) => s.trim()).filter(Boolean),
    });
    setMsg({ type: "success", text: "Lekce byla uložena. Přesměrovávám zpět…" });
    toast("Lekce byla uložena!", "success");
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    savingRef.current = true;
    setTimeout(() => router.replace(`/${lang}/edu/dashboard/`), 1200);
  }

  void savingRef;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push(`/${lang}/edu/dashboard/`)}
          className="bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] shadow-lg backdrop-blur rounded-md px-3 py-1.5 text-sm"
        >
          Zrušit
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="bg-emerald-500 text-black font-semibold hover:bg-emerald-400 shadow-lg rounded-md px-4 py-1.5 text-sm gap-1.5 inline-flex items-center"
        >
          <Icon name="save" className="h-4 w-4" />
          Uložit lekci
        </button>
      </div>

      <main className="px-6 pt-6 pb-32">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.push(`/${lang}/edu/dashboard/`)}
              className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-emerald-500 transition-colors mb-6"
            >
              <Icon name="arrow-left" className="h-4 w-4" />
              Zpět na přehled
            </button>
          </div>

          {msg ? (
            <div
              className={`mb-6 rounded-xl border p-4 flex items-center gap-3 text-sm font-medium ${
                msg.type === "success"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                  : "border-red-500/20 bg-red-500/10 text-red-600"
              }`}
            >
              <Icon name={msg.type === "success" ? "check-circle" : "alert-triangle"} className="h-5 w-5 shrink-0" />
              {msg.text}
            </div>
          ) : null}

          <div className="mb-4 text-[11px] text-[var(--color-text-muted)] text-right">{autosaveInfo}</div>

          <div className="mb-4">
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); scheduleAutosave(); }}
              placeholder="Název lekce"
              className="w-full text-2xl md:text-3xl font-bold tracking-tight bg-transparent border-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>
          <div className="mb-6">
            <input
              value={description}
              onChange={(e) => { setDescription(e.target.value); scheduleAutosave(); }}
              placeholder="Krátký popis (volitelné)"
              className="w-full text-sm bg-transparent border-none text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>

          <div id="block-list" className="space-y-3 mb-4">
            {blocks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-8 text-center text-sm text-[var(--color-text-muted)]">
                Začni přidáváním bloků níže.
              </div>
            ) : (
              blocks.map((b, idx) => (
                <BlockCard
                  key={idx}
                  b={b}
                  idx={idx}
                  total={blocks.length}
                  onUpdate={(field, val) => updateBlock(idx, field, val)}
                  onUp={() => moveBlock(idx, -1)}
                  onDown={() => moveBlock(idx, 1)}
                  onDelete={() => deleteBlock(idx)}
                />
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-10">
            {BLOCK_TYPES.map((b) => (
              <button
                key={b.type}
                type="button"
                onClick={() => addBlock(b.type)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:border-emerald-500/30 hover:text-emerald-500 transition-colors"
              >
                <Icon name={b.icon} className="h-4 w-4" />
                {b.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">Doložka</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Povinné</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Autor / Tvůrce lekce *</label>
                <input
                  value={author}
                  onChange={(e) => { setAuthor(e.target.value); scheduleAutosave(); }}
                  placeholder="Jméno nebo přezdívka tvůrce"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Zdroje a reference</label>
                <textarea
                  value={sourcesRaw}
                  onChange={(e) => { setSourcesRaw(e.target.value); scheduleAutosave(); }}
                  rows={3}
                  placeholder="Každý zdroj na nový řádek (např. URL nebo název knihy)"
                  className={`${INPUT_CLS} resize-y`}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── BlockCard ─────────────────────────────────────────────────────────────

interface BlockCardProps {
  b: BlockState;
  idx: number;
  total: number;
  onUpdate: (field: string, val: unknown) => void;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
}

function BlockCard({ b, idx, total, onUpdate, onUp, onDown, onDelete }: BlockCardProps) {
  const def = BLOCK_TYPES.find((t) => t.type === b.type);
  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[var(--color-text-muted)] inline-flex items-center gap-2">
          <Icon name={def?.icon || "info"} className="h-3.5 w-3.5" />
          {TYPE_LABELS[b.type] || b.type}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onUp}
            disabled={idx === 0}
            className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-emerald-500 disabled:opacity-30"
            title="Nahoru"
          >
            <Icon name="chevron-up" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDown}
            disabled={idx === total - 1}
            className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-emerald-500 disabled:opacity-30"
            title="Dolů"
          >
            <Icon name="chevron-down" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-red-500"
            title="Smazat blok"
          >
            <Icon name="trash-2" className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <BlockBody b={b} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

interface BlockBodyProps {
  b: BlockState;
  onUpdate: (field: string, val: unknown) => void;
}

function FieldInput({ name, value, onUpdate, placeholder, type = "text" }: { name: string; value: string | number; onUpdate: (f: string, v: unknown) => void; placeholder?: string; type?: string }) {
  return (
    <input
      value={value as string | number}
      onChange={(e) => onUpdate(name, type === "number" ? Number(e.target.value) : e.target.value)}
      placeholder={placeholder}
      type={type}
      className={INPUT_CLS}
    />
  );
}

function FieldTextarea({ name, value, onUpdate, placeholder, rows = 3 }: { name: string; value: string; onUpdate: (f: string, v: unknown) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onUpdate(name, e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${INPUT_CLS} resize-y`}
    />
  );
}

function FieldSelect<T extends string>({ name, value, onUpdate, options }: { name: string; value: T; onUpdate: (f: string, v: unknown) => void; options: { value: T; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onUpdate(name, e.target.value as T)}
      className={INPUT_CLS}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function BlockBody({ b, onUpdate }: BlockBodyProps) {
  switch (b.type) {
    case "heading":
      return (
        <>
          <FieldSelect
            name="level"
            value={String(b.level) as "1" | "2" | "3"}
            onUpdate={(f, v) => onUpdate(f, Number(v))}
            options={[{ value: "1", label: "H1" }, { value: "2", label: "H2" }, { value: "3", label: "H3" }]}
          />
          <FieldInput name="text" value={String(b.text || "")} onUpdate={onUpdate} placeholder="Text nadpisu" />
        </>
      );
    case "paragraph":
      return <FieldTextarea name="text" value={String(b.text || "")} onUpdate={onUpdate} placeholder="Text odstavce…" rows={4} />;
    case "list":
      return (
        <>
          <FieldTextarea name="itemsText" value={String(b.itemsText || "")} onUpdate={onUpdate} placeholder="Jedna položka na řádek" rows={4} />
          <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mt-2">
            <input
              type="checkbox"
              checked={!!b.ordered}
              onChange={(e) => onUpdate("ordered", e.target.checked)}
              className="accent-emerald-500"
            />
            Číslovaný
          </label>
        </>
      );
    case "code":
      return (
        <>
          <FieldInput name="language" value={String(b.language || "")} onUpdate={onUpdate} placeholder="jazyk (python, js…)" />
          <FieldTextarea name="code" value={String(b.code || "")} onUpdate={onUpdate} placeholder="Kód" rows={5} />
        </>
      );
    case "callout":
      return (
        <>
          <FieldSelect
            name="variant"
            value={(b.variant as "info" | "warning" | "tip") || "info"}
            onUpdate={onUpdate}
            options={[{ value: "info", label: "Info" }, { value: "warning", label: "Warning" }, { value: "tip", label: "Tip" }]}
          />
          <FieldTextarea name="text" value={String(b.text || "")} onUpdate={onUpdate} placeholder="Text calloutu" rows={3} />
        </>
      );
    case "quiz":
      return (
        <>
          <FieldInput name="question" value={String(b.question || "")} onUpdate={onUpdate} placeholder="Otázka" />
          <FieldTextarea name="optionsText" value={String(b.optionsText || "")} onUpdate={onUpdate} placeholder="Možnosti – jedna na řádek" rows={3} />
          <FieldInput name="correctIndex" value={Number(b.correctIndex) || 0} onUpdate={onUpdate} placeholder="Index správné (0 = první)" type="number" />
          <FieldTextarea name="explanation" value={String(b.explanation || "")} onUpdate={onUpdate} placeholder="Vysvětlení" rows={2} />
        </>
      );
    case "multiple":
      return (
        <>
          <FieldInput name="question" value={String(b.question || "")} onUpdate={onUpdate} placeholder="Otázka" />
          <FieldTextarea name="optionsText" value={String(b.optionsText || "")} onUpdate={onUpdate} placeholder="Možnosti – jedna na řádek" rows={3} />
          <FieldInput name="correctIndicesText" value={String(b.correctIndicesText || "")} onUpdate={onUpdate} placeholder="Správné indexy (0,2,3)" />
          <FieldTextarea name="explanation" value={String(b.explanation || "")} onUpdate={onUpdate} placeholder="Vysvětlení" rows={2} />
        </>
      );
    case "match":
      return (
        <>
          <FieldInput name="question" value={String(b.question || "")} onUpdate={onUpdate} placeholder="Otázka / instrukce" />
          <FieldTextarea name="pairsText" value={String(b.pairsText || "")} onUpdate={onUpdate} placeholder="pár na řádek: levá | pravá" rows={4} />
        </>
      );
    case "order":
      return (
        <>
          <FieldInput name="question" value={String(b.question || "")} onUpdate={onUpdate} placeholder="Otázka / instrukce" />
          <FieldTextarea name="itemsText" value={String(b.itemsText || "")} onUpdate={onUpdate} placeholder="Položky v náhodném pořadí – jedna na řádek" rows={4} />
          <FieldInput name="correctOrderText" value={String(b.correctOrderText || "")} onUpdate={onUpdate} placeholder="Správné pořadí indexů (0,2,1,3)" />
          <FieldTextarea name="explanation" value={String(b.explanation || "")} onUpdate={onUpdate} placeholder="Vysvětlení" rows={2} />
        </>
      );
    case "open":
      return (
        <>
          <FieldInput name="title" value={String(b.title || "")} onUpdate={onUpdate} placeholder="Název cvičení" />
          <FieldTextarea name="task" value={String(b.task || "")} onUpdate={onUpdate} placeholder="Úkol / zadání" rows={2} />
          <FieldTextarea name="description" value={String(b.description || "")} onUpdate={onUpdate} placeholder="Popis / kontext" rows={2} />
          <FieldInput name="keywordsText" value={String(b.keywordsText || "")} onUpdate={onUpdate} placeholder="Klíčová slova (čárkou)" />
          <FieldTextarea name="hint" value={String(b.hint || "")} onUpdate={onUpdate} placeholder="Nápověda" rows={2} />
          <FieldTextarea name="modelSolution" value={String(b.modelSolution || "")} onUpdate={onUpdate} placeholder="Vzorové řešení" rows={3} />
        </>
      );
    case "timeline":
      return <FieldTextarea name="itemsText" value={String(b.itemsText || "")} onUpdate={onUpdate} placeholder="rok | popis – jedna na řádek" rows={4} />;
    default:
      return null;
  }
}