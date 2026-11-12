import { readFileSync } from "node:fs";
const env = {};
for (const l of readFileSync(process.argv[2], "utf8").split("\n")) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].replace(/^"|"$/g, ""); }
const url = env.SUPABASE_URL.replace(/\/+$/, "");
const svc = env.SUPABASE_SECRET_KEY;
const spec = await (await fetch(url + "/rest/v1/", { headers: { apikey: svc, Authorization: `Bearer ${svc}`, Accept: "application/openapi+json" } })).json();
const out = {};
for (const [p, v] of Object.entries(spec.paths)) {
  if (!p.startsWith("/rpc/")) continue;
  const body = (v.post?.parameters ?? []).find((x) => x.in === "body");
  const ref = body?.schema?.$ref?.split("/").pop();
  const props = (ref && spec.definitions?.[ref]?.properties) || body?.schema?.properties || {};
  out[p.slice(5)] = Object.fromEntries(Object.entries(props).map(([k, s]) => [k, s.format || s.type]));
}
console.log(JSON.stringify(out, null, 0));
