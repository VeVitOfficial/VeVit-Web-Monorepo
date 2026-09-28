import type { Metadata } from "next";
import { connection } from "next/server";
import { myOffers, myRequests, offerCounts, viewer } from "@/lib/services";
import { servicesLocale } from "@/lib/services-locale";
import { StatusBadge, dateLabel, money } from "@/components/services/ui";

export const metadata: Metadata = { title: "Moje zakázky – VeVit Services" };

export default async function MyJobsPage() {
  await connection();
  const locale = await servicesLocale();
  const base = `/${locale}/services`;
  const session = await viewer();
  if (!session) {
    return (
      <div className="svc-empty">
        <p>Své poptávky a nabídky uvidíte po přihlášení.</p>
        <p style={{ marginTop: 12 }}>
          <a className="svc-btn svc-btn--primary" href={`/${locale}/account/login?return_to=${encodeURIComponent(`${base}/moje`)}`}>Přihlásit se</a>
        </p>
      </div>
    );
  }
  const [requests, offers] = await Promise.all([myRequests(session.user.id), myOffers(session.user.id)]);
  const counts = await offerCounts(requests.map((request) => request.id));

  return (
    <>
      <h1 className="svc-h1">Moje zakázky</h1>

      <h2 className="svc-h2">Moje poptávky</h2>
      {requests.length === 0 ? (
        <div className="svc-empty">Zatím jste nic nezadali. <a href={`${base}/poptavka/nova`}>Zadat poptávku</a></div>
      ) : (
        <div className="svc-stack">
          {requests.map((request) => (
            <a key={request.id} className="svc-card svc-card--link svc-spread" href={`${base}/poptavka/${request.id}`}>
              <div>
                <strong>{request.title}</strong>
                <div className="svc-small">Zadáno {dateLabel(request.created_at)} · {counts.get(request.id) ?? 0} nabídek</div>
              </div>
              <StatusBadge status={request.status} />
            </a>
          ))}
        </div>
      )}

      <h2 className="svc-h2">Moje nabídky</h2>
      {offers.length === 0 ? (
        <div className="svc-empty">Zatím jste neposlali žádnou nabídku. <a href={base}>Procházet poptávky</a></div>
      ) : (
        <div className="svc-stack">
          {offers.map((offer) => (
            <a key={offer.id} className="svc-card svc-card--link svc-spread" href={`${base}/poptavka/${offer.request_id}`}>
              <div>
                <strong>{offer.request?.title ?? "Poptávka"}</strong>
                <div className="svc-small">{money(offer.price)} · odesláno {dateLabel(offer.created_at)}</div>
              </div>
              <StatusBadge status={offer.status} />
            </a>
          ))}
        </div>
      )}
    </>
  );
}
