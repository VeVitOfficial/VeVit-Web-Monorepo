import { timingSafeEqual } from "node:crypto";
import { runDueJobs } from "@/lib/jobs/payment-jobs";
import "server-only";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Job runner for jobs queued after a verified payment. Vercel Cron (Hobby plan: once a day) retries failed or stuck jobs with
 * "Authorization: Bearer <CRON_SECRET>"; the webhook also runs jobs itself right after a payment.
 * Without a configured secret nobody gets in.
 */

const HEADERS = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } as const;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (secret === "") return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return new Response(JSON.stringify({ error: { code: "unauthorized" } }), { status: 401, headers: HEADERS });
  }
  try {
    const result = await runDueJobs(10);
    return new Response(JSON.stringify(result), { status: 200, headers: HEADERS });
  } catch (error) {
    console.error("[store:jobs] runner failure", error instanceof Error ? error.name : "unknown");
    return new Response(JSON.stringify({ error: { code: "runner_failed" } }), { status: 500, headers: HEADERS });
  }
}
