<?php

declare(strict_types=1);

final class ActorContext
{
    public function __construct(
        private readonly string $type,
        private readonly ?string $userId,
        private readonly ?string $sessionIdHash,
        private readonly string $authSource,
    ) {
        if (!in_array($type, ['customer_account', 'customer_guest', 'legacy_shared_admin', 'system'], true)) {
            throw new InvalidArgumentException('Invalid actor type.');
        }
        if ($authSource === '' || strlen($authSource) > 64) {
            throw new InvalidArgumentException('Invalid authentication source.');
        }
        if ($type === 'customer_account' && ($userId === null || $userId === '' || $sessionIdHash !== null)) {
            throw new InvalidArgumentException('Account actor requires only a stable user id.');
        }
        if ($type === 'customer_guest' && ($userId !== null || $sessionIdHash !== null)) {
            throw new InvalidArgumentException('Guest actor cannot carry account identity.');
        }
        if ($type === 'legacy_shared_admin' && ($userId !== null || $sessionIdHash === null)) {
            throw new InvalidArgumentException('Legacy admin actor requires only a session audit id.');
        }
        if ($type === 'system' && ($userId !== null || $sessionIdHash !== null)) {
            throw new InvalidArgumentException('System actor cannot carry user identity.');
        }
        if ($sessionIdHash !== null && !preg_match('/^[a-f0-9]{64}$/', $sessionIdHash)) {
            throw new InvalidArgumentException('Actor session id must be an opaque SHA-256 value.');
        }
    }

    public function type(): string { return $this->type; }
    public function userId(): ?string { return $this->userId; }
    public function sessionIdHash(): ?string { return $this->sessionIdHash; }
    public function authSource(): string { return $this->authSource; }
}
