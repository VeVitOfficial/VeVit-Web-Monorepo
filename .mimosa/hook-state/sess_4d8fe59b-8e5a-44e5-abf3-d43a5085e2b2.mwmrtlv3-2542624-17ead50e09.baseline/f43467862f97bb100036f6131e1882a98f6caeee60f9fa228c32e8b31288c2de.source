// Outgoing mail for the Office integration. The monorepo already sends mail through Resend's HTTP API
// (account/api/forgot-password.php), so this uses the same variables: RESEND_API_KEY and MAIL_FROM.

export type MailMessage = { to: string; subject: string; text: string };

export interface MailSender {
  /** Throws `MailUnavailable` when the message could not be handed over. */
  send(m: MailMessage): Promise<void>;
}

export class MailUnavailable extends Error {}

/** Collects messages in memory: tests, and the local integration run (OFFICE_MAIL_PROVIDER=mock). */
export class MockMail implements MailSender {
  sent: MailMessage[] = [];
  async send(m: MailMessage) { this.sent.push({ ...m }); }
}

/** No provider configured: sending fails loudly instead of pretending mail works. */
export class UnconfiguredMail implements MailSender {
  async send(): Promise<void> { throw new MailUnavailable("no mail provider is configured"); }
}

export class ResendMail implements MailSender {
  private readonly apiKey: string;
  private readonly from: string;
  private readonly fetchImpl: typeof fetch;
  constructor(apiKey: string, from: string, fetchImpl: typeof fetch = fetch) {
    this.apiKey = apiKey;
    this.from = from;
    this.fetchImpl = fetchImpl;
  }
  async send(m: MailMessage) {
    let res: Response;
    try {
      res = await this.fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ from: this.from, to: [m.to], subject: m.subject, text: m.text }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new MailUnavailable("mail request failed");
    }
    if (!res.ok) throw new MailUnavailable(`mail provider answered ${res.status}`);
  }
}

export function mailFromEnv(env: Record<string, string | undefined>): MailSender {
  // `mock` is for the local integration run only; production leaves the variable unset.
  if (env.OFFICE_MAIL_PROVIDER === "mock" && env.NODE_ENV !== "production") return new MockMail();
  const key = env.RESEND_API_KEY?.trim();
  if (!key) return new UnconfiguredMail();
  return new ResendMail(key, env.MAIL_FROM?.trim() || "vevit <noreply@vevit.cz>");
}
