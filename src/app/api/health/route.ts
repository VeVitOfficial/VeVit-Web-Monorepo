import { resolveEdgeFunctionUrl } from "@/lib/edge-proxy";

export const dynamic = "force-dynamic";
export function GET() {
  const checks = {
    supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY),
    authEdgeFunction: Boolean(resolveEdgeFunctionUrl("auth")),
    apiEdgeFunction: Boolean(resolveEdgeFunctionUrl("api")),
    stripeWebhook: Boolean(resolveEdgeFunctionUrl("stripe"))
  };
  const healthy = Object.values(checks).every(Boolean);
  return Response.json(
    { status: healthy ? "ok" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
