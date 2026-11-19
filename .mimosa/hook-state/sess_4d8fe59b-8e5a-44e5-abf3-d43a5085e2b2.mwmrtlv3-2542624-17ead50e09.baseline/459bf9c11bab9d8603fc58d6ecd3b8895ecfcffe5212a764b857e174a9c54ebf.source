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

export function budgetLabel(min: number | null, max: number | null, type = "fixed"): string {
  if (type === "negotiable" || (min === null && max === null)) return "Rozpočet dohodou";
  const unit = type === "hourly" ? " Kč/h" : " Kč";
  const fmt = (value: number) => `${czk.format(value)}${unit}`;
  if (min !== null && max !== null) return min === max ? fmt(min) : `${czk.format(min)}–${fmt(max)}`;
  if (min !== null) return `od ${fmt(min)}`;
  return `do ${fmt(max as number)}`;
}

export function placeLabel(city: string, remote: boolean): string {
  if (city && remote) return `${city} nebo na dálku`;
  return city || "Na dálku";
}

export function distanceLabel(km: number | null): string {
  if (km === null || !Number.isFinite(km)) return "";
  if (km < 1) return "méně než 1 km";
  return `${Math.round(km)} km`;
}

/** „za 3 dny“, „zítra“, „dnes“, „po termínu“. */
export function untilLabel(iso: string, now: number): string {
  const days = Math.ceil((Date.parse(iso) - now) / 86_400_000);
  if (days < 0) return "po termínu";
  if (days === 0) return "dnes";
  if (days === 1) return "zítra";
  if (days < 5) return `za ${days} dny`;
  return `za ${days} dní`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return `${n} ${one}`;
  if (n >= 2 && n <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
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
  if (days === 1) return "včera";
  if (days < 30) return `před ${days} dny`;
  const months = Math.round(days / 30);
  return months <= 1 ? "před měsícem" : `před ${months} měsíci`;
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
