// Drobné prezentační prvky Services (bez stavu, použitelné na serveru i klientu).

const STATUS_LABELS: Record<string, string> = {
  open: "Otevřená",
  assigned: "Rozpracovaná",
  completed: "Dokončená",
  cancelled: "Zrušená",
  expired: "Vypršela",
  sent: "Odeslaná",
  accepted: "Přijatá",
  rejected: "Nevybraná",
  withdrawn: "Stažená",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`svc-badge svc-badge--${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}

const czk = new Intl.NumberFormat("cs-CZ");

export function money(value: number): string {
  return `${czk.format(value)} Kč`;
}

export function budgetLabel(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return min === max ? money(min) : `${czk.format(min)}–${money(max)}`;
  if (min !== null) return `od ${money(min)}`;
  if (max !== null) return `do ${money(max)}`;
  return "Rozpočet dohodou";
}

export function placeLabel(city: string, remote: boolean): string {
  if (city && remote) return `${city} nebo na dálku`;
  return city || "Na dálku";
}

export function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", timeZone: "Europe/Prague" }).format(new Date(iso));
}

export function ago(iso: string, now: number): string {
  const minutes = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  if (minutes < 60) return minutes <= 1 ? "právě teď" : `před ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `před ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "včera" : `před ${days} dny`;
}

export function Avatar({ name, url }: { name: string; url: string | null }) {
  return (
    <span className="svc-avatar" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- avatary jsou externí URL z účtu */}
      {url ? <img src={url} alt="" /> : name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function Stars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="svc-stars" aria-label={`${value.toFixed(1)} z 5`}>
      {"★★★★★".slice(0, rounded)}
      <span style={{ opacity: 0.3 }}>{"★★★★★".slice(rounded)}</span>
    </span>
  );
}
