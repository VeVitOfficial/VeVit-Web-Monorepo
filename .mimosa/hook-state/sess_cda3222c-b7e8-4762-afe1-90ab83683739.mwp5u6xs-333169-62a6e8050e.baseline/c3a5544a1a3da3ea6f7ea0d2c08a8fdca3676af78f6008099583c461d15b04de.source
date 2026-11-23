"use client";

import { useState } from "react";
import type { CategoryNode } from "./categories";
import { CityPicker, type CityOption } from "./city-picker";
import { RADII } from "./constants";
import { SvcIcon } from "./icons";
import { AutoSubmit, FiltersPanel } from "./interactive";

/** Filtry katalogu poskytovatelů (GET). */
export function ProviderFilters({ action, tree, initial }: {
  action: string;
  tree: CategoryNode[];
  initial: { q: string; category: string; city: CityOption | null; radius: number; remoteOnly: boolean; minRating: number; sort: string };
}) {
  const [city, setCity] = useState<CityOption | null>(initial.city);
  const id = "svc-provider-filters";
  const active = [initial.q, initial.category, initial.city, initial.remoteOnly, initial.minRating].filter(Boolean).length;
  return (
    <aside className="svc-sidebar" aria-label="Filtry poskytovatelů">
      <FiltersPanel count={active}>
        <form id={id} action={action} method="get" className="svc-filters2" role="search">
          <div className="svc-fgroup">
            <label className="svc-flabel" htmlFor={`${id}-q`}>Hledat</label>
            <div className="svc-searchbox">
              <SvcIcon name="search" size={16} />
              <input id={`${id}-q`} className="svc-input svc-input--icon" type="search" name="q" defaultValue={initial.q} placeholder="Jméno nebo dovednost" />
            </div>
          </div>
          <div className="svc-fgroup">
            <label className="svc-flabel" htmlFor={`${id}-kat`}>Obor</label>
            <select id={`${id}-kat`} className="svc-select" name="kat" defaultValue={initial.category}>
              <option value="">Všechny obory</option>
              {tree.map((parent) => (
                <optgroup key={parent.slug} label={parent.name_cs}>
                  <option value={parent.slug}>{parent.name_cs} (vše)</option>
                  {parent.children.map((child) => <option key={child.slug} value={child.slug}>{child.name_cs}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="svc-fgroup">
            <span className="svc-flabel">Lokalita</span>
            <CityPicker name="obec" initial={initial.city} onChange={setCity} />
            <label className="svc-fsub">
              <span>Okruh</span>
              <select className="svc-select svc-select--sm" name="okruh" defaultValue={String(initial.radius)} disabled={!city}>
                {RADII.map((radius) => <option key={radius} value={radius}>+ {radius} km</option>)}
              </select>
            </label>
            <label className="svc-check"><input type="checkbox" name="dalku" value="1" defaultChecked={initial.remoteOnly} /> Jen práce na dálku</label>
          </div>
          <div className="svc-fgroup">
            <span className="svc-flabel">Hodnocení</span>
            <label className="svc-check"><input type="checkbox" name="hodnoceni" value="4" defaultChecked={initial.minRating === 4} /> 4 hvězdy a víc</label>
          </div>
          <div className="svc-fgroup">
            <label className="svc-flabel" htmlFor={`${id}-sort`}>Řadit</label>
            <select id={`${id}-sort`} className="svc-select" name="razeni" defaultValue={initial.sort}>
              <option value="hodnoceni">Nejlépe hodnocení</option>
              <option value="zakazky">Nejvíc zakázek</option>
              {city ? <option value="nejblize">Nejblíže</option> : null}
              <option value="nejnovejsi">Nejnovější</option>
            </select>
          </div>
          <div className="svc-factions">
            <button className="svc-btn svc-btn--primary" type="submit">Zobrazit</button>
            <a className="svc-link" href={action}>Vymazat filtry</a>
          </div>
        </form>
        <AutoSubmit formId={id} />
      </FiltersPanel>
    </aside>
  );
}
