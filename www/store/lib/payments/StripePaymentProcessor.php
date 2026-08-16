<?php
declare(strict_types=1);

require_once __DIR__ . '/../orders/OrderStateMachine.php';

final class StripePaymentConflict extends RuntimeException
{
}

final class StripePaymentProcessor
{
    public function __construct(
        private readonly PDO $pdo,
        private readonly OrderStateMachine $stateMachine,
        private readonly bool $expectedLiveMode,
        private readonly ?string $expectedAccountId = null
    ) {
    }

    /**
     * The only event that may apply paid side effects is
     * checkout.session.completed with payment_status=paid.
     *
     * @param array<string,mixed> $event
     * @return array{result:string,http_status:int}
     */
    public function process(array $event, string $payloadHash): array
    {
        $eventId = $event['id'] ?? null;
        $eventType = $event['type'] ?? null;
        $object = $event['data']['object'] ?? null;
        if (!is_string($eventId) || !preg_match('/^evt_[A-Za-z0-9_]+$/', $eventId)
            || !is_string($eventType) || !is_array($object)) {
            throw new InvalidArgumentException('Invalid Stripe event structure.');
        }

        $this->pdo->beginTransaction();
        try {
            $ledger = $this->upsertAndLockEvent($eventId, $eventType, $object, $payloadHash);
            if (!hash_equals((string) $ledger['payload_hash'], $payloadHash)) {
                $this->markEvent((int) $ledger['id'], 'manual_review', 'event_id_payload_mismatch', null);
                $this->pdo->commit();
                return ['result' => 'manual_review', 'http_status' => 200];
            }
            if (in_array($ledger['processing_status'], ['processed', 'ignored', 'manual_review'], true)) {
                $this->pdo->commit();
                return ['result' => 'duplicate', 'http_status' => 200];
            }
            if ($eventType !== 'checkout.session.completed') {
                $this->markEvent((int) $ledger['id'], 'ignored', 'unsupported_event', null);
                $this->pdo->commit();
                return ['result' => 'ignored', 'http_status' => 200];
            }
            if (($event['livemode'] ?? null) !== $this->expectedLiveMode
                || ($this->expectedAccountId !== null && ($event['account'] ?? null) !== $this->expectedAccountId)) {
                $this->markEvent((int) $ledger['id'], 'manual_review', 'environment_mismatch', null);
                $this->pdo->commit();
                return ['result' => 'manual_review', 'http_status' => 200];
            }

            $order = $this->lockCorrelatedOrder($object);
            if ($order === null) {
                $this->markEvent((int) $ledger['id'], 'manual_review', 'order_correlation_failed', null);
                $this->pdo->commit();
                return ['result' => 'manual_review', 'http_status' => 200];
            }
            $orderId = (int) $order['id'];
            $this->pdo->prepare('UPDATE store_payment_events SET order_id = ? WHERE id = ?')->execute([$orderId, $ledger['id']]);

            $mismatch = $this->paymentMismatch($order, $object);
            if ($mismatch !== null) {
                $this->markEvent((int) $ledger['id'], 'manual_review', $mismatch, $orderId);
                $this->pdo->commit();
                return ['result' => 'manual_review', 'http_status' => 200];
            }

            if ($order['payment_status'] === 'paid' && $order['payment_effects_applied_at'] !== null) {
                $this->markEvent((int) $ledger['id'], 'processed', 'already_fulfilled', $orderId);
                $this->pdo->commit();
                return ['result' => 'duplicate_payment', 'http_status' => 200];
            }
            if ($order['payment_status'] === 'paid' && $order['fulfillment_status'] === 'manual_review') {
                $this->markEvent((int) $ledger['id'], 'processed', 'already_manual_review', $orderId);
                $this->pdo->commit();
                return ['result' => 'paid_manual_review', 'http_status' => 200];
            }
            $this->stateMachine->assertPayment((string) $order['payment_status'], 'paid');

            $items = $this->lockOrderItemsAndProducts($orderId);
            $conflict = $this->fulfillmentConflict($items);
            if ($conflict !== null) {
                $update = $this->pdo->prepare(
                    "UPDATE store_orders SET payment_status = 'paid', status = 'manual_review',
                     fulfillment_status = 'manual_review', paid_at = COALESCE(paid_at, NOW()),
                     payment_evidence_at = COALESCE(payment_evidence_at, NOW()),
                     stripe_payment_intent = COALESCE(stripe_payment_intent, ?),
                     manual_review_reason = ? WHERE id = ?"
                );
                $update->execute([$object['payment_intent'] ?: null, $conflict, $orderId]);
                $this->markEvent((int) $ledger['id'], 'processed', $conflict, $orderId);
                $this->pdo->commit();
                return ['result' => 'paid_manual_review', 'http_status' => 200];
            }

            foreach ($items as $item) {
                if ($item['product_type'] === 'physical') $this->applyInventoryMovement($orderId, $item);
            }
            foreach ($items as $item) {
                if ($item['product_type'] === 'digital') $this->createEntitlement($order, $item);
            }
            $this->stateMachine->assertFulfillment((string) $order['fulfillment_status'], 'ready');
            $update = $this->pdo->prepare(
                "UPDATE store_orders SET payment_status = 'paid', fulfillment_status = 'ready', status = 'paid',
                 paid_at = COALESCE(paid_at, NOW()), payment_evidence_at = COALESCE(payment_evidence_at, NOW()),
                 payment_effects_applied_at = COALESCE(payment_effects_applied_at, NOW()),
                 stripe_payment_intent = COALESCE(stripe_payment_intent, ?), stripe_session_status = 'complete'
                 WHERE id = ?"
            );
            $update->execute([$object['payment_intent'] ?: null, $orderId]);
            $this->markEvent((int) $ledger['id'], 'processed', 'paid', $orderId);
            $this->pdo->commit();
            return ['result' => 'paid', 'http_status' => 200];
        } catch (Throwable $exception) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $exception;
        }
    }

    /** @param array<string,mixed> $object @return array<string,mixed> */
    private function upsertAndLockEvent(string $eventId, string $type, array $object, string $payloadHash): array
    {
        $query = $this->pdo->prepare(
            "INSERT INTO store_payment_events
                (stripe_event_id, event_type, stripe_object_id, payload_hash, attempts)
             VALUES (?, ?, ?, ?, 1)
             ON CONFLICT (stripe_event_id) DO UPDATE SET attempts = store_payment_events.attempts + 1
             RETURNING *"
        );
        $query->execute([$eventId, $type, is_string($object['id'] ?? null) ? $object['id'] : null, $payloadHash]);
        return $query->fetch(PDO::FETCH_ASSOC);
    }

    /** @param array<string,mixed> $object @return array<string,mixed>|null */
    private function lockCorrelatedOrder(array $object): ?array
    {
        $sessionId = $object['id'] ?? null;
        $publicId = $object['metadata']['order_public_id'] ?? null;
        if (!is_string($sessionId) || !is_string($publicId) || !preg_match('/^[a-f0-9]{32}$/', $publicId)) return null;
        $query = $this->pdo->prepare('SELECT * FROM store_orders WHERE public_id = ? AND stripe_session_id = ? FOR UPDATE');
        $query->execute([$publicId, $sessionId]);
        return $query->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /** @param array<string,mixed> $order @param array<string,mixed> $object */
    private function paymentMismatch(array $order, array $object): ?string
    {
        if (($object['payment_status'] ?? null) !== 'paid' || ($object['status'] ?? null) !== 'complete') return 'payment_not_complete';
        if (!is_int($object['amount_total'] ?? null) || $object['amount_total'] !== (int) $order['total_minor']) return 'amount_mismatch';
        if (!is_string($object['currency'] ?? null) || strtolower($object['currency']) !== strtolower((string) $order['currency'])) return 'currency_mismatch';
        $intent = $object['payment_intent'] ?? null;
        if (!is_string($intent) || !preg_match('/^pi_[A-Za-z0-9_]+$/', $intent)) return 'payment_intent_invalid';
        if (!empty($order['stripe_payment_intent']) && !hash_equals((string) $order['stripe_payment_intent'], $intent)) return 'payment_intent_mismatch';
        $other = $this->pdo->prepare('SELECT id FROM store_orders WHERE stripe_payment_intent = ? AND id <> ? LIMIT 1');
        $other->execute([$intent, $order['id']]);
        if ($other->fetchColumn() !== false) return 'payment_intent_reused';
        if (in_array($order['payment_status'], ['cancelled', 'refunded'], true)) return 'order_closed';
        return null;
    }

    /** @return list<array<string,mixed>> */
    private function lockOrderItemsAndProducts(int $orderId): array
    {
        $query = $this->pdo->prepare(
            'SELECT oi.*, p.stock, p.allow_backorder, p.is_active AS current_product_active
             FROM store_order_items oi
             JOIN store_products p ON p.id = oi.product_id
             WHERE oi.order_id = ?
             ORDER BY p.id, oi.id
             FOR UPDATE OF oi, p'
        );
        $query->execute([$orderId]);
        return $query->fetchAll(PDO::FETCH_ASSOC);
    }

    /** @param list<array<string,mixed>> $items */
    private function fulfillmentConflict(array $items): ?string
    {
        if ($items === []) return 'order_items_missing';
        foreach ($items as $item) {
            if ((int) $item['quantity'] <= 0) return 'invalid_historical_quantity';
            if ($item['product_type'] === 'physical') {
                $backorder = $this->dbBool($item['allow_backorder']);
                if (($item['stock'] === null || (int) $item['stock'] < (int) $item['quantity']) && !$backorder) return 'inventory_conflict';
            } elseif ($item['product_type'] === 'digital') {
                if (!$this->dbBool($item['current_product_active']) || empty($item['digital_content_path'])) return 'digital_content_conflict';
            } else {
                return 'unsupported_item_type';
            }
        }
        return null;
    }

    /** @param array<string,mixed> $item */
    private function applyInventoryMovement(int $orderId, array $item): void
    {
        $sourceKey = "order:{$orderId}:item:{$item['id']}:paid-sale:v1";
        $insert = $this->pdo->prepare(
            "INSERT INTO store_inventory_movements
                (product_id, order_id, order_item_id, movement_type, quantity, source_key, audit_metadata)
             VALUES (?, ?, ?, 'sale', ?, ?, ?::jsonb)
             ON CONFLICT (order_item_id, movement_type) DO NOTHING RETURNING id"
        );
        $insert->execute([
            $item['product_id'], $orderId, $item['id'], -(int) $item['quantity'], $sourceKey,
            json_encode(['source' => 'verified_stripe_payment'], JSON_THROW_ON_ERROR),
        ]);
        if ($insert->fetchColumn() === false) return;
        if ($item['stock'] !== null) {
            $update = $this->pdo->prepare(
                'UPDATE store_products SET stock = stock - ? WHERE id = ? AND (stock >= ? OR allow_backorder = TRUE)'
            );
            $update->execute([(int) $item['quantity'], $item['product_id'], (int) $item['quantity']]);
            if ($update->rowCount() !== 1) throw new RuntimeException('Inventory changed after lock.');
        }
    }

    /** @param array<string,mixed> $order @param array<string,mixed> $item */
    private function createEntitlement(array $order, array $item): void
    {
        $insert = $this->pdo->prepare(
            'INSERT INTO store_download_entitlements
                (order_id, order_item_id, user_id, audit_metadata)
             VALUES (?, ?, ?, ?::jsonb)
             ON CONFLICT (order_item_id) DO NOTHING'
        );
        $insert->execute([
            $order['id'], $item['id'], $order['user_id'],
            json_encode(['source' => 'verified_stripe_payment'], JSON_THROW_ON_ERROR),
        ]);
    }

    private function markEvent(int $eventId, string $status, string $result, ?int $orderId): void
    {
        $query = $this->pdo->prepare(
            'UPDATE store_payment_events
             SET processing_status = ?, result = ?, order_id = COALESCE(?, order_id), processed_at = NOW()
             WHERE id = ?'
        );
        $query->execute([$status, $result, $orderId, $eventId]);
    }

    private function dbBool(mixed $value): bool
    {
        return $value === true || $value === 1 || $value === '1' || $value === 't' || $value === 'true';
    }
}
