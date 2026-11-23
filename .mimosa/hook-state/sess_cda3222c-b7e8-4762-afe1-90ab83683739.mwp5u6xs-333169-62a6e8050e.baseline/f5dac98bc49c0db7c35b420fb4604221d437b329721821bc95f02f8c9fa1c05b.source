// Vykreslení lehkého Markdownu AIFB do Reactu: text, <strong>, <em> a odkazy do průvodce.
// Nic se nevkládá jako HTML (žádné dangerouslySetInnerHTML); U+00A0 zůstává v textu.

import Link from "next/link";
import type { ReactNode } from "react";
import { parseInline, type InlineNode } from "@/lib/edu/aifb/markdown";
import { guidePath } from "@/lib/edu/aifb/routes";

export type RichTextContext = {
  locale: string;
  categoryId: string;
};

function renderNodes(nodes: InlineNode[], ctx: RichTextContext, keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}${index}`;
    switch (node.type) {
      case "text":
        return node.text;
      case "strong":
        return <strong key={key}>{renderNodes(node.children, ctx, `${key}.`)}</strong>;
      case "em":
        return <em key={key}>{renderNodes(node.children, ctx, `${key}.`)}</em>;
      case "ref":
        return (
          <Link key={key} href={guidePath(ctx.locale, ctx.categoryId, node.anchor)} className="aifb-ref">
            {node.text}
          </Link>
        );
    }
  });
}

/** Vloží text jako řadu uzlů (bez obalu); pro odstavec použij <p><RichText/></p>. */
export function RichText({ text, ctx }: { text: string; ctx: RichTextContext }) {
  return <>{renderNodes(parseInline(text), ctx, "")}</>;
}
