// Sdílené číselníky VeVit Services (server i klient).

export const JOB_TYPES = [
  { value: "one_time", label: "Jednorázová zakázka", short: "Jednorázově", hint: "Jedna konkrétní práce s koncem." },
  { value: "recurring", label: "Opakovaná / pravidelná", short: "Pravidelně", hint: "Např. úklid každý týden, doučování 2× měsíčně." },
  { value: "long_term", label: "Dlouhodobá spolupráce", short: "Dlouhodobě", hint: "Průběžná práce na měsíce, správa, podpora." },
  { value: "part_time", label: "Brigáda", short: "Brigáda", hint: "Výpomoc na pár hodin nebo dní." },
] as const;

export type JobType = (typeof JOB_TYPES)[number]["value"];

export const BUDGET_TYPES = [
  { value: "fixed", label: "Cena za celou práci" },
  { value: "hourly", label: "Hodinová sazba" },
  { value: "negotiable", label: "Dohodou" },
] as const;

export type BudgetType = (typeof BUDGET_TYPES)[number]["value"];

export const REGIONS = [
  { value: "praha", label: "Praha" },
  { value: "stredocesky", label: "Středočeský kraj" },
  { value: "jihocesky", label: "Jihočeský kraj" },
  { value: "plzensky", label: "Plzeňský kraj" },
  { value: "karlovarsky", label: "Karlovarský kraj" },
  { value: "ustecky", label: "Ústecký kraj" },
  { value: "liberecky", label: "Liberecký kraj" },
  { value: "kralovehradecky", label: "Královéhradecký kraj" },
  { value: "pardubicky", label: "Pardubický kraj" },
  { value: "vysocina", label: "Kraj Vysočina" },
  { value: "jihomoravsky", label: "Jihomoravský kraj" },
  { value: "olomoucky", label: "Olomoucký kraj" },
  { value: "zlinsky", label: "Zlínský kraj" },
  { value: "moravskoslezsky", label: "Moravskoslezský kraj" },
] as const;

export const RADII = [5, 10, 25, 50, 100] as const;

export const POSTED = [
  { value: 1, label: "Za posledních 24 h" },
  { value: 3, label: "Za poslední 3 dny" },
  { value: 7, label: "Za poslední týden" },
  { value: 30, label: "Za poslední měsíc" },
] as const;

export const SORTS = [
  { value: "newest", label: "Nejnovější" },
  { value: "distance", label: "Nejblíže" },
  { value: "budget", label: "Nejvyšší rozpočet" },
  { value: "deadline", label: "Nejbližší termín" },
  { value: "offers", label: "Nejméně nabídek" },
] as const;

export type SortValue = (typeof SORTS)[number]["value"];

export const PAGE_SIZE = 20;

export function jobTypeLabel(value: string, short = false): string {
  const found = JOB_TYPES.find((item) => item.value === value);
  return found ? (short ? found.short : found.label) : value;
}

export function regionLabel(value: string): string {
  return REGIONS.find((item) => item.value === value)?.label ?? "";
}

/** Malá písmena bez diakritiky (stejně jako search_text v DB). */
export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
