import { handleAccountRequest } from "@/lib/account-route";
import {
  getProvider, listCategories, myOffers, myRequests, offerCounts, reviewSummary, savedSearches, unreadCounts,
  bookmarkedIds, completedJobsFor,
} from "@/lib/services";
import { categoryLabel } from "@/components/services/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_REQUEST = new Set(["open", "assigned"]);
const ACTIVE_OFFER = new Set(["sent", "accepted"]);

// VeVit Services v účtu: aktivní poptávky a nabídky, nepřečtené zprávy,
// hodnocení a profil poskytovatele.
export async function GET() {
  return handleAccountRequest(async (session) => {
    const me = session.user.id;
    const [categories, requests, offers, unread, provider, reviews, searches, bookmarks, jobs] = await Promise.all([
      listCategories(), myRequests(me), myOffers(me), unreadCounts(me), getProvider(me), reviewSummary(me),
      savedSearches(me), bookmarkedIds(me), completedJobsFor([me]),
    ]);
    const counts = await offerCounts(requests.map((request) => request.id));
    const activeRequests = requests.filter((request) => ACTIVE_REQUEST.has(request.status));
    const activeOffers = offers.filter((offer) => ACTIVE_OFFER.has(offer.status));

    return Response.json(
      {
        requests: activeRequests.slice(0, 20).map((request) => ({
          id: request.id,
          title: request.title,
          category: categoryLabel(request.category, categories),
          status: request.status,
          offers: counts.get(request.id) ?? 0,
          unread: unread.byRequest.get(request.id) ?? 0,
          expires_at: request.expires_at,
          created_at: request.created_at,
        })),
        offers: activeOffers.slice(0, 20).map((offer) => ({
          id: offer.id,
          request_id: offer.request_id,
          title: offer.request?.title ?? "",
          status: offer.status,
          request_status: offer.request?.status ?? null,
          price: offer.price,
          unread: unread.byOffer.get(offer.id) ?? 0,
          created_at: offer.created_at,
        })),
        stats: {
          active_requests: activeRequests.length,
          total_requests: requests.length,
          active_offers: activeOffers.length,
          unread: unread.total,
          completed_jobs: jobs.get(me) ?? 0,
          rating: reviews.average,
          reviews: reviews.count,
          saved_searches: searches.length,
          bookmarks: bookmarks.size,
        },
        provider: provider ? { active: provider.active, headline: provider.headline } : null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
