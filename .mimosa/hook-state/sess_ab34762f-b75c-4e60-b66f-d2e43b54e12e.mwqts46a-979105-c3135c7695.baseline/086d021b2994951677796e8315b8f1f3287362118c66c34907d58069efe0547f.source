/** The DNS provider behind an interface; the real adapter is TODO-VIT.md (which API it needs is written there). */
export interface DnsAdapter {
  /** Creates or replaces the single TXT record `name` with `value`. */
  setTxt(name: string, value: string): Promise<void>;
  clearTxt(name: string): Promise<void>;
}

export class MockDns implements DnsAdapter {
  records = new Map<string, string>();
  calls: string[] = [];
  async setTxt(name: string, value: string) { this.calls.push(`set ${name}`); this.records.set(name, value); }
  async clearTxt(name: string) { this.calls.push(`clear ${name}`); this.records.delete(name); }
}

/** Fails closed: until a real provider is configured the endpoints answer 503 instead of pretending. */
export class UnconfiguredDns implements DnsAdapter {
  async setTxt(): Promise<void> { throw new Error("DNS provider is not configured"); }
  async clearTxt(): Promise<void> { throw new Error("DNS provider is not configured"); }
}

export function dnsFromEnv(env: Record<string, string | undefined>): DnsAdapter {
  return env.OFFICE_DNS_PROVIDER === "mock" ? new MockDns() : new UnconfiguredDns();
}
