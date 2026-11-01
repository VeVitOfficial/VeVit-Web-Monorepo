import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import * as api from "../../../src/lib/office/office-api.ts";
import { sha256Hex } from "../../../src/lib/office/crypto.ts";
import { authed, makeDeps, pair, req } from "./helpers.mjs";

const U = "https://vevit.cz/api/office";
const TXT = "A".repeat(43);
const dnsReq = (method, token, body) => req(method, `${U}/dns/acme`, { headers: token ? { authorization: `Bearer ${token}` } : {}, json: body });

test("pairing: start, confirm by the signed-in owner, poll once; the database never holds the token", async () => {
  const { deps, store } = makeDeps();
  const start = await (await api.linkStart(deps, req("POST", `${U}/link/start`))).json();
  assert.deepEqual([start.link_url, start.expires_in], ["https://vevit.cz/office/link", 600]);
  assert.match(start.code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  const poll = () => api.linkPoll(deps, req("POST", `${U}/link/poll`, { json: { poll_token: start.poll_token } })).then(async (r) => [r.status, await r.json()]);
  assert.deepEqual(await poll(), [200, { status: "pending" }]);
  // Confirmation needs a session, CSRF, a code that exists and a valid free name.
  const confirm = (headers, body) => api.linkConfirm(deps, req("POST", `${U}/link/confirm`, { headers, json: body }));
  assert.equal((await confirm({}, { code: start.code, name: "dilna" })).status, 401);
  assert.equal((await confirm({ "x-test-user": "u1" }, { code: start.code, name: "dilna" })).status, 403);
  assert.equal((await confirm(authed("u1"), { code: "BBBB-BBBB", name: "dilna" })).status, 404);
  assert.equal((await confirm(authed("u1"), { code: start.code, name: "Dilna" })).status, 422);
  const reserved = await confirm(authed("u1"), { code: start.code, name: "www" });
  assert.deepEqual([reserved.status, (await reserved.json()).reason], [422, "reserved"]);
  const ok = await confirm(authed("u1"), { code: start.code.toLowerCase(), name: "dilna", display_name: "Dílna <b>3.A</b>" });
  assert.equal(ok.status, 200);
  assert.deepEqual((await ok.json()).device.host, "dilna.office.vevit.cz");
  assert.equal(store.devices.get([...store.devices.keys()][0]).displayName, "Dílna b3.A/b", "angle brackets are stripped from display names");
  assert.equal((await confirm(authed("u2"), { code: start.code, name: "jina" })).status, 404, "a code is confirmed once");
  const [status, linked] = await poll();
  assert.equal(status, 200);
  assert.deepEqual([linked.status, linked.name, linked.owner_sub], ["linked", "dilna", "u1"]);
  assert.match(linked.device_token, /^[A-Za-z0-9_-]{43}$/, "256 random bits");
  const row = [...store.devices.values()][0];
  assert.equal(row.tokenHash, sha256Hex(linked.device_token));
  assert.ok(!JSON.stringify([...store.devices.values(), ...store.links.values()]).includes(linked.device_token), "the plain token is nowhere in the stored rows");
  assert.deepEqual((await poll())[0], 410, "the token is handed over once");
});

test("pairing: expiry, name collisions, malformed polls, rate limits", async () => {
  const { deps, clock } = makeDeps();
  const a = await (await api.linkStart(deps, req("POST", `${U}/link/start`))).json();
  clock.t += 601_000;
  assert.equal((await api.linkConfirm(deps, req("POST", `${U}/link/confirm`, { headers: authed("u1"), json: { code: a.code, name: "dilna" } }))).status, 404, "an expired code is gone");
  assert.equal((await api.linkPoll(deps, req("POST", `${U}/link/poll`, { json: { poll_token: a.poll_token } }))).status, 410);
  await pair(deps, "u1", "dilna", api);
  const b = await (await api.linkStart(deps, req("POST", `${U}/link/start`))).json();
  assert.equal((await api.linkConfirm(deps, req("POST", `${U}/link/confirm`, { headers: authed("u2"), json: { code: b.code, name: "dilna" } }))).status, 409, "the name is taken");
  for (const bad of [{}, { poll_token: 5 }, { poll_token: "short" }]) assert.equal((await api.linkPoll(deps, req("POST", `${U}/link/poll`, { json: bad }))).status, 400);
  assert.equal((await api.linkPoll(deps, req("POST", `${U}/link/poll`, { json: { poll_token: "q".repeat(43) } }))).status, 410);
  let limited = 0;
  for (let i = 0; i < 14; i += 1) if ((await api.linkStart(deps, req("POST", `${U}/link/start`))).status === 429) limited += 1;
  assert.ok(limited >= 4);
  let guesses = 0;
  for (let i = 0; i < 14; i += 1) if ((await api.linkConfirm(deps, req("POST", `${U}/link/confirm`, { headers: authed("u2"), json: { code: "CCCC-CCCC", name: `n${i}abc` } }))).status === 429) guesses += 1;
  assert.ok(guesses >= 3, "guessing pairing codes is limited per person");
});

test("an account can link at most ten servers", async () => {
  const { deps, counts } = makeDeps();
  for (let i = 0; i < 10; i += 1) { await pair(deps, "u1", `server${i}`, api); counts.clear(); }
  const start = await (await api.linkStart(deps, req("POST", `${U}/link/start`))).json();
  const r = await api.linkConfirm(deps, req("POST", `${U}/link/confirm`, { headers: authed("u1"), json: { code: start.code, name: "eleventh" } }));
  assert.deepEqual([r.status, (await r.json()).error], [409, "device_limit"]);
});

test("a name of an unlinked device is not given to somebody else", async () => {
  const { deps } = makeDeps();
  const dev = await pair(deps, "u1", "dilna", api);
  await api.deviceUnlink(deps, req("DELETE", `${U}/devices/x`, { headers: authed("u1") }), dev.id);
  const b = await (await api.linkStart(deps, req("POST", `${U}/link/start`))).json();
  assert.equal((await api.linkConfirm(deps, req("POST", `${U}/link/confirm`, { headers: authed("u2"), json: { code: b.code, name: "dilna" } }))).status, 409);
});

test("DNS: a device sets and clears only its own _acme-challenge TXT record", async () => {
  const { deps, store } = makeDeps();
  const mine = await pair(deps, "u1", "dilna", api);
  const other = await pair(deps, "u2", "skola", api);
  const own = "_acme-challenge.dilna.office.vevit.cz";
  assert.equal((await api.dnsAcme(deps, dnsReq("PUT", mine.token, { name: own, value: TXT }))).status, 204);
  assert.equal(deps.dns.records.get(own), TXT);
  assert.equal((await api.dnsAcme(deps, dnsReq("PUT", mine.token, { name: `${own}.`, value: "B".repeat(43) }))).status, 204, "a trailing dot is the same name");
  // Everything outside the device's own name is refused and logged: another device's name, the apex, wildcards, other zones.
  for (const name of ["_acme-challenge.skola.office.vevit.cz", "dilna.office.vevit.cz", "_acme-challenge.vevit.cz", "_acme-challenge.office.vevit.cz", "*.office.vevit.cz", `${own}.evil.example`, "x." + own, "", undefined]) {
    assert.equal((await api.dnsAcme(deps, dnsReq("PUT", mine.token, { name, value: TXT }))).status, 403, String(name));
    assert.equal((await api.dnsAcme(deps, dnsReq("DELETE", mine.token, { name }))).status, 403, String(name));
  }
  assert.ok(store.auditLog.some((e) => e.kind === "dns_refused"));
  assert.deepEqual([...deps.dns.records.keys()], [own], "nothing else was touched");
  for (const value of ["short", `${"A".repeat(42)}!`, 5, undefined]) assert.equal((await api.dnsAcme(deps, dnsReq("PUT", mine.token, { name: own, value }))).status, 400);
  // Tokens: none, wrong, another device's (acts only on its own name), revoked.
  assert.equal((await api.dnsAcme(deps, dnsReq("PUT", null, { name: own, value: TXT }))).status, 401);
  assert.equal((await api.dnsAcme(deps, dnsReq("PUT", "x".repeat(43), { name: own, value: TXT }))).status, 401);
  assert.equal((await api.dnsAcme(deps, dnsReq("PUT", other.token, { name: own, value: TXT }))).status, 403, "a foreign device cannot set this name");
  assert.equal((await api.dnsAcme(deps, dnsReq("DELETE", mine.token, { name: own }))).status, 204);
  assert.equal(deps.dns.records.size, 0);
  assert.equal((await api.dnsAcme(deps, req("POST", `${U}/dns/acme`, { headers: { authorization: `Bearer ${mine.token}` }, json: {} }))).status, 405);
  assert.deepEqual(store.auditLog.filter((e) => e.kind.startsWith("dns_")).map((e) => e.kind).filter((k) => k !== "dns_refused"), ["dns_set", "dns_set", "dns_cleared"]);
  // The audit log never contains TXT values.
  assert.ok(!JSON.stringify(store.auditLog).includes(TXT));
});

test("DNS provider outages answer 503, an unconfigured provider too; rate limit per device", async () => {
  const { deps } = makeDeps();
  const mine = await pair(deps, "u1", "dilna", api);
  const own = "_acme-challenge.dilna.office.vevit.cz";
  deps.dns = { setTxt: async () => { throw new Error("down"); }, clearTxt: async () => { throw new Error("down"); } };
  assert.equal((await api.dnsAcme(deps, dnsReq("PUT", mine.token, { name: own, value: TXT }))).status, 503);
  deps.dns = { setTxt: async () => {}, clearTxt: async () => {} };
  let limited = 0;
  for (let i = 0; i < 34; i += 1) if ((await api.dnsAcme(deps, dnsReq("PUT", mine.token, { name: own, value: TXT }))).status === 429) limited += 1;
  assert.ok(limited >= 3);
});

test("subscription: the device sees its owner's plan; unlinking cuts it off at once", async () => {
  const { deps, store } = makeDeps();
  const mine = await pair(deps, "u1", "dilna", api);
  const sub = (t) => api.subscription(deps, req("GET", `${U}/subscription`, { headers: t ? { authorization: `Bearer ${t}` } : {} }));
  assert.deepEqual(await (await sub(mine.token)).json(), { name: "dilna", active: false, plan: "none", bytes_per_month: 0, max_streams: 0 });
  await store.setSubscription("u1", { plan: "pro", active: true });
  assert.deepEqual(await (await sub(mine.token)).json(), { name: "dilna", active: true, plan: "pro", bytes_per_month: 500_000_000_000, max_streams: 64 });
  await store.setSubscription("u1", { plan: "mystery", active: true });
  assert.equal((await (await sub(mine.token)).json()).active, false, "an unknown plan grants nothing");
  assert.equal((await sub(null)).status, 401);
  assert.equal((await sub("y".repeat(43))).status, 401);
  assert.equal((await api.deviceUnlink(deps, req("DELETE", `${U}/devices/x`, { headers: authed("u1") }), mine.id)).status, 204);
  assert.equal((await sub(mine.token)).status, 401, "the revoked token is dead");
  assert.equal((await api.dnsAcme(deps, dnsReq("PUT", mine.token, { name: "_acme-challenge.dilna.office.vevit.cz", value: TXT }))).status, 401);
});

test("devices in the account: list, rename, unlink only your own; unlinking revokes consents and the token", async () => {
  const { deps, store } = makeDeps();
  const dev = await pair(deps, "u1", "dilna", api);
  await pair(deps, "u2", "skola", api);
  const list = await api.devicesList(deps, req("GET", `${U}/devices`, { headers: authed("u1") })).then((r) => r.json());
  assert.deepEqual(list.devices.map((d) => [d.name, d.host]), [["dilna", "dilna.office.vevit.cz"]]);
  assert.ok(!JSON.stringify(list).includes("token"));
  assert.equal((await api.devicesList(deps, req("GET", `${U}/devices`))).status, 401);
  const patch = (u, id, body, h = authed(u)) => api.deviceRename(deps, req("PATCH", `${U}/devices/${id}`, { headers: h, json: body }), id);
  assert.equal((await patch("u1", dev.id, { display_name: "Naše dílna" })).status, 200);
  assert.equal((await patch("u2", dev.id, { display_name: "Hacked" })).status, 404, "another person's device");
  assert.equal((await patch("u1", dev.id, { display_name: "  " })).status, 400);
  assert.equal((await patch("u1", dev.id, { display_name: "x" }, { "x-test-user": "u1" })).status, 403);
  assert.equal(store.devices.get(dev.id).displayName, "Naše dílna");
  // Jana consents to Eva's server, then Eva unlinks it.
  await store.saveConsent("u2", dev.id);
  assert.equal((await api.deviceUnlink(deps, req("DELETE", `${U}/devices/x`, { headers: authed("u2") }), dev.id)).status, 404);
  assert.equal((await api.deviceUnlink(deps, req("DELETE", `${U}/devices/x`, { headers: authed("u1") }), dev.id)).status, 204);
  assert.equal(await store.getConsent("u2", dev.id), null, "consents are gone with the device");
  assert.deepEqual((await api.devicesList(deps, req("GET", `${U}/devices`, { headers: authed("u1") })).then((r) => r.json())).devices, []);
  assert.equal((await api.deviceUnlink(deps, req("DELETE", `${U}/devices/x`, { headers: authed("u1") }), dev.id)).status, 404);
  assert.ok(["link_confirmed", "link_collected", "device_unlinked", "device_renamed"].every((k) => store.auditLog.some((e) => e.kind === k)));
});

function stripeReq(secret, body, now, bad = false) {
  const raw = JSON.stringify(body);
  const t = Math.floor(now / 1000);
  const v1 = createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  return new Request(`${U}/stripe/webhook`, { method: "POST", headers: { "stripe-signature": `t=${t},v1=${bad ? "0".repeat(64) : v1}` }, body: raw });
}

test("Stripe webhook: inert without a secret; verifies the signature and its age; maps prices to plans", async () => {
  const off = makeDeps();
  assert.equal((await api.stripeWebhook(off.deps, new Request(`${U}/stripe/webhook`, { method: "POST", body: "{}" }))).status, 503);
  const { deps, store, clock } = makeDeps({ stripe: { secret: "whsec_test", pricePlans: { price_pro: "pro" } } });
  const sub = (type, status = "active") => ({ type, data: { object: { id: "sub_1", customer: "cus_1", status, metadata: { vevit_user_id: "u1" }, items: { data: [{ price: { id: "price_pro" } }] } } } });
  assert.equal((await api.stripeWebhook(deps, stripeReq("whsec_test", sub("customer.subscription.created"), clock.t, true))).status, 400);
  assert.equal((await api.stripeWebhook(deps, stripeReq("other_secret", sub("customer.subscription.created"), clock.t))).status, 400);
  assert.equal((await api.stripeWebhook(deps, stripeReq("whsec_test", sub("customer.subscription.created"), clock.t - 400_000))).status, 400, "a replayed old event");
  assert.equal((await api.stripeWebhook(deps, stripeReq("whsec_test", sub("customer.subscription.created"), clock.t))).status, 200);
  assert.deepEqual(await store.getSubscription("u1"), { plan: "pro", active: true, bytesPerMonth: 500_000_000_000, maxStreams: 64 });
  await api.stripeWebhook(deps, stripeReq("whsec_test", sub("customer.subscription.deleted", "canceled"), clock.t));
  assert.equal((await store.getSubscription("u1")).active, false);
  const unknownPrice = { type: "customer.subscription.created", data: { object: { customer: "cus_9", status: "active", metadata: { vevit_user_id: "u2" }, items: { data: [{ price: { id: "price_x" } }] } } } };
  const r = await api.stripeWebhook(deps, stripeReq("whsec_test", unknownPrice, clock.t));
  assert.deepEqual([r.status, (await r.json()).ignored], [200, true]);
  assert.equal((await store.getSubscription("u2")).active, false);
  assert.equal((await api.stripeWebhook(deps, new Request(`${U}/stripe/webhook`, { method: "POST", body: "x".repeat(300000) }))).status, 413);
});
