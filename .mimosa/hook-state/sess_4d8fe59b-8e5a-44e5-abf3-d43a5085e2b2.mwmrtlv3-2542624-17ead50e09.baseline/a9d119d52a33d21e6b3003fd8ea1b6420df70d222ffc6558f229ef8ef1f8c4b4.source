// Bezpečný renderer lehkého Markdownu pro obsah AIFB: jen **tučně** a *kurzíva*,
// žádné HTML. Výstupem je strom uzlů, který React vykreslí jako text, <strong>
// a <em>; nic se neinjektuje jako HTML. Veškerý ostatní text (včetně neoddělitelných
// mezer U+00A0) zůstává beze změny. Odkazy „kapitola N" / „oddíl N.M" se mění na
// uzly `ref` s kotvou na stránce Pro učitele (id g<N>, g<N>-<M>).
//
// Soubor je záměrně bez importů, aby ho šlo spustit přímo v Node (testy, validace).

export type InlineNode =
  | { type: "text"; text: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "em"; children: InlineNode[] }
  | { type: "ref"; text: string; anchor: string };

/** „kapitola 7", „kapitole 7", „oddílu 7.2", „Oddíl 1.4" (mezera i U+00A0). */
export const GUIDE_REF_PATTERN = /(?:kapitol\p{L}*|oddíl\p{L}*)[\s ]+(\d+)(?:\.(\d+))?/giu;

/** Kotva v průvodci: kapitola 7 → g7, oddíl 7.2 → g7-2. */
export function guideAnchor(chapter: string, section?: string): string {
  return section === undefined || section === "" ? `g${chapter}` : `g${chapter}-${section}`;
}

/** Index uzavírací * kurzívy od pozice `from`; vnořené **tučné** přeskočí. */
function findItalicClose(src: string, from: number): number {
  let j = from;
  while (j < src.length) {
    if (src.startsWith("**", j)) {
      const close = src.indexOf("**", j + 2);
      if (close === -1) return -1;
      j = close + 2;
      continue;
    }
    if (src[j] === "*") return j;
    j += 1;
  }
  return -1;
}

function parseMarks(src: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let buf = "";
  const flush = () => {
    if (buf !== "") {
      nodes.push({ type: "text", text: buf });
      buf = "";
    }
  };
  let i = 0;
  while (i < src.length) {
    if (src.startsWith("**", i)) {
      const close = src.indexOf("**", i + 2);
      if (close > i + 2) {
        flush();
        nodes.push({ type: "strong", children: parseMarks(src.slice(i + 2, close)) });
        i = close + 2;
        continue;
      }
    } else if (src[i] === "*") {
      const close = findItalicClose(src, i + 1);
      if (close > i + 1) {
        flush();
        nodes.push({ type: "em", children: parseMarks(src.slice(i + 1, close)) });
        i = close + 1;
        continue;
      }
    }
    buf += src[i];
    i += 1;
  }
  flush();
  return nodes;
}

function linkRefs(nodes: InlineNode[]): InlineNode[] {
  const out: InlineNode[] = [];
  for (const node of nodes) {
    if (node.type === "strong" || node.type === "em") {
      out.push({ ...node, children: linkRefs(node.children) });
      continue;
    }
    if (node.type !== "text") {
      out.push(node);
      continue;
    }
    let last = 0;
    for (const match of node.text.matchAll(GUIDE_REF_PATTERN)) {
      const start = match.index ?? 0;
      if (start > last) out.push({ type: "text", text: node.text.slice(last, start) });
      out.push({ type: "ref", text: match[0], anchor: guideAnchor(match[1], match[2]) });
      last = start + match[0].length;
    }
    if (last < node.text.length) out.push({ type: "text", text: node.text.slice(last) });
  }
  return out;
}

/** Rozloží text na uzly (tučně, kurzíva, odkazy do průvodce). Nikdy nevrací HTML. */
export function parseInline(src: string): InlineNode[] {
  return linkRefs(parseMarks(src));
}

/** Text bez značek (pro title, aria-label, řazení): `**a**` → `a`. */
export function plainText(src: string): string {
  const walk = (nodes: InlineNode[]): string =>
    nodes.map((node) => (node.type === "text" || node.type === "ref" ? node.text : walk(node.children))).join("");
  return walk(parseInline(src));
}

/** Všechny odkazy do průvodce, které text obsahuje (pro kontrolu existence oddílů). */
export function guideRefsIn(src: string): { text: string; anchor: string }[] {
  const refs: { text: string; anchor: string }[] = [];
  const walk = (nodes: InlineNode[]) => {
    for (const node of nodes) {
      if (node.type === "ref") refs.push({ text: node.text, anchor: node.anchor });
      else if (node.type === "strong" || node.type === "em") walk(node.children);
    }
  };
  walk(parseInline(src));
  return refs;
}
