import test from "node:test";
import assert from "node:assert/strict";
import { guideAnchor, guideRefsIn, parseInline, plainText } from "../../src/lib/edu/aifb/markdown.ts";

test("tučně a kurzíva se mění na uzly, ne na HTML", () => {
  assert.deepEqual(parseInline("a **b** c *d* e"), [
    { type: "text", text: "a " },
    { type: "strong", children: [{ type: "text", text: "b" }] },
    { type: "text", text: " c " },
    { type: "em", children: [{ type: "text", text: "d" }] },
    { type: "text", text: " e" },
  ]);
});

test("vnořené tučné a kurzíva (obě pořadí)", () => {
  assert.deepEqual(parseInline("**tučné *kurzíva* uvnitř**"), [
    {
      type: "strong",
      children: [
        { type: "text", text: "tučné " },
        { type: "em", children: [{ type: "text", text: "kurzíva" }] },
        { type: "text", text: " uvnitř" },
      ],
    },
  ]);
  assert.deepEqual(parseInline("*kurzíva **tučné** uvnitř*"), [
    {
      type: "em",
      children: [
        { type: "text", text: "kurzíva " },
        { type: "strong", children: [{ type: "text", text: "tučné" }] },
        { type: "text", text: " uvnitř" },
      ],
    },
  ]);
});

test("neoddělitelné mezery U+00A0 zůstanou beze změny", () => {
  const src = "v lese **a potom** k domovu";
  const joined = (nodes) => nodes.map((n) => (n.type === "text" ? n.text : joined(n.children))).join("");
  assert.equal(joined(parseInline(src)), "v lese a potom k domovu");
  assert.ok(plainText(src).includes(" "));
  assert.equal(plainText(src), "v lese a potom k domovu");
});

test("nepárové hvězdičky a HTML zůstanou obyčejným textem", () => {
  assert.deepEqual(parseInline("5 * 3 a **nezavřené"), [{ type: "text", text: "5 * 3 a **nezavřené" }]);
  assert.deepEqual(parseInline("<b>x</b>"), [{ type: "text", text: "<b>x</b>" }]);
});

test("kapitola N a oddíl N.M se mění na odkazy do průvodce", () => {
  const nodes = parseInline("Viz oddíl 7.2 a kapitola 8, případně oddílu 1.4.");
  const refs = nodes.filter((n) => n.type === "ref");
  assert.deepEqual(refs.map((n) => [n.text, n.anchor]), [
    ["oddíl 7.2", "g7-2"],
    ["kapitola 8", "g8"],
    ["oddílu 1.4", "g1-4"],
  ]);
  assert.equal(guideAnchor("7", "2"), "g7-2");
  assert.equal(guideAnchor("7"), "g7");
});

test("odkaz uvnitř tučného textu se zachová", () => {
  assert.deepEqual(guideRefsIn("**viz kapitola 7**"), [{ text: "kapitola 7", anchor: "g7" }]);
});
