<?php
declare(strict_types=1);

final readonly class AuditActor
{
    public function __construct(
        public string $type,
        public ?string $userId,
        public ?string $sessionId,
        public string $authSource,
    ) {
    }

    public static function fromContext(ActorContext $actor): self
    {
        return new self($actor->type(), $actor->userId(), $actor->sessionIdHash(), $actor->authSource());
    }
}
