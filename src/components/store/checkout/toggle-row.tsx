import type { ReactNode } from "react";

/** Switch row used for "Nakupuji na firmu" and "Fakturační adresa je jiná". */
export function ToggleRow({ on, onChange, title, hint }: { on: boolean; onChange: (on: boolean) => void; title: string; hint: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={`store-toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)}>
      <span className="store-toggle__switch" aria-hidden="true" />
      <span>
        <b>{title}</b>
        <small>{hint}</small>
      </span>
    </button>
  );
}
