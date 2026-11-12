import test from "node:test";
import assert from "node:assert/strict";
import { vevitWikipediaSanitizeHtml as sanitize } from "../../src/lib/edu-wikipedia-sanitize.ts";

// Server-side sanitizer for Wikipedia HTML that reaches dangerouslySetInnerHTML.
const PAYLOADS = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  '<a href="javascript:alert(1)">x</a>',
  '<a href="JaVaScRiPt:alert(1)">x</a>',
  '<a href="&#106;avascript:alert(1)">x</a>',
  "<svg onload=alert(1)>",
  '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
  "<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>",
  '<p style="background:url(javascript:alert(1))">x</p>',
  '<form action="javascript:alert(1)"><button>x</button></form>',
  '<a href="data:text/html,<script>alert(1)</script>">x</a>',
  '<object data="x"></object><embed src="x">',
  '<base href="//evil.example/">',
  '<meta http-equiv="refresh" content="0;url=//evil">',
  '<div onclick="alert(1)">x</div>',
  '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
  "<link rel=stylesheet href=//evil>",
];
const DANGEROUS = /<script|\son\w+\s*=|javascript:|<iframe|<object|<embed|<base|<meta|<form|srcdoc|data:text/i;

for (const payload of PAYLOADS) {
  test(`XSS payload odstraněn: ${payload.slice(0, 50)}`, () => {
    assert.doesNotMatch(sanitize(payload), DANGEROUS);
  });
}

test("běžný obsah článku zůstane", () => {
  const out = sanitize('<p>Ahoj <b>světe</b> <a href="https://cs.wikipedia.org/wiki/Praha">Praha</a></p>');
  assert.match(out, /<b>světe<\/b>/);
  assert.match(out, /href="https:\/\/cs\.wikipedia\.org\/wiki\/Praha"/);
});
