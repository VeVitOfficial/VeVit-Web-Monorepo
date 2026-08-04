<?php
declare(strict_types=1);

require_once __DIR__ . '/../orders/OrderStateMachine.php';

interface StripeCheckoutClient
{
    /** @param array<string,mixed> $parameters @return array<string,mixed> */
    public function createCheckoutSession(array $parameters, string $idempotencyKey): array;
}

final class LegacyStripeCheckoutClient implements StripeCheckoutClient
{
    public function __construct(private readonly string $secretKey)
    {
    }

    public function createCheckoutSession(array $parameters, string $idempotencyKey): array
    {
        Stripe::setApiKey($this->secretKey);
        $response = Stripe::request('POST', 'checkout/sessions', $parameters, $idempotencyKey);
        if (($response['code'] ?? 0) !== 200 || !is_array($response['body'] ?? null)) {
            throw new RuntimeException('Stripe checkout request failed.');
        }
        return $response['body'];
    }
}

final class StripeCheckoutService
{
    public function __construct(
        private readonly PDO $pdo,
        private readonly StripeCheckoutClient $client,
        private readonly string $appUrl,
        private readonly bool $expectedLiveMode
    ) {
    }

    /** @return array{url:string,order:array<string,mixed>,reused:bool} */
    public function createOrReuse(int $orderId): array
    {
        $this->pdo->beginTransaction();
        try {
            $lock = $this->pdo->prepare('SELECT * FROM store_orders WHERE id = ? FOR UPDATE');
            $lock->execute([$orderId]);
            $order = $lock->fetch(PDO::FETCH_ASSOC);
            if (!$order) throw new RuntimeException('Order unavailable.');
            if (!in_array($order['payment_status'], ['pending_checkout', 'awaiting_payment', 'failed'], true)) {
                throw new DomainException('Order may not start checkout in its current state.');
            }
            $sessionExpiresAt = empty($order['stripe_session_expires_at']) ? null : new DateTimeImmutable((string) $order['stripe_session_expires_at']);
            if (!empty($order['stripe_session_id']) && !empty($order['stripe_checkout_url'])
                && ($sessionExpiresAt === null || $sessionExpiresAt > new DateTimeImmutable('now', new DateTimeZone('UTC')))) {
                $this->pdo->commit();
                return ['url' => (string) $order['stripe_checkout_url'], 'order' => $order, 'reused' => true];
            }
            $attempt = (int) $order['stripe_session_attempt'];
            if (!empty($order['stripe_session_id']) && $sessionExpiresAt !== null
                && $sessionExpiresAt <= new DateTimeImmutable('now', new DateTimeZone('UTC'))) {
                $attempt++;
                $expire = $this->pdo->prepare(
                    "UPDATE store_orders SET stripe_session_id = NULL, stripe_checkout_url = NULL,
                     stripe_session_status = 'expired', stripe_session_attempt = ? WHERE id = ?"
                );
                $expire->execute([$attempt, $orderId]);
            } else {
                $this->pdo->prepare("UPDATE store_orders SET stripe_session_status = 'creating' WHERE id = ?")->execute([$orderId]);
            }
            $itemsQuery = $this->pdo->prepare('SELECT product_name, quantity, unit_price_minor FROM store_order_items WHERE order_id = ? ORDER BY id');
            $itemsQuery->execute([$orderId]);
            $items = $itemsQuery->fetchAll(PDO::FETCH_ASSOC);
            if ($items === []) throw new RuntimeException('Order has no items.');
            $stripeTotal = 0;
            foreach ($items as $item) {
                $unit = (int) $item['unit_price_minor'];
                $quantity = (int) $item['quantity'];
                if ($unit <= 0 || $quantity <= 0 || $unit > intdiv(PHP_INT_MAX, $quantity)) {
                    throw new RuntimeException('Order contains invalid monetary data.');
                }
                $stripeTotal += $unit * $quantity;
            }
            $shippingMinor = (int) $order['shipping_minor'];
            if ($shippingMinor < 0) throw new RuntimeException('Order contains invalid shipping.');
            $stripeTotal += $shippingMinor;
            if ($stripeTotal !== (int) $order['total_minor']) {
                throw new RuntimeException('Order total does not match Stripe line items.');
            }
            $this->pdo->commit();

            $parameters = [
                'mode' => 'payment',
                // Release 0 uses one synchronous authoritative event. Enabling
                // asynchronous methods requires a separate state-machine change.
                'payment_method_types[0]' => 'card',
                'success_url' => $this->appUrl . '/success.php?order=' . rawurlencode((string) $order['public_id']),
                'cancel_url' => $this->appUrl . '/cancel.php?order=' . rawurlencode((string) $order['public_id']),
                'client_reference_id' => (string) $order['public_id'],
                'metadata[order_public_id]' => (string) $order['public_id'],
                'metadata[schema_version]' => '1',
            ];
            foreach ($items as $index => $item) {
                $parameters["line_items[{$index}][price_data][currency]"] = (string) $order['currency'];
                $parameters["line_items[{$index}][price_data][product_data][name]"] = mb_substr((string) $item['product_name'], 0, 120);
                $parameters["line_items[{$index}][price_data][unit_amount]"] = (int) $item['unit_price_minor'];
                $parameters["line_items[{$index}][quantity]"] = (int) $item['quantity'];
            }
            if ($shippingMinor > 0) {
                $index = count($items);
                $parameters["line_items[{$index}][price_data][currency]"] = (string) $order['currency'];
                $parameters["line_items[{$index}][price_data][product_data][name]"] = 'Doprava';
                $parameters["line_items[{$index}][price_data][unit_amount]"] = $shippingMinor;
                $parameters["line_items[{$index}][quantity]"] = 1;
            }
            $idempotencyKey = 'vevit-store:checkout:v1:' . (string) $order['public_id'] . ':' . $attempt;
            $session = $this->client->createCheckoutSession($parameters, $idempotencyKey);
            if (!is_string($session['id'] ?? null) || !preg_match('/^cs_(?:test|live)_[A-Za-z0-9_]+$/', $session['id'])
                || !is_string($session['url'] ?? null) || !str_starts_with($session['url'], 'https://checkout.stripe.com/')
                || ($session['mode'] ?? null) !== 'payment'
                || ($session['status'] ?? null) !== 'open'
                || ($session['payment_status'] ?? null) !== 'unpaid'
                || ($session['livemode'] ?? null) !== $this->expectedLiveMode
                || ($session['client_reference_id'] ?? null) !== $order['public_id']
                || ($session['metadata']['order_public_id'] ?? null) !== $order['public_id']
                || ($session['metadata']['schema_version'] ?? null) !== '1'
                || !is_int($session['amount_total'] ?? null) || $session['amount_total'] !== (int) $order['total_minor']
                || !is_string($session['currency'] ?? null) || strtolower($session['currency']) !== strtolower((string) $order['currency'])) {
                throw new RuntimeException('Stripe returned an invalid checkout session.');
            }

            $this->pdo->beginTransaction();
            $lock->execute([$orderId]);
            $current = $lock->fetch(PDO::FETCH_ASSOC);
            if (!$current) throw new RuntimeException('Order unavailable.');
            if (!empty($current['stripe_session_id'])) {
                if (!hash_equals((string) $current['stripe_session_id'], (string) $session['id'])) {
                    throw new RuntimeException('Conflicting Stripe checkout session.');
                }
            } else {
                (new OrderStateMachine())->assertPayment((string) $current['payment_status'], 'awaiting_payment');
                $update = $this->pdo->prepare(
                    "UPDATE store_orders
                     SET stripe_session_id = ?, stripe_checkout_url = ?, stripe_session_status = 'open',
                         stripe_session_expires_at = to_timestamp(?), payment_status = 'awaiting_payment',
                         status = 'awaiting_payment'
                     WHERE id = ?"
                );
                $update->execute([
                    $session['id'], $session['url'], is_int($session['expires_at'] ?? null) ? $session['expires_at'] : time() + 86400, $orderId,
                ]);
            }
            $lock->execute([$orderId]);
            $stored = $lock->fetch(PDO::FETCH_ASSOC);
            $this->pdo->commit();
            return ['url' => (string) $stored['stripe_checkout_url'], 'order' => $stored, 'reused' => false];
        } catch (Throwable $exception) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $exception;
        }
    }
}
