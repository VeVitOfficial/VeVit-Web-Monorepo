import type { PacketaPoint } from "@/lib/checkout/checkout-input";
import { buildCreatePacketXml, parseCreatePacketResponse, type CreatePacketInput, type CreatePacketResult } from "@/lib/checkout/packeta-xml";
import { buildValidationRequest, parseValidationResponse, type PointValidation } from "@/lib/checkout/packeta-point";
import "server-only";

/**
 * Packeta (Zásilkovna) server calls. The pickup point comes from the browser, so the checkout asks
 * Packeta whether the id is a real, currently usable point and keeps Packeta's data, not the
 * browser's. Packets are created from the point id alone.
 */

const VALIDATE_URL = "https://widget.packeta.com/v6/pps/api/widget/v1/validate";
const TIMEOUT_MS = 3000;

/** The widget key is public by design (it also ships to the browser); the API password never is. */
function widgetApiKey(): string {
  return process.env.NEXT_PUBLIC_PACKETA_API_KEY?.trim() ?? "";
}

export async function lookupPacketaPoint(point: PacketaPoint): Promise<PointValidation> {
  const apiKey = widgetApiKey();
  if (apiKey === "") return { status: "unknown" };
  try {
    const response = await fetch(VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-Language": "cs" },
      body: JSON.stringify(buildValidationRequest(point.id, apiKey)),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // 400/401 mean our request or key is wrong, not that the customer's point is: do not block the order.
    if (!response.ok) return { status: "unknown" };
    return parseValidationResponse(point.id, await response.json());
  } catch {
    return { status: "unknown" };
  }
}

/** "unknown" (Packeta unreachable or key missing) lets checkout continue; packet creation is the last check. */
export async function validatePacketaPoint(point: PacketaPoint): Promise<"valid" | "invalid" | "unknown"> {
  return (await lookupPacketaPoint(point)).status;
}

const REST_URL = "https://www.zasilkovna.cz/api/rest";
const CREATE_TIMEOUT_MS = 15000;

export class PacketaNotConfiguredError extends Error {
  constructor() {
    super("packeta_not_configured: PACKETA_API_PASSWORD or PACKETA_SENDER_LABEL is empty");
  }
}

/**
 * Creates the packet for a pickup point order. The point is addressed by its id only. Network
 * errors throw (the job retries); a fault from Packeta is returned so the job can store the reason.
 */
export async function createPacket(input: Omit<CreatePacketInput, "apiPassword" | "eshop">): Promise<CreatePacketResult> {
  const apiPassword = process.env.PACKETA_API_PASSWORD?.trim() ?? "";
  const eshop = process.env.PACKETA_SENDER_LABEL?.trim() ?? "";
  if (apiPassword === "" || eshop === "") throw new PacketaNotConfiguredError();
  const response = await fetch(REST_URL, {
    method: "POST",
    headers: { "Content-Type": "text/xml; charset=utf-8", Accept: "text/xml" },
    body: buildCreatePacketXml({ ...input, apiPassword, eshop }),
    cache: "no-store",
    signal: AbortSignal.timeout(CREATE_TIMEOUT_MS),
  });
  const parsed = parseCreatePacketResponse(await response.text());
  if (!parsed.ok && parsed.fault === "invalid_response" && !response.ok) return { ok: false, fault: `http_${response.status}` };
  return parsed;
}
