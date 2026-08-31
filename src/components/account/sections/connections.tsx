"use client";

import { useCallback, useEffect, useState } from "react";
import { accountT as t, accountFormatDate, type AccountLocale } from "@/lib/account-i18n";
import { useAccountLocale } from "../use-account-locale";
import { useAccountApi } from "../api";
import { useSession } from "../session";
import { StateError } from "../ui";

/** Port of loadConnections + connect/disconnect-provider from app.js. */

type ConnectionsData = {
  has_password: boolean;
  connections: Record<string, { provider_email: string; created_at: string }>;
};

const PROVIDERS = ["google", "github", "discord"] as const;

function maskEmail(value: unknown, locale: AccountLocale): string {
  const [local, domain] = String(value || "").split("@");
  return local && domain ? `${local.slice(0, 2)}•••@${domain}` : t("email.unavailable", locale);
}

export function ConnectionsSection() {
  const locale = useAccountLocale();
  const { showToast } = useSession();
  const run = useAccountApi();
  const [data, setData] = useState<ConnectionsData | null>(null);
  const [failed, setFailed] = useState(false);

  const fetch = useCallback(() => run<ConnectionsData>("connections.php"), [run]);

  const refresh = useCallback(() => {
    fetch().then(
      (data) => {
        setData(data);
        setFailed(false);
      },
      (error) => {
        console.error("Connections load failed", error);
        setFailed(true);
      },
    );
  }, [fetch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function disconnect(provider: string) {
    if (!confirm(t("conn.disconnectConfirm", locale))) return;
    try {
      await run("connections-disconnect.php", { method: "POST", body: { provider } });
      showToast(t("conn.disconnected", locale));
      refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("error.requestFailed", locale), "error");
    }
  }

  function connect(provider: string) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- API route that 302-redirects to the OAuth provider (legacy-identical behavior)
    window.location.assign(`/account/api/oauth/start.php?provider=${encodeURIComponent(provider)}&mode=connect`);
  }

  if (failed) {
    return <StateError message={t("conn.loadFailed", locale)} onRetry={refresh} retryLabel={t("action.retry", locale)} />;
  }
  if (!data) {
    return <div className="card"><div className="skeleton skeleton--line" /><div className="skeleton skeleton--line skeleton--short" /></div>;
  }

  return (
    <div className="settings-cards">
      {PROVIDERS.map((provider) => {
        const connection = data.connections?.[provider];
        return (
          <article className="card connection-card" key={provider}>
            <div className="card-heading card-heading--split">
              <div>
                <h2>{provider[0].toUpperCase() + provider.slice(1)}</h2>
                <p>
                  {connection
                    ? `${t("conn.connected", locale)} · ${maskEmail(connection.provider_email, locale)} · ${accountFormatDate(connection.created_at, locale)}`
                    : t("conn.notConnected", locale)}
                </p>
              </div>
              {connection ? (
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => disconnect(provider)}>{t("conn.disconnect", locale)}</button>
              ) : (
                <button className="btn btn--primary btn--sm" type="button" onClick={() => connect(provider)}>{t("conn.connect", locale)}</button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}