"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { TurnstileField, captchaToken, resetCaptcha } from "@/components/account/auth/captcha";
import type { CategoryNode, ServicesCategory } from "./categories";
import { CityPicker, type CityOption } from "./city-picker";
import { BUDGET_TYPES, JOB_TYPES } from "./constants";
import { SvcIcon } from "./icons";
import { RequestCard } from "./request-card";

export type RequestDraft = {
  id?: string;
  category: string;
  title: string;
  description: string;
  job_type: string;
  budget_type: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  urgent: boolean;
  remote: boolean;
  city: CityOption | null;
};

const EMPTY: RequestDraft = {
  category: "", title: "", description: "", job_type: "one_time", budget_type: "fixed",
  budget_min: null, budget_max: null, deadline: null, urgent: false, remote: false, city: null,
};

const TIPS = [
  "Název řekne, co přesně chcete: „Web pro kavárnu s rezervacemi“, ne „Web“.",
  "V popisu uveďte rozsah, co už máte připravené a co má být výsledkem.",
  "I orientační rozpočet přitáhne relevantní nabídky.",
  "Termín pomůže poskytovatelům naplánovat práci.",
  "Kontakty do textu nepište, uvidí je až vybraný poskytovatel.",
];

async function post(path: string, body: unknown): Promise<{ id: string }> {
  const response = await fetch(`/services/api/${path}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!response.ok || !data.id) throw new Error(data.error?.message ?? "Něco se nepovedlo. Zkuste to znovu.");
  return { id: data.id };
}

function money(value: string): number | null {
  const digits = value.replace(/\s/g, "");
  return /^\d+$/.test(digits) ? Number(digits) : null;
}

export function RequestForm({ tree, categories, base, initial, today }: {
  tree: CategoryNode[];
  categories: ServicesCategory[];
  base: string;
  initial?: RequestDraft;
  /** Dnešní datum (YYYY-MM-DD) ze serveru – minimum termínu a čas náhledu. */
  today: string;
}) {
  const router = useRouter();
  const editing = Boolean(initial?.id);
  const start = initial ?? EMPTY;
  const startParent = categories.find((item) => item.slug === start.category)?.parent_slug ?? (start.category || "");
  const [parent, setParent] = useState(startParent);
  const [category, setCategory] = useState(start.category);
  const [title, setTitle] = useState(start.title);
  const [description, setDescription] = useState(start.description);
  const [jobType, setJobType] = useState(start.job_type);
  const [budgetType, setBudgetType] = useState(start.budget_type);
  const [budgetMin, setBudgetMin] = useState(start.budget_min?.toString() ?? "");
  const [budgetMax, setBudgetMax] = useState(start.budget_max?.toString() ?? "");
  const [deadline, setDeadline] = useState(start.deadline ?? "");
  const [urgent, setUrgent] = useState(start.urgent);
  const [remote, setRemote] = useState(start.remote);
  const [city, setCity] = useState<CityOption | null>(start.city);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const node = tree.find((item) => item.slug === parent) ?? null;
  const previewTime = useMemo(() => Date.parse(`${today}T12:00:00Z`), [today]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!category) {
      setError("Vyberte kategorii.");
      return;
    }
    if (!remote && !city) {
      setError("Vyberte město ze seznamu, nebo zaškrtněte práci na dálku.");
      return;
    }
    setBusy(true);
    try {
      const body = {
        category, title, description, job_type: jobType, budget_type: budgetType,
        budget_min: budgetType === "negotiable" ? "" : budgetMin,
        budget_max: budgetType === "negotiable" ? "" : budgetMax,
        deadline, urgent, remote, city_code: city?.code ?? null,
        cf_turnstile: editing ? undefined : captchaToken(),
      };
      const result = await post(editing ? `requests/${initial?.id}/edit` : "requests", body);
      router.push(`${base}/poptavka/${result.id}${editing ? "" : "?nova=1"}`);
      router.refresh();
    } catch (reason) {
      if (!editing) resetCaptcha();
      setError(reason instanceof Error ? reason.message : String(reason));
      setBusy(false);
    }
  }

  const unit = budgetType === "hourly" ? "Kč/h" : "Kč";
  return (
    <div className="svc-formlayout">
      <form className="svc-form svc-stack" onSubmit={submit} noValidate>
        <section className="svc-card svc-formsec">
          <h2 className="svc-formsec__title"><span>1</span> Kategorie</h2>
          <div className="svc-catpick" role="radiogroup" aria-label="Hlavní kategorie">
            {tree.map((item) => (
              <label key={item.slug} className={`svc-catpick__item${parent === item.slug ? " is-selected" : ""}`}>
                <input
                  type="radio"
                  name="parent"
                  value={item.slug}
                  checked={parent === item.slug}
                  onChange={() => { setParent(item.slug); setCategory(item.children.length ? "" : item.slug); }}
                />
                <SvcIcon name={item.icon} size={20} />
                <span>{item.name_cs}</span>
              </label>
            ))}
          </div>
          {node && node.children.length ? (
            <label className="svc-field" style={{ marginTop: 16 }}>
              <span>Upřesněte</span>
              <select className="svc-select" value={category} onChange={(event) => setCategory(event.target.value)} required>
                <option value="" disabled>Vyberte podkategorii</option>
                {node.children.map((child) => <option key={child.slug} value={child.slug}>{child.name_cs}</option>)}
                <option value={node.slug}>Jiné v kategorii {node.name_cs}</option>
              </select>
            </label>
          ) : null}
        </section>

        <section className="svc-card svc-formsec">
          <h2 className="svc-formsec__title"><span>2</span> Co potřebujete</h2>
          <label className="svc-field">
            <span>Název poptávky</span>
            <input className="svc-input" value={title} onChange={(event) => setTitle(event.target.value)} required minLength={5} maxLength={120} placeholder="Např. Web pro kavárnu s online rezervacemi" />
            <small className="svc-counter">{title.trim().length}/120</small>
          </label>
          <label className="svc-field">
            <span>Popis</span>
            <textarea className="svc-textarea" value={description} onChange={(event) => setDescription(event.target.value)} required minLength={20} maxLength={4000} rows={7} placeholder="Co přesně má být hotové, v jakém rozsahu, co už máte a co očekáváte jako výsledek." />
            <small className="svc-counter">
              {description.trim().length < 20 ? `Ještě aspoň ${20 - description.trim().length} znaků` : `${description.trim().length}/4000`}
            </small>
          </label>
        </section>

        <section className="svc-card svc-formsec">
          <h2 className="svc-formsec__title"><span>3</span> Typ zakázky a rozpočet</h2>
          <div className="svc-optcards" role="radiogroup" aria-label="Typ zakázky">
            {JOB_TYPES.map((type) => (
              <label key={type.value} className={`svc-optcard${jobType === type.value ? " is-selected" : ""}`}>
                <input type="radio" name="job_type" value={type.value} checked={jobType === type.value} onChange={() => setJobType(type.value)} />
                <strong>{type.label}</strong>
                <small>{type.hint}</small>
              </label>
            ))}
          </div>
          <div className="svc-segmented" role="radiogroup" aria-label="Typ rozpočtu" style={{ marginTop: 18 }}>
            {BUDGET_TYPES.map((type) => (
              <label key={type.value} className={budgetType === type.value ? "is-selected" : undefined}>
                <input type="radio" name="budget_type" value={type.value} checked={budgetType === type.value} onChange={() => setBudgetType(type.value)} />
                {type.label}
              </label>
            ))}
          </div>
          {budgetType !== "negotiable" ? (
            <div className="svc-fields-2" style={{ marginTop: 14 }}>
              <label className="svc-field">
                <span>Od</span>
                <div className="svc-suffix"><input className="svc-input" inputMode="numeric" value={budgetMin} onChange={(event) => setBudgetMin(event.target.value)} placeholder="Nepovinné" /><span>{unit}</span></div>
              </label>
              <label className="svc-field">
                <span>Do</span>
                <div className="svc-suffix"><input className="svc-input" inputMode="numeric" value={budgetMax} onChange={(event) => setBudgetMax(event.target.value)} placeholder="Nepovinné" /><span>{unit}</span></div>
              </label>
            </div>
          ) : <p className="svc-small" style={{ marginTop: 12 }}>Poskytovatelé navrhnou cenu sami v nabídce.</p>}
        </section>

        <section className="svc-card svc-formsec">
          <h2 className="svc-formsec__title"><span>4</span> Místo a termín</h2>
          <div className="svc-field">
            <span>Kde se bude práce dělat</span>
            <CityPicker name="city_code" initial={start.city} onChange={setCity} placeholder={remote ? "Nepovinné – práce na dálku" : "Začněte psát název obce"} />
          </div>
          <label className="svc-check" style={{ marginTop: 10 }}>
            <input type="checkbox" checked={remote} onChange={(event) => setRemote(event.target.checked)} />
            Lze udělat i na dálku (online)
          </label>
          <div className="svc-fields-2" style={{ marginTop: 16 }}>
            <label className="svc-field">
              <span>Termín dokončení</span>
              <input className="svc-input" type="date" min={today} value={deadline} onChange={(event) => setDeadline(event.target.value)} />
            </label>
            <label className="svc-check svc-check--card" style={{ alignSelf: "end" }}>
              <input type="checkbox" checked={urgent} onChange={(event) => setUrgent(event.target.checked)} />
              <span><strong><SvcIcon name="zap" size={14} /> Spěchá</strong><small>Poptávka se ve výpisu zvýrazní.</small></span>
            </label>
          </div>
        </section>

        {editing ? null : <TurnstileField action="services_request" />}
        {error ? <p className="svc-alert svc-alert--error" role="alert">{error}</p> : null}
        <div className="svc-row">
          <button className="svc-btn svc-btn--primary" type="submit" disabled={busy}>
            {busy ? "Ukládám…" : editing ? "Uložit změny" : "Zveřejnit poptávku"}
          </button>
          {editing ? <a className="svc-btn" href={`${base}/poptavka/${initial?.id}`}>Zrušit</a> : null}
          <span className="svc-small">{editing ? "Změny se projeví hned." : "Zadání je zdarma. Poptávka bude veřejná 30 dní nebo do výběru nabídky."}</span>
        </div>
      </form>

      <aside className="svc-formaside">
        <div className="svc-card">
          <h3 className="svc-aside-title"><SvcIcon name="sparkles" size={16} /> Jak dostat dobré nabídky</h3>
          <ul className="svc-tips">{TIPS.map((tip) => <li key={tip}><SvcIcon name="check" size={14} /> {tip}</li>)}</ul>
        </div>
        <div>
          <p className="svc-small" style={{ margin: "0 0 8px" }}>Náhled ve výpisu</p>
          <RequestCard
            request={{
              id: initial?.id ?? "nahled",
              category: category || parent || "ostatni",
              title: title.trim() || "Název vaší poptávky",
              description: description.trim() || "Popis se zobrazí tady.",
              city: city?.label.replace(/ \(okres .*\)$/, "") ?? "",
              remote,
              budget_min: budgetType === "negotiable" ? null : money(budgetMin),
              budget_max: budgetType === "negotiable" ? null : money(budgetMax),
              budget_type: budgetType,
              job_type: jobType,
              urgent,
              deadline: deadline || null,
              created_at: new Date(previewTime).toISOString(),
              views: 0,
            }}
            categories={categories}
            base={base}
            now={previewTime}
            preview
          />
        </div>
      </aside>
    </div>
  );
}
