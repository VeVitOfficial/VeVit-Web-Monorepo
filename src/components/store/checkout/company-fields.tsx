"use client";

import { useEffect, useRef, useState } from "react";
import { icoValid, type CompanyInfo } from "@/lib/checkout/company";

type Lookup = "idle" | "loading" | "loaded" | "not_found" | "unavailable";

const ZIP = /^\d{3} ?\d{2}$/;
const DIC = /^[A-Z]{2}[0-9A-Z]{2,12}$/;

/** IČO with instant check digit validation, then name, DIČ and seat from ARES (via our server). */
export function CompanyFields({ value, onChange, error }: { value: CompanyInfo | null; onChange: (company: CompanyInfo | null) => void; error?: string }) {
  const [ico, setIco] = useState(value?.ico ?? "");
  const [name, setName] = useState(value?.name ?? "");
  const [dic, setDic] = useState(value?.dic ?? "");
  const [street, setStreet] = useState(value?.address.street ?? "");
  const [city, setCity] = useState(value?.address.city ?? "");
  const [zip, setZip] = useState(value?.address.zip ?? "");
  const [country, setCountry] = useState<"CZ" | "SK">(value?.address.country ?? "CZ");
  const [lookup, setLookup] = useState<Lookup>(value ? "loaded" : "idle");
  const lastLookup = useRef(value?.ico ?? "");
  const emitted = useRef(JSON.stringify(value));
  const emit = useRef(onChange);

  useEffect(() => {
    emit.current = onChange;
  });

  const icoBad = ico.length === 8 && !icoValid(ico);
  const dicBad = dic !== "" && !DIC.test(dic);

  // Report a company only when everything the server will accept is filled in.
  useEffect(() => {
    const complete = icoValid(ico) && lookup !== "not_found" && lookup !== "loading" && name.trim() !== "" && street.trim() !== "" && city.trim() !== "" && ZIP.test(zip.trim()) && !dicBad;
    const next: CompanyInfo | null = complete
      ? { ico, name: name.trim(), dic: dic === "" ? null : dic, address: { street: street.trim(), city: city.trim(), zip: zip.trim(), country } }
      : null;
    const serialized = JSON.stringify(next);
    if (serialized !== emitted.current) {
      emitted.current = serialized;
      emit.current(next);
    }
  }, [ico, name, dic, street, city, zip, country, lookup, dicBad]);

  useEffect(() => {
    if (!icoValid(ico) || ico === lastLookup.current) return;
    lastLookup.current = ico;
    const controller = new AbortController();
    setLookup("loading");
    (async () => {
      try {
        const response = await fetch(`/store/api/ares.php?ico=${ico}`, { signal: controller.signal, credentials: "same-origin" });
        if (response.status === 404) return setLookup("not_found");
        if (!response.ok) return setLookup("unavailable");
        const company = (await response.json()) as CompanyInfo;
        setName(company.name);
        setDic(company.dic ?? "");
        setStreet(company.address.street);
        setCity(company.address.city);
        setZip(company.address.zip);
        setCountry(company.address.country);
        setLookup("loaded");
      } catch {
        if (!controller.signal.aborted) setLookup("unavailable");
      }
    })();
    return () => controller.abort();
  }, [ico]);

  const icoMessage = icoBad
    ? "IČO není platné. Zkontroluj, jestli v něm není překlep."
    : lookup === "not_found" ? "Firma s tímto IČO v registru není."
    : lookup === "unavailable" ? "ARES teď neodpovídá, údaje vyplň ručně."
    : "";

  return (
    <div className="store-company">
      <label className={`store-field ${icoBad || lookup === "not_found" ? "bad" : icoValid(ico) && lookup === "loaded" ? "ok" : ""}`}>
        IČO
        <input
          value={ico}
          inputMode="numeric"
          maxLength={8}
          placeholder="12345678"
          autoComplete="off"
          aria-invalid={icoBad || lookup === "not_found"}
          onChange={(event) => {
            setIco(event.target.value.replace(/\D/g, "").slice(0, 8));
            if (lookup === "not_found" || lookup === "unavailable") setLookup("idle");
          }}
        />
        <span className="store-field__error" role={icoMessage ? "alert" : undefined}>{icoMessage}</span>
      </label>
      {lookup === "loading" && <p className="store-ares"><span className="store-spin" /> Hledám v ARES…</p>}
      {lookup === "loaded" && <p className="store-ares">✓ Načteno z ARES{name ? ` · ${name}` : ""}</p>}
      <label className="store-field">
        Název firmy
        <input value={name} placeholder="Načte se z ARES" onChange={(event) => setName(event.target.value)} />
      </label>
      <label className={`store-field ${dicBad ? "bad" : ""}`}>
        DIČ
        <input value={dic} placeholder="CZ12345678" onChange={(event) => setDic(event.target.value.toUpperCase().replace(/\s/g, ""))} />
        <span className="store-field__error">
          {dicBad ? "DIČ má tvar CZ12345678." : lookup === "loaded" && dic === "" ? "Firma není plátce DPH, DIČ nevyplňuj." : ""}
        </span>
      </label>
      <label className="store-field">
        Ulice a číslo
        <input value={street} placeholder="Načte se z ARES" onChange={(event) => setStreet(event.target.value)} />
      </label>
      <div className="store-form-row">
        <label className="store-field">
          Město
          <input value={city} onChange={(event) => setCity(event.target.value)} />
        </label>
        <label className="store-field">
          PSČ
          <input value={zip} inputMode="numeric" onChange={(event) => setZip(event.target.value)} />
        </label>
      </div>
      <label className="store-field">
        Země
        <select value={country} onChange={(event) => setCountry(event.target.value === "SK" ? "SK" : "CZ")}>
          <option value="CZ">Česko</option>
          <option value="SK">Slovensko</option>
        </select>
      </label>
      {error && <p className="store-error" role="alert">{error}</p>}
    </div>
  );
}
