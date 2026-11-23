// Bez závislosti na slovnících, aby šel použít i v klientských komponentách (t z useEduLang).
type T = (key: string, vars?: Record<string, string | number>) => string;

/** České skloňování počtu: 1 / 2–4 / ostatní. Klíče `<base>.one|few|many`. */
export function countWord(t: T, base: string, count: number): string {
  const form = count === 1 ? "one" : count >= 2 && count <= 4 ? "few" : "many";
  return `${count} ${t(`${base}.${form}`)}`;
}
