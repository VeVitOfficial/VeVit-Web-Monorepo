// Read-only black-box probe of Supabase as the anonymous (publishable key) role. Never prints secrets or row data.
import { readFileSync } from "node:fs";
const env = {};
for (const l of readFileSync(process.argv[2], "utf8").split("\n")) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const url = env.SUPABASE_URL.replace(/\/+$/, "");
const anon = env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const svc = env.SUPABASE_SECRET_KEY;
const h = (k, extra = {}) => ({ apikey: k, Authorization: `Bearer ${k}`, ...extra });
const get = (p, k, extra) => fetch(url + p, { headers: h(k, extra) });

const spec = await (await get("/rest/v1/", anon, { Accept: "application/openapi+json" })).json().catch(() => null);
const paths = Object.keys(spec?.paths ?? {});
const tables = paths.filter((p) => p !== "/" && !p.startsWith("/rpc/")).map((p) => p.slice(1));
const rpcs = paths.filter((p) => p.startsWith("/rpc/")).map((p) => p.slice(5));
console.log("ANON openapi: tables/views visible =", tables.length, "| rpc visible =", rpcs.length);
console.log("ANON visible tables:", tables.join(", ") || "(none)");
console.log("ANON visible rpc:", rpcs.join(", ") || "(none)");

// every table the service role knows about, probed as anon
const sspec = await (await get("/rest/v1/", svc, { Accept: "application/openapi+json" })).json().catch(() => null);
const all = Object.keys(sspec?.paths ?? {}).filter((p) => p !== "/" && !p.startsWith("/rpc/")).map((p) => p.slice(1)).sort();
const allRpc = Object.keys(sspec?.paths ?? {}).filter((p) => p.startsWith("/rpc/")).map((p) => p.slice(5)).sort();
console.log(`\nSERVICE view: ${all.length} tables/views, ${allRpc.length} rpc exposed through PostgREST`);
let leaks = 0;
for (const t of all) {
  const r = await get(`/rest/v1/${encodeURIComponent(t)}?select=*&limit=1`, anon, { Prefer: "count=exact" });
  let rows = 0; let body = null;
  try { body = await r.json(); rows = Array.isArray(body) ? body.length : 0; } catch {}
  const total = r.headers.get("content-range") ?? "";
  const verdict = r.status === 200 && rows > 0 ? "LEAK(rows readable)" : r.status === 200 ? "ok(empty/RLS)" : `blocked(${r.status}${body?.code ? " " + body.code : ""})`;
  if (verdict.startsWith("LEAK")) leaks++;
  console.log(`  anon GET ${t.padEnd(40)} ${verdict.padEnd(22)} range=${total}`);
}
console.log("anon readable tables with data:", leaks);
console.log("\nrpc executable by anon (per ANON openapi):", rpcs.length ? rpcs.join(", ") : "none");
console.log("rpc exposed at all (service view):", allRpc.join(", ") || "none");

// storage buckets (metadata only)
const b = await get("/storage/v1/bucket", svc);
const buckets = b.ok ? await b.json() : [];
console.log("\nBUCKETS:", Array.isArray(buckets) ? buckets.map((x) => `${x.name}(public=${x.public},limit=${x.file_size_limit ?? "none"},mime=${(x.allowed_mime_types ?? []).join("|") || "any"})`).join("; ") : `status ${b.status}`);
// auth settings
const s = await get("/auth/v1/settings", anon);
const sj = s.ok ? await s.json() : {};
console.log("AUTH settings: disable_signup =", sj.disable_signup, "| autoconfirm =", sj.mailer_autoconfirm, "| external providers enabled =", Object.entries(sj.external ?? {}).filter(([, v]) => v).map(([k]) => k).join(",") || "none");
