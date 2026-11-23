"use client";

// Vykreslí tělo jednoho nástroje. Registr (TOOL_COMPONENTS) načítá komponenty přes next/dynamic,
// takže klient stáhne jen chunk zobrazeného nástroje, ne všech ~100. Musí to být klientská
// komponenta: next/dynamic v server komponentě kód nerozdělí (viz docs Next 16, lazy-loading).
import type { ReactNode } from "react";
import { TOOL_COMPONENTS } from "@/components/tools/registry";
import type { Locale } from "@/components/tools/registry/data";

export function ToolHost({
  slug,
  locale,
  disabled,
  readyLabel,
  fallback,
  children,
}: {
  slug: string;
  locale: Locale;
  /** Nástroj v údržbě: implementace existuje, ale nespouští se. */
  disabled: boolean;
  readyLabel: string;
  /** Informační panel pro nástroje bez implementace nebo v údržbě (renderuje server). */
  fallback: ReactNode;
  /** Toaster, RecordRecent apod. (jen když nástroj běží). */
  children?: ReactNode;
}) {
  const Component = TOOL_COMPONENTS[slug];
  if (!Component || disabled) return <>{fallback}</>;
  return (
    <div className="tool-tool" id="tool-root" data-tool-state="idle" aria-busy="false">
      <p className="sr-only" id="tool-live-status" role="status" aria-live="polite" aria-atomic="true">{readyLabel}</p>
      <Component locale={locale} />
      {children}
    </div>
  );
}
