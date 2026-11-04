import assert from "node:assert/strict";
import { test } from "node:test";
import { sha256Hex } from "../../../src/lib/office/crypto.ts";
import * as ev from "../../../src/lib/office/email-verify.ts";
import { MailUnavailable, ResendMail, mailFromEnv, MockMail, UnconfiguredMail } from "../../../src/lib/office/mail.ts";
import * as api from "../../../src/lib/office/office-api.ts";
import { authed, makeDeps, req } from "./helpers.mjs";

const send = (deps, user = "u2") => ev.emailVerifySend(deps, req("POST", "https://vevit.cz/api/office/email/verify/send", { headers: authed(user) }));
const confirm = (deps, token) => ev.emailVerifyConfirm(deps, req("POST", "https://vevit.cz/api/office/email/verify/confirm", { json: { token } }));
const tokenOf = (deps) => new URL(deps.mail.sent.at(-1).text.match(/https:\/\/\S+/)[0]).searchParams.get("token");

test("sending needs a session and CSRF, and does nothing for an already verified address", async () => {
  const { deps } = makeDeps();
  assert.equal((await ev.emailVerifySend(deps, req("POST", "https://vevit.cz/x"))).status, 401);
  assert.equal((await ev.emailVerifySend(deps, req("POST", "https://vevit.cz/x", { headers: { "x-test-user": "u2" } }))).status, 403);
  const done = await send(deps, "u1");
  assert.deepEqual(await done.json(), { sent: false, already_verified: true });
  assert.equal(deps.mail.sent.length, 0);
});

test("the mailed link holds a one-time token; only its hash is stored; confirming sets email_verified", async () => {
  const { deps, store } = makeDeps();
  const r = await send(deps);
  assert.deepEqual(await r.json(), { sent: true, expires_in: 86400 });
  assert.equal(deps.mail.sent.length, 1);
  assert.equal(deps.mail.sent[0].to, "jana@example.test");
  const link = deps.mail.sent[0].text.match(/https:\/\/\S+/)[0];
  assert.match(link, /^https:\/\/vevit\.cz\/office\/verify-email\?token=[A-Za-z0-9_-]{43}$/);
  const token = tokenOf(deps);
  assert.ok(store.emailVerifications.has(sha256Hex(token)) && !store.emailVerifications.has(token), "only the hash is stored");
  assert.equal(store.users.get("u2").emailVerified, false);
  assert.equal((await confirm(deps, token)).status, 200);
  assert.equal(store.users.get("u2").emailVerified, true);
  assert.equal((await confirm(deps, token)).status, 400, "a token works once");
  assert.ok(store.auditLog.some((e) => e.kind === "email_verified" && e.userId === "u2"));
  assert.ok(!JSON.stringify(store.auditLog).includes(token), "the token never reaches the audit log");
});

test("a link expires after 24 hours and a malformed token is refused", async () => {
  const { deps, clock } = makeDeps();
  await send(deps);
  const token = tokenOf(deps);
  clock.t += 86_400_000 + 1000;
  assert.equal((await confirm(deps, token)).status, 400);
  assert.equal((await confirm(deps, "short")).status, 400);
  assert.equal((await confirm(deps, "A".repeat(43))).status, 400);
});

test("a new link replaces the old one", async () => {
  const { deps, clock } = makeDeps();
  await send(deps);
  const first = tokenOf(deps);
  clock.t += 61_000;
  assert.equal((await send(deps)).status, 200);
  const second = tokenOf(deps);
  assert.notEqual(first, second);
  assert.equal((await confirm(deps, first)).status, 400);
  assert.equal((await confirm(deps, second)).status, 200);
});

test("resending is rate limited: a pause between mails and a cap per hour", async () => {
  const { deps } = makeDeps();
  assert.equal((await send(deps)).status, 200);
  const again = await send(deps);
  assert.equal(again.status, 429, "the second mail within the pause");
  assert.equal(deps.mail.sent.length, 1);
});

test("a changed address is unverified again and old links die", async () => {
  const { deps, store, clock } = makeDeps();
  await send(deps);
  const oldLink = tokenOf(deps);
  store.changeEmail("u2", "jana.new@example.test");
  assert.equal((await confirm(deps, oldLink)).status, 400, "a link for the old address is dead");
  clock.t += 61_000;
  await send(deps);
  assert.equal(deps.mail.sent.at(-1).to, "jana.new@example.test");
  assert.equal((await confirm(deps, tokenOf(deps))).status, 200);
  assert.equal(store.users.get("u2").emailVerified, true);
  // Verified people changing the address lose the verification.
  store.changeEmail("u2", "jana.third@example.test");
  assert.equal(store.users.get("u2").emailVerified, false);
});

test("a failed delivery answers 503 and leaves no valid link", async () => {
  const { deps, store } = makeDeps({ mail: new UnconfiguredMail() });
  const r = await send(deps);
  assert.equal(r.status, 503);
  assert.equal(store.emailVerifications.size, 0);
});

test("the device list reports whether the address is verified", async () => {
  const { deps } = makeDeps();
  const list = await api.devicesList(deps, req("GET", "https://vevit.cz/api/office/devices", { headers: authed("u2") }));
  assert.equal((await list.json()).email_verified, false);
  await send(deps);
  await confirm(deps, tokenOf(deps));
  const after = await api.devicesList(deps, req("GET", "https://vevit.cz/api/office/devices", { headers: authed("u2") }));
  assert.equal((await after.json()).email_verified, true);
});

test("the Resend adapter sends the documented request and maps failures", async () => {
  const calls = [];
  const ok = new ResendMail("key-1", "vevit <noreply@vevit.cz>", async (url, init) => { calls.push([url, init]); return new Response("{}", { status: 200 }); });
  await ok.send({ to: "a@b.test", subject: "S", text: "T" });
  assert.equal(calls[0][0], "https://api.resend.com/emails");
  assert.equal(calls[0][1].headers.authorization, "Bearer key-1");
  assert.deepEqual(JSON.parse(calls[0][1].body), { from: "vevit <noreply@vevit.cz>", to: ["a@b.test"], subject: "S", text: "T" });
  await assert.rejects(new ResendMail("k", "f", async () => new Response("no", { status: 422 })).send({ to: "a@b.test", subject: "S", text: "T" }), MailUnavailable);
  await assert.rejects(new ResendMail("k", "f", async () => { throw new Error("down"); }).send({ to: "a@b.test", subject: "S", text: "T" }), MailUnavailable);
});

test("mailFromEnv: the mock never activates in production, no key means unconfigured", () => {
  assert.ok(mailFromEnv({ OFFICE_MAIL_PROVIDER: "mock" }) instanceof MockMail);
  assert.ok(mailFromEnv({ OFFICE_MAIL_PROVIDER: "mock", NODE_ENV: "production" }) instanceof UnconfiguredMail);
  assert.ok(mailFromEnv({}) instanceof UnconfiguredMail);
  assert.ok(mailFromEnv({ RESEND_API_KEY: "k" }) instanceof ResendMail);
});
