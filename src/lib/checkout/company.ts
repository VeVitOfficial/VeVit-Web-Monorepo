// Czech company ID (ICO) validation and ARES response mapping. Pure, no imports.

export type PostalAddress = { street: string; city: string; zip: string; country: "CZ" | "SK" };

export type CompanyInfo = { ico: string; name: string; dic: string | null; address: PostalAddress };

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2];

export function icoValid(ico: string): boolean {
  if (!/^\d{8}$/.test(ico)) return false;
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += WEIGHTS[i]! * Number(ico[i]);
  const m = sum % 11;
  const check = m === 0 ? 1 : m === 1 ? 0 : 11 - m;
  return check === Number(ico[7]);
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

export function mapAresSubject(json: unknown): CompanyInfo | null {
  const root = record(json);
  const seat = record(root?.sidlo);
  const ico = text(root?.ico);
  const name = text(root?.obchodniJmeno);
  if (!root || !seat || !ico || !/^\d{8}$/.test(ico) || !name) return null;

  const house = num(seat.cisloDomovni);
  const orientation = num(seat.cisloOrientacni);
  const place = text(seat.nazevUlice) ?? text(seat.nazevCastiObce) ?? text(seat.nazevObce);
  const city = text(seat.nazevMestskehoObvodu) ?? text(seat.nazevObce);
  const psc = num(seat.psc);
  if (!place || !city || house === null || psc === null) return null;

  return {
    ico,
    name,
    dic: text(root.dic),
    address: {
      street: `${place} ${house}${orientation !== null ? `/${orientation}` : ""}`,
      city,
      zip: String(psc).padStart(5, "0"),
      country: "CZ",
    },
  };
}
