import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), "utf8");

function routes(dir) {
  const out = [];
  for (const name of readdirSync(join(root, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(join(root, rel)).isDirectory()) out.push(...routes(rel));
    else if (name === "route.ts") out.push(rel);
  }
  return out;
}
const mutating = (src) => /export (?:async )?function (?:POST|PUT|PATCH|DELETE)\b|export const (?:POST|PUT|PATCH|DELETE)\b/.test(src);

test("účtové mutace mají CSRF/origin ochranu nebo jsou záměrně veřejné", () => {
  // Veřejné přihlašovací/registrační kroky bez session (chrání je limit, anti-bot a Turnstile).
  const publicByDesign = new Set([
    "login.php", "register.php", "forgot-password.php", "reset-password.php", "nickname-availability.php",
    "csp-report.php", "2fa/login-verify.php", "2fa/recovery-verify.php",
  ]);
  const guarded = /handleAccountRequest|csrfValid|consoleWriteActor/;
  for (const file of routes("src/app/account/api")) {
    const src = read(file);
    if (!mutating(src)) continue;
    const key = file.replace("src/app/account/api/", "").replace("/route.ts", "");
    if (publicByDesign.has(key)) continue;
    assert.match(src, guarded, `${file} je mutace bez CSRF/origin ochrany`);
  }
  assert.match(read("src/lib/account-route.ts"), /isCrossSiteRequest/);
});

test("kvízové zápisy vyžadují CSRF token a povolený origin", () => {
  for (const file of routes("src/app/edu/api/quiz")) {
    const src = read(file);
    if (!mutating(src) || file.includes("dispatch.php")) continue;
    assert.match(src, /handleQuizWriteRequest/, file);
    assert.doesNotMatch(src, /export async function POST[\s\S]{0,200}handleQuizRequest\(/, `${file}: POST bez write guardu`);
  }
  const dispatch = read("src/app/edu/api/quiz/predictions/dispatch.php/route.ts");
  assert.match(dispatch, /timingSafeEqual/);
  assert.match(dispatch, /configured\.length < 32/);
});

test("školní a AIFB zápisy jdou přes apiActor (origin + session + CSRF)", () => {
  for (const file of ["src/app/edu/api/school/vstup/route.ts", "src/app/edu/api/school/sprava/route.ts", "src/app/edu/api/school/ucitel/route.ts", "src/app/edu/api/school/prubeh/route.ts", "src/app/edu/api/aifb/upravy/route.ts"]) {
    assert.match(read(file), /apiActor\(request\)/, file);
  }
  const api = read("src/lib/edu/aifb/api.ts");
  assert.match(api, /csrfValid\(request, session\)/);
  assert.match(api, /sameOrigin\(request\)/);
  assert.match(read("src/app/edu/api/aifb/upravy/route.ts"), /role !== "admin"[\s\S]{0,60}403/);
});

test("zápisy služeb mají origin kontrolu, session a limit", () => {
  for (const file of routes("src/app/services/api")) {
    const src = read(file);
    if (mutating(src)) assert.match(src, /handleServicesWrite|handleServicesRequest/, file);
  }
  const lib = read("src/lib/services.ts");
  assert.match(lib, /requireSameOrigin\(request\)/);
});

test("office: zápisy vyžadují CSRF, zařízení bearer token, webhook podpis", () => {
  const api = read("src/lib/office/office-api.ts");
  assert.match(api, /write && !safeEqual\(req\.headers\.get\("x-csrf-token"\)/);
  assert.match(api, /bad_signature/);
  assert.match(read("src/lib/office/oidc.ts"), /x-csrf-token/);
  assert.doesNotMatch(read("src/lib/office/runtime.ts"), /"unset"/);
});

test("cron endpoint bez CRON_SECRET nikoho nepustí", () => {
  const src = read("src/app/api/jobs/run/route.ts");
  assert.match(src, /secret === ""\) return false/);
  assert.match(src, /timingSafeEqual/);
});

test("žádná NEXT_PUBLIC_ proměnná neobsahuje tajemství", () => {
  const seen = new Set();
  for (const dir of ["src"]) {
    const walk = (d) => { for (const n of readdirSync(join(root, d))) { const rel = `${d}/${n}`; if (n === "graphify-out" || n === "node_modules") continue; const st = statSync(join(root, rel)); if (st.isDirectory()) walk(rel); else if (/\.(ts|tsx|mjs|js)$/.test(n)) for (const m of read(rel).matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) seen.add(m[0]); } };
    walk(dir);
  }
  for (const name of seen) assert.doesNotMatch(name, /SECRET|PASSWORD|PRIVATE|SERVICE|TOKEN/, name);
});

test("chybové odpovědi nevrací text od upstreamu ani interní zprávy", () => {
  const proxy = read("src/app/edu/php/ai-proxy.php/route.ts");
  assert.doesNotMatch(proxy, /upstream: phpMbSubstr/);
  assert.doesNotMatch(proxy, /upstream error: \$\{message\}/);
  assert.doesNotMatch(proxy, /není nastaven v php/);
});

test("závislosti: opravené verze a žádný nepoužívaný balíček", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.ok(!("@supabase/ssr" in pkg.dependencies), "@supabase/ssr se nepoužívá");
  const lock = JSON.parse(read("package-lock.json"));
  const ver = (n) => lock.packages[`node_modules/${n}`]?.version.split(".").map(Number);
  const atLeast = (v, min) => { for (let i = 0; i < 3; i++) { if (v[i] !== min[i]) return v[i] > min[i]; } return true; };
  assert.ok(atLeast(ver("next"), [16, 4, 6]), `next ${ver("next")}`);
  assert.ok(atLeast(ver("sharp"), [0, 35, 6]) || ver("sharp").join(".") === "0.35.5", `sharp ${ver("sharp")}`);
  assert.ok(atLeast(ver("fflate"), [0, 8, 3]), `fflate ${ver("fflate")}`);
});

test("CSP: vynucená část brání pluginům, <base> a vložení do cizích rámů", () => {
  const cfg = read("next.config.ts");
  assert.match(cfg, /key: "Content-Security-Policy",\s*value: \["object-src 'none'", "base-uri 'self'", "frame-ancestors 'self'"\]/);
  assert.match(cfg, /Strict-Transport-Security/);
  assert.match(cfg, /poweredByHeader: false/);
});

test("Wikipedia HTML na klientovi nikdy neprojde nesanitizované", () => {
  const src = read("src/lib/edu/wikipedia.ts");
  assert.match(src, /stripActiveContent\(doc\)/);
  assert.doesNotMatch(src, /sanitizer \? sanitizer\.sanitizeWikipedia\(html\) : doc;/);
});
