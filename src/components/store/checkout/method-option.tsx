import type { ReactNode } from "react";

type Props = {
  name: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: ReactNode;
  hint?: ReactNode;
  price?: ReactNode;
  children?: ReactNode;
};

/** One selectable row (delivery or payment method); the icon column has a fixed width so texts line up. */
export function MethodOption({ name, selected, disabled = false, onSelect, icon, title, hint, price, children }: Props) {
  return (
    <>
      <label className={`store-method ${selected ? "sel" : ""} ${disabled ? "unavailable" : ""}`}>
        <input type="radio" name={name} checked={selected} disabled={disabled} onChange={onSelect} />
        <span className="store-method__icon">{icon}</span>
        <span className="store-method__text">
          <b>{title}</b>
          {hint && <small>{hint}</small>}
        </span>
        {price && <span className="store-method__price">{price}</span>}
      </label>
      {selected && children && <div className="store-method__sub">{children}</div>}
    </>
  );
}
