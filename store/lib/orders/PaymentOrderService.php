<?php
declare(strict_types=1);

require_once __DIR__ . '/Money.php';
require_once __DIR__ . '/SnapshotIntegrity.php';

final class PaymentOrderException extends RuntimeException
{
    public function __construct(public readonly string $errorCode)
    {
        parent::__construct('Objednávku nelze bezpečně vytvořit.');
    }
}

final class PaymentOrderService
{
    public function __construct(
        private readonly PDO $pdo,
        private readonly DateTimeImmutable $now,
        private readonly string $storagePath
    ) {
    }

    /**
     * @param array<string,mixed>|null $user
     * @return array{order:array<string,mixed>,guest_grant:string,reused:bool}
     */
    public function createFromSnapshot(string $publicId, ?array $user, ?string $checkoutGrant): array
    {
        $this->pdo->beginTransaction();
        try {
            $statement = $this->pdo->prepare('SELECT * FROM store_checkout_snapshots WHERE public_id = ? FOR UPDATE');
            $statement->execute([$publicId]);
            $snapshotRow = $statement->fetch(PDO::FETCH_ASSOC);
            if (!$snapshotRow) throw new PaymentOrderException('snapshot_unavailable');

            $this->authorizeSnapshot($snapshotRow, $user, $checkoutGrant);
            $existing = $this->findOrderForSnapshot((int) $snapshotRow['id']);
            if ($existing !== null) {
                if (!hash_equals((string) $existing['checkout_request_hash'], (string) $snapshotRow['request_hash'])) {
                    throw new PaymentOrderException('idempotency_conflict');
                }
                $this->pdo->commit();
                return ['order' => $existing, 'guest_grant' => '', 'reused' => true];
            }
            if ((string) $snapshotRow['status'] !== 'pending') throw new PaymentOrderException('snapshot_consumed');
            if (new DateTimeImmutable((string) $snapshotRow['expires_at']) <= $this->now) {
                $this->pdo->prepare("UPDATE store_checkout_snapshots SET status = 'expired', updated_at = NOW() WHERE id = ?")->execute([$snapshotRow['id']]);
                throw new PaymentOrderException('snapshot_expired');
            }

            $snapshot = json_decode((string) $snapshotRow['snapshot_data'], true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($snapshot)) throw new PaymentOrderException('snapshot_invalid');
            $this->verifySnapshotIntegrity($snapshot, (string) $snapshotRow['snapshot_hash']);
            if (($snapshot['user_id'] ?? null) !== $snapshotRow['user_id']
                || (string) ($snapshot['currency'] ?? '') !== (string) $snapshotRow['currency']) {
                throw new PaymentOrderException('snapshot_invalid');
            }
            $validated = $this->revalidateProducts($snapshot);

            foreach (['subtotal_minor', 'shipping_minor', 'total_minor'] as $field) {
                if (!is_int($snapshot[$field] ?? null) || (int) $snapshot[$field] !== (int) $snapshotRow[$field]) {
                    throw new PaymentOrderException('snapshot_invalid');
                }
            }
            if ((int) $snapshot['subtotal_minor'] + (int) $snapshot['shipping_minor'] !== (int) $snapshot['total_minor']) {
                throw new PaymentOrderException('snapshot_invalid');
            }

            $isOwner = $user !== null && $snapshotRow['user_id'] !== null
                && hash_equals((string) $snapshotRow['user_id'], (string) ($user['id'] ?? ''));
            $guestGrant = $isOwner ? '' : bin2hex(random_bytes(32));
            $order = $this->insertOrder($snapshotRow, $snapshot, $isOwner ? null : $guestGrant);
            $this->insertItems((int) $order['id'], $snapshot['items'], $validated);

            $consume = $this->pdo->prepare("UPDATE store_checkout_snapshots SET status = 'consumed', updated_at = NOW() WHERE id = ? AND status = 'pending'");
            $consume->execute([$snapshotRow['id']]);
            if ($consume->rowCount() !== 1) throw new PaymentOrderException('snapshot_consumed');

            $this->pdo->commit();
            return ['order' => $order, 'guest_grant' => $guestGrant, 'reused' => false];
        } catch (Throwable $exception) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $exception;
        }
    }

    /** @param array<string,mixed> $snapshotRow @param array<string,mixed>|null $user */
    private function authorizeSnapshot(array $snapshotRow, ?array $user, ?string $grant): void
    {
        $owned = $user !== null && $snapshotRow['user_id'] !== null
            && hash_equals((string) $snapshotRow['user_id'], (string) ($user['id'] ?? ''));
        $guest = $snapshotRow['user_id'] === null && is_string($grant) && strlen($grant) === 64
            && hash_equals((string) $snapshotRow['checkout_grant_hash'], hash('sha256', $grant));
        if (!$owned && !$guest) throw new PaymentOrderException('snapshot_unavailable');
    }

    /** @return array<string,mixed>|null */
    private function findOrderForSnapshot(int $snapshotId): ?array
    {
        $statement = $this->pdo->prepare('SELECT * FROM store_orders WHERE checkout_snapshot_id = ? FOR UPDATE');
        $statement->execute([$snapshotId]);
        return $statement->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /** @param array<string,mixed> $snapshot */
    private function verifySnapshotIntegrity(array $snapshot, string $storedHash): void
    {
        $embedded = (string) ($snapshot['snapshot_hash'] ?? '');
        $calculated = SnapshotIntegrity::hash($snapshot);
        if ($embedded === '' || !hash_equals($storedHash, $embedded) || !hash_equals($embedded, $calculated)) {
            throw new PaymentOrderException('snapshot_invalid');
        }
    }

    /**
     * @param array<string,mixed> $snapshot
     * @return array<int,array<string,mixed>>
     */
    private function revalidateProducts(array $snapshot): array
    {
        $items = $snapshot['items'] ?? null;
        if (!is_array($items) || $items === [] || count($items) > 25) throw new PaymentOrderException('snapshot_invalid');
        $productIds = [];
        foreach ($items as $item) {
            if (!is_array($item) || !is_int($item['product_id'] ?? null) || !is_int($item['quantity'] ?? null)
                || $item['quantity'] < 1 || $item['quantity'] > 100 || ($item['variant_id'] ?? null) !== null) {
                throw new PaymentOrderException('snapshot_invalid');
            }
            $productIds[] = $item['product_id'];
        }
        if (count(array_unique($productIds)) !== count($productIds)) throw new PaymentOrderException('snapshot_invalid');
        $placeholders = implode(',', array_fill(0, count($productIds), '?'));
        $query = $this->pdo->prepare("SELECT id, name, sku, price::text AS price, sale_price::text AS sale_price, type, stock, is_active, is_sellable, allow_backorder, currency, download_file FROM store_products WHERE id IN ({$placeholders}) ORDER BY id FOR UPDATE");
        $query->execute($productIds);
        $products = [];
        foreach ($query->fetchAll(PDO::FETCH_ASSOC) as $product) $products[(int) $product['id']] = $product;
        if (count($products) !== count($productIds)) throw new PaymentOrderException('product_unavailable');

        $subtotal = 0;
        foreach ($items as $item) {
            $product = $products[$item['product_id']];
            if (!$this->dbBool($product['is_active']) || !$this->dbBool($product['is_sellable'])) throw new PaymentOrderException('product_unavailable');
            if (!in_array($product['type'], ['physical', 'digital'], true)
                || $product['type'] !== $item['type']
                || strtolower((string) $product['currency']) !== 'czk'
                || (string) $item['currency'] !== 'czk') {
                throw new PaymentOrderException('product_changed');
            }
            $sale = $product['sale_price'];
            $price = $sale !== null && Money::decimalToMinor((string) $sale) > 0 ? (string) $sale : (string) $product['price'];
            $minor = Money::decimalToMinor($price);
            if ($minor <= 0 || $minor !== $item['unit_amount_minor'] || $minor * $item['quantity'] !== $item['line_total_minor']) {
                throw new PaymentOrderException('price_changed');
            }
            $subtotal += $item['line_total_minor'];
            if ($product['type'] === 'physical') {
                if ($product['stock'] === null && !$this->dbBool($product['allow_backorder'])) throw new PaymentOrderException('stock_changed');
                if ($product['stock'] !== null && (int) $product['stock'] < $item['quantity'] && !$this->dbBool($product['allow_backorder'])) {
                    throw new PaymentOrderException('stock_changed');
                }
            } elseif (!$this->safeDigitalPath((string) $product['download_file'])) {
                throw new PaymentOrderException('digital_unavailable');
            }
        }
        if ($subtotal !== (int) $snapshot['subtotal_minor']) throw new PaymentOrderException('snapshot_invalid');
        return $products;
    }

    /** @param array<string,mixed> $row @param array<string,mixed> $snapshot @return array<string,mixed> */
    private function insertOrder(array $row, array $snapshot, ?string $guestGrant): array
    {
        $publicId = bin2hex(random_bytes(16));
        $orderNumber = 'VVS-' . $this->now->format('ymd') . '-' . strtoupper(bin2hex(random_bytes(4)));
        $query = $this->pdo->prepare(
            "INSERT INTO store_orders (
                order_number, public_id, user_id, guest_grant_hash, guest_grant_expires_at,
                status, payment_status, fulfillment_status, total, currency,
                customer_email, customer_name, shipping_address, notes,
                checkout_snapshot_id, checkout_request_hash, subtotal_minor, shipping_minor,
                total_minor, audit_metadata
            ) VALUES (
                ?, ?, ?, ?, ?, 'pending_checkout', 'pending_checkout', 'pending', ?, 'czk',
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb
            ) RETURNING *"
        );
        $query->execute([
            $orderNumber, $publicId, $snapshot['user_id'],
            $guestGrant === null ? null : hash('sha256', $guestGrant),
            $guestGrant === null ? null : $this->now->modify('+30 days')->format('Y-m-d H:i:s'),
            Money::minorToDecimal((int) $snapshot['total_minor']),
            $snapshot['customer_email'], $snapshot['customer_name'],
            $snapshot['shipping'] === null ? null : json_encode($snapshot['shipping'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            $snapshot['notes'], $row['id'], $row['request_hash'],
            $snapshot['subtotal_minor'], $snapshot['shipping_minor'], $snapshot['total_minor'],
            json_encode(['snapshot_hash' => $row['snapshot_hash'], 'schema_version' => 1], JSON_THROW_ON_ERROR),
        ]);
        return $query->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * @param list<array<string,mixed>> $items
     * @param array<int,array<string,mixed>> $products
     */
    private function insertItems(int $orderId, array $items, array $products): void
    {
        $query = $this->pdo->prepare(
            'INSERT INTO store_order_items (
                order_id, product_id, variant_id, product_name, product_type, quantity,
                unit_price, product_sku, unit_price_minor, line_total_minor,
                stock_context, digital_content_path
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?)'
        );
        foreach ($items as $item) {
            $product = $products[$item['product_id']];
            $query->execute([
                $orderId, $item['product_id'], null, $item['name'], $item['type'], $item['quantity'],
                Money::minorToDecimal($item['unit_amount_minor']), $item['sku'] === '' ? null : $item['sku'],
                $item['unit_amount_minor'], $item['line_total_minor'],
                json_encode([
                    'snapshot_status' => $item['stock_status'],
                    'allow_backorder' => $this->dbBool($product['allow_backorder']),
                    'stock_at_order' => $product['stock'] === null ? null : (int) $product['stock'],
                ], JSON_THROW_ON_ERROR),
                $item['type'] === 'digital' ? $product['download_file'] : null,
            ]);
        }
    }

    private function safeDigitalPath(string $relative): bool
    {
        if ($relative === '' || str_starts_with($relative, '/') || str_contains($relative, '..')
            || str_contains($relative, "\0") || preg_match('#^[a-z][a-z0-9+.-]*://#i', $relative)) return false;
        $base = realpath($this->storagePath);
        $path = $base === false ? false : realpath($base . DIRECTORY_SEPARATOR . $relative);
        return $base !== false && $path !== false && is_file($path) && str_starts_with($path, $base . DIRECTORY_SEPARATOR);
    }

    private function dbBool(mixed $value): bool
    {
        return $value === true || $value === 1 || $value === '1' || $value === 't' || $value === 'true';
    }
}
