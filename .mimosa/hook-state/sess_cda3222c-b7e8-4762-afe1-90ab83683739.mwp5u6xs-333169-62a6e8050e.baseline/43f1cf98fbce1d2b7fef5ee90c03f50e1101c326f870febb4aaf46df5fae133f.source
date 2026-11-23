import { guarded } from "@/lib/office/runtime";
import * as oidc from "@/lib/office/oidc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return guarded(async (d) => oidc.jwks(d));
}
