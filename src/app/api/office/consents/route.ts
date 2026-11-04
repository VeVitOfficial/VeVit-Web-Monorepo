import { guarded } from "@/lib/office/runtime";
import * as office_api from "@/lib/office/office-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return guarded((d) => office_api.consentsList(d, request));
}
