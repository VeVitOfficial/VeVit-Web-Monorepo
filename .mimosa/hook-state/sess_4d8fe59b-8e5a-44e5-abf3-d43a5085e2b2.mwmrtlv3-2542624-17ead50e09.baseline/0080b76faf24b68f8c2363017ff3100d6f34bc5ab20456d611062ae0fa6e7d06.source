import { createHash, randomBytes } from "node:crypto";
import "server-only";

/**
 * Port of store/lib/orders/Money.php + SnapshotIntegrity.php.
 *
 * SnapshotIntegrity::hash MUST stay byte-identical with the PHP implementation:
 * it deep-sorts object keys (ksort, binary string comparison) and serializes
 * with no spaces, unicode unescaped and slashes unescaped (the JS defaults),
 * so plain JSON.stringify matches PHP's json_encode flags used there.
 */

export function decimalToMinor(value: string): number {
  const trimmed = value.trim();
  const match = /^([0-9]+)(?:\.([0-9]{1,2}))?$/.exec(trimmed);
  if (!match) throw new Error("Invalid decimal money value.");
  if (match[1]!.length > 16) throw new Error("Money value is too large.");
  const whole = Number(match[1]);
  if (!Number.isSafeInteger(whole) || whole > 92233720368547758) throw new Error("Money value is too large.");
  return whole * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}

export function minorToDecimal(minor: number): string {
  if (minor < 0) throw new Error("Money must not be negative.");
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
}

function sortRecursively(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortRecursively);
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortRecursively((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

export function snapshotIntegrityHash(snapshot: Record<string, unknown>): string {
  const copy = { ...snapshot };
  delete copy.snapshot_hash;
  return createHash("sha256").update(JSON.stringify(sortRecursively(copy))).digest("hex");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

/** PHP (int) cast: leading integer of the string form, 0 when absent. */
export function phpIntCast(value: unknown): number {
  if (typeof value === "number") return Math.trunc(value);
  const match = /^[+-]?\d+/.exec(String(value ?? "").trim());
  const parsed = match !== null ? Number.parseInt(match[0], 10) : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** PHP trim() default charlist (" \t\n\r\0\x0B"), not the Unicode set. */
export function phpTrim(value: string): string {
  return value.replace(/^[\t\n\v\f\r\0 ]+/, "").replace(/[\t\n\v\f\r\0 ]+$/, "");
}

/** mb_strlen() — code points, not UTF-16 units. */
export function phpMbLength(value: string): number {
  return Array.from(value).length;
}