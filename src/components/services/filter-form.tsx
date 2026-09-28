"use client";

import { useState } from "react";
import type { CategoryNode } from "./categories";
import { CityPicker, type CityOption } from "./city-picker";
import { JOB_TYPES, POSTED, RADII, REGIONS } from "./constants";
import { SvcIcon } from "./icons";
import { AutoSubmit, FiltersPanel } from "./interactive";

export type FilterState = {
  q: string;
  categories: string[];
  jobTypes: string[];
  city: CityOption | null;
  radius: number | null;
  region: string;
  remote: "any" | "only" | "exclude";
  budgetMin: number | null;
  posted: number | null;
  noOffers: boolean;
  urgent: boolean;
  sort: string;
};

/** Filtry výpisu poptávek (GET formulář, s JS se odesílá sám po změně). */
export function FilterForm({ id, action, filters, tree, counts, activeCount, resetHref }: {
  id: string;
  action: string;
  filters: FilterState;
  tree: CategoryNode[];
  counts: Record<string, number>;
  activeCount: number;
  resetHref: string;
}) {
  const [city, setCity] = useState<CityOption | null>(filters.city);
  const selected = new Set(filters.categories);

  return (
    <aside className="svc-sidebar" aria-label="Filtry poptávek">
      <FiltersPanel count={activeCount}>
        <form id={id} action={action} method="get" className="svc-filters2" role="search">
          <div className="svc-fgroup">
            <label className="svc-flabel" htmlFor={`${id}-q`}>Co hledáte</label>
            <div className="svc-searchbox">
              <SvcIcon name="search" size={16} />
              <input id={`${id}-q`} className="svc-input svc-input--icon" type="search" name="q" defaultValue={filters.q} placeholder="Např. web, úklid, logo" maxLength={80} />
            </div>
          </div>

          <div className="svc-fgroup">
            <span className="svc-flabel">Lokalita</span>
            <CityPicker name="obec" initial={filters.city} onChange={setCity} />
            <div className="svc-frow">
              <label className="svc-fsub">
                <span>Okruh</span>
                <select className="svc-select svc-select--sm" name="okruh" defaultValue={String(filters.radius ?? 25)} disabled={!city}>
                  {RADII.map((radius) => <option key={radius} value={radius}>+ {radius} km</option>)}
                </select>
              </label>
              <label className="svc-fsub">
                <span>nebo kraj</span>
                <select className="svc-select svc-select--sm" name="kraj" defaultValue={filters.region} disabled={Boolean(city)}>
                  <option value="">Celá ČR</option>
                  {REGIONS.map((region) => <option key={region.value} value={region.value}>{region.label}</option>)}
                </select>
              </label>
            </div>
            <div className="svc-fradios" role="radiogroup" aria-label="Práce na dálku">
              {([["", "Včetně práce na dálku"], ["jen", "Jen na dálku"], ["ne", "Jen na místě"]] as const).map(([value, label]) => (
                <label key={value} className="svc-check">
                  <input type="radio" name="dalku" value={value} defaultChecked={(filters.remote === "only" ? "jen" : filters.remote === "exclude" ? "ne" : "") === value} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="svc-fgroup">
            <span className="svc-flabel">Kategorie</span>
            <ul className="svc-ctree">
              {tree.map((parent) => {
                const open = selected.has(parent.slug) || parent.children.some((child) => selected.has(child.slug));
                return (
                  <li key={parent.slug}>
                    <details open={open}>
                      <summary>
                        <label className="svc-check" onClick={(event) => event.stopPropagation()}>
                          <input type="checkbox" name="kat" value={parent.slug} defaultChecked={selected.has(parent.slug)} />
                          <SvcIcon name={parent.icon} size={15} />
                          <span className="svc-ctree__name">{parent.name_cs}</span>
                        </label>
                        <span className="svc-ctree__count">{counts[parent.slug] ?? 0}</span>
                        <SvcIcon name="chevron-down" size={14} className="svc-ctree__chev" />
                      </summary>
                      <ul>
                        {parent.children.map((child) => (
                          <li key={child.slug}>
                            <label className="svc-check">
                              <input type="checkbox" name="kat" value={child.slug} defaultChecked={selected.has(child.slug) || selected.has(parent.slug)} disabled={selected.has(parent.slug)} />
                              <span className="svc-ctree__name">{child.name_cs}</span>
                            </label>
                            <span className="svc-ctree__count">{counts[child.slug] ?? 0}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="svc-fgroup">
            <span className="svc-flabel">Typ zakázky</span>
            {JOB_TYPES.map((type) => (
              <label key={type.value} className="svc-check">
                <input type="checkbox" name="typ" value={type.value} defaultChecked={filters.jobTypes.includes(type.value)} />
                {type.label}
              </label>
            ))}
          </div>

          <div className="svc-fgroup">
            <label className="svc-flabel" htmlFor={`${id}-od`}>Rozpočet alespoň</label>
            <div className="svc-suffix">
              <input id={`${id}-od`} className="svc-input" name="od" inputMode="numeric" pattern="[0-9 ]*" defaultValue={filters.budgetMin ?? ""} placeholder="Libovolný" />
              <span>Kč</span>
            </div>
          </div>

          <div className="svc-fgroup">
            <span className="svc-flabel">Zveřejněno</span>
            <label className="svc-check"><input type="radio" name="stari" value="" defaultChecked={!filters.posted} /> Kdykoli</label>
            {POSTED.map((item) => (
              <label key={item.value} className="svc-check">
                <input type="radio" name="stari" value={item.value} defaultChecked={filters.posted === item.value} /> {item.label}
              </label>
            ))}
          </div>

          <div className="svc-fgroup">
            <span className="svc-flabel">Další</span>
            <label className="svc-check"><input type="checkbox" name="bez_nabidek" value="1" defaultChecked={filters.noOffers} /> Zatím bez nabídek</label>
            <label className="svc-check"><input type="checkbox" name="spech" value="1" defaultChecked={filters.urgent} /> Jen spěchající</label>
          </div>

          <div className="svc-factions">
            <button className="svc-btn svc-btn--primary" type="submit">Zobrazit výsledky</button>
            <a className="svc-link" href={resetHref}>Vymazat filtry</a>
          </div>
        </form>
        <AutoSubmit formId={id} />
      </FiltersPanel>
    </aside>
  );
}
