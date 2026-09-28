"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SvcIcon } from "./icons";

export type CityOption = { code: number; label: string; region?: string };

/**
 * Našeptávač obce (combobox podle WAI-ARIA). Vybraná obec se odesílá jako kód
 * ve skrytém poli `name`, takže funguje v GET filtrech i ve formulářích.
 */
export function CityPicker({ name, initial, placeholder = "Město nebo obec", onChange, required = false, id }: {
  name: string;
  initial: CityOption | null;
  placeholder?: string;
  onChange?: (city: CityOption | null) => void;
  required?: boolean;
  id?: string;
}) {
  const listId = useId();
  const [text, setText] = useState(initial?.label ?? "");
  const [selected, setSelected] = useState<CityOption | null>(initial);
  const [options, setOptions] = useState<CityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const request = useRef(0);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(event: MouseEvent) {
      if (wrap.current && !wrap.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function lookup(value: string) {
    const current = ++request.current;
    if (value.trim().length < 2) {
      setOptions([]);
      return;
    }
    window.setTimeout(async () => {
      if (current !== request.current) return;
      try {
        const response = await fetch(`/services/api/cities?q=${encodeURIComponent(value)}`);
        const data = (await response.json()) as { cities: CityOption[] };
        if (current !== request.current) return;
        setOptions(data.cities);
        setActive(data.cities.length ? 0 : -1);
        setOpen(true);
      } catch {
        /* bez našeptávače */
      }
    }, 150);
  }

  function choose(city: CityOption | null) {
    setSelected(city);
    setText(city?.label ?? "");
    setOpen(false);
    onChange?.(city);
    // Filtry se po výběru obce odešlou samy (AutoSubmit poslouchá svc:city);
    // timeout počká, až React přepíše skryté pole s kódem.
    window.setTimeout(() => wrap.current?.dispatchEvent(new CustomEvent("svc:city", { bubbles: true })), 0);
  }

  return (
    <div className="svc-combo" ref={wrap}>
      <SvcIcon name="map-pin" size={16} className="svc-combo__icon" />
      <input
        id={id}
        className="svc-input svc-input--icon"
        role="combobox"
        aria-expanded={open && options.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={text}
        required={required}
        onChange={(event) => {
          setText(event.target.value);
          if (selected) {
            setSelected(null);
            onChange?.(null);
          }
          lookup(event.target.value);
        }}
        onFocus={() => { if (options.length && !selected) setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActive((i) => Math.min(options.length - 1, i + 1)); }
          else if (event.key === "ArrowUp") { event.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
          else if (event.key === "Enter" && open && active >= 0 && options[active]) { event.preventDefault(); choose(options[active]); }
          else if (event.key === "Escape") setOpen(false);
        }}
        onBlur={() => {
          // Vepsaný přesný název bez kliknutí na návrh vybereme automaticky.
          if (!selected && options.length) {
            const exact = options.find((option) => option.label.toLowerCase() === text.trim().toLowerCase());
            if (exact) choose(exact);
          }
        }}
      />
      {selected || text ? (
        <button type="button" className="svc-combo__clear" aria-label="Vymazat město" onClick={() => { choose(null); setOptions([]); }}>
          <SvcIcon name="x" size={14} />
        </button>
      ) : null}
      <input type="hidden" name={name} value={selected ? String(selected.code) : ""} />
      {open && options.length > 0 ? (
        <ul className="svc-combo__list" role="listbox" id={listId}>
          {options.map((option, index) => (
            <li
              key={option.code}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              className={index === active ? "is-active" : undefined}
              onMouseDown={(event) => { event.preventDefault(); choose(option); }}
              onMouseEnter={() => setActive(index)}
            >
              <span>{option.label}</span>
              {option.region ? <small>{option.region}</small> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
