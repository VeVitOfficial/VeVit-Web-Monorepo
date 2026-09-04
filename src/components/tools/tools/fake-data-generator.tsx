"use client";

// Generátor fiktivních testovacích dat — port legacy fake-data-generator.js.
// JSON/CSV export, česká jména/města. Čistě client-side.
import { useCallback, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

const FIELDS: { k: string; l: string }[] = [
  { k: "name", l: "Jméno" }, { k: "email", l: "E-mail" }, { k: "phone", l: "Telefon" },
  { k: "username", l: "Uživ. jméno" }, { k: "city", l: "Město" }, { k: "zip", l: "PSČ" },
  { k: "street", l: "Ulice" }, { k: "company", l: "Firma" }, { k: "date", l: "Datum" },
  { k: "number", l: "Číslo" }, { k: "uuid", l: "UUID" }, { k: "boolean", l: "Ano/Ne" },
  { k: "ip", l: "IP adresa" }, { k: "password", l: "Heslo" },
];

const FIRST = ["Jan", "Petr", "Martin", "Tomáš", "Jakub", "Lucie", "Marie", "Eva", "Hana", "Anna", "Karel", "Pavel", "Vlasta", "Miroslav", "Lenka"];
const LAST = ["Novák", "Svoboda", "Novotný", "Dvořák", "Černý", "Procházka", "Kučera", "Veselý", "Horák", "Němec", "Pokorný", "Růžička", "Mareš", "Beneš"];
const CITIES = ["Praha", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "Ústí n.L.", "Hradec Králové", "České Budějovice", "Pardubice", "Zlín", "Karlovy Vary"];
const STREETS = ["Nádražní", "Hlavní", "Komenského", "Masarykova", "Parková", "Jablonského", "Dukelská", "Míru", "Polní", "Lesní"];
const COMPS = ["Alfa s.r.o.", "BetaTech a.s.", "Gama CZ", "Delta Services", "Epsilon Group", "Zeta Digital", "Omega Trade"];

function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
function rint(a: number, b: number): number { return Math.floor(Math.random() * (b - a + 1)) + a; }
function uuid(): string {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0];
    return (+c ^ (r & 15) >> (+c / 4)).toString(16);
  });
}
function slug(s: string): string { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, ""); }

function genValue(k: string): unknown {
  switch (k) {
    case "name": return pick(FIRST) + " " + pick(LAST);
    case "email": return slug(pick(FIRST)) + "." + slug(pick(LAST)) + rint(1, 99) + "@" + pick(["example.com", "test.cz", "mail.cz", "firma.cz"]);
    case "phone": return "+420 " + rint(600, 799) + " " + rint(100, 999) + " " + rint(100, 999);
    case "username": return slug(pick(FIRST)) + rint(10, 99);
    case "city": return pick(CITIES);
    case "zip": return String(rint(100, 799) * rint(1, 9)).slice(0, 3) + " " + rint(10, 99);
    case "street": return pick(STREETS) + " " + rint(1, 200);
    case "company": return pick(COMPS);
    case "date": return rint(1970, 2024) + "-" + String(rint(1, 12)).padStart(2, "0") + "-" + String(rint(1, 28)).padStart(2, "0");
    case "number": return rint(1, 9999);
    case "uuid": return uuid();
    case "boolean": return Math.random() > 0.5;
    case "ip": return rint(1, 255) + "." + rint(0, 255) + "." + rint(0, 255) + "." + rint(1, 254);
    case "password": return Array.from({ length: 12 }, () => Math.random().toString(36).slice(2, 3)).join("");
    default: return "";
  }
}

function escCSV(v: unknown, d: string): string {
  const s = v == null ? "" : String(v);
  if (new RegExp('["' + (d === "\t" ? "\\t" : d) + '\\n]').test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export default function FakeDataGenerator({ locale }: ToolComponentProps) {
  void locale;
  const [selected, setSelected] = useState<string[]>(["name", "email", "phone", "city"]);
  const [count, setCount] = useState(10);
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [out, setOut] = useState("");
  const dlUrlRef = useRef<string | null>(null);

  const toggleField = (k: string) => {
    setSelected((prev) => {
      const idx = prev.indexOf(k);
      return idx === -1 ? [...prev, k] : prev.filter((x) => x !== k);
    });
  };

  const generate = useCallback(() => {
    const n = Math.min(2000, Math.max(1, count || 10));
    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < n; i++) {
      const row: Record<string, unknown> = {};
      for (const k of selected) row[k] = genValue(k);
      rows.push(row);
    }
    if (format === "json") setOut(JSON.stringify(rows, null, 2));
    else {
      const d = ",";
      const lines = [selected.join(d)];
      for (const r of rows) lines.push(selected.map((k) => escCSV(r[k], d)).join(d));
      setOut(lines.join("\n"));
    }
  }, [count, format, selected]);

  const onDownload = () => {
    if (!out) return;
    const ext = format === "json" ? "json" : "csv";
    const blob = new Blob([out], { type: "text/plain;charset=utf-8" });
    if (dlUrlRef.current) URL.revokeObjectURL(dlUrlRef.current);
    const url = URL.createObjectURL(blob);
    dlUrlRef.current = url;
    const a = document.createElement("a");
    a.href = url; a.download = "fake-data." + ext; a.click();
  };

  return (
    <div className="stack" style={{ maxWidth: "56rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <span className="field-label">Pole</span>
        <div id="fd-fields" className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
          {FIELDS.map((f) => {
            const on = selected.includes(f.k);
            return (
              <button key={f.k} type="button" className={on ? "btn btn-primary" : "btn btn-ghost"} onClick={() => toggleField(f.k)}>{f.l}</button>
            );
          })}
        </div>
      </div>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
        <div className="stack-sm">
          <label className="field-label" htmlFor="fd-count">Počet řádků</label>
          <input className="input" id="fd-count" type="number" min={1} max={2000} value={count} style={{ width: "6rem" }} onChange={(e) => setCount(parseInt(e.target.value, 10) || 10)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="fd-format">Formát</label>
          <select className="select" id="fd-format" value={format} onChange={(e) => setFormat(e.target.value as "json" | "csv")}>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <button className="btn btn-primary" id="fd-gen" type="button" onClick={generate}>Generovat</button>
        <button className="btn btn-secondary" id="fd-dl" type="button" disabled={!out} onClick={onDownload}>Stáhnout</button>
      </div>
      <div className="stack-sm">
        <textarea className="textarea mono" id="fd-out" rows={14} readOnly value={out} placeholder="Vygenerovaná data se zobrazí zde…" />
      </div>
    </div>
  );
}