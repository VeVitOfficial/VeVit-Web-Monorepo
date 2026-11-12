import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isCrossSiteRequest } from "../../src/lib/request-origin.ts";

const req = (headers) => new Request("https://www.vevit.cz/account/api/x", { method: "POST", headers });

test("Sec-Fetch-Site cross-site je zamítnuto", () => {
  assert.equal(isCrossSiteRequest(req({ "sec-fetch-site": "cross-site", host: "www.vevit.cz" })), true);
});

test("Origin cizí domény je zamítnut, vlastní projde", () => {
  assert.equal(isCrossSiteRequest(req({ origin: "https://evil.example", host: "www.vevit.cz" })), true);
  assert.equal(isCrossSiteRequest(req({ origin: "https://www.vevit.cz", host: "www.vevit.cz" })), false);
  assert.equal(isCrossSiteRequest(req({ origin: "https://evil.example", "x-forwarded-host": "www.vevit.cz" })), true);
});

test("poškozený Origin se bere jako cizí", () => {
  assert.equal(isCrossSiteRequest(req({ origin: "not a url", host: "www.vevit.cz" })), true);
});

test("požadavek bez Origin/Sec-Fetch-Site (server-to-server) projde", () => {
  assert.equal(isCrossSiteRequest(req({ host: "www.vevit.cz" })), false);
  assert.equal(isCrossSiteRequest(req({ "sec-fetch-site": "same-origin", host: "www.vevit.cz" })), false);
});

test("účtové routy i AI proxy používají guard, reset hesla sdílenou politiku", () => {
  const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
  assert.match(read("src/lib/account-route.ts"), /isCrossSiteRequest/);
  const proxy = read("src/app/edu/php/ai-proxy.php/route.ts");
  assert.match(proxy, /isCrossSiteRequest/);
  assert.match(proxy, /toolsRateLimit/);
  assert.doesNotMatch(proxy, /upstream: phpMbSubstr/);
  assert.match(read("src/app/account/api/reset-password.php/route.ts"), /registerPasswordError/);
});
