// Kontrola osobních údajů před odesláním textu do AI (pravidlo R2): e-mail, telefon, rodné číslo, adresa
// stránky. Používá ji klient (okamžité upozornění) i server (nikdy nespoléhá jen na klienta).
// Soubor je bez importů (klient, server, testy).

export type PersonalDataKind = "email" | "birthNumber" | "phone" | "url";

/** Vrací druh nalezeného osobního údaje, nebo null. Pořadí: rodné číslo před telefonem. */
export function detectPersonalData(text: string): PersonalDataKind | null {
  if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(text)) return "email";
  if (/\b\d{6}\s?\/\s?\d{3,4}\b/.test(text)) return "birthNumber";
  if (/(?:\+?\d[\s.-]?){9,}/.test(text)) return "phone";
  if (/https?:\/\/|\bwww\.[\w-]+\./i.test(text)) return "url";
  return null;
}
