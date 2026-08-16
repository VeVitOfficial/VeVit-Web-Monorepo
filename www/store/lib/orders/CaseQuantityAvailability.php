<?php
declare(strict_types=1);

final class CaseQuantityAvailability
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public static function eligible(int $purchased, int $finalClaims, int $finalReturns, int $activeClaims, int $activeReturns): int
    {
        foreach (func_get_args() as $quantity) {
            if ($quantity < 0) throw new DomainException('Quantity cannot be negative.');
        }
        $eligible = $purchased - $finalClaims - $finalReturns - $activeClaims - $activeReturns;
        if ($eligible < 0) throw new DomainException('Stored case quantities exceed purchased quantity.');
        return $eligible;
    }

    /** @param list<int> $itemIds @return array<int,array<string,mixed>> */
    public function lockOrderItems(int $orderId, array $itemIds): array
    {
        $ids = array_values(array_unique(array_map('intval', $itemIds)));
        sort($ids, SORT_NUMERIC);
        if ($orderId < 1 || $ids === [] || min($ids) < 1) throw new InvalidArgumentException('Invalid order items.');
        $marks = implode(',', array_fill(0, count($ids), '?'));
        $statement = $this->pdo->prepare("SELECT id, order_id, quantity, product_type FROM store_order_items WHERE order_id = ? AND id IN ($marks) ORDER BY id FOR UPDATE OF store_order_items");
        $statement->execute([$orderId, ...$ids]);
        $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        if (count($rows) !== count($ids)) throw new DomainException('Order item is unavailable.');
        $result = [];
        foreach ($rows as $row) $result[(int) $row['id']] = $row;
        return $result;
    }

    /** @param array<int,array<string,mixed>> $locked @param array<int,int> $requested */
    public function assertReservable(array $locked, array $requested): void
    {
        $statement = $this->pdo->prepare(
            "SELECT
              COALESCE((SELECT SUM(ci.requested_quantity) FROM store_claim_items ci JOIN store_claims c ON c.id=ci.claim_id WHERE ci.order_item_id=? AND c.status IN ('submitted','under_review','waiting_for_customer','accepted')),0) active_claims,
              COALESCE((SELECT SUM(ri.requested_quantity) FROM store_return_items ri JOIN store_returns r ON r.id=ri.return_id WHERE ri.order_item_id=? AND r.status IN ('requested','approved','waiting_for_goods','received','inspected','refund_pending')),0) active_returns,
              COALESCE((SELECT SUM(ci.consumed_quantity) FROM store_claim_items ci JOIN store_claims c ON c.id=ci.claim_id WHERE ci.order_item_id=? AND c.status='resolved'),0) final_claims,
              COALESCE((SELECT SUM(ri.consumed_quantity) FROM store_return_items ri JOIN store_returns r ON r.id=ri.return_id WHERE ri.order_item_id=? AND r.status='completed'),0) final_returns"
        );
        foreach ($requested as $itemId => $quantity) {
            if (!isset($locked[$itemId]) || $quantity < 1) throw new DomainException('Invalid requested quantity.');
            $statement->execute([$itemId,$itemId,$itemId,$itemId]);
            $used = $statement->fetch(PDO::FETCH_ASSOC);
            $eligible = self::eligible((int)$locked[$itemId]['quantity'],(int)$used['final_claims'],(int)$used['final_returns'],(int)$used['active_claims'],(int)$used['active_returns']);
            if ($quantity > $eligible) throw new DomainException('Requested quantity exceeds eligible quantity.');
        }
    }
}
