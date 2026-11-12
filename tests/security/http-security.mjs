#!/usr/bin/env node
// Black-box HTTP security checks against a RUNNING server: node tests/security/http-security.mjs http://localhost:3111
// Sends only a handful of harmless requests (no credentials, no state changes). Exit code 1 on any failure.
const base = (process.argv[2] || "http://localhost:3000").replace(/\/+$/, "");
const host = new URL(base).host;
let failed = 0;

async function req(path, init = {}) {
  const res = await fetch(base + path, { redirect: "manual", ...init, headers: { ...(init.headers || {}) } });
  const text = await res.text().catch(() => "");
  return { status: res.status, headers: res.headers, text };
}
function check(name, ok, detail = "") { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  -> ${detail}`}`); if (!ok) failed++; }
const json = { "Content-Type": "application/json" };
const evil = { Origin: "https://evil.example", "Sec-Fetch-Site": "cross-site" };

// 1. CSRF: cross-site writes are refused before any session lookup
for (const p of ["change-password.php", "delete-account.php", "sessions-revoke.php", "profile-update.php", "avatar-remove.php", "preferences.php", "notifications.php", "2fa/disable.php", "logout.php"]) {
  const r = await req(`/account/api/${p}`, { method: "POST", headers: { ...json, ...evil }, body: "{}" });
  check(`CSRF cross-site POST /account/api/${p} -> 403`, r.status === 403, r.status);
}
const own = { ...json, Origin: base };
for (const p of ["change-password.php", "delete-account.php", "sessions-revoke.php", "profile-update.php"]) {
  const r = await req(`/account/api/${p}`, { method: "POST", headers: own, body: "{}" });
  check(`unauthenticated same-origin POST /account/api/${p} -> 401`, r.status === 401, r.status);
}

// 2. Admin / privileged routes without a session
for (const p of ["/account/api/admin/users.php", "/account/api/admin/overview.php", "/account/api/admin/config.php", "/account/api/admin/audit.php", "/account/api/admin/orgs.php", "/account/api/me.php", "/edu/api/quiz/state.php"]) {
  const r = await req(p);
  check(`no session GET ${p} -> 401`, r.status === 401, r.status);
}
const adminPost = await req("/account/api/admin/user-action.php", { method: "POST", headers: own, body: "{}" });
check("no session POST admin/user-action.php -> 401/404", [401, 404].includes(adminPost.status), adminPost.status);
const upr = await req("/edu/api/aifb/upravy", { method: "POST", headers: own, body: "{}" });
check("no session POST aifb/upravy -> 401", upr.status === 401, upr.status);
for (const p of ["sprava", "ucitel", "vstup", "prubeh"]) {
  const r = await req(`/edu/api/school/${p}`, { method: "POST", headers: own, body: "{}" });
  check(`no session POST school/${p} -> 401`, r.status === 401, r.status);
}
const quiz = await req("/edu/api/quiz/evaluate.php", { method: "POST", headers: { ...json, Origin: "https://evil.example" }, body: "{}" });
check("cross-origin quiz write -> 403", quiz.status === 403, quiz.status);

// 3. Secrets-gated endpoints
check("cron without bearer -> 401", (await req("/api/jobs/run")).status === 401);
check("cron with wrong bearer -> 401", (await req("/api/jobs/run", { headers: { Authorization: "Bearer wrong" } })).status === 401);
const disp = await req("/edu/api/quiz/predictions/dispatch.php", { method: "POST", headers: json, body: "{}" });
check("quiz dispatch without secret -> 401", disp.status === 401, disp.status);
const wh = await req("/store/api/webhook.php", { method: "POST", headers: { ...json, "Stripe-Signature": "t=1,v1=bad" }, body: "{}" });
check("store webhook with bad signature rejected (4xx/5xx, never 2xx)", wh.status >= 400, wh.status);
const owh = await req("/api/office/stripe/webhook", { method: "POST", headers: { ...json, "Stripe-Signature": "t=1,v1=bad" }, body: "{}" });
check("office webhook with bad signature rejected", owh.status >= 400, owh.status);
check("OIDC consent POST without session -> 401", (await req("/account/oidc/consent", { method: "POST", headers: own, body: "{}" })).status === 401);
check("office devices without session -> 401", (await req("/api/office/devices")).status === 401);
check("office subscription without device token -> 401", (await req("/api/office/subscription")).status === 401);

// 4. Paid / expensive endpoints refuse cross-site callers
const ai = await req("/edu/php/ai-proxy.php", { method: "POST", headers: { ...json, ...evil }, body: JSON.stringify({ question: "a", context: "b" }) });
check("AI proxy cross-site -> 403", ai.status === 403, ai.status);
const pdf = await req("/api/tools/html-to-pdf", { method: "POST", headers: { ...json, ...evil }, body: "{}" });
check("html-to-pdf cross-site -> 403", pdf.status === 403, pdf.status);

// 5. Input validation
const weak = await req("/account/api/reset-password.php", { method: "POST", headers: json, body: JSON.stringify({ token: "a".repeat(64), new_password: "abcdefgh" }) });
check("reset-password enforces the password policy (weak -> 422)", weak.status === 422, weak.status);
const short = await req("/account/api/reset-password.php", { method: "POST", headers: json, body: JSON.stringify({ token: "x", new_password: "Abcdef1!x" }) });
check("reset-password rejects malformed token -> 400", short.status === 400, short.status);
const big = await req("/account/api/csp-report.php", { method: "POST", headers: { "Content-Type": "application/csp-report", "Content-Length": "70000" }, body: "x".repeat(70000) });
check("oversized CSP report -> 413", big.status === 413, big.status);
const badJson = await req("/account/api/reset-password.php", { method: "POST", headers: json, body: "{not json" });
check("malformed JSON never 5xx", badJson.status < 500, badJson.status);
const wrongMethod = await req("/account/api/change-password.php");
check("GET on a POST-only route -> 405", wrongMethod.status === 405, wrongMethod.status);

// 6. Headers & exposed files
const home = await req("/cs/home");
const h = (n) => home.headers.get(n) || "";
check("HSTS present (>= 1 year, preload)", /max-age=(\d{8,})/.test(h("strict-transport-security")) && /preload/.test(h("strict-transport-security")), h("strict-transport-security"));
check("X-Content-Type-Options: nosniff", h("x-content-type-options") === "nosniff");
check("X-Frame-Options set", /SAMEORIGIN|DENY/.test(h("x-frame-options")));
check("Referrer-Policy set", h("referrer-policy") !== "");
check("Permissions-Policy set", h("permissions-policy") !== "");
check("enforced CSP blocks object/base/framing", /object-src 'none'/.test(h("content-security-policy")) && /base-uri 'self'/.test(h("content-security-policy")) && /frame-ancestors 'self'/.test(h("content-security-policy")), h("content-security-policy"));
check("no X-Powered-By", h("x-powered-by") === "");
for (const p of ["/.env", "/.env.local", "/.git/HEAD", "/.git/config", "/package.json", "/package-lock.json", "/next.config.ts", "/src/proxy.ts", "/supabase/sql/account/schema.sql", "/tsconfig.json"]) {
  const r = await req(p);
  const leaked = r.status === 200 && /DB_|SECRET|"name"\s*:|\[core\]|createClient|create table/i.test(r.text);
  check(`exposed file ${p} not served`, !leaked, r.status);
}

console.log(failed === 0 ? "\nALL PASSED" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
