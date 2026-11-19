"use client";

// Kontext pro breadcrumbs nahrazující legacy setBreadcrumbs() z navbar.js.
// Stránka (stage 2) zavolá useEduBreadcrumbs().setBreadcrumbs([...]) v
// useEffect; Navbar je odběratelem stejného kontextu a překreslí se.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface BreadcrumbsContextValue {
  breadcrumbs: Breadcrumb[];
  setBreadcrumbs: (crumbs: Breadcrumb[]) => void;
}

const BreadcrumbsContext = createContext<BreadcrumbsContextValue | null>(null);

export function BreadcrumbsProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbsState] = useState<Breadcrumb[]>([]);

  const setBreadcrumbs = useCallback((crumbs: Breadcrumb[]) => {
    setBreadcrumbsState(crumbs);
  }, []);

  const value = useMemo<BreadcrumbsContextValue>(
    () => ({ breadcrumbs, setBreadcrumbs }),
    [breadcrumbs, setBreadcrumbs],
  );

  return (
    <BreadcrumbsContext.Provider value={value}>{children}</BreadcrumbsContext.Provider>
  );
}

export function useEduBreadcrumbs(): BreadcrumbsContextValue {
  const ctx = useContext(BreadcrumbsContext);
  if (!ctx) {
    throw new Error("useEduBreadcrumbs musí být volán uvnitř <BreadcrumbsProvider>");
  }
  return ctx;
}