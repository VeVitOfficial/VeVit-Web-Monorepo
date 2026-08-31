"use client";

import { useCallback, useEffect, useState } from "react";
import {
  accountT as t,
  accountTp,
  accountFormatDate,
  accountFormatDateTime,
} from "@/lib/account-i18n";
import { useAccountLocale } from "../use-account-locale";
import { useAccountApi } from "../api";
import { useSession } from "../session";
import { StateError } from "../ui";
import { ConfirmDialog, RecoveryCodesModal, TotpSetupModal } from "../modals";

/**
 * Port of loadSecurity/renderSecuritySection + handleAccountAction branches
 * (revoke/change-password/2FA) from app.js, plus the twofa_reauth URL flow.
 */

type SessionsPayload = {
  sessions: Array<{
    id: string;
    device: string | null;
    ip_address: string | null;
    created_at: string;
    last_seen_at: string;
    expires_at: string;
    is_current: boolean;
  }>;
};
type ConnectionsPayload = {
  has_password: boolean;
  connections: Record<string, { provider_email: string; created_at: string }>;
};
type TwofaPayload = {
  enabled: boolean;
  enabled_at: string | null;
  recovery_codes_remaining: number;
};
type OverviewPayload = {
  security: { last_password_change: string | null };
};

/** Prompt for a password with validation against the real password shape is
 * impossible — the legacy app used window.prompt; keep the same UX (parity). */
function promptPassword(message: string): string | null {
  return prompt(message);
}

export function SecuritySection() {
  const locale = useAccountLocale();
  const { showToast } = useSession();
  const run = useAccountApi();
  const [data, setData] = useState<{ sessions: SessionsPayload; overview: OverviewPayload; connections: ConnectionsPayload; twofa: TwofaPayload } | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirmState, setConfirmState] = useState<"revoke-others" | null>(null);
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const [totp, setTotp] = useState<{ challenge: string; qr_code: string; secret: string } | null>(null);

  const fetchAll = useCallback(
    () =>
      Promise.all([
        run<SessionsPayload>("sessions-list.php"),
        run<OverviewPayload>("account-overview.php"),
        run<ConnectionsPayload>("connections.php"),
        run<TwofaPayload>("2fa/status.php"),
      ]),
    [run],
  );

  const load = useCallback(() =>
    fetchAll().then(
      ([sessions, overview, connections, twofa]) => {
        setData({ sessions, overview, connections, twofa });
        setFailed(false);
        return true;
      },
      (error) => {
        console.error("Security load failed", error);
        setFailed(true);
        return false;
      },
    ), [fetchAll]);

  const reload = load;

  /** URL flow from loadSecurity: /account/security?twofa_reauth=…&twofa_action=… */
  async function handleReauth() {
    const params = new URLSearchParams(window.location.search);
    const reauth = params.get("twofa_reauth");
    if (!reauth) return;
    const action = params.get("twofa_action") || "setup";
    window.history.replaceState({}, "", "/account/security");
    try {
      if (action === "setup") {
        setTotp(await run<{ challenge: string; qr_code: string; secret: string }>("2fa/setup-start.php", { method: "POST", body: { reauth_challenge: reauth } }));
        return;
      }
      const code = prompt(t("security.promptReauthCode", locale));
      if (code === null) return;
      const endpoint = action === "disable" ? "2fa/disable.php" : "2fa/recovery-regenerate.php";
      const result = await run<{ recovery_codes?: string[] }>(endpoint, { method: "POST", body: { reauth_challenge: reauth, code } });
      if (action === "disable") {
        showToast(t("security.2faDisabled", locale));
        reload();
      } else {
        setRecovery(result.recovery_codes || []);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("error.requestFailed", locale), "error");
    }
  }

  useEffect(() => {
    load().then((succeeded) => {
      if (succeeded) handleReauth();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once after load; handleReauth re-runs via reload()
  }, [load]);

  function hasPasswordProvider(): { hasPassword: boolean; provider: string } {
    const hasPassword = Boolean(data?.connections?.has_password);
    const provider = Object.keys(data?.connections?.connections || {})[0] || "";
    return { hasPassword, provider };
  }

  async function revokeSession(sessionId: string) {
    if (!confirm(t("security.revokeOneConfirm", locale))) return;
    try {
      await run("sessions-revoke.php", { method: "POST", body: { session_id: sessionId } });
      showToast(t("security.sessionRevoked", locale));
      reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("error.requestFailed", locale), "error");
    }
  }

  async function changePassword() {
    const current = promptPassword(t("security.promptCurrentPassword", locale));
    if (current === null) return;
    const next = promptPassword(t("security.promptNewPassword", locale));
    if (next === null) return;
    const confirmPassword = promptPassword(t("security.promptConfirmPassword", locale));
    if (confirmPassword !== next) {
      showToast(t("security.passwordMismatch", locale), "error");
      return;
    }
    try {
      await run("change-password.php", { method: "POST", body: { current_password: current, new_password: next } });
      showToast(t("security.passwordChanged", locale));
      reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("error.requestFailed", locale), "error");
    }
  }

  async function startTotpSetup(needsReauth: boolean) {
    if (needsReauth) {
      const { provider } = hasPasswordProvider();
      if (!provider) {
        showToast(t("security.needOAuthOrPassword", locale), "error");
        return;
      }
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- API route that 302-redirects to the OAuth provider (legacy-identical behavior)
      window.location.assign(`/account/api/oauth/start.php?mode=twofa_reauth&provider=${encodeURIComponent(provider)}`);
      return;
    }
    const password = promptPassword(t("security.promptConfirmCurrent", locale));
    if (password === null) return;
    try {
      setTotp(await run<{ challenge: string; qr_code: string; secret: string }>("2fa/setup-start.php", { method: "POST", body: { password } }));
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("error.requestFailed", locale), "error");
    }
  }

  async function regenerate2fa(needsReauth: boolean) {
    if (needsReauth) {
      const { provider } = hasPasswordProvider();
      if (!provider) {
        showToast(t("security.needOAuthOrPassword", locale), "error");
        return;
      }
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- API route that 302-redirects to the OAuth provider (legacy-identical behavior)
      window.location.assign(`/account/api/oauth/start.php?mode=twofa_reauth&twofa_action=regenerate&provider=${encodeURIComponent(provider)}`);
      return;
    }
    const password = promptPassword(t("security.promptConfirmCurrent", locale));
    if (password === null) return;
    const code = promptPassword(t("security.promptTotpCode", locale));
    if (code === null) return;
    try {
      const result = await run<{ recovery_codes?: string[] }>("2fa/recovery-regenerate.php", { method: "POST", body: { password, code } });
      setRecovery(result.recovery_codes || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("error.requestFailed", locale), "error");
    }
  }

  async function disable2fa(needsReauth: boolean) {
    if (needsReauth) {
      const { provider } = hasPasswordProvider();
      if (!provider) {
        showToast(t("security.needOAuthOrPassword", locale), "error");
        return;
      }
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- API route that 302-redirects to the OAuth provider (legacy-identical behavior)
      window.location.assign(`/account/api/oauth/start.php?mode=twofa_reauth&twofa_action=disable&provider=${encodeURIComponent(provider)}`);
      return;
    }
    if (!confirm(t("security.disable2faConfirm", locale))) return;
    const password = promptPassword(t("security.promptConfirmCurrent", locale));
    if (password === null) return;
    const code = promptPassword(t("security.promptTotpCode", locale));
    if (code === null) return;
    try {
      await run("2fa/disable.php", { method: "POST", body: { password, code } });
      showToast(t("security.2faDisabled", locale));
      reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("error.requestFailed", locale), "error");
    }
  }

  if (failed) {
    return <StateError message={t("security.loadFailed", locale)} onRetry={load} retryLabel={t("action.retry", locale)} />;
  }
  if (!data) {
    return <div className="card"><div className="skeleton skeleton--line" /><div className="skeleton skeleton--line skeleton--short" /></div>;
  }

  const hasPassword = Boolean(data.connections?.has_password);
  const provider = Object.keys(data.connections?.connections || {})[0] || "";
  const lastPasswordChange = data.overview?.security?.last_password_change;
  const sessions = data.sessions?.sessions || [];
  const twofa = data.twofa || { enabled: false, enabled_at: null, recovery_codes_remaining: 0 };
  const recoveryRemaining = Number(twofa.recovery_codes_remaining) || 0;

  return (
    <section>
      <article className="card">
        <div className="card-heading card-heading--split">
          <div>
            <h2>{t("security.passwordTitle", locale)}</h2>
            <p>{hasPassword ? t("security.passwordSet", locale) : t("security.passwordNotSet", locale)}</p>
          </div>
          <button className="btn btn--primary btn--sm" type="button" onClick={changePassword}>
            {hasPassword ? t("security.changePassword", locale) : t("security.setPassword", locale)}
          </button>
        </div>
        <p className="field-hint">
          {lastPasswordChange
            ? `${t("security.lastPasswordChangePrefix", locale)} ${accountFormatDate(lastPasswordChange, locale)}`
            : t("security.noPasswordChange", locale)}
        </p>
      </article>

      {twofa.enabled ? (
        <article className="card">
          <div className="card-heading card-heading--split">
            <div>
              <h2>{t("security.2faTitle", locale)}</h2>
              <p>
                <span className="status-badge">{t("security.2faActive", locale)}</span>
                {" · "}
                {t("security.2faEnabledPrefix", locale)} {accountFormatDate(twofa.enabled_at, locale)}
                {" · "}
                {accountTp("security.2faRecoveryRemaining", recoveryRemaining, locale, { n: recoveryRemaining })}
              </p>
            </div>
            <div className="button-row">
              <button className="btn btn--ghost btn--sm" type="button" onClick={() => regenerate2fa(!hasPassword)} data-oauth-provider={provider}>
                {t("security.regenerate2fa", locale)}
              </button>
              <button className="btn btn--warn btn--sm" type="button" onClick={() => disable2fa(!hasPassword)} data-oauth-provider={provider}>
                {t("security.disable2fa", locale)}
              </button>
            </div>
          </div>
        </article>
      ) : (
        <article className="card">
          <div className="card-heading card-heading--split">
            <div>
              <h2>{t("security.2faTitle", locale)}</h2>
              <p>{t("security.2faDisabledDesc", locale)}</p>
            </div>
            <button className="btn btn--primary btn--sm" type="button" onClick={() => startTotpSetup(!hasPassword)} data-oauth-provider={provider}>
              {t("security.enable2fa", locale)}
            </button>
          </div>
        </article>
      )}

      <article className="card">
        <div className="card-heading card-heading--split">
          <div>
            <h2>{t("security.sessionsTitle", locale)}</h2>
            <p>{accountTp("security.sessionsCount", sessions.length, locale, { n: sessions.length })}</p>
          </div>
          {sessions.length > 1 && (
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => setConfirmState("revoke-others")}>
              {t("security.revokeOthers", locale)}
            </button>
          )}
        </div>
        <div className="settings-list">
          {sessions.length === 0 ? (
            <div className="state-card state-card--empty">
              <span className="state-card__icon" aria-hidden="true">○</span>
              <div>
                <strong>{t("security.noOtherSessions", locale)}</strong>
                <p>{t("security.sessionsEmptyDesc", locale)}</p>
              </div>
            </div>
          ) : (
            sessions.map((session) => (
              <div className="settings-row" key={session.id}>
                <div>
                  <strong>
                    {session.device || t("security.webDevice", locale)}
                    {session.is_current && (
                      <span className="status-badge status-badge--current">{t("security.currentDevice", locale)}</span>
                    )}
                  </strong>
                  <p>
                    {session.ip_address || t("security.ipUnspecified", locale)} · {t("security.sessionCreated", locale)}{" "}
                    {accountFormatDateTime(session.created_at, locale)} · {t("security.sessionActive", locale)}{" "}
                    {accountFormatDateTime(session.last_seen_at, locale)} · {t("security.sessionValidUntil", locale)}{" "}
                    {accountFormatDateTime(session.expires_at, locale)}
                  </p>
                </div>
                {!session.is_current && (
                  <button className="btn btn--ghost btn--sm" type="button" onClick={() => revokeSession(session.id)}>
                    {t("security.revokeSession", locale)}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </article>

      {confirmState === "revoke-others" && (
        <ConfirmDialog
          locale={locale}
          title={t("security.revokeOthersTitle", locale)}
          message={t("security.revokeOthersMessage", locale)}
          confirmLabel={t("security.revokeOthers", locale)}
          dangerous
          cancel={() => setConfirmState(null)}
          onResult={async (result) => {
            if (!result) return;
            try {
              await run("sessions-revoke.php", { method: "POST", body: { all_others: true } });
              showToast(t("security.sessionRevoked", locale));
              reload();
            } catch (error) {
              showToast(error instanceof Error ? error.message : t("error.requestFailed", locale), "error");
            }
          }}
        />
      )}

      {totp && (
        <TotpSetupModal
          locale={locale}
          data={totp}
          cancel={() => setTotp(null)}
          onSuccess={(codes) => {
            setTotp(null);
            setRecovery(codes);
          }}
        />
      )}

      {recovery && (
        <RecoveryCodesModal
          locale={locale}
          codes={recovery}
          close={() => {
            setRecovery(null);
            reload();
          }}
        />
      )}
    </section>
  );
}