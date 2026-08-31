import { parse, serialize, type DefaultTreeAdapterMap } from "parse5";

type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];

// Port of edu/php/wikipedia-sanitize.php: second server-side defense layer
// for HTML fetched from Wikipedia. The client still runs DOMPurify before
// the result is inserted into the page DOM.

const ALLOWED_TAGS = new Set([
  "article", "section", "div", "span", "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u",
  "s", "small", "sub", "sup", "blockquote", "pre", "code", "kbd", "var",
  "ul", "ol", "li", "dl", "dt", "dd", "figure", "figcaption", "picture",
  "table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td", "a", "img",
]);

const DROP_TAGS = new Set([
  "script", "style", "iframe", "object", "embed", "svg", "math", "form",
  "input", "button", "select", "textarea", "option", "link", "base", "meta",
  "template", "noscript", "video", "audio", "source", "track", "canvas",
]);

const ALLOWED_ATTRIBUTES = new Set([
  "id", "class", "title", "lang", "dir", "href", "src", "alt", "width",
  "height", "colspan", "rowspan", "scope", "loading",
]);

function isElement(node: Node): node is Element {
  return (node as { tagName?: string }).tagName !== undefined;
}

function collectElementDescendants(node: Node, out: Element[]): void {
  for (const child of (node as { childNodes?: Node[] }).childNodes ?? []) {
    if (isElement(child)) {
      out.push(child);
    }
    collectElementDescendants(child, out);
  }
}

function elementById(node: Node, id: string): Element | null {
  if (isElement(node) && node.attrs.some((attr) => attr.name === "id" && attr.value === id)) {
    return node;
  }
  for (const child of (node as { childNodes?: Node[] }).childNodes ?? []) {
    const found = elementById(child, id);
    if (found !== null) return found;
  }
  return null;
}

function detach(node: Element): void {
  const parent = (node as unknown as { parentNode?: Node }).parentNode as Element | null;
  if (parent?.childNodes) {
    parent.childNodes = parent.childNodes.filter((child) => child !== node);
    (node as unknown as { parentNode: Node | null }).parentNode = null;
  }
}

function unwrap(node: Element): void {
  const parent = (node as unknown as { parentNode?: Node }).parentNode as Element | null;
  const childNodes = node.childNodes ?? [];
  if (parent?.childNodes) {
    const index = parent.childNodes.indexOf(node);
    parent.childNodes = [
      ...parent.childNodes.slice(0, index),
      ...childNodes,
      ...parent.childNodes.slice(index + 1),
    ];
    for (const child of childNodes) {
      (child as unknown as { parentNode: Node }).parentNode = parent;
    }
  }
  (node as unknown as { childNodes: Node[] }).childNodes = [];
  (node as unknown as { parentNode: Node | null }).parentNode = null;
}

function findAttribute(element: Element, name: string): { name: string; value: string } | undefined {
  return element.attrs.find((attr) => attr.name === name);
}

export function phpStripTags(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…", lsquo: "‘",
  rsquo: "’", ldquo: "“", rdquo: "”", eacute: "é",
  aacute: "á", ccaron: "č", iacute: "í", yacute: "ý",
  uacute: "ú", scaron: "š", zcaron: "ž", copy: "©",
  reg: "®", trade: "™", deg: "°", middot: "·",
};

export function phpHtmlEntityDecode(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (entity, body: string) => {
    if (body.startsWith("#")) {
      const code = body.length > 1
        ? parseInt(body[1] === "x" || body[1] === "X" ? body.slice(2) : body.slice(1), body[1] === "x" || body[1] === "X" ? 16 : 10)
        : NaN;
      const safe = Number.isInteger(code) && code > 0 && code <= 0x10ffff ? code : 0xfffd;
      try {
        return String.fromCodePoint(safe);
      } catch {
        return entity;
      }
    }
    return NAMED_ENTITIES[body] ?? entity;
  });
}

export function phpMbSubstr(text: string, start: number, length: number): string {
  return [...text].slice(start, start + length).join("");
}

export function vevitWikipediaSanitizeHtml(html: string): string {
  try {
    // PHP wraps the fragment in a UTF-8-declared root div the same way to
    // keep encoding and fragment parsing aligned.
    const document = parse(`<!doctype html><div id="vevit-wiki-root">${html}</div>`);
    const root = elementById(document, "vevit-wiki-root");
    if (root === null) return "";

    const nodes: Element[] = [];
    collectElementDescendants(root as unknown as Node, nodes);
    // Reverse document order so descendants are handled before ancestors —
    // the same order the PHP DOM walker uses.
    nodes.reverse();

    for (const node of nodes) {
      // Nodes can be detached as part of an ancestor drop/unwrap, but that
      // can never happen here: descendants precede ancestors and mutation
      // only happens on the current node.
      const tag = node.tagName.toLowerCase();
      if (DROP_TAGS.has(tag)) {
        detach(node);
        continue;
      }
      if (!ALLOWED_TAGS.has(tag)) {
        unwrap(node);
        continue;
      }
      node.attrs = node.attrs.filter((attribute) => {
        const lower = attribute.name.toLowerCase();
        if (lower.startsWith("on") || lower === "srcdoc") return false;
        return ALLOWED_ATTRIBUTES.has(lower);
      });

      const href = findAttribute(node, "href");
      if (href) {
        let value = href.value.trim();
        if (value.startsWith("//")) value = `https:${value}`;
        if (!/^(?:https:\/\/|\/|\.\/|#)/i.test(value)) {
          node.attrs = node.attrs.filter((attribute) => attribute !== href);
        } else {
          href.value = value;
        }
      }
      const src = findAttribute(node, "src");
      if (src) {
        let value = src.value.trim();
        if (value.startsWith("//")) value = `https:${value}`;
        if (!/^https:\/\/upload\.wikimedia\.org\//i.test(value)) {
          node.attrs = node.attrs.filter((attribute) => attribute !== src);
        } else {
          src.value = value;
        }
      }
    }

    // serialize() on an element serializes its children — the equivalent of
    // the PHP loop over root childNodes.
    return serialize(root as unknown as DefaultTreeAdapterMap["parentNode"]);
  } catch {
    return "";
  }
}