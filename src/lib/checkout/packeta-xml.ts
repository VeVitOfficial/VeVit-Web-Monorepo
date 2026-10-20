// Packeta REST API (createPacket) request and response handling. Pure, no imports.
// Shape from docs.packeta.com/docs/packet-creation/packeta-pudos (REST tab, POST https://www.zasilkovna.cz/api/rest).

export type CreatePacketInput = {
  apiPassword: string;
  number: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  addressId: string;
  valueCzk: string;
  weightKg: string;
  eshop: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Packeta pickup point packet, prepaid (no cash on delivery), value in CZK. */
export function buildCreatePacketXml(input: CreatePacketInput): string {
  const fields: Array<[string, string]> = [
    ["number", input.number],
    ["name", input.name],
    ["surname", input.surname],
    ["email", input.email],
    ["phone", input.phone],
    ["addressId", input.addressId],
    ["value", input.valueCzk],
    ["currency", "CZK"],
    ["weight", input.weightKg],
    ["eshop", input.eshop],
  ];
  const attributes = fields.map(([tag, value]) => `<${tag}>${escapeXml(value)}</${tag}>`).join("");
  return `<createPacket><apiPassword>${escapeXml(input.apiPassword)}</apiPassword><packetAttributes>${attributes}</packetAttributes></createPacket>`;
}

function tagText(xml: string, tag: string): string | null {
  const match = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(xml);
  return match ? match[1]!.trim() : null;
}

function unescapeXml(value: string): string {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

export type CreatePacketResult = { ok: true; id: string; barcode: string } | { ok: false; fault: string };

/**
 * Reads the createPacket answer. A fault keeps the fault name, Packeta's text and, when present,
 * the offending field, so the stored job error says what to fix. It never includes the request.
 */
export function parseCreatePacketResponse(xml: string): CreatePacketResult {
  const status = tagText(xml, "status");
  if (status === "ok") {
    const id = tagText(xml, "id");
    const barcode = tagText(xml, "barcode");
    return id && /^\d+$/.test(id) && barcode ? { ok: true, id, barcode: unescapeXml(barcode) } : { ok: false, fault: "invalid_response" };
  }
  if (status !== "fault") return { ok: false, fault: "invalid_response" };
  const parts: string[] = [];
  const faultName = tagText(xml, "fault");
  if (faultName) parts.push(unescapeXml(faultName));
  const text = tagText(xml, "string");
  if (text) parts.push(unescapeXml(text));
  for (const match of xml.matchAll(/<name>([^<]*)<\/name>\s*<fault>([^<]*)<\/fault>/g)) {
    parts.push(`${unescapeXml(match[1]!.trim())}: ${unescapeXml(match[2]!.trim())}`);
  }
  return { ok: false, fault: parts.length > 0 ? parts.join(" | ").slice(0, 500) : "unknown_fault" };
}

const NAME_CHARS = /[^\p{L}\p{N} ,.'\-&()]/gu;

function cleanName(value: string): string {
  return value.replace(NAME_CHARS, " ").replace(/\s+/g, " ").trim();
}

/** Packeta wants name and surname, 1-32 chars each, from a limited character set. A single word is used for both. */
export function splitRecipientName(full: string): { name: string; surname: string } {
  const words = cleanName(full).split(" ").filter(Boolean);
  if (words.length === 0) return { name: "Zákazník", surname: "Zákazník" };
  const surname = words.length === 1 ? words[0]! : words[words.length - 1]!;
  const name = words.length === 1 ? words[0]! : words.slice(0, -1).join(" ");
  return { name: [...name].slice(0, 32).join(""), surname: [...surname].slice(0, 32).join("") };
}

/** Weight in kg with three decimals; Packeta rejects zero, so there is a 100 g floor. */
export function formatWeightKg(grams: number): string {
  const safe = Number.isFinite(grams) && grams > 0 ? grams : 100;
  return (Math.max(safe, 100) / 1000).toFixed(3);
}

export function minorToCzk(minor: number): string {
  return (minor / 100).toFixed(2);
}
