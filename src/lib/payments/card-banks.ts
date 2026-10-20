// Czech/Slovak issuer table keyed by the first six card digits. Public BIN lists are incomplete and
// sometimes contradict each other, so a prefix listed under two banks is left out on purpose.

export type CardBankKey = "cs" | "csob" | "kb" | "rb" | "uc" | "moneta" | "airbank";

export type CardBank = {
  key: CardBankKey;
  name: string;
  background: string;
  foreground: string;
  logo: string;
};

const BANK_PREFIXES: Record<CardBankKey, string> = {
  cs: "414092 414084 406457 434359 440507 440508 440678 451158 451159 451160 451161 490729 494068 421577 440616 430119 440558 540718 544490 549077 550447 552733 556072 557890 520136",
  csob: "440752 440753 440754 491011 491080 491825 494359 494360 487494 526276 540452 543455 543463 544494 547122 547360 547361 547375 554275 554354 554355 554398 556071 557018 557019 558623",
  kb: "412500 412501 413015 427848 445965 445966 449319 449320 483737 491701 477975 446514 446515 420964 418803 491779 532185 532317 518998 543402 540298 540299 544322 547533 547698 549725 552857 552974 554286 554585 557711",
  // Includes the former Equa Bank ranges.
  rb: "408359 408360 408361 408363 408364 413093 414667 415461 418609 418808 418865 427881 472941 472942 472943 472944 474138 480234 520655 520637 527446 541934 541963 544208 548163 548164 548361 552682 558270 558278 548391 518651 512588 543769 544738 547982",
  uc: "433738 456803 456817 456820 457049 459017 460317 477996 477997 498568 479073 455734 429041 415012 528706 547055 547056 547431 547438 558499 542812",
  moneta: "478544 546882 543554 547411 553061 464461 529923",
  airbank: "516844",
};

export const CARD_BANKS: Record<CardBankKey, CardBank> = {
  cs: { key: "cs", name: "Česká spořitelna", background: "linear-gradient(135deg,#2870ed,#0b3d91)", foreground: "#fff", logo: "/payments/banks/cs.svg" },
  csob: { key: "csob", name: "ČSOB", background: "linear-gradient(135deg,#00a3e0,#003b71)", foreground: "#fff", logo: "/payments/banks/csob.svg" },
  kb: { key: "kb", name: "Komerční banka", background: "linear-gradient(135deg,#e4002b,#1a1a1a)", foreground: "#fff", logo: "/payments/banks/kb.svg" },
  rb: { key: "rb", name: "Raiffeisenbank", background: "linear-gradient(135deg,#fee600,#e8c900)", foreground: "#111", logo: "/payments/banks/rb.svg" },
  uc: { key: "uc", name: "UniCredit Bank", background: "linear-gradient(135deg,#e2001a,#7a0010)", foreground: "#fff", logo: "/payments/banks/uc.svg" },
  moneta: { key: "moneta", name: "MONETA Money Bank", background: "linear-gradient(135deg,#3c3c3c,#f26a21)", foreground: "#fff", logo: "/payments/banks/moneta.svg" },
  airbank: { key: "airbank", name: "Air Bank", background: "linear-gradient(135deg,#7ac943,#2e8b2e)", foreground: "#fff", logo: "/payments/banks/airbank.svg" },
};

export const BRAND_LOGOS: Record<"visa" | "mastercard" | "amex" | "maestro" | "applepay" | "googlepay" | "paypal", string> = {
  visa: "/payments/brands/visa.svg",
  mastercard: "/payments/brands/mastercard.svg",
  amex: "/payments/brands/amex.svg",
  maestro: "/payments/brands/maestro.svg",
  applepay: "/payments/brands/applepay.svg",
  googlepay: "/payments/brands/googlepay.svg",
  paypal: "/payments/brands/paypal.svg",
};

const BIN_LENGTH = 6;

const PREFIX_TO_BANK = new Map<string, CardBankKey>();
for (const key of Object.keys(BANK_PREFIXES) as CardBankKey[]) {
  for (const prefix of BANK_PREFIXES[key].split(" ")) PREFIX_TO_BANK.set(prefix, key);
}

export function prefixesOf(key: CardBankKey): readonly string[] {
  return BANK_PREFIXES[key].split(" ");
}

export function bankForDigits(digits: string): CardBank | null {
  if (digits.length < BIN_LENGTH) return null;
  const key = PREFIX_TO_BANK.get(digits.slice(0, BIN_LENGTH));
  return key ? CARD_BANKS[key] : null;
}
