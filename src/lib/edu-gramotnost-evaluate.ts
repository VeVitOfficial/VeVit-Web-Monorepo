/**
 * Port of evaluateExercise() from edu/ai-gramotnost/api/exercises.php —
 * exercise-type-aware answer evaluation with PHP parity (strtolower → ASCII
 * lowercase, round() → half away from zero, (int) casts, `?:`/`??` semantics,
 * PHP 8 scalar/array comparison after sort()).
 */

type PhpMap = Record<string, unknown>;

/** PHP `(array)` cast of a scalar/null → single-element/empty list. */
function phpArray(value: unknown): unknown[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return Object.values(value as PhpMap);
  return [value];
}

/** PHP `(string)` cast. */
function phpStr(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "";
  return "Object";
}

/** PHP `?:` emptiness test (null/false/0/''/'0'/[]/{} are falsy). */
function phpTruthy(value: unknown): boolean {
  if (value === null || value === undefined || value === false) return false;
  if (typeof value === "string") return value.length > 0 && value !== "0";
  if (typeof value === "number") return value !== 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

/** Missing/null-safe PHP `$arr['key'] ?? null` view over an answer value. */
function asPhpMap(value: unknown): PhpMap {
  return value !== null && typeof value === "object" ? (value as PhpMap) : {};
}

function prop(map: PhpMap, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
}

/** PHP strtolower() — ASCII-only lowercasing. */
function asciiLower(value: string): string {
  return value.replace(/[A-Z]/g, (c) => c.toLowerCase());
}

/**
 * PHP sort() over a list of ids/values — PHP 8 comparison (numeric strings
 * compare numerically, everything else as binary strings).
 */
function phpSort(values: unknown[]): unknown[] {
  return [...values].sort((a, b) => {
    const sa = phpStr(a);
    const sb = phpStr(b);
    const numeric = /^(?:[+-]?\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/;
    if (numeric.test(sa) && numeric.test(sb)) {
      const na = Number(sa);
      const nb = Number(sb);
      return na === nb ? 0 : na < nb ? -1 : 1;
    }
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  });
}

/** PHP array `==` after sort(): same length and value-wise equality via strval. */
function phpListEquals(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (phpStr(a[i]) !== phpStr(b[i])) return false;
  }
  return true;
}

/** PHP round() — half away from zero (JS Math.round is half-up). */
function phpRound(value: number): number {
  if (!Number.isFinite(value)) return Math.trunc(value);
  const floor = Math.floor(value);
  const diff = value - floor;
  return diff > 0.5 ? floor + 1 : diff < 0.5 ? floor : (floor % 2 === 0 ? floor : floor + 1);
}

export function evaluateExercise(
  type: unknown, answer: unknown, correct: unknown, config: unknown,
): { is_correct: boolean; score: number; feedback: string } {
  const a: unknown = phpTruthy(answer) ? answer : [];
  const cor: unknown = phpTruthy(correct) ? correct : [];
  const ans = asPhpMap(a);
  const corMap = asPhpMap(cor);
  const cfg = asPhpMap(config);

  switch (type) {
    case "multiple_choice":
    case "true_false": {
      const sel = phpSort(phpArray(prop(ans, "selectedIds")).map((v) => phpStr(v)));
      const corIds = phpSort(phpArray(prop(corMap, "correctIds")).map((v) => phpStr(v)));
      const ok = phpListEquals(sel, corIds);
      return { is_correct: ok, score: ok ? 100 : 0, feedback: ok ? "Správná volba." : "Odpověď není správná." };
    }
    case "fill_blank": {
      const vals = phpArray(prop(ans, "values")).map((v) => asciiLower(phpStr(v)).trim());
      const answers = phpArray(prop(corMap, "answers")).map((v) => asciiLower(phpStr(v)).trim());
      const total = Math.max(answers.length, vals.length, 1);
      let match = 0;
      for (let i = 0; i < total; i++) {
        if ((vals[i] ?? "") === (answers[i] ?? "")) match += 1;
      }
      const ok = match === total;
      return {
        is_correct: ok,
        score: Math.trunc(phpRound((match / total) * 100)),
        feedback: ok ? "Vše vyplněno správně." : `Správně ${match} z ${total}.`,
      };
    }
    case "sorting": {
      const order = phpArray(prop(ans, "order")).map((v) => phpStr(v));
      const corOrder = phpArray(prop(corMap, "order")).map((v) => phpStr(v));
      const ok = phpListEquals(order, corOrder);
      return { is_correct: ok, score: ok ? 100 : 0, feedback: ok ? "Správné pořadí." : "Pořadí nesouhlasí." };
    }
    case "matching": {
      const pairs = phpArray(prop(ans, "pairs"));
      const corPairs = phpArray(prop(corMap, "pairs"));
      let match = 0;
      const total = Math.max(corPairs.length, pairs.length, 1);
      for (const rawPair of pairs) {
        const pair = asPhpMap(rawPair);
        for (const rawCorPair of corPairs) {
          const corPair = asPhpMap(rawCorPair);
          if (phpStr(corPair.leftId) === phpStr(pair.leftId) && phpStr(corPair.rightId) === phpStr(pair.rightId)) {
            match += 1;
            break;
          }
        }
      }
      const ok = match === total;
      return {
        is_correct: ok,
        score: Math.trunc(phpRound((match / total) * 100)),
        feedback: ok ? "Vše spárováno správně." : `Správně ${match} z ${total} párování.`,
      };
    }
    case "drag_drop": {
      const placements = asPhpMap(prop(ans, "placements"));
      const corPlacements = asPhpMap(prop(corMap, "placements"));
      let match = 0;
      const total = Math.max(Object.keys(corPlacements).length, Object.keys(placements).length, 1);
      for (const [id, zone] of Object.entries(placements)) {
        if (Object.prototype.hasOwnProperty.call(corPlacements, id) && corPlacements[id] !== null
          && phpStr(corPlacements[id]) === phpStr(zone)) match += 1;
      }
      const ok = match === total;
      return {
        is_correct: ok,
        score: Math.trunc(phpRound((match / total) * 100)),
        feedback: ok ? "Vše umístěno správně." : `Správně ${match} z ${total}.`,
      };
    }
    case "prompt_builder": {
      const order = phpArray(prop(ans, "order")).map((v) => phpStr(v));
      const corOrder = phpArray(prop(corMap, "order")).map((v) => phpStr(v));
      const ok = phpListEquals(order, corOrder);
      return {
        is_correct: ok,
        score: ok ? 100 : 40,
        feedback: ok ? "Perfektní struktura promptu." : "Struktura nesouhlasí – zkontroluj pořadí bloků.",
      };
    }
    case "code_playground": {
      const code = asciiLower(phpStr(prop(ans, "code")));
      const kws = phpArray(prop(corMap, "keywords")).map((v) => asciiLower(phpStr(v)));
      const out = phpStr(prop(ans, "output"));
      let hit = 0;
      for (const k of kws) {
        if (k && code.includes(k)) hit += 1;
      }
      const kwOk = kws.length > 0 ? hit === kws.length : true;
      const expectsOutput = phpTruthy(prop(corMap, "expectedOutput"));
      const outOk = !expectsOutput || out.trim() === phpStr(prop(corMap, "expectedOutput")).trim();
      const ok = kwOk && outOk;
      const score = (kwOk ? 60 : (hit * 60) / Math.max(kws.length, 1)) + (outOk ? 40 : 0);
      return {
        is_correct: ok,
        score: Math.trunc(phpRound(score)),
        feedback: ok ? "Kód splňuje požadavky." : "Kód neobsahuje všechny očekávané konstrukce.",
      };
    }
    case "simulation": {
      const ok = phpTruthy(prop(asPhpMap(ans), "won"));
      return { is_correct: ok, score: ok ? 100 : 0, feedback: ok ? "Cíl simulace dosažen!" : "Cíl nedosáhnut – zkus jiný přístup." };
    }
    case "open_response": {
      const txt = asciiLower(phpStr(prop(ans, "text")));
      const rawKws = prop(corMap, "keywords") !== null && prop(corMap, "keywords") !== undefined
        ? prop(corMap, "keywords")
        : (prop(cfg, "keywords") !== null && prop(cfg, "keywords") !== undefined ? prop(cfg, "keywords") : []);
      const kws = phpArray(rawKws).map((v) => asciiLower(phpStr(v)));
      let hit = 0;
      for (const k of kws) {
        if (k && txt.includes(k)) hit += 1;
      }
      const need = Math.max(kws.length, 1);
      const score = Math.trunc(phpRound((hit / need) * 100));
      const ok = score >= 70;
      return { is_correct: ok, score, feedback: `Nalezeno ${hit} z ${need} klíčových prvků.` };
    }
  }
  return { is_correct: false, score: 0, feedback: "Neznámý typ cvičení." };
}