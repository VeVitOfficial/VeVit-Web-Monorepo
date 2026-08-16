<?php
declare(strict_types=1);
final class ClaimRepository
{
    public function __construct(private readonly PDO $pdo) {}
    public static function customerDetailSql(): string
    {
        return "SELECT c.public_id,c.order_id,c.reason_code,c.problem_description,c.requested_resolution,c.status,c.customer_note,c.version,c.created_at,c.updated_at,c.closed_at,e.public_id AS event_public_id,e.action,e.old_state,e.new_state,e.public_message,e.created_at AS event_created_at FROM store_claims c LEFT JOIN store_claim_events e ON e.claim_id=c.id WHERE c.public_id=? ORDER BY e.created_at,e.id";
    }
    public static function customerItemsSql(): string
    {
        return 'SELECT ci.order_item_id,oi.product_name,ci.requested_quantity,ci.approved_quantity,ci.consumed_quantity,ci.reason_code,ci.requested_resolution,ci.resolution_outcome FROM store_claim_items ci JOIN store_claims c ON c.id=ci.claim_id JOIN store_order_items oi ON oi.id=ci.order_item_id AND oi.order_id=ci.order_id WHERE c.public_id=? ORDER BY ci.order_item_id';
    }
    /** @return list<array<string,mixed>> */
    public function customerDetail(string $publicId): array
    {
        $s=$this->pdo->prepare(self::customerDetailSql());$s->execute([$publicId]);return $s->fetchAll(PDO::FETCH_ASSOC);
    }
    public function customerItems(string $publicId): array
    {
        $s=$this->pdo->prepare(self::customerItemsSql());$s->execute([$publicId]);return $s->fetchAll(PDO::FETCH_ASSOC);
    }
    public function customerListByOwner(string$userId):array{$s=$this->pdo->prepare('SELECT public_id,reason_code,requested_resolution,status,version,created_at,updated_at,closed_at FROM store_claims WHERE owner_type=\'account\' AND owner_user_id=? ORDER BY created_at DESC,id DESC');$s->execute([$userId]);return$s->fetchAll(PDO::FETCH_ASSOC);}
    /** @return array<string,mixed>|null */
    public function parentOrder(string $publicId): ?array
    {
        $s = $this->pdo->prepare('SELECT o.* FROM store_claims c JOIN store_orders o ON o.id=c.order_id WHERE c.public_id=?');
        $s->execute([$publicId]);
        return $s->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    /** @return array<string,mixed>|null */
    public function lockByPublicId(string $publicId): ?array
    {
        $s = $this->pdo->prepare('SELECT * FROM store_claims WHERE public_id=? FOR UPDATE');
        $s->execute([$publicId]);
        return $s->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    public function transitionReplay(int $claimId,string $keyHash):?array{$s=$this->pdo->prepare("SELECT request_hash,new_state,entity_version FROM store_claim_events WHERE claim_id=? AND action IN('state_transition','state_noop') AND idempotency_key_hash=?");$s->execute([$claimId,$keyHash]);return$s->fetch(PDO::FETCH_ASSOC)?:null;}
    public function messageReplay(int$id,string$key):?array{$s=$this->pdo->prepare("SELECT public_id,request_hash FROM store_claim_events WHERE claim_id=? AND action='customer_message' AND idempotency_key_hash=?");$s->execute([$id,$key]);return$s->fetch(PDO::FETCH_ASSOC)?:null;}
    public function insertCustomerMessage(int$id,string$status,AuditActor$a,string$c,string$key,string$request,string$message):array{$public=bin2hex(random_bytes(16));$s=$this->pdo->prepare("INSERT INTO store_claim_events(public_id,claim_id,action,old_state,new_state,actor_type,actor_user_id,actor_session_id,auth_source,public_message,correlation_id,idempotency_key_hash,request_hash)VALUES(?,?,'customer_message',?,?,?,?,?,?,?,?,?,?)");$s->execute([$public,$id,$status,$status,$a->type,$a->userId,$a->sessionId,$a->authSource,$message,$c,$key,$request]);return['public_id'=>$public];}
    /** @return array<string,mixed>|null */
    public function findCreateReplay(string $scopeHash,string $keyHash):?array
    {
        $s=$this->pdo->prepare('SELECT id,public_id,request_hash FROM store_claims WHERE idempotency_scope_hash=? AND idempotency_key_hash=?');$s->execute([$scopeHash,$keyHash]);return $s->fetch(PDO::FETCH_ASSOC)?:null;
    }

    /** @return array<string,mixed>|null */
    public function orderByPublicId(string $publicId):?array
    { $s=$this->pdo->prepare('SELECT * FROM store_orders WHERE public_id=?');$s->execute([$publicId]);return $s->fetch(PDO::FETCH_ASSOC)?:null; }

    /** @param array<string,mixed> $row @return array<string,mixed> */
    public function insertClaim(array $row):array
    {
        $s=$this->pdo->prepare('INSERT INTO store_claims(public_id,order_id,owner_type,owner_user_id,reason_code,problem_description,requested_resolution,customer_note,idempotency_scope_hash,idempotency_key_hash,request_hash) VALUES(?,?,?,?,?,?,?,?,?,?,?) RETURNING id,public_id,version,status');
        $s->execute([$row['public_id'],$row['order_id'],$row['owner_type'],$row['owner_user_id'],$row['reason_code'],$row['problem_description'],$row['requested_resolution'],$row['customer_note'],$row['scope_hash'],$row['key_hash'],$row['request_hash']]);return $s->fetch(PDO::FETCH_ASSOC);
    }
    public function insertItem(int $claimId,int $orderId,int $itemId,int $quantity,string $reason,string $resolution):void
    { $s=$this->pdo->prepare('INSERT INTO store_claim_items(claim_id,order_id,order_item_id,requested_quantity,reason_code,requested_resolution) VALUES(?,?,?,?,?,?)');$s->execute([$claimId,$orderId,$itemId,$quantity,$reason,$resolution]); }
    public function insertCreatedEvent(int $claimId,string $publicId,AuditActor $actor,string $correlationId,string $keyHash):void
    { $s=$this->pdo->prepare("INSERT INTO store_claim_events(public_id,claim_id,action,new_state,actor_type,actor_user_id,actor_session_id,auth_source,public_message,correlation_id,idempotency_key_hash) VALUES(?,?,'created','submitted',?,?,?,?,?,?,?)");$s->execute([$publicId,$claimId,$actor->type,$actor->userId,$actor->sessionId,$actor->authSource,'Reklamace byla přijata.',$correlationId,$keyHash]); }

    /** @param array<string,mixed> $data */
    public function transition(int $id, int $expectedVersion, string $status, array $data): array
    {
        $closed = in_array($status, ['rejected', 'resolved', 'cancelled'], true);
        $s = $this->pdo->prepare('UPDATE store_claims SET status=?, customer_note=COALESCE(?,customer_note), internal_note=COALESCE(?,internal_note), closed_at=CASE WHEN ? THEN now() ELSE closed_at END, updated_at=now(), version=version+1 WHERE id=? AND version=? RETURNING *');
        $s->execute([$status, $data['public_message'] ?? null, $data['internal_note'] ?? null, $closed ? 1 : 0, $id, $expectedVersion]);
        $row = $s->fetch(PDO::FETCH_ASSOC);
        if (!$row) throw new DomainException('Version conflict.');
        return $row;
    }

    /** @param array<int,int> $approved */
    public function resolveItems(int $claimId, array $approved, string $outcome): void
    {
        $s = $this->pdo->prepare('UPDATE store_claim_items SET approved_quantity=?, consumed_quantity=?, resolution_outcome=? WHERE claim_id=? AND order_item_id=?');
        foreach ($approved as $itemId => $quantity) {
            $s->execute([$quantity, $quantity, $outcome, $claimId, $itemId]);
            if ($s->rowCount() !== 1) throw new DomainException('Claim item unavailable.');
        }
    }
    public function items(int $claimId):array{$s=$this->pdo->prepare('SELECT order_id,order_item_id,requested_quantity,approved_quantity,consumed_quantity FROM store_claim_items WHERE claim_id=? ORDER BY order_item_id FOR UPDATE');$s->execute([$claimId]);return$s->fetchAll(PDO::FETCH_ASSOC);}

    public function insertTransitionEvent(int $claimId, string $action, string $old, string $new, int $entityVersion, AuditActor $actor, string $correlation, string $keyHash, string $requestHash, ?string $publicMessage, ?string $internalNote): void
    {
        $s = $this->pdo->prepare("INSERT INTO store_claim_events(public_id,claim_id,action,old_state,new_state,entity_version,actor_type,actor_user_id,actor_session_id,auth_source,public_message,internal_note,correlation_id,idempotency_key_hash,request_hash) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $s->execute([bin2hex(random_bytes(16)), $claimId, $action, $old, $new, $entityVersion, $actor->type, $actor->userId, $actor->sessionId, $actor->authSource, $publicMessage, $internalNote, $correlation, $keyHash, $requestHash]);
    }
}
