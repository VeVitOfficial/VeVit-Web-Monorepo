import { guarded } from "@/lib/office/runtime";
import * as office_api from "@/lib/office/office-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  return guarded((d) => office_api.dnsAcme(d, request));
}

export async function DELETE(request: Request) {
  return guarded((d) => office_api.dnsAcme(d, request));
}
