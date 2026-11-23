import { guarded } from "@/lib/office/runtime";
import * as oidc from "@/lib/office/oidc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return guarded((d) => oidc.consentInfo(d, request));
}

export async function POST(request: Request) {
  return guarded((d) => oidc.consentDecision(d, request));
}
