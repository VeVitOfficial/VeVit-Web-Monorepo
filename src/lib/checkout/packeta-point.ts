// Packeta pickup point mapping and validation request/response shapes (widget v6 + validation
// endpoint, docs.packeta.com/docs/pudo-delivery/widget). Pure: no aliases or node_modules.
import type { PacketaPoint } from "./checkout-input.ts";

/** Only Packeta's own pickup points and Z-BOXes in CZ/SK: external carriers have no branch id. */
export const PACKETA_VENDORS = [
  { country: "cz" },
  { country: "cz", group: "zbox" },
  { country: "sk" },
  { country: "sk", group: "zbox" },
];

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function text(value: unknown, limit: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed !== "" && [...trimmed].length <= limit ? trimmed : null;
}

function country(value: unknown): "CZ" | "SK" | null {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  return code === "CZ" || code === "SK" ? code : null;
}

function zip(value: unknown): string | null {
  const digits = typeof value === "string" ? value.replace(/\s/g, "") : "";
  return /^\d{5}$/.test(digits) ? digits : null;
}

function branchId(value: unknown): string | null {
  const id = typeof value === "string" || typeof value === "number" ? String(value) : "";
  return /^\d{1,10}$/.test(id) ? id : null;
}

function build(id: string, name: unknown, street: unknown, city: unknown, zipValue: unknown, countryValue: unknown, zbox: boolean): PacketaPoint | null {
  const mappedName = text(name, 160);
  const mappedStreet = text(street, 160);
  const mappedCity = text(city, 100);
  const mappedZip = zip(zipValue);
  const mappedCountry = country(countryValue);
  if (!mappedName || !mappedStreet || !mappedCity || !mappedZip || !mappedCountry) return null;
  return { id, name: mappedName, street: mappedStreet, city: mappedCity, zip: mappedZip, country: mappedCountry, kind: zbox ? "zbox" : "pickup" };
}

/**
 * Maps the object the widget passes to the pick callback. Returns null for anything the checkout
 * cannot ship to: no branch id (external carriers), unsupported country or a point the widget
 * marks as not selectable.
 */
export function pointFromWidget(raw: unknown): PacketaPoint | null {
  const source = record(raw);
  if (!source) return null;
  if (source.pickupPointType === "external" || (source.error !== undefined && source.error !== null)) return null;
  const id = branchId(source.id);
  if (id === null) return null;
  const zbox = source.group === "zbox" || /z-?box/i.test(String(source.name ?? ""));
  return build(id, source.name, source.street, source.city, source.zip, source.country, zbox);
}

/** Body for POST https://widget.packeta.com/v6/pps/api/widget/v1/validate; only the id comes from the client. */
export function buildValidationRequest(id: string, apiKey: string) {
  return {
    apiKey,
    point: { id },
    options: { country: "cz,sk", carriers: "packeta", vendors: PACKETA_VENDORS },
  };
}

export type PointValidation =
  | { status: "valid"; point: PacketaPoint }
  | { status: "invalid" }
  | { status: "unknown" };

/**
 * Reads the validation answer. A valid point is rebuilt from Packeta's own data (name, address,
 * group) so nothing the browser sent about the point reaches the order except its id.
 */
export function parseValidationResponse(id: string, json: unknown): PointValidation {
  const source = record(json);
  if (!source || typeof source.isValid !== "boolean") return { status: "unknown" };
  if (!source.isValid) return { status: "invalid" };
  const point = record(source.point);
  const address = record(point?.address);
  if (!point || !address) return { status: "unknown" };
  const rebuilt = build(id, point.name, address.street, address.city, address.zip, address.country, point.group === "zbox");
  return rebuilt ? { status: "valid", point: rebuilt } : { status: "unknown" };
}
