import { randomToken, sha256Hex, ipFingerprint } from "./crypto.ts";
import type { OfficeDeps } from "./deps.ts";
import { json, readJson } from "./http.ts";
import { limit, userSession } from "./office-api.ts";

// E-mail verification for the Vevit account. `users.email_verified_at` is what OIDC reports as `email_verified`;
// the Office server trusts an e-mail address only when it is true. A changed address is unverified again (trigger in migration 027).

export const VERIFY_TTL_S = 24 * 60 * 60;
export const VERIFY_PATH = "/office/verify-email";

const iso = (ms: number) => new Date(ms).toISOString();

function message(link: string) {
  return {
    subject: "Potvrďte e-mail · Confirm your e-mail · vevit",
    text:
      `Dobrý den,\n\npro ověření e-mailu ve Vevit účtu otevřete odkaz níže (platí 24 hodin):\n${link}\n\n` +
      `Pokud jste o ověření nežádali, tento e-mail ignorujte.\n\n— Tým vevit\n\n` +
      `----\n\nHello,\n\nopen the link below to verify your e-mail address on your Vevit account (valid for 24 hours):\n${link}\n\n` +
      `If you did not ask for this, ignore this message.\n\n— The vevit team\n`,
  };
}

/** POST /api/office/email/verify/send: mails a verification link to the signed-in person's current address. */
export async function emailVerifySend(d: OfficeDeps, req: Request): Promise<Response> {
  const u = await userSession(d, req, true);
  if (u.error) return u.error;
  const userId = u.session.userId;
  // A pause between two mails, then an hourly cap per person, then a cap per address of origin.
  const pause = await limit(d, userId, "office_email_pause", 60, 1);
  if (pause) return pause;
  const hourly = await limit(d, userId, "office_email_hour", 3600, 3);
  if (hourly) return hourly;
  const byIp = await limit(d, d.clientIp(req), "office_email_ip", 3600, 10);
  if (byIp) return byIp;
  const user = await d.store.getUser(userId);
  if (!user) return json(401, { error: "unauthorized" });
  if (user.emailVerified) return json(200, { sent: false, already_verified: true });
  const token = randomToken(32);
  const hash = sha256Hex(token);
  await d.store.createEmailVerification({ id: randomToken(12), userId, email: user.email, tokenHash: hash, expiresAt: iso(d.now() + VERIFY_TTL_S * 1000) });
  const link = `${new URL(d.issuer).origin}${VERIFY_PATH}?token=${token}`;
  try {
    await d.mail.send({ to: user.email, ...message(link) });
  } catch {
    // Nothing was delivered: the link must not stay valid.
    await d.store.deleteEmailVerification(hash);
    return json(503, { error: "mail_unavailable" });
  }
  await d.store.audit({ kind: "email_verification_sent", userId, ipHash: ipFingerprint(d.clientIp(req), d.ipSecret) });
  return json(200, { sent: true, expires_in: VERIFY_TTL_S });
}

/** POST /api/office/email/verify/confirm {token}: no session needed, the mailbox is the proof. A page button calls this, never a GET. */
export async function emailVerifyConfirm(d: OfficeDeps, req: Request): Promise<Response> {
  const limited = await limit(d, d.clientIp(req), "office_email_confirm", 600, 20);
  if (limited) return limited;
  const body = await readJson(req);
  const token = typeof body?.token === "string" ? body.token : "";
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return json(400, { error: "invalid_or_expired" });
  const done = await d.store.consumeEmailVerification(sha256Hex(token));
  if (!done) return json(400, { error: "invalid_or_expired" });
  await d.store.audit({ kind: "email_verified", userId: done.userId, ipHash: ipFingerprint(d.clientIp(req), d.ipSecret) });
  return json(200, { verified: true });
}
