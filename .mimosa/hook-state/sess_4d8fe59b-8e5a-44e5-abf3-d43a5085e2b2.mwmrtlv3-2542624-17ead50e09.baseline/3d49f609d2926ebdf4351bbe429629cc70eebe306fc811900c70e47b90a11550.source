"use client";

import { useState } from "react";
import { CityPicker, type CityOption } from "./city-picker";
import { SvcIcon } from "./icons";

/** Velké vyhledávání na úvodní stránce: co + kde + okruh. */
export function HeroSearch({ action, radii }: { action: string; radii: number[] }) {
  const [city, setCity] = useState<CityOption | null>(null);
  return (
    <form className="svc-herosearch" action={action} method="get" role="search">
      <label className="svc-herosearch__field">
        <SvcIcon name="search" size={18} />
        <span className="sr-only">Co hledáte</span>
        <input className="svc-herosearch__input" type="search" name="q" placeholder="Co potřebujete? Např. web, malování, úklid" maxLength={80} />
      </label>
      <div className="svc-herosearch__field svc-herosearch__field--city">
        <CityPicker name="obec" initial={null} placeholder="Kde? Město nebo obec" onChange={setCity} />
      </div>
      <label className="svc-herosearch__radius">
        <span className="sr-only">Okruh</span>
        <select className="svc-select" name="okruh" defaultValue="25" disabled={!city}>
          {radii.map((radius) => <option key={radius} value={radius}>+ {radius} km</option>)}
        </select>
      </label>
      <button className="svc-btn svc-btn--primary svc-herosearch__submit" type="submit">Hledat</button>
    </form>
  );
}
