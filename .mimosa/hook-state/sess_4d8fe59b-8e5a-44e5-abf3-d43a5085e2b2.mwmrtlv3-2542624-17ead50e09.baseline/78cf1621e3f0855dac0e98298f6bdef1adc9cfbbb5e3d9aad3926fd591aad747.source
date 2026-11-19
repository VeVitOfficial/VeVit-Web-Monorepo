// Drobečková navigace AIFB: Edu › AI gramotnost › Kategorie › Level › Lekce.
// Poslední položka je aktuální stránka (aria-current), ostatní jsou odkazy.

import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function Crumbs({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <nav aria-label={label}>
      <ol className="aifb-crumbs">
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`}>
            {item.href && index < items.length - 1 ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current={index === items.length - 1 ? "page" : undefined}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
