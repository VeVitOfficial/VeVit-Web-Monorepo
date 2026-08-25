export const dynamic = "force-dynamic";
export function GET() {
  const checks = {
    supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY),
    authEdgeFunction: Boolean(process.env.SUPABASE_AUTH_FUNCTION_URL),
    apiEdgeFunction: Boolean(process.env.SUPABASE_API_FUNCTION_URL),
    stripeWebhook: Boolean(process.env.SUPABASE_STRIPE_WEBHOOK_URL)
  };
  const healthy = Object.values(checks).every(Boolean);
  return Response.json(
    { status: healthy ? "ok" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
