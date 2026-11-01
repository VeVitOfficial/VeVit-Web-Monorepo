import { guarded } from "@/lib/office/runtime";
import * as email_verify from "@/lib/office/email-verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return guarded((d) => email_verify.emailVerifyConfirm(d, request));
}
