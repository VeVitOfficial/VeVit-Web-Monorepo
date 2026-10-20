import { BRAND_LOGOS } from "@/lib/payments/card-banks";
import type { CardBrand } from "@/lib/payments/card-validation";
import type { BankView, Zone } from "./use-card-form";
import styles from "./card-gateway.module.css";

const NEUTRAL_BACKGROUND = "linear-gradient(135deg,#3a3f47,#15181c)";
const BRAND_NAMES: Record<CardBrand, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", maestro: "Maestro" };

type Props = {
  digits: string;
  brand: CardBrand | null;
  bank: BankView | null;
  bankUnknown: boolean;
  holder: string;
  expiry: string;
  cvcLength: number;
  cvcTyped: number;
  focused: Zone | null;
  badZones: Zone[];
};

type Slot = { ch: string; index: number };

function numberGroups(digits: string, brand: CardBrand | null): Slot[][] {
  const sizes = brand === "amex" ? [4, 6, 5] : [4, 4, 4, 4];
  const total = brand === "amex" ? 15 : Math.max(16, digits.length);
  const groups: Slot[][] = [];
  let pos = 0;
  for (const size of sizes) {
    if (pos >= total) break;
    const group: Slot[] = [];
    for (let i = 0; i < size && pos < total; i++, pos++) group.push({ ch: pos < digits.length ? digits[pos]! : "•", index: pos });
    groups.push(group);
  }
  // Longer-than-16 numbers (Maestro/Visa 19) spill into one extra group.
  if (pos < total) {
    const spill: Slot[] = [];
    for (; pos < total; pos++) spill.push({ ch: pos < digits.length ? digits[pos]! : "•", index: pos });
    groups.push(spill);
  }
  return groups;
}

function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function CardPreview({ digits, brand, bank, bankUnknown, holder, expiry, cvcLength, cvcTyped, focused, badZones }: Props) {
  const background = bank?.background ?? NEUTRAL_BACKGROUND;
  const color = bank?.foreground ?? "#fff";
  const faceStyle = { background, color };
  const zoneClass = (zone: Zone) =>
    [styles.zone, focused === zone ? styles.active : "", badZones.includes(zone) ? styles.bad : ""].filter(Boolean).join(" ");

  return (
    <div className={styles.stage} aria-hidden="true">
      <div className={`${styles.card} ${focused === "cvc" ? styles.flipped : ""}`}>
        <div className={`${styles.face} ${styles.front}`} style={faceStyle}>
          <div className={styles.top}>
            <div className={styles.bank}>
              {bank ? (
                <span className={styles.bankRow} key={bank.name}>
                  {bank.logo && (
                    <span className={styles.bankLogo}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="" src={bank.logo} />
                    </span>
                  )}
                  <span>{bank.name}</span>
                </span>
              ) : bankUnknown ? <small>banka nerozpoznána</small> : null}
            </div>
            {brand && (
              <span className={styles.brand} key={brand}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={BRAND_NAMES[brand]} src={BRAND_LOGOS[brand]} />
              </span>
            )}
          </div>
          <div className={styles.chip} />
          <div className={zoneClass("number")}>
            <div className={styles.number}>
              {numberGroups(digits, brand).map((group, gi) => (
                <span key={gi}>
                  {group.map(({ ch, index }) => ch === "•"
                    ? <span className={styles.placeholderDigit} key={index}>{ch}</span>
                    : <span className={styles.digit} key={`${index}-${ch}`}>{ch}</span>)}
                  &nbsp;
                </span>
              ))}
            </div>
          </div>
          <div className={styles.row}>
            <div className={zoneClass("name")} style={{ flex: 1, minWidth: 0 }}>
              <div className={styles.label}>Držitel karty</div>
              <div className={styles.val}>{holder.trim() ? stripDiacritics(holder) : "JMÉNO PŘÍJMENÍ"}</div>
            </div>
            <div className={zoneClass("exp")}>
              <div className={styles.label}>Platnost</div>
              <div className={styles.val}>{expiry || "MM/RR"}</div>
            </div>
          </div>
        </div>
        <div className={`${styles.face} ${styles.back}`} style={faceStyle}>
          <div className={styles.strip} />
          <div className={styles.sig}>
            <div className={styles.sigBand} />
            <div className={zoneClass("cvc")}>
              <div className={styles.cvc}>{cvcTyped > 0 ? "•".repeat(cvcTyped) : "•".repeat(cvcLength)}</div>
            </div>
          </div>
          <div className={styles.backNote}>
            {cvcLength === 4 ? "Čtyři číslice na přední straně karty" : "Tři číslice na zadní straně karty"}
          </div>
        </div>
      </div>
    </div>
  );
}
