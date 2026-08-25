<?php

declare(strict_types=1);

interface AuthContext
{
    public function isAuthenticated(): bool;

    public function userId(): ?string;

    public function verifiedEmail(): ?string;

    public function hasRole(string $role): bool;

    public function source(): string;

    public function verifiedAt(): ?DateTimeImmutable;
}
