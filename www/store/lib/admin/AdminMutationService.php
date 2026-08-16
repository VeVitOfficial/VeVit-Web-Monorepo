<?php
declare(strict_types=1);

final class AdminMutationService
{
    public function __construct(
        private readonly ClaimService $claims,
        private readonly ReturnService $returns,
        private readonly DeliveryService $deliveries,
    ) {
    }

    /** @param array<string,mixed> $data @return array<string,mixed> */
    public function transition(string $entity, string $publicId, ActorContext $actor, int $expectedVersion, string $target, array $data, string $idempotencyKey): array
    {
        return match ($entity) {
            'claim' => $this->claims->transition($publicId, $actor, $expectedVersion, $target, $data, $idempotencyKey),
            'return' => $this->returns->transition($publicId, $actor, $expectedVersion, $target, $data, $idempotencyKey),
            'delivery' => $this->deliveries->transition($publicId, $actor, $expectedVersion, $target, $data, $idempotencyKey),
            default => throw new DomainException('Unsupported admin mutation.'),
        };
    }

    /** @param array<string,mixed> $data @return array<string,mixed> */
    public function createDelivery(int$orderId,ActorContext$actor,array$data,string$idempotencyKey):array
    {
        if($orderId<1)throw new DomainException('Order unavailable.');
        return$this->deliveries->create($orderId,$actor,$data,$idempotencyKey);
    }
}
