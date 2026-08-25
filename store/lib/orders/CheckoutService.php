<?php

declare(strict_types=1);

require_once __DIR__ . '/SnapshotIntegrity.php';

final class CheckoutValidationException extends RuntimeException
{
    public string $errorCode;

    public function __construct(string $errorCode, string $message = 'Objednávku se nepodařilo ověřit.')
    {
        $this->errorCode = $errorCode;
        parent::__construct($message);
    }
}

interface CheckoutRepository
{
    public function begin(): void;
    public function commit(): void;
    public function rollBack(): void;
    public function isInTransaction(): bool;
    public function lockIdempotency(string $scopeHash, string $keyHash): void;
    /** @param array<string,mixed> $snapshot */
    public function expireSnapshot(array $snapshot): void;

    /** @return array<string, mixed>|null */
    public function findExisting(string $scopeHash, string $keyHash): ?array;

    /** @param list<int> $productIds @return list<array<string, mixed>> */
    public function findProductsForCheckout(array $productIds): array;

    /** @param array<string, mixed> $snapshot */
    public function saveSnapshot(array $snapshot): void;
}

final class CheckoutService
{
    private const MAX_ITEMS = 25;
    private const MAX_QUANTITY = 100;
    private const SNAPSHOT_TTL_SECONDS = 1800;
    private const MAX_TOTAL_MINOR = 9999999999;

    private CheckoutRepository $repository;
    private DateTimeImmutable $now;
    private ?string $digitalStoragePath;

    public function __construct(CheckoutRepository $repository, DateTimeImmutable $now, ?string $digitalStoragePath = null)
    {
        $this->repository = $repository;
        $this->now = $now;
        $this->digitalStoragePath = $digitalStoragePath;
    }

    /**
     * Builds and persists an order snapshot from product IDs and quantities only.
     * Client-owned display/pricing fields are intentionally discarded.
     *
     * @param array<string, mixed> $input
     * @param array<string, mixed>|null $user
     * @return array{snapshot:array<string,mixed>,grant:string,reused:bool}
     */
    public function createSnapshot(array $input, ?array $user, string $sessionId): array
    {
        $normalized = $this->normalizeInput($input);
        $scopeHash = hash('sha256', $user !== null ? 'user:' . (string) $user['id'] : 'session:' . $sessionId);
        $keyHash = hash('sha256', $normalized['idempotency_key']);
        $requestHash = hash('sha256', json_encode([
            'items' => $normalized['items'], 'email' => $normalized['email'], 'name' => $normalized['name'],
            'shipping' => $normalized['shipping'], 'notes' => $normalized['notes'],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));

        $this->repository->begin();
        try {
            $this->repository->lockIdempotency($scopeHash, $keyHash);
            $existing = $this->repository->findExisting($scopeHash, $keyHash);
            if ($existing !== null) {
                if (!hash_equals((string) ($existing['request_hash'] ?? ''), $requestHash)) {
                    throw new CheckoutValidationException('idempotency_conflict', 'Stejný požadavek již obsahuje jiné údaje. Obnovte prosím stránku.');
                } elseif (($existing['persisted_status'] ?? 'pending') === 'consumed') {
                    $this->repository->commit();
                    return ['snapshot' => $existing, 'grant' => '', 'reused' => true];
                } elseif (new DateTimeImmutable((string) $existing['expires_at']) <= $this->now) {
                    $this->repository->expireSnapshot($existing);
                } else {
                    $this->repository->commit();
                    return ['snapshot' => $existing, 'grant' => '', 'reused' => true];
                }
            }

            $productIds = array_keys($normalized['items']);
            $products = $this->repository->findProductsForCheckout($productIds);
            $productsById = [];
            foreach ($products as $product) {
                $productsById[(int) $product['id']] = $product;
            }

            if (count($productsById) !== count($productIds)) {
                throw new CheckoutValidationException('product_unavailable', 'Jedna nebo více položek již nejsou dostupné.');
            }

            $items = [];
            $subtotalMinor = 0;
            $hasPhysical = false;
            foreach ($normalized['items'] as $productId => $quantity) {
                $product = $productsById[$productId];
                $items[] = $this->buildItem($product, $quantity);
                $item = $items[array_key_last($items)];
                if ($item['line_total_minor'] > self::MAX_TOTAL_MINOR - $subtotalMinor) {
                    throw new CheckoutValidationException('order_total_limit', 'Celková cena objednávky je příliš vysoká.');
                }
                $subtotalMinor += $item['line_total_minor'];
                $hasPhysical = $hasPhysical || $item['type'] === 'physical';
            }

            $shipping = $this->normalizeShipping($normalized['shipping'], $hasPhysical);
            $shippingMinor = $hasPhysical && $subtotalMinor < 100000 ? 9900 : 0;
            $totalMinor = $subtotalMinor + $shippingMinor;
            if ($totalMinor > self::MAX_TOTAL_MINOR) {
                throw new CheckoutValidationException('order_total_limit', 'Celková cena objednávky je příliš vysoká.');
            }
            $expiresAt = $this->now->modify('+' . self::SNAPSHOT_TTL_SECONDS . ' seconds');
            $grant = bin2hex(random_bytes(32));
            $publicId = bin2hex(random_bytes(16));
            $snapshot = [
                'public_id' => $publicId,
                'user_id' => $user['id'] ?? null,
                'customer_email' => $normalized['email'],
                'customer_name' => $normalized['name'],
                'shipping' => $shipping,
                'notes' => $normalized['notes'],
                'currency' => 'czk',
                'items' => $items,
                'subtotal_minor' => $subtotalMinor,
                'shipping_minor' => $shippingMinor,
                'total_minor' => $totalMinor,
                'created_at' => $this->now->format(DATE_ATOM),
                'expires_at' => $expiresAt->format(DATE_ATOM),
                'price_version' => $this->now->format('YmdHis'),
                'checkout_grant_hash' => hash('sha256', $grant),
                'idempotency_scope_hash' => $scopeHash,
                'idempotency_key_hash' => $keyHash,
                'request_hash' => $requestHash,
            ];
            $snapshot['snapshot_hash'] = SnapshotIntegrity::hash($this->publicSnapshot($snapshot));
            $this->repository->saveSnapshot($snapshot);
            $this->repository->commit();

            return ['snapshot' => $snapshot, 'grant' => $grant, 'reused' => false];
        } catch (Throwable $exception) {
            if ($this->repository->isInTransaction()) {
                $this->repository->rollBack();
            }
            throw $exception;
        }
    }

    /** @param array<string, mixed> $input @return array{items:array<int,int>,email:string,name:string,shipping:array<string,mixed>|null,notes:string,idempotency_key:string} */
    private function normalizeInput(array $input): array
    {
        $unexpectedTopLevel = array_diff(array_keys($input), ['items', 'email', 'name', 'shipping', 'notes', 'idempotency_key']);
        if ($unexpectedTopLevel !== []) {
            throw new CheckoutValidationException('unexpected_field', 'Požadavek obsahuje nepodporovaná data.');
        }
        $rawItems = $input['items'] ?? null;
        if (!is_array($rawItems) || $rawItems === [] || count($rawItems) > self::MAX_ITEMS) {
            throw new CheckoutValidationException('invalid_items', 'Košík není platný.');
        }
        $items = [];
        foreach ($rawItems as $item) {
            if (!is_array($item)) {
                throw new CheckoutValidationException('invalid_items', 'Košík není platný.');
            }
            $unexpectedItemFields = array_diff(array_keys($item), ['product_id', 'quantity', 'variant_id', 'price', 'sale_price', 'currency', 'name', 'type', 'stock', 'shipping', 'tax', 'total', 'download_url', 'download_token']);
            if ($unexpectedItemFields !== []) {
                throw new CheckoutValidationException('unexpected_field', 'Požadavek obsahuje nepodporovaná data.');
            }
            if (array_key_exists('variant_id', $item) && $item['variant_id'] !== null && $item['variant_id'] !== '') {
                throw new CheckoutValidationException('variants_not_supported', 'Vybraná varianta není dostupná.');
            }
            $productId = $this->positiveInteger($item['product_id'] ?? null, 'invalid_product');
            $quantity = $this->positiveInteger($item['quantity'] ?? null, 'invalid_quantity');
            if ($quantity > self::MAX_QUANTITY) {
                throw new CheckoutValidationException('quantity_limit', 'Požadované množství je příliš vysoké.');
            }
            $items[$productId] = ($items[$productId] ?? 0) + $quantity;
            if ($items[$productId] > self::MAX_QUANTITY) {
                throw new CheckoutValidationException('quantity_limit', 'Požadované množství je příliš vysoké.');
            }
        }
        if (count($items) > self::MAX_ITEMS) {
            throw new CheckoutValidationException('invalid_items', 'Košík obsahuje příliš mnoho položek.');
        }
        ksort($items, SORT_NUMERIC);

        $email = filter_var((string) ($input['email'] ?? ''), FILTER_VALIDATE_EMAIL);
        if ($email === false || strlen($email) > 255) {
            throw new CheckoutValidationException('invalid_contact', 'Zadejte platný e-mail.');
        }
        $name = trim((string) ($input['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 120) {
            throw new CheckoutValidationException('invalid_contact', 'Zadejte jméno objednatele.');
        }
        $notes = trim((string) ($input['notes'] ?? ''));
        if (mb_strlen($notes) > 2000) {
            throw new CheckoutValidationException('invalid_notes', 'Poznámka je příliš dlouhá.');
        }
        $key = (string) ($input['idempotency_key'] ?? '');
        if (!preg_match('/^[A-Za-z0-9_-]{16,128}$/', $key)) {
            throw new CheckoutValidationException('invalid_idempotency_key', 'Požadavek nelze bezpečně zopakovat.');
        }

        return ['items' => $items, 'email' => $email, 'name' => $name, 'shipping' => $input['shipping'] ?? null, 'notes' => $notes, 'idempotency_key' => $key];
    }

    private function positiveInteger(mixed $value, string $errorCode): int
    {
        if (is_int($value)) {
            $number = $value;
        } elseif (is_string($value) && preg_match('/^[1-9][0-9]*$/', $value)) {
            $number = (int) $value;
        } else {
            throw new CheckoutValidationException($errorCode, 'Neplatné množství nebo produkt.');
        }
        if ($number < 1) {
            throw new CheckoutValidationException($errorCode, 'Neplatné množství nebo produkt.');
        }
        return $number;
    }

    /** @param array<string, mixed> $product @return array<string, mixed> */
    private function buildItem(array $product, int $quantity): array
    {
        if (!$this->databaseBoolean($product['is_active'] ?? false) || !$this->databaseBoolean($product['is_sellable'] ?? false)) {
            throw new CheckoutValidationException('product_unavailable', 'Jedna nebo více položek již nejsou dostupné.');
        }
        $type = (string) ($product['type'] ?? '');
        if (!in_array($type, ['physical', 'digital'], true)) {
            throw new CheckoutValidationException('product_unavailable', 'Jedna nebo více položek již nejsou dostupné.');
        }
        if (strtolower((string) ($product['currency'] ?? '')) !== 'czk') {
            throw new CheckoutValidationException('unsupported_currency', 'Měna produktu není podporovaná.');
        }
        $unitAmountMinor = $this->effectivePriceMinor($product);
        if ($unitAmountMinor > intdiv(self::MAX_TOTAL_MINOR, $quantity)) {
            throw new CheckoutValidationException('order_total_limit', 'Celková cena objednávky je příliš vysoká.');
        }
        if ($type === 'digital' && !$this->hasValidDigitalBinding((string) ($product['download_file'] ?? ''))) {
            throw new CheckoutValidationException('digital_content_unavailable', 'Digitální produkt není právě dostupný.');
        }

        $stock = $product['stock'] ?? null;
        $backorder = false;
        if ($type === 'physical' && $stock === null && !$this->databaseBoolean($product['allow_backorder'] ?? false)) {
            throw new CheckoutValidationException('product_unavailable', 'Jedna nebo více položek již nejsou dostupné.');
        }
        if ($type === 'physical' && ($stock === null || $quantity > (int) $stock)) {
            if (!$this->databaseBoolean($product['allow_backorder'] ?? false)) {
                throw new CheckoutValidationException('insufficient_stock', 'Požadované množství není skladem.');
            }
            $backorder = $stock === null || $quantity > (int) $stock;
        }

        return [
            'product_id' => (int) $product['id'],
            'variant_id' => null,
            'sku' => (string) ($product['sku'] ?? ''),
            'name' => (string) $product['name'],
            'type' => $type,
            'quantity' => $quantity,
            'currency' => 'czk',
            'unit_amount_minor' => $unitAmountMinor,
            'line_total_minor' => $unitAmountMinor * $quantity,
            'stock_status' => $type === 'digital' ? 'digital' : ($backorder ? 'backorder' : 'in_stock'),
            'backorder' => $backorder,
        ];
    }

    /** @param array<string, mixed> $product */
    private function effectivePriceMinor(array $product): int
    {
        $sale = $product['sale_price'] ?? null;
        $candidate = $sale !== null && $this->decimalToMinor((string) $sale) > 0 ? (string) $sale : (string) ($product['price'] ?? '');
        $minor = $this->decimalToMinor($candidate);
        if ($minor <= 0) {
            throw new CheckoutValidationException('invalid_price', 'Cena produktu není platná.');
        }
        return $minor;
    }

    private function decimalToMinor(string $value): int
    {
        if (!preg_match('/^([0-9]+)(?:\.([0-9]{1,2}))?$/', trim($value), $matches)) {
            throw new CheckoutValidationException('invalid_price', 'Cena produktu není platná.');
        }
        $whole = (int) $matches[1];
        $fraction = str_pad($matches[2] ?? '', 2, '0');
        if ($whole > 92233720368547758) {
            throw new CheckoutValidationException('invalid_price', 'Cena produktu není platná.');
        }
        return ($whole * 100) + (int) $fraction;
    }

    /** @param array<string, mixed>|null $shipping @return array<string, string>|null */
    private function normalizeShipping(mixed $shipping, bool $required): ?array
    {
        if (!$required) {
            return null;
        }
        if (!is_array($shipping)) {
            throw new CheckoutValidationException('shipping_required', 'Doplňte doručovací adresu.');
        }
        if (array_diff(array_keys($shipping), ['street', 'city', 'zip', 'country']) !== []) {
            throw new CheckoutValidationException('invalid_shipping', 'Doručovací adresa není platná.');
        }
        $result = [];
        foreach (['street' => 160, 'city' => 100, 'zip' => 24] as $field => $limit) {
            $value = trim((string) ($shipping[$field] ?? ''));
            if ($value === '' || mb_strlen($value) > $limit) {
                throw new CheckoutValidationException('invalid_shipping', 'Doručovací adresa není platná.');
            }
            $result[$field] = $value;
        }
        $country = strtoupper(trim((string) ($shipping['country'] ?? '')));
        if (!in_array($country, ['CZ', 'SK'], true)) {
            throw new CheckoutValidationException('invalid_shipping', 'Země doručení není podporovaná.');
        }
        $result['country'] = $country;
        return $result;
    }

    private function hasValidDigitalBinding(string $binding): bool
    {
        if ($binding === '' || $this->digitalStoragePath === null || str_starts_with($binding, '/') || str_contains($binding, '..') || str_contains($binding, "\0") || preg_match('#^[a-z][a-z0-9+.-]*://#i', $binding)) {
            return false;
        }
        $base = realpath($this->digitalStoragePath);
        $file = realpath($base . DIRECTORY_SEPARATOR . $binding);
        return $base !== false && $file !== false && is_file($file) && str_starts_with($file, $base . DIRECTORY_SEPARATOR);
    }

    private function databaseBoolean(mixed $value): bool
    {
        return $value === true || $value === 1 || $value === '1' || $value === 't' || $value === 'true';
    }

    /** @param array<string,mixed> $snapshot @return array<string,mixed> */
    private function publicSnapshot(array $snapshot): array
    {
        unset($snapshot['checkout_grant_hash'], $snapshot['idempotency_scope_hash'], $snapshot['idempotency_key_hash'], $snapshot['request_hash']);
        return $snapshot;
    }

}

final class PdoCheckoutRepository implements CheckoutRepository
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function begin(): void { $this->pdo->beginTransaction(); }
    public function commit(): void { $this->pdo->commit(); }
    public function rollBack(): void { $this->pdo->rollBack(); }
    public function isInTransaction(): bool { return $this->pdo->inTransaction(); }
    public function lockIdempotency(string $scopeHash, string $keyHash): void
    {
        $statement = $this->pdo->prepare('SELECT pg_advisory_xact_lock(hashtext(?))');
        $statement->execute([$scopeHash . ':' . $keyHash]);
    }
    public function expireSnapshot(array $snapshot): void
    {
        $statement = $this->pdo->prepare("UPDATE store_checkout_snapshots SET status = 'expired' WHERE public_id = ? AND status = 'pending'");
        $statement->execute([$snapshot['public_id']]);
    }

    public function findExisting(string $scopeHash, string $keyHash): ?array
    {
        $statement = $this->pdo->prepare(
            "SELECT public_id, snapshot_data, request_hash, status
             FROM store_checkout_snapshots
             WHERE idempotency_scope_hash = ? AND idempotency_key_hash = ?
               AND status IN ('pending', 'consumed')
             FOR UPDATE"
        );
        $statement->execute([$scopeHash, $keyHash]);
        $order = $statement->fetch();
        if (!$order || empty($order['snapshot_data'])) {
            return null;
        }
        $snapshot = json_decode((string) $order['snapshot_data'], true, 512, JSON_THROW_ON_ERROR);
        $snapshotHash = (string) ($snapshot['snapshot_hash'] ?? '');
        $expectedHash = SnapshotIntegrity::hash($snapshot);
        if ($snapshotHash === '' || !hash_equals($snapshotHash, $expectedHash)) {
            throw new RuntimeException('Persisted checkout snapshot integrity check failed.');
        }
        $snapshot['request_hash'] = $order['request_hash'];
        $snapshot['persisted_status'] = $order['status'];
        return $snapshot;
    }

    public function findProductsForCheckout(array $productIds): array
    {
        $placeholders = implode(',', array_fill(0, count($productIds), '?'));
        $statement = $this->pdo->prepare("SELECT id, name, sku, price::text AS price, sale_price::text AS sale_price, type, stock, is_active, is_sellable, allow_backorder, currency, download_file FROM store_products WHERE id IN ({$placeholders}) FOR UPDATE");
        $statement->execute($productIds);
        return $statement->fetchAll();
    }

    public function saveSnapshot(array $snapshot): void
    {
        $snapshotJson = json_encode($this->publicSnapshot($snapshot), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $statement = $this->pdo->prepare("INSERT INTO store_checkout_snapshots (public_id, user_id, customer_email, customer_name, shipping_address, notes, currency, subtotal_minor, shipping_minor, total_minor, snapshot_data, snapshot_hash, checkout_grant_hash, expires_at, idempotency_scope_hash, idempotency_key_hash, request_hash, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'czk', ?, ?, ?, ?::jsonb, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())");
        $statement->execute([
            $snapshot['public_id'], $snapshot['user_id'],
            $snapshot['customer_email'], $snapshot['customer_name'], $snapshot['shipping'] === null ? null : json_encode($snapshot['shipping'], JSON_UNESCAPED_UNICODE), $snapshot['notes'],
            $snapshot['subtotal_minor'], $snapshot['shipping_minor'], $snapshot['total_minor'], $snapshotJson, $snapshot['snapshot_hash'], $snapshot['checkout_grant_hash'], $snapshot['expires_at'], $snapshot['idempotency_scope_hash'], $snapshot['idempotency_key_hash'], $snapshot['request_hash'],
        ]);
    }

    /** @param array<string,mixed> $snapshot @return array<string,mixed> */
    private function publicSnapshot(array $snapshot): array
    {
        unset($snapshot['checkout_grant_hash'], $snapshot['idempotency_scope_hash'], $snapshot['idempotency_key_hash'], $snapshot['request_hash']);
        return $snapshot;
    }
}
