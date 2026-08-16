<?php
declare(strict_types=1);

final class CustomerOrderService
{
    public function __construct(private readonly PDO $pdo, private readonly OrderAccessService $access)
    {
    }

    /** @return list<array<string,mixed>> */
    public function accountOrders(AuthContext $auth): array
    {
        if (!$auth->isAuthenticated() || !$auth->userId()) throw new DomainException('Verified account required.');
        $s = $this->pdo->prepare('SELECT public_id,order_number,status,payment_status,fulfillment_status,total,currency,created_at FROM store_orders WHERE user_id=? ORDER BY created_at DESC,id DESC');
        $s->execute([$auth->userId()]);
        return $s->fetchAll(PDO::FETCH_ASSOC);
    }

    /** @return array<string,mixed> */
    public function detail(string $publicId, ActorContext $actor, ?string $guestGrant): array
    {
        $s = $this->pdo->prepare('SELECT id,public_id,order_number,user_id,guest_grant_hash,guest_grant_expires_at,status,payment_status,fulfillment_status,total,currency,created_at FROM store_orders WHERE public_id=?');
        $s->execute([$publicId]);
        $order = $s->fetch(PDO::FETCH_ASSOC);
        $user = $actor->type() === 'customer_account' ? ['id' => $actor->userId()] : null;
        if (!$order || !$this->access->canAccess($order, $user, $guestGrant, false, $publicId)) throw new DomainException('Order unavailable.');
        unset($order['user_id'], $order['guest_grant_hash'], $order['guest_grant_expires_at']);
        $items = $this->pdo->prepare('SELECT id,product_id,product_name,product_type,quantity,unit_price FROM store_order_items WHERE order_id=? ORDER BY id');
        $items->execute([$order['id']]);
        $order['items'] = $items->fetchAll(PDO::FETCH_ASSOC);
        unset($order['id']);
        return $order;
    }

    /** @return array<string,mixed>|null */
    public function rawOrderForAuthorizedDelivery(string $publicId): ?array
    {
        $s = $this->pdo->prepare('SELECT * FROM store_orders WHERE public_id=?');
        $s->execute([$publicId]);
        return $s->fetch(PDO::FETCH_ASSOC) ?: null;
    }
}
