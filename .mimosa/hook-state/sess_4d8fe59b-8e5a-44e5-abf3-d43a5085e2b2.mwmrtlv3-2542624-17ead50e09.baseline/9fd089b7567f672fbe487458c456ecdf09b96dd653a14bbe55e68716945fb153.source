import { categoryIcon, categoryLabel, type ServicesCategory } from "./categories";
import { jobTypeLabel } from "./constants";
import { SvcIcon } from "./icons";
import { BookmarkButton } from "./interactive";
import { ago, budgetLabel, distanceLabel, plural, untilLabel } from "./ui";

type CardRequest = {
  id: string;
  category: string;
  title: string;
  description: string;
  city: string;
  remote: boolean;
  budget_min: number | null;
  budget_max: number | null;
  budget_type: string;
  job_type: string;
  urgent: boolean;
  deadline: string | null;
  created_at: string;
  views: number;
};

/** Karta poptávky ve výpisu (server i klient). */
export function RequestCard({ request, categories, base, now, distance = null, offers = 0, bookmark, preview = false }: {
  request: CardRequest;
  categories: ServicesCategory[];
  base: string;
  now: number;
  distance?: number | null;
  offers?: number;
  bookmark?: { saved: boolean; loginHref: string | null };
  /** Náhled ve formuláři – bez odkazů. */
  preview?: boolean;
}) {
  const href = `${base}/poptavka/${request.id}`;
  const place = request.city || "Na dálku";
  const distanceText = distanceLabel(distance);
  return (
    <article className={`svc-rcard${request.urgent ? " svc-rcard--urgent" : ""}`}>
      <span className="svc-rcard__icon" aria-hidden="true"><SvcIcon name={categoryIcon(request.category, categories)} size={20} /></span>
      <div className="svc-rcard__body">
        <div className="svc-rcard__top">
          <span className="svc-rcard__cat">{categoryLabel(request.category, categories)}</span>
          {request.urgent ? <span className="svc-tag svc-tag--urgent"><SvcIcon name="zap" size={12} /> Spěchá</span> : null}
          <span className="svc-rcard__age">{ago(request.created_at, now)}</span>
        </div>
        <h3 className="svc-rcard__title">{preview ? request.title : <a href={href}>{request.title}</a>}</h3>
        <p className="svc-rcard__desc">{request.description}</p>
        <ul className="svc-rcard__facts">
          <li><SvcIcon name="banknote" size={14} /> {budgetLabel(request.budget_min, request.budget_max, request.budget_type)}</li>
          <li>
            <SvcIcon name={request.city ? "map-pin" : "globe"} size={14} /> {place}
            {distanceText ? <span className="svc-rcard__dist"> · {distanceText}</span> : null}
            {request.city && request.remote ? <span className="svc-rcard__dist"> · i na dálku</span> : null}
          </li>
          <li><SvcIcon name="repeat" size={14} /> {jobTypeLabel(request.job_type, true)}</li>
          {request.deadline ? <li><SvcIcon name="calendar" size={14} /> Termín {untilLabel(request.deadline, now)}</li> : null}
        </ul>
      </div>
      <div className="svc-rcard__side">
        <span className={`svc-rcard__offers${offers === 0 ? " is-zero" : ""}`}>
          {offers === 0 ? "Zatím bez nabídek" : plural(offers, "nabídka", "nabídky", "nabídek")}
        </span>
        {bookmark ? <BookmarkButton requestId={request.id} initial={bookmark.saved} loginHref={bookmark.loginHref} compact /> : null}
        {preview ? null : <a className="svc-btn svc-btn--sm" href={href}>Detail</a>}
      </div>
    </article>
  );
}
