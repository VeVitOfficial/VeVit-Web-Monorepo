import Link from "next/link";

/**
 * Port of agenda_page_start()/agenda_unavailable() from store/lib/customer-page.php.
 * Every customer-agenda page renders inside this frame (server component).
 */
export function AgendaPage({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main id="main-content" className="flex-1 w-full max-w-store mx-auto px-margin py-10">
      <div className="mb-8">
        <p className="font-mono-label text-primary uppercase tracking-widest">Zákaznická agenda</p>
        <h1 className="font-display text-h1 mt-2">{title}</h1>
        {subtitle ? <p className="text-on-surface-variant mt-2 max-w-2xl">{subtitle}</p> : null}
      </div>
      {children}
    </main>
  );
}

export function AgendaUnavailable({ message }: { message: string }) {
  return (
    <section className="bg-surface-container border border-outline-variant rounded-xl p-6" role="status">
      <h2 className="font-h2 text-h2">Funkce je dočasně nedostupná</h2>
      <p className="text-on-surface-variant mt-2">{message}</p>
      <Link className="btn btn-primary mt-5 inline-flex" href="/store/catalog">Přejít do katalogu</Link>
    </section>
  );
}

/** Port of agenda_timeline() — vertical event timeline. */
export function AgendaTimeline({ events }: { events: { state: string; message: string; at: string }[] }) {
  return (
    <ol className="space-y-3 mt-4">
      {events.map((event, index) => (
        <li key={index} className="border-l-2 border-primary pl-4 py-1">
          <div className="font-semibold">{event.state}</div>
          {event.message !== "" ? <p className="text-on-surface-variant">{event.message}</p> : null}
          <time className="font-caption text-caption text-on-surface-variant">{event.at}</time>
        </li>
      ))}
    </ol>
  );
}