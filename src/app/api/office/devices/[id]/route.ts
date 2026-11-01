import { guarded } from "@/lib/office/runtime";
import * as office_api from "@/lib/office/office-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return guarded((d) => office_api.deviceRename(d, request, id));
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return guarded((d) => office_api.deviceUnlink(d, request, id));
}
