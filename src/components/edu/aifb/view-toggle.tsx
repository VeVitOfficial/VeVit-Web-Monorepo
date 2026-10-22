"use client";

// Přepínač zobrazení (Mapa / Seznam, Karty / Tabulka): skupina tlačítek s aria-pressed,
// ovladatelná klávesnicí, stav není vyjádřen jen barvou.

export type ViewOption<T extends string> = { value: T; label: string };

export function ViewToggle<T extends string>({
  options, value, onChange, label,
}: { options: ViewOption<T>[]; value: T; onChange: (value: T) => void; label: string }) {
  return (
    <div className="aifb-toggle" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="aifb-toggle__btn"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
