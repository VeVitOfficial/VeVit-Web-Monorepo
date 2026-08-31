"use client";

/**
 * Shared render state pieces for the React account dashboard — ports of the
 * state-card / skeleton patterns from account/index.html + app.js
 * (renderSectionError, renderEmpty, the per-card loading markup).
 */

export function StateError({ message, onRetry, retryLabel }: { message: string; onRetry: () => void; retryLabel: string }) {
  return (
    <div className="state-card state-card--error" data-state="error">
      <span className="state-card__icon" aria-hidden="true">!</span>
      <div>
        <strong>Data se nepodařilo načíst.</strong>
        <p>{message}</p>
      </div>
      <button className="btn btn--ghost btn--sm" type="button" onClick={onRetry}>{retryLabel}</button>
    </div>
  );
}

export function StateEmpty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="state-card state-card--empty" data-state="empty">
      <span className="state-card__icon" aria-hidden="true">○</span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}

/** Loading skeletons shown while a section fetch runs (parity with index.html). */
export function SectionSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="card">
      {Array.from({ length: lines }, (_, index) => (
        <div className="skeleton skeleton--line" key={index} style={index === 0 ? undefined : { marginTop: 10 }} />
      ))}
    </div>
  );
}

export function Avatar({ url, initials, className }: { url: string; initials: string; className: string }) {
  if (url === "") return <span className={className}>{initials}</span>;
  const src = url.startsWith("storage:") ? `/account/api/avatar.php?v=${encodeURIComponent(url)}` : url;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={src} alt="" />
  );
}