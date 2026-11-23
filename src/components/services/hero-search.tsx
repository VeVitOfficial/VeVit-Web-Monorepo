"use client";

import { useState } from "react";
import { CityPicker, type CityOption } from "./city-picker";
import { SvcIcon } from "./icons";

/** Vyhledávání poptávek: co + kde + okruh. Varianta „hero“ na úvodní stránce, „bar“ ve výpisu. */
export function HeroSearch({ action, radii, variant = "hero", initialQuery = "", initialCity = null, hidden = [] }: {
  action: string;
  radii: number[];
  variant?: "hero" | "bar";
  initialQuery?: string;
  initialCity?: CityOption | null;
  /** Skrytá pole (např. zachování ostatních filtrů při hledání z lišty). */
  hidden?: Array<[string, string]>;
}) {
  const [city, setCity] = useState<CityOption | null>(initialCity);
  return (
    <form className={`svc-herosearch${variant === "bar" ? " svc-herosearch--bar" : ""}`} action={action} method="get" role="search">
      {hidden.map(([name, value]) => <input key={`${name}=${value}`} type="hidden" name={name} value={value} />)}
      <label className="svc-herosearch__field">
        <SvcIcon name="search" size={18} />
        <span className="sr-only">Co hledáte</span>
        <input className="svc-herosearch__input" type="search" name="q" defaultValue={initialQuery} placeholder="Co potřebujete? Např. web, malování, úklid" maxLength={80} />
      </label>
      <div className="svc-herosearch__field svc-herosearch__field--city">
        <CityPicker name="obec" initial={initialCity} placeholder="Kde? Město nebo obec" onChange={setCity} />
      </div>
      <label className="svc-herosearch__radius">
        <span className="sr-only">Okruh</span>
        <select className="svc-select" name="okruh" defaultValue="25" disabled={!city}>
          {radii.map((radius) => <option key={radius} value={radius}>+ {radius} km</option>)}
        </select>
      </label>
      <button className="svc-btn svc-btn--primary svc-herosearch__submit" type="submit">
        {variant === "bar" ? <SvcIcon name="search" size={16} /> : null} Hledat
      </button>
    </form>
  );
}
