<?php
declare(strict_types=1);

final class AdminAgendaRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<array<string,mixed>> */
    public function claims(?string $status = null): array
    {
        $sql = 'SELECT c.public_id,c.status,c.version,c.reason_code,c.created_at,o.order_number FROM store_claims c JOIN store_orders o ON o.id=c.order_id';
        $args = [];
        if ($status !== null && $status !== '') {
            $sql .= ' WHERE c.status=?';
            $args[] = $status;
        }
        $s = $this->pdo->prepare($sql . ' ORDER BY c.created_at DESC,c.id DESC LIMIT 200');
        $s->execute($args);
        return $s->fetchAll(PDO::FETCH_ASSOC);
    }

    /** @return list<array<string,mixed>> */
    public function returns(?string $status = null): array
    {
        $sql = 'SELECT r.public_id,r.status,r.refund_status,r.version,r.reason_code,r.created_at,o.order_number FROM store_returns r JOIN store_orders o ON o.id=r.order_id';
        $args = [];
        if ($status !== null && $status !== '') {
            $sql .= ' WHERE r.status=?';
            $args[] = $status;
        }
        $s = $this->pdo->prepare($sql . ' ORDER BY r.created_at DESC,r.id DESC LIMIT 200');
        $s->execute($args);
        return $s->fetchAll(PDO::FETCH_ASSOC);
    }

    /** @return list<array<string,mixed>> */
    public function deliveries(?string $status = null): array
    {
        $sql = 'SELECT d.public_id,d.status,d.version,d.carrier_code,d.tracking_number,d.estimated_delivery_at,d.delivered_at,o.order_number FROM store_deliveries d JOIN store_orders o ON o.id=d.order_id';
        $args = [];
        if ($status !== null && $status !== '') {
            $sql .= ' WHERE d.status=?';
            $args[] = $status;
        }
        $s = $this->pdo->prepare($sql . ' ORDER BY d.created_at DESC,d.id DESC LIMIT 200');
        $s->execute($args);
        return $s->fetchAll(PDO::FETCH_ASSOC);
    }

    /** @return list<array<string,mixed>> */
    public function deliveryCandidates():array
    {
        $s=$this->pdo->query("SELECT o.id order_id,o.order_number,o.status,oi.id order_item_id,oi.product_name,oi.quantity FROM store_orders o JOIN store_order_items oi ON oi.order_id=o.id AND oi.product_type='physical' WHERE o.status IN('paid','processing','shipped','delivered') ORDER BY o.created_at DESC,o.id DESC,oi.id LIMIT 300");
        $grouped=[];foreach($s->fetchAll(PDO::FETCH_ASSOC)as$row){$id=(int)$row['order_id'];if(!isset($grouped[$id]))$grouped[$id]=['order_id'=>$id,'order_number'=>$row['order_number'],'status'=>$row['status'],'items'=>[]];$grouped[$id]['items'][]=['order_item_id'=>(int)$row['order_item_id'],'product_name'=>$row['product_name'],'quantity'=>(int)$row['quantity']];}return array_values($grouped);
    }

    public function claimDetail(string$id):?array{return$this->caseDetail('claim',$id);}
    public function returnDetail(string$id):?array{return$this->caseDetail('return',$id);}
    private function caseDetail(string$type,string$id):?array
    {
        $table=$type==='claim'?'store_claims':'store_returns';$eventTable=$type==='claim'?'store_claim_events':'store_return_events';$parent=$type.'_id';
        $s=$this->pdo->prepare("SELECT x.*,o.order_number FROM {$table} x JOIN store_orders o ON o.id=x.order_id WHERE x.public_id=?");$s->execute([$id]);$row=$s->fetch(PDO::FETCH_ASSOC);if(!$row)return null;
        $e=$this->pdo->prepare("SELECT action,old_state,new_state,actor_type,public_message,internal_note,created_at FROM {$eventTable} WHERE {$parent}=? ORDER BY created_at,id");$e->execute([$row['id']]);$row['events']=$e->fetchAll(PDO::FETCH_ASSOC);
        if($type==='claim')$itemSql='SELECT ci.order_item_id,oi.product_name,ci.requested_quantity,ci.approved_quantity,ci.consumed_quantity FROM store_claim_items ci JOIN store_order_items oi ON oi.id=ci.order_item_id AND oi.order_id=ci.order_id WHERE ci.claim_id=? ORDER BY ci.order_item_id';
        else$itemSql='SELECT ri.order_item_id,oi.product_name,ri.requested_quantity,ri.received_quantity,ri.inspected_quantity,ri.consumed_quantity FROM store_return_items ri JOIN store_order_items oi ON oi.id=ri.order_item_id AND oi.order_id=ri.order_id WHERE ri.return_id=? ORDER BY ri.order_item_id';
        $items=$this->pdo->prepare($itemSql);$items->execute([$row['id']]);$row['items']=$items->fetchAll(PDO::FETCH_ASSOC);
        $a=$this->pdo->prepare("SELECT public_id,original_filename,detected_mime,byte_size,scan_status,uploaded_at,revoked_at,deleted_at FROM store_case_attachments WHERE {$parent}=? ORDER BY uploaded_at,id");$a->execute([$row['id']]);$row['attachments']=$a->fetchAll(PDO::FETCH_ASSOC);return$row;
    }
    public function deliveryDetail(string$id):?array{$s=$this->pdo->prepare('SELECT d.*,o.order_number FROM store_deliveries d JOIN store_orders o ON o.id=d.order_id WHERE d.public_id=?');$s->execute([$id]);$row=$s->fetch(PDO::FETCH_ASSOC);if(!$row)return null;$e=$this->pdo->prepare('SELECT action,old_state,new_state,actor_type,public_message,internal_note,created_at FROM store_delivery_events WHERE delivery_id=? ORDER BY created_at,id');$e->execute([$row['id']]);$row['events']=$e->fetchAll(PDO::FETCH_ASSOC);$items=$this->pdo->prepare('SELECT di.order_item_id,oi.product_name,di.shipped_quantity FROM store_delivery_items di JOIN store_order_items oi ON oi.id=di.order_item_id AND oi.order_id=di.order_id WHERE di.delivery_id=? ORDER BY di.order_item_id');$items->execute([$row['id']]);$row['items']=$items->fetchAll(PDO::FETCH_ASSOC);return$row;}
}
