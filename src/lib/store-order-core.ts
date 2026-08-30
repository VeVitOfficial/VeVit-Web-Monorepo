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