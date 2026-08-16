<?php

declare(strict_types=1);

/**
 * Deliberately unavailable until VeVit Account supplies a reviewed server-to-server
 * session contract. This class never trusts browser input, cookies, or callback data.
 */
final class VeVitAccountAuthContext implements AuthContext
{
    /** @param array<string,mixed> $config @param callable():array<string,mixed>|null $provider */
    public function __construct(private readonly array $config, private readonly ?Closure $provider = null)
    {
    }

    public function isAuthenticated(): bool { return false; }
    public function userId(): ?string { return null; }
    public function verifiedEmail(): ?string { return null; }
    public function hasRole(string $role): bool { return false; }
    public function source(): string { return 'vevit_account_unavailable'; }
    public function verifiedAt(): ?DateTimeImmutable { return null; }
}
