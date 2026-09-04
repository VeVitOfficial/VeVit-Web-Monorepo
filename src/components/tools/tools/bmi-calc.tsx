"use client";

// BMI kalkulačka — referenční implementace React portu nástroje.
// Portuje tools/assets/js/tools/bmi-calc.js (živý výpočet v prohlížeči).
// Komponenta renderuje POUZE vnitřní tělo .tool-tool — shell dodává stránka.
import { useMemo } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import type { Locale } from "@/components/tools/registry/data";

const LABELS: Record<Locale, { weight: string; height: string; bmi: string; category: string; ideal: string; note: string; cats: [string, string, string, string] }> = {
  cs: { weight: "Váha (kg)", height: "Výška (cm)", bmi: "BMI", category: "Kategorie", ideal: "Ideální váha", note: "Výpočet běží živě v prohlížeči. BMI je orientační ukazatel — nebere v úvahu svalovou hmotu ani stavbu těla.", cats: ["Podváha", "Normální váha", "Nadváha", "Obezita"] },
  en: { weight: "Weight (kg)", height: "Height (cm)", bmi: "BMI", category: "Category", ideal: "Ideal weight", note: "Calculation runs live in the browser. BMI is an indicative measure — it does not account for muscle mass or body build.", cats: ["Underweight", "Normal weight", "Overweight", "Obesity"] },
  de: { weight: "Gewicht (kg)", height: "Größe (cm)", bmi: "BMI", category: "Kategorie", ideal: "Idealgewicht", note: "Die Berechnung läuft live im Browser. BMI ist ein Richtwert — er berücksichtigt weder Muskelmasse noch Körperbau.", cats: ["Untergewicht", "Normalgewicht", "Übergewicht", "Adipositas"] },
  es: { weight: "Peso (kg)", height: "Altura (cm)", bmi: "IMC", category: "Categoría", ideal: "Peso ideal", note: "El cálculo se ejecuta en vivo en el navegador. El IMC es orientativo — no tiene en cuenta la masa muscular ni la complexión.", cats: ["Bajo peso", "Peso normal", "Sobrepeso", "Obesidad"] },
  uk: { weight: "Вага (кг)", height: "Зріст (см)", bmi: "ІМТ", category: "Категорія", ideal: "Ідеальна вага", note: "Розрахунок виконується в браузері. ІМТ — орієнтовний показник, він не враховує м'язову масу та статуру.", cats: ["Недостатня вага", "Нормальна вага", "Надлишкова вага", "Ожиріння"] },
  fr: { weight: "Poids (kg)", height: "Taille (cm)", bmi: "IMC", category: "Catégorie", ideal: "Poids idéal", note: "Le calcul s'exécute en direct dans le navigateur. L'IMC est indicatif — il ne tient compte ni de la masse musculaire ni de la corpulence.", cats: ["Insuffisant", "Normal", "Surpoids", "Obésité"] },
  sk: { weight: "Váha (kg)", height: "Výška (cm)", bmi: "BMI", category: "Kategória", ideal: "Ideálna váha", note: "Výpočet beží živo v prehliadači. BMI je orientačný ukazovateľ — nezohľadňuje svalovú hmotu ani stavbu tela.", cats: ["Podváha", "Normálna váha", "Nadváha", "Obezita"] },
};

const LOCALE_TAG: Record<Locale, string> = { cs: "cs-CZ", en: "en-US", de: "de-DE", es: "es-ES", uk: "uk-UA", fr: "fr-FR", sk: "sk-SK" };

function catOf(b: number, cats: [string, string, string, string]): string {
  if (b < 18.5) return cats[0];
  if (b < 25) return cats[1];
  if (b < 30) return cats[2];
  return cats[3];
}

export default function BmiCalc({ locale }: ToolComponentProps) {
  const L = LABELS[locale] ?? LABELS.cs;
  const locTag = LOCALE_TAG[locale] ?? "cs-CZ";

  const { bmiText, catText, idealText, showIdeal } = useMemo(() => {
    // výchozí hodnoty odpovídají legacy HTML (value=70, value=175)
    return compute(70, 175, L.cats, locTag);
  }, [L, locTag]);

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="bmi-weight">{L.weight}</label>
          <input className="input" type="number" id="bmi-weight" min={20} max={400} step={0.1} defaultValue={70} inputMode="decimal" onChange={liveCompute} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="bmi-height">{L.height}</label>
          <input className="input" type="number" id="bmi-height" min={80} max={250} step={0.5} defaultValue={175} inputMode="decimal" onChange={liveCompute} />
        </div>
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} role="status" aria-live="polite">
        <div className="kv"><span className="k">{L.bmi}</span><span className="v accent" id="bmi-val">{bmiText}</span></div>
        <div className="kv"><span className="k">{L.category}</span><span className="v" id="bmi-cat">{catText}</span></div>
        <div className={`kv${showIdeal ? "" : " hidden"}`} id="bmi-ideal-row"><span className="k">{L.ideal}</span><span className="v" id="bmi-ideal">{idealText}</span></div>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem" }}>{L.note}</p>
    </div>
  );
}

// Výpočet izolovaný do funkce — volán z useMemo i z live input handleru.
function compute(W: number, H: number, cats: [string, string, string, string], locTag: string) {
  if (!W || !H || H <= 0) return { bmiText: "—", catText: "—", idealText: "—", showIdeal: false };
  const m = H / 100;
  const bmi = W / (m * m);
  const lo = 18.5 * m * m;
  const hi = 24.9 * m * m;
  const fmt = (n: number) => n.toLocaleString(locTag, { maximumFractionDigits: 1 });
  return {
    bmiText: fmt(bmi),
    catText: catOf(bmi, cats),
    idealText: `${fmt(lo)}–${fmt(hi)} kg`,
    showIdeal: true,
  };
}

// Živý přepočet bez React state — čte DOM inputy a zapisuje výsledky přímo
// do textContent, věrně legacy bmi-calc.js (addEventListener('input', compute)).
function liveCompute() {
  const wEl = document.getElementById("bmi-weight") as HTMLInputElement | null;
  const hEl = document.getElementById("bmi-height") as HTMLInputElement | null;
  const valEl = document.getElementById("bmi-val");
  const catEl = document.getElementById("bmi-cat");
  const idealEl = document.getElementById("bmi-ideal");
  const idealRow = document.getElementById("bmi-ideal-row");
  if (!wEl || !hEl || !valEl || !catEl || !idealEl || !idealRow) return;
  const lang = (document.documentElement.lang || "cs") as Locale;
  const L = LABELS[lang] ?? LABELS.cs;
  const locTag = LOCALE_TAG[lang] ?? "cs-CZ";
  const W = parseFloat(wEl.value);
  const H = parseFloat(hEl.value);
  const r = compute(isNaN(W) ? 0 : W, isNaN(H) ? 0 : H, L.cats, locTag);
  valEl.textContent = r.bmiText;
  catEl.textContent = r.catText;
  idealEl.textContent = r.idealText;
  idealRow.classList.toggle("hidden", !r.showIdeal);
}