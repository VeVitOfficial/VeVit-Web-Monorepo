"use client";

import { useState, type FormEvent } from "react";
import type { CategoryNode } from "./categories";
import { CityPicker, type CityOption } from "./city-picker";
import { SvcIcon } from "./icons";

export type ProviderDraft = {
  headline: string;
  bio: string;
  categories: string[];
  city: CityOption | null;
  radius_km: number;
  remote: boolean;
  active: boolean;
  hourly_rate: number | null;
  website: string;
};

const RADIUS_OPTIONS = [0, 5, 10, 25, 50, 100, 200];

export function ProviderForm({ tree, initial, base, publicHref }: { tree: CategoryNode[]; initial: ProviderDraft | null; base: string; publicHref: string | null }) {
  const [chosen, setChosen] = useState<Set<string>>(new Set(initial?.categories ?? []));
  const [remote, setRemote] = useState(initial?.remote ?? false);
  const [city, setCity] = useState<CityOption | null>(initial?.city ?? null);
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function toggle(slug: string) {
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/services/api/provider", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: form.get("headline"),
          bio,
          categories: [...chosen],
          city_code: city?.code ?? null,
          radius_km: form.get("radius_km"),
          remote,
          active: form.get("active") === "on",
          hourly_rate: form.get("hourly_rate"),
          website: form.get("website"),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
      if (!response.ok) throw new Error(data.error?.message ?? "Něco se nepovedlo. Zkuste to znovu.");
      setMessage({ kind: "ok", text: "Profil je uložený. Teď můžete posílat nabídky na poptávky." });
    } catch (reason) {
      setMessage({ kind: "error", text: reason instanceof Error ? reason.message : String(reason) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="svc-form svc-stack" onSubmit={submit}>
      <section className="svc-card svc-formsec">
        <h2 className="svc-formsec__title"><span>1</span> Co nabízíte</h2>
        <label className="svc-field">
          <span>Krátký popis nabídky</span>
          <input className="svc-input" name="headline" required minLength={3} maxLength={120} defaultValue={initial?.headline ?? ""} placeholder="Např. Weby na míru a e-shopy, rychle a srozumitelně" />
        </label>
        <label className="svc-field">
          <span>O vás</span>
          <textarea className="svc-textarea" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={2000} rows={6} placeholder="Zkušenosti, ukázky práce, jak pracujete, na co se specializujete." />
          <small className="svc-counter">{bio.length}/2000</small>
        </label>
      </section>

      <section className="svc-card svc-formsec">
        <h2 className="svc-formsec__title"><span>2</span> Obory <small className="svc-small">({chosen.size} vybráno)</small></h2>
        <p className="svc-small" style={{ marginTop: 0 }}>Hlavní obor zahrnuje všechny podkategorie. Podle oborů vás zadavatelé najdou v katalogu.</p>
        <div className="svc-stack" style={{ gap: 14 }}>
          {tree.map((parent) => (
            <fieldset key={parent.slug} className="svc-catgroup">
              <legend><SvcIcon name={parent.icon} size={15} /> {parent.name_cs}</legend>
              <div className="svc-chips">
                <label className="svc-chip">
                  <input type="checkbox" checked={chosen.has(parent.slug)} onChange={() => toggle(parent.slug)} />
                  Vše
                </label>
                {parent.children.map((child) => (
                  <label key={child.slug} className="svc-chip">
                    <input type="checkbox" checked={chosen.has(child.slug) || chosen.has(parent.slug)} disabled={chosen.has(parent.slug)} onChange={() => toggle(child.slug)} />
                    {child.name_cs}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="svc-card svc-formsec">
        <h2 className="svc-formsec__title"><span>3</span> Kde a za kolik</h2>
        <div className="svc-fields-2">
          <div className="svc-field">
            <span>Město</span>
            <CityPicker name="city_code" initial={initial?.city ?? null} onChange={setCity} placeholder={remote ? "Nepovinné" : "Začněte psát název obce"} />
          </div>
          <label className="svc-field">
            <span>Dojedu do</span>
            <select className="svc-select" name="radius_km" defaultValue={String(initial?.radius_km ?? 25)}>
              {RADIUS_OPTIONS.map((km) => <option key={km} value={km}>{km === 0 ? "Jen v obci" : `${km} km`}</option>)}
            </select>
          </label>
        </div>
        <label className="svc-check" style={{ marginTop: 10 }}>
          <input type="checkbox" checked={remote} onChange={(event) => setRemote(event.target.checked)} /> Pracuji i na dálku
        </label>
        <div className="svc-fields-2" style={{ marginTop: 16 }}>
          <label className="svc-field">
            <span>Orientační hodinová sazba</span>
            <div className="svc-suffix"><input className="svc-input" name="hourly_rate" inputMode="numeric" pattern="[0-9 ]*" defaultValue={initial?.hourly_rate ?? ""} placeholder="Nepovinné" /><span>Kč/h</span></div>
          </label>
          <label className="svc-field">
            <span>Web nebo portfolio</span>
            <input className="svc-input" name="website" type="url" inputMode="url" maxLength={200} defaultValue={initial?.website ?? ""} placeholder="https://" />
          </label>
        </div>
      </section>

      <label className="svc-check svc-check--card">
        <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} />
        <span><strong>Profil je aktivní</strong><small>Neaktivní profil není v katalogu a nemůže posílat nabídky.</small></span>
      </label>
      {message ? <p className={`svc-alert svc-alert--${message.kind}`} role={message.kind === "error" ? "alert" : "status"}>{message.text}</p> : null}
      <div className="svc-row">
        <button className="svc-btn svc-btn--primary" type="submit" disabled={busy}>{busy ? "Ukládám…" : "Uložit profil"}</button>
        {publicHref ? <a className="svc-btn" href={publicHref}><SvcIcon name="eye" size={15} /> Veřejný profil</a> : null}
        <a className="svc-btn" href={`${base}/poptavky`}>Procházet poptávky</a>
      </div>
    </form>
  );
}
