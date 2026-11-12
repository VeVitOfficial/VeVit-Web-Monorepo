// Side-effect-free probe: can the anon role EXECUTE each RPC? Mutating functions get an invalid uuid/int so the body can never run.
import { readFileSync } from "node:fs";
const env = {};
for (const l of readFileSync(process.argv[2], "utf8").split("\n")) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const url = env.SUPABASE_URL.replace(/\/+$/, "");
const anon = env.SUPABASE_PUBLISHABLE_KEY;
const sigs = JSON.parse(readFileSync(process.argv[3], "utf8"));
const READONLY = new Set(["user_effective_tier", "user_permissions", "user_rank_keys", "level_for_xp", "services_category_counts", "services_unread_counts", "edu_quiz_poll_distribution"]);
const sample = { text: "00000000-0000-0000-0000-000000000000", "text[]": [], jsonb: {}, boolean: false, numeric: 0, "double precision": 0 };
const results = [];
for (const [fn, params] of Object.entries(sigs)) {
  const carriers = Object.entries(params).filter(([, t]) => ["uuid", "integer", "bigint"].includes(t));
  let body, mode;
  if (READONLY.has(fn)) { mode = "readonly-valid"; body = Object.fromEntries(Object.entries(params).map(([k, t]) => [k, t === "uuid" ? "00000000-0000-0000-0000-000000000000" : t === "integer" || t === "bigint" ? 0 : sample[t] ?? "x"])); }
  else if (carriers.length) { mode = "garbage-carrier"; body = Object.fromEntries(Object.entries(params).map(([k, t]) => [k, t === "uuid" ? "not-a-uuid" : t === "integer" || t === "bigint" ? "not-a-number" : sample[t] ?? "x"])); }
  else { results.push([fn, "SKIPPED (text-only mutating; not safe to call)"]); continue; }
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${anon}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  const verdict = j.code === "42501" ? "BLOCKED (permission denied)" : r.status === 404 ? `not found ${j.code ?? ""}` : j.code === "22P02" ? "INCONCLUSIVE (type error before ACL?)" : r.ok ? `EXECUTED status ${r.status} !!` : `status ${r.status} ${j.code ?? ""}`;
  results.push([fn, `${verdict} [${mode}]`]);
}
for (const [f, v] of results.sort()) console.log(f.padEnd(40), v);
