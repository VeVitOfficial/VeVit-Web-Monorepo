import { agendaErrorPayload, agendaJson, agendaPrepareHttp, agendaUser } from "@/lib/store-agenda";
import { returnAccountList } from "@/lib/store-returns";
import { StoreError } from "@/lib/store-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Port of store/api/returns/list.php — every failure flattens to 401. */
async function handler(request: Request): Promise<Response> {
  try {
    agendaPrepareHttp(request, ["GET"]);
    const user = await agendaUser();
    // ReturnService::accountList — !isAuthenticated() || !userId()
    if (user === null || user.id === "") throw new Error("Verified account required.");
    const returns = await returnAccountList(user.id);
    return agendaJson({ returns }, "private, no-store");
  } catch (error) {
    if (error instanceof StoreError) return error.response;
    void error;
    return agendaErrorPayload(401, "verified_account_required", "Seznam vrácení vyžaduje ověřené přihlášení.");
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;