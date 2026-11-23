// Inline SVG ikony pro obchod (náhrada ligaturových ikon).
// Velikost řídí font-size (width/height = 1em), barvu currentColor.
// Třída `icon-filled` vyplní tvar.

import type { ReactNode } from "react";

const PATHS: Record<string, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
  storefront: (
    <>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M5 11v10h14V11" />
    </>
  ),
  new_releases: <path d="M12 2l2.4 2.6 3.5-.3.6 3.5 3.1 1.7-1.4 3.2 1.4 3.2-3.1 1.7-.6 3.5-3.5-.3L12 22l-2.4-2.6-3.5.3-.6-3.5-3.1-1.7 1.4-3.2-1.4-3.2 3.1-1.7.6-3.5 3.5.3z" />,
  sell: (
    <>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  local_shipping: (
    <>
      <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z" />
      <circle cx="5.5" cy="18.5" r="2" />
      <circle cx="18.5" cy="18.5" r="2" />
    </>
  ),
  assignment_return: (
    <>
      <path d="M9 2h6v4H9zM5 4h2M17 4h2v16H5V4h2" />
      <path d="M9 12h6M12 9l3 3-3 3" />
    </>
  ),
  mail: <path d="M3 5h18v14H3zM3 5l9 8 9-8" />,
  shopping_bag: (
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  account_circle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.2 18.2a7 7 0 0 1 11.6 0" />
    </>
  ),
  check_circle: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </>
  ),
  inventory_2: <path d="M3 7h18v4H3zM5 11v10h14V11M10 15h4" />,
  policy: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  cancel: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </>
  ),
  currency_exchange: <path d="M7 7h11l-3-3M17 17H6l3 3M4 9h16M20 15H4" />,
  help: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5M12 17h.01" />
    </>
  ),
  replay: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
  lock: <path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4" />,
  favorite: <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />,
  download: <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />,
  warning: <path d="M12 3 2 21h20zM12 10v5M12 18h.01" />,
  devices: (
    <>
      <path d="M2 4h18v11H2z" />
      <path d="M8 19h6M11 15v4" />
      <path d="M16 9h6v11h-6z" />
    </>
  ),
  school: (
    <>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11.5V16c0 1.7 12 1.7 12 0v-4.5" />
      <path d="M22 9.5V15" />
    </>
  ),
  router: (
    <>
      <rect x="3" y="13" width="18" height="7" rx="1" />
      <path d="M7 16.5h.01M10 16.5h.01" />
      <path d="M6 13 10 9M14 13l2.5-2.5" />
    </>
  ),
  chair: (
    <>
      <path d="M7 3h10v7H7z" />
      <path d="M5 12.5h14M12 10v2.5" />
      <path d="M9 20.5h6M12 12.5v8" />
    </>
  ),
  directions_car: (
    <>
      <path d="M5 13l1.7-5h10.6L19 13" />
      <path d="M3 13h18v5H3z" />
      <path d="M7 18v2M17 18v2" />
      <path d="M7 15.5h.01M17 15.5h.01" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18h1.2a1.8 1.8 0 0 0 0-3.6H12a1.8 1.8 0 0 1 0-3.6h5.7A3.3 3.3 0 0 0 21 10.5C21 6 17 3 12 3z" />
      <path d="M7.5 10h.01M11 7.5h.01M15 8.5h.01" />
    </>
  ),
  pets: (
    <>
      <circle cx="6.5" cy="9.5" r="1.4" />
      <circle cx="12" cy="7.5" r="1.4" />
      <circle cx="17.5" cy="9.5" r="1.4" />
      <path d="M12 12.5c-2.6 0-5.2 2-5.7 4.5-.3 1.5 1.1 2 2.2 1.4 1-.5 2.1-.7 3.5-.7s2.5.2 3.5.7c1.1.6 2.5.1 2.2-1.4-.5-2.5-3.1-4.5-5.7-4.5z" />
    </>
  ),
};

const FALLBACK = <circle cx="12" cy="12" r="10" />;

export function Icon({ name, className }: { name: string; className?: string }) {
  const filled = className?.includes("icon-filled") ?? false;
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block align-[-0.125em] ${className ?? ""}`}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name] ?? FALLBACK}
    </svg>
  );
}
