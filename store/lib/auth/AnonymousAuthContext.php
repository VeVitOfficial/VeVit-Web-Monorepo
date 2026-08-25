<?php

declare(strict_types=1);

final class AnonymousAuthContext implements AuthContext
{
    public function __construct(private readonly string $reason = 'anonymous')
    {
    }

    public function isAuthenticated(): bool { return false; }
    public function userId(): ?string { return null; }
    public function verifiedEmail(): ?string { return null; }
    public function hasRole(string $role): bool { return false; }
    public function source(): string { return $this->reason; }
    public function verifiedAt(): ?DateTimeImmutable { return null; }
}
