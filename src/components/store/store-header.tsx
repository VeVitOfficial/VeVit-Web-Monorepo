"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/store/use-cart";

const NAV_ITEMS = [
  { href: "/store", label: "Domů", key: "home", icon: "home" },
  { href: "/store/catalog", label: "Katalog", key: "catalog", icon: "storefront" },
  { href: "/store/catalog?sort=newest", label: "Novinky", key: "new", icon: "new_releases" },
  { href: "/store/catalog?deals=1", label: "Slevy", key: "deals", icon: "sell" },
];

const DRAWER_INFO = [
  { href: "/cs/store/about.php", icon: "info", label: "O nás" },
  { href: "/cs/store/shipping.php", icon: "local_shipping", label: "Doprava a platba" },
  { href: "/cs/store/returns.php", icon: "assignment_return", label: "Vrácení a reklamace" },
  { href: "/cs/store/contact.php", icon: "mail", label: "Kontakt a podpora" },
];

const BOTTOM_ITEMS = [
  { href: "/store", icon: "home", label: "Domů" },
  { href: "/store/catalog", icon: "storefront", label: "Katalog" },
  { href: "/store/cart", icon: "shopping_bag", label: "Košík" },
];

function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ""}`} aria-hidden="true">{name}</span>;
}

function CartBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="nav-cart-badge absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary-container text-on-primary-fixed text-[10px] font-bold rounded-full flex items-center justify-center" aria-label="položky v košíku">
      {count}
    </span>
  );
}

export function StoreHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const cart = useCart();
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <>
      <a className="skip-link" href="#main-content">Přeskočit na obsah</a>

      <div className="announcement-bar" role="status" aria-live="polite">
        <Icon name="local_shipping" className="text-[16px] icon-filled" />
        <span>Doprava zdarma u objednávek nad 1&nbsp;000&nbsp;Kč · Digitální produkty ihned po platbě</span>
      </div>

      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-outline-variant">
        <nav className="hidden md:flex items-center justify-between w-full max-w-store mx-auto px-margin py-3" aria-label="Hlavní navigace">
          <span className="vv-app-brand" aria-label="VeVit Store">
            <Link href="/">VeVit</Link>
            <Link href="/store">Store</Link>
          </span>

          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="px-3 py-2 rounded-md font-body-md font-semibold transition-colors duration-150 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <form method="get" action="/store/catalog" role="search" className="relative flex items-center group">
              <label htmlFor="header-search-desktop" className="sr-only">Hledat produkty</label>
              <Icon name="search" className="absolute left-3 text-on-surface-variant pointer-events-none group-focus-within:text-primary transition-colors text-[20px]" />
              <input
                id="header-search-desktop"
                name="search"
                type="search"
                placeholder="Hledat produkty…"
                autoComplete="off"
                className="bg-surface-container border border-outline-variant rounded-full pl-10 pr-4 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-48 lg:w-60 transition-all duration-200 placeholder:text-on-surface-variant/50"
              />
            </form>

            <Link href="/store/cart" aria-label="Košík" className="relative p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors duration-150">
              <Icon name="shopping_bag" className="text-[22px]" />
              <CartBadge count={itemCount} />
            </Link>

            <div className="flex items-center" aria-live="polite" aria-label="Stav přihlášení">
              <StoreSessionStatus />
            </div>
          </div>
        </nav>

        <nav className="md:hidden flex items-center justify-between w-full px-4 py-3 relative" aria-label="Mobilní navigace">
          <button
            type="button"
            aria-label="Otevřít menu"
            aria-expanded={drawerOpen}
            aria-controls="mobileDrawer"
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors duration-150"
          >
            <Icon name="menu" className="text-[22px]" />
          </button>

          <span className="vv-app-brand absolute left-1/2 -translate-x-1/2" aria-label="VeVit Store">
            <Link href="/">VeVit</Link>
            <Link href="/store">Store</Link>
          </span>

          <Link href="/store/cart" aria-label="Košík" className="relative p-2 rounded-lg text-on-surface-variant hover:text-primary transition-colors duration-150">
            <Icon name="shopping_bag" className="text-[22px]" />
            <CartBadge count={itemCount} />
          </Link>
        </nav>
      </header>

      <div
        id="mobileDrawer"
        className={`mobile-drawer${drawerOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigační menu"
        aria-hidden={!drawerOpen}
      >
        <div className="mobile-drawer__backdrop" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
        <div className="mobile-drawer__panel" tabIndex={-1}>
          <div className="mobile-drawer__header">
            <span className="vv-app-brand" aria-label="VeVit Store">
              <Link href="/">VeVit</Link>
              <Link href="/store">Store</Link>
            </span>
            <button
              type="button"
              aria-label="Zavřít menu"
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container-high transition-colors"
            >
              <Icon name="close" className="text-[22px]" />
            </button>
          </div>

          <nav className="mobile-drawer__nav" aria-label="Navigace">
            <div className="mobile-drawer__section-title">Navigace</div>
            {[
              ...NAV_ITEMS,
              { href: "/store/cart", icon: "shopping_bag", label: "Košík", key: "cart" },
            ].map((item) => (
              <Link key={item.key} href={item.href} className="mobile-drawer__link" onClick={() => setDrawerOpen(false)}>
                <span className="flex items-center gap-3">
                  <Icon name={item.icon} />
                  {item.label}
                </span>
              </Link>
            ))}

            <div className="mobile-drawer__section-title mt-2">Informace</div>
            {DRAWER_INFO.map((item) => (
              <Link key={item.href} href={item.href} className="mobile-drawer__link" onClick={() => setDrawerOpen(false)}>
                <span className="flex items-center gap-3">
                  <Icon name={item.icon} />
                  {item.label}
                </span>
              </Link>
            ))}

            <div className="px-5 py-4 mt-2 border-t border-outline-variant">
              <form method="get" action="/store/catalog" role="search">
                <label htmlFor="mobile-drawer-search" className="sr-only">Hledat produkty</label>
                <div className="relative">
                  <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
                  <input
                    id="mobile-drawer-search"
                    name="search"
                    type="search"
                    placeholder="Hledat produkty…"
                    className="w-full bg-surface border border-outline-variant rounded-full pl-10 pr-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50"
                  />
                </div>
              </form>
            </div>
          </nav>

          <div className="mobile-drawer__footer">
            <StoreSessionStatus />
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 w-full z-40 md:hidden bg-surface-container/95 backdrop-blur-md border-t border-outline-variant" aria-label="Rychlá navigace">
        <div className="flex items-stretch h-16">
          {BOTTOM_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 relative text-on-surface-variant hover:text-on-surface"
            >
              <Icon name={item.icon} />
              <span className="font-caption text-[10px] font-semibold tracking-wide uppercase">{item.label}</span>
            </Link>
          ))}
          <span className="flex-1" data-store-bottom-session>
            <StoreSessionStatus compact />
          </span>
        </div>
      </nav>
    </>
  );
}

/** Hydrates the session slot like the legacy /assets/shared/session.js module. */
function StoreSessionStatus({ compact = false }: { compact?: boolean }) {
  const [user, setUser] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/account/api/me.php", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { user?: { nickname?: string; email?: string } } | null) => {
        if (data?.user) setUser(data.user.nickname || data.user.email || "Účet");
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return <span aria-hidden="true" />;
  if (!user) {
    return (
      <Link href="/account" className={compact
        ? "flex-1 flex flex-col items-center justify-center gap-0.5 text-on-surface-variant relative"
        : "px-3 py-2 rounded-md font-body-md font-semibold transition-colors duration-150 text-on-surface-variant hover:text-primary hover:bg-surface-container-high"}>
        {compact ? <><Icon name="account_circle" className="text-[22px]" /><span className="font-caption text-[10px] font-semibold tracking-wide uppercase">Účet</span></> : "Přihlásit se"}
      </Link>
    );
  }
  return (
    <Link href="/store/orders" className={compact
      ? "flex-1 flex flex-col items-center justify-center gap-0.5 text-primary relative"
      : "px-3 py-2 rounded-md font-body-md font-semibold transition-colors duration-150 text-primary bg-primary/10"}>
      {compact ? <><Icon name="account_circle" className="text-[22px] icon-filled" /><span className="font-caption text-[10px] font-semibold tracking-wide uppercase">Objednávky</span></> : user}
    </Link>
  );
}