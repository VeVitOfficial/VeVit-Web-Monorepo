// Cross-repository integration harness: serves the REAL Office provider handlers (src/lib/office/*, the same functions the Next.js
// route files call) over HTTP on a loopback port, so the Rust Office server can talk to them. Not covered here: Supabase/SQL
// (a MemoryStore stands in), Next.js routing and the pages, real DNS. Used by VeVit-office/tools/integration-vevit.sh; local only.
//
//   CHALLTEST_URL  management URL of pebble-challtestsrv: the DNS adapter writes ACME TXT records there ("mock DNS").
//
// Prints `LISTENING <port>` once ready. Test-only endpoints live under /__harness/ and are refused for non-loopback peers.
import { createServer } from "node:http";
import { generateKeyPairSync, randomBytes } from "node:crypto";
import { MemoryStore } from "../../src/lib/office/memory-store.ts";
import { MockMail } from "../../src/lib/office/mail.ts";
import { loadOfficeKeys } from "../../src/lib/office/jwt.ts";
import * as api from "../../src/lib/office/office-api.ts";
import * as oidc from "../../src/lib/office/oidc.ts";
import * as verify from "../../src/lib/office/email-verify.ts";

const challtest = process.env.CHALLTEST_URL;

/** Mock DNS: the TXT record goes to Pebble's challenge DNS server, which is what the CA queries. */
class ChalltestDns {
  log = [];
  async post(path, body) {
    if (!challtest) return;
    const r = await fetch(`${challtest}/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`challtestsrv ${path}: ${r.status}`);
  }
  async setTxt(name, value) { this.log.push({ op: "set", name }); await this.post("set-txt", { host: `${name}.`, value }); }
  async clearTxt(name) { this.log.push({ op: "clear", name }); await this.post("clear-txt", { host: `${name}.` }); }
}

const pem = (k) => Buffer.from(k.export({ type: "pkcs8", format: "pem" })).toString("base64");
const keys = loadOfficeKeys({ OFFICE_OIDC_KEY_ACTIVE: pem(generateKeyPairSync("ec", { namedCurve: "P-256" }).privateKey) });

const store = new MemoryStore();
// Eva owns the server and has a verified e-mail; Jana and Karel have not verified theirs.
store.users.set("u1", { id: "u1", email: "eva@example.test", name: "Eva Nováková", preferredUsername: "eva", emailVerified: true });
store.users.set("u2", { id: "u2", email: "jana@example.test", name: "Jana Svobodová", preferredUsername: "jana", emailVerified: false });
store.users.set("u3", { id: "u3", email: "karel@example.test", name: "Karel Dvořák", preferredUsername: "karel", emailVerified: false });

// A paid plan is what lets a paired server use the relay (GET /api/office/subscription → active).
await store.setSubscription("u1", { plan: "pro", active: true });

const mail = new MockMail();
const dns = new ChalltestDns();
const windows = new Map();
let issuer = "";
const deps = {
  store, dns, mail, keys,
  now: () => Date.now(),
  get issuer() { return issuer; },
  cloudRedirectUris: [],
  sealKey: randomBytes(32).toString("base64"),
  ipSecret: "harness-secret",
  // The browser cookie of the harness is `vvtest=<user id>`; the CSRF token of a session is `csrf-<user id>`.
  session: async (req) => {
    const m = /(?:^|;\s*)vvtest=([a-z0-9]+)/.exec(req.headers.get("cookie") ?? "");
    return m && store.users.has(m[1]) ? { userId: m[1], csrf: `csrf-${m[1]}` } : null;
  },
  rateLimit: async (key, ns, windowS, max) => {
    const k = `${ns}|${key}`;
    const t = Date.now();
    let w = windows.get(k);
    if (!w || t >= w.end) { w = { n: 0, end: t + windowS * 1000 }; windows.set(k, w); }
    w.n += 1;
    return w.n > max ? "limited" : "ok";
  },
  clientIp: () => "203.0.113.7",
  stripe: null,
};

const routes = {
  "POST /api/office/link/start": api.linkStart,
  "POST /api/office/link/poll": api.linkPoll,
  "POST /api/office/link/confirm": api.linkConfirm,
  "PUT /api/office/dns/acme": api.dnsAcme,
  "DELETE /api/office/dns/acme": api.dnsAcme,
  "GET /api/office/subscription": api.subscription,
  "GET /api/office/devices": api.devicesList,
  "GET /api/office/consents": api.consentsList,
  "POST /api/office/email/verify/send": verify.emailVerifySend,
  "POST /api/office/email/verify/confirm": verify.emailVerifyConfirm,
  "GET /account/oidc/authorize": oidc.authorize,
  "GET /account/oidc/consent": oidc.consentInfo,
  "POST /account/oidc/consent": oidc.consentDecision,
  "POST /account/oidc/token": oidc.token,
  "POST /account/oidc/device": oidc.deviceAuthorization,
  "POST /account/oidc/device/approve": oidc.deviceApprove,
  "GET /account/oidc/jwks": (d) => oidc.jwks(d),
  "GET /account/.well-known/openid-configuration": (d) => oidc.discovery(d),
};

async function handle(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  if (path === "/__harness/mail") return Response.json(mail.sent);
  if (path === "/__harness/audit") return Response.json(store.auditLog.map((e) => e.kind));
  if (path === "/__harness/dns") return Response.json(dns.log);
  const device = /^\/api\/office\/devices\/([^/]+)$/.exec(path);
  if (device && req.method === "DELETE") return api.deviceUnlink(deps, req, device[1]);
  if (device && req.method === "PATCH") return api.deviceRename(deps, req, device[1]);
  const fn = routes[`${req.method} ${path}`];
  return fn ? fn(deps, req) : new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
}

const server = createServer(async (nodeReq, nodeRes) => {
  try {
    const chunks = [];
    for await (const c of nodeReq) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const headers = new Headers();
    for (const [k, v] of Object.entries(nodeReq.headers)) if (typeof v === "string") headers.set(k, v);
    const req = new Request(`http://${nodeReq.headers.host}${nodeReq.url}`, { method: nodeReq.method, headers, body: nodeReq.method === "GET" || nodeReq.method === "HEAD" ? undefined : body });
    if (req.url.includes("/__harness/") && !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(nodeReq.socket.remoteAddress ?? "")) {
      nodeRes.writeHead(403).end();
      return;
    }
    const res = await handle(req);
    nodeRes.writeHead(res.status, Object.fromEntries(res.headers));
    nodeRes.end(Buffer.from(await res.arrayBuffer()));
  } catch (e) {
    console.error("harness error", e);
    nodeRes.writeHead(500).end();
  }
});

server.listen(0, "127.0.0.1", () => {
  const { port } = server.address();
  issuer = `http://127.0.0.1:${port}/account`;
  console.log(`LISTENING ${port}`);
});
