<?php

declare(strict_types=1);

/**
 * VeVit Account — PHP server-side adapter for store.vevit.cz
 *
 * Centralises configuration and server-to-server session verification.
 *
 * BLOCKER [B1]: The actual endpoint URL for account.vevit.cz/api/me.php must
 *   be confirmed with the VeVit Account team.
 * BLOCKER [B4]: The CORS allowed-origins list on account.vevit.cz must include
 *   https://store.vevit.cz before the JS adapter's credentialed fetch works.
 * BLOCKER [Server-side]: vevit_session is a host-only cookie for account.vevit.cz.
 *   PHP on store.vevit.cz never receives it. Server-to-server verification
 *   requires a separate contract (shared secret, signed token, or service API key)
 *   from the VeVit Account team. Until that contract exists, getCurrentUser()
 *   returns null for all requests, which is the safe conservative default.
 * BLOCKER [B5]: Logout endpoint, CSRF contract, and redirect behaviour must be
 *   confirmed before implementing server-side logout.
 *
 * Configuration keys (via store_load_config() / config_secret.php):
 *   VEVIT_ACCOUNT_ME_URL    — e.g. https://account.vevit.cz/api/me.php
 *   VEVIT_ACCOUNT_LOGIN_URL — e.g. https://account.vevit.cz/login
 *   VEVIT_ACCOUNT_APP_URL   — e.g. https://store.vevit.cz (return_url base)
 */
final class VevitAccount
{
    private string $meUrl;
    private string $loginUrl;
    private string $appUrl;
    private int    $timeoutSeconds;

    public function __construct(
        string $meUrl    = 'https://vevit.cz/account/api/me.php',
        string $loginUrl = 'https://vevit.cz/account/login',
        string $appUrl   = '',
        int    $timeoutSeconds = 3
    ) {
        if (filter_var($meUrl,    FILTER_VALIDATE_URL) === false) throw new InvalidArgumentException('Invalid meUrl.');
        if (filter_var($loginUrl, FILTER_VALIDATE_URL) === false) throw new InvalidArgumentException('Invalid loginUrl.');
        $this->meUrl          = $meUrl;
        $this->loginUrl       = $loginUrl;
        $this->appUrl         = $appUrl;
        $this->timeoutSeconds = max(1, min(10, $timeoutSeconds));
    }

    /**
     * Build the login redirect URL including a return_url parameter.
     *
     * [B2] The return_url parameter name must be confirmed with the VeVit Account team.
     */
    public function loginRedirectUrl(?string $returnPath = null): string
    {
        $base = $this->appUrl ?: '';
        $returnUrl = $returnPath
            ? rtrim($base, '/') . '/' . ltrim($returnPath, '/')
            : rtrim($base, '/') . '/';

        if ($returnUrl && filter_var($returnUrl, FILTER_VALIDATE_URL)) {
            return $this->loginUrl . '?return_url=' . urlencode($returnUrl); // [B2]
        }

        return $this->loginUrl;
    }

    /**
     * Attempt server-to-server session verification.
     *
     * BLOCKER: This cannot work until the VeVit Account team provides a
     * server-side contract. vevit_session is host-only for account.vevit.cz
     * and PHP on store.vevit.cz never receives it.
     *
     * When the contract is available, implement it here:
     *   - API key in Authorization header, or
     *   - Signed request from store.vevit.cz → account.vevit.cz, or
     *   - A dedicated server-to-server endpoint.
     *
     * Until then: always returns null (unauthenticated — safe default).
     *
     * @return array{id:string,display_name:string,avatar_url:string|null}|null
     */
    public function checkSession(): ?array
    {
        // [BLOCKER] Server-to-server contract not yet available.
        // Do NOT attempt to read $_COOKIE['vevit_session'] here —
        // that cookie is host-only for account.vevit.cz; it is absent.
        return null;
    }

    /**
     * Emit a Location redirect to the VeVit Account login page.
     * Must only be called before any output.
     */
    public function redirectToLogin(?string $returnPath = null): never
    {
        $url = $this->loginRedirectUrl($returnPath);
        header('Location: ' . $url, true, 302);
        exit;
    }

    public function getMeUrl(): string    { return $this->meUrl; }
    public function getLoginUrl(): string { return $this->loginUrl; }
    public function getAppUrl(): string   { return $this->appUrl; }

    /**
     * Build from the application config array (output of store_load_config()).
     *
     * @param array<string, mixed> $config
     */
    public static function fromConfig(array $config): self
    {
        return new self(
            $config['vevit_account']['me_url']    ?? 'https://vevit.cz/account/api/me.php',
            $config['vevit_account']['login_url'] ?? 'https://vevit.cz/account/login',
            $config['app_url']                    ?? '',
        );
    }
}
