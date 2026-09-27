import { handleAccountRequest } from "@/lib/account-route";
import { localeRedirectTarget } from "@/lib/account-auth";
import { BillingUnavailableError, billingStripe, csrfValid, stripeCustomerId } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe Customer Portal: change tier or card, download invoices, cancel.
// Portal changes come back through the stripe-webhook edge function.

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    if (!csrfValid(request, session)) {
      return Response.json({ error: "Neplatný požadavek." }, { status: 403 });
    }
    const customer = await stripeCustomerId(session.user.id);
    if (!customer) return Response.json({ error: "Nemáte žádné předplatné." }, { status: 404 });

    try {
      const lang = typeof session.user.language === "string" ? session.user.language : "cs";
      const portal = await billingStripe().billingPortal.sessions.create({
        customer,
        locale: "cs",
        return_url: `${new URL(request.url).origin}${localeRedirectTarget("/account/billing", lang)}`,
      });
      return Response.json({ url: portal.url }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (error instanceof BillingUnavailableError) {
        return Response.json({ error: "Platby zatím nejsou dostupné." }, { status: 503 });
      }
      console.error("[billing] portal failed", error instanceof Error ? error.message : error);
      return Response.json({ error: "Správu předplatného se nepodařilo otevřít." }, { status: 502 });
    }
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}
