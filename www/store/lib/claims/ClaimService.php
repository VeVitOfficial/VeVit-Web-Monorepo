<?php
declare(strict_types=1);
require_once __DIR__ . '/ClaimStateMachine.php';
final class ClaimService
{
    public function __construct(private readonly PDO $pdo,private readonly ClaimRepository $repository,private readonly CaseQuantityAvailability $availability,private readonly OrderAccessService $access,private readonly AuditService $audit,private readonly ClaimStateMachine $machine = new ClaimStateMachine()){}
    /** @param array<string,mixed> $input @return array<string,mixed> */
    public function create(string $orderPublicId,ActorContext $actor,?string $guestGrant,string $idempotencyKey,array $input):array
    {
        $order=$this->orderForCreate($orderPublicId,$actor,$guestGrant);
        if($idempotencyKey===''||strlen($idempotencyKey)>255)throw new DomainException('Invalid request.');
        $items=$input['items']??null;if(!is_array($items)||$items===[])throw new DomainException('Claim items are required.');
        $requested=[];foreach($items as $item){$id=(int)($item['order_item_id']??0);$q=(int)($item['quantity']??0);if($id<1||$q<1||isset($requested[$id]))throw new DomainException('Invalid claim item.');$requested[$id]=$q;}ksort($requested,SORT_NUMERIC);
        $normalized=['reason_code'=>(string)($input['reason_code']??''),'problem_description'=>(string)($input['problem_description']??''),'requested_resolution'=>(string)($input['requested_resolution']??''),'items'=>$requested];
        if($normalized['reason_code']===''||$normalized['problem_description']===''||!in_array($normalized['requested_resolution'],['repair','replacement','refund','store_credit','other'],true))throw new DomainException('Invalid claim data.');
        $scopeHash=hash('sha256',$actor->type()."\0".(string)$order['id']."\0".($actor->userId()??(string)$guestGrant));$keyHash=hash('sha256',$idempotencyKey);$requestHash=hash('sha256',json_encode($normalized,JSON_THROW_ON_ERROR));
        return Transactional::run($this->pdo,function()use($order,$actor,$normalized,$requested,$scopeHash,$keyHash,$requestHash){
            $replay=$this->repository->findCreateReplay($scopeHash,$keyHash);if($replay){if(!hash_equals((string)$replay['request_hash'],$requestHash))throw new DomainException('Idempotency conflict.');return $replay;}
            $locked=$this->availability->lockOrderItems((int)$order['id'],array_keys($requested));$this->availability->assertReservable($locked,$requested);
            $publicId=bin2hex(random_bytes(16));$correlation=bin2hex(random_bytes(16));$auditActor=AuditActor::fromContext($actor);
            $claim=$this->repository->insertClaim(['public_id'=>$publicId,'order_id'=>(int)$order['id'],'owner_type'=>$actor->type()==='customer_account'?'account':'guest','owner_user_id'=>$actor->userId(),'reason_code'=>$normalized['reason_code'],'problem_description'=>$normalized['problem_description'],'requested_resolution'=>$normalized['requested_resolution'],'customer_note'=>null,'scope_hash'=>$scopeHash,'key_hash'=>$keyHash,'request_hash'=>$requestHash]);
            foreach($requested as $id=>$q)$this->repository->insertItem((int)$claim['id'],(int)$order['id'],$id,$q,$normalized['reason_code'],$normalized['requested_resolution']);
            $this->repository->insertCreatedEvent((int)$claim['id'],bin2hex(random_bytes(16)),$auditActor,$correlation,$keyHash);
            $this->audit->record(bin2hex(random_bytes(16)),'claim',(int)$claim['id'],'create','success',$auditActor,$correlation,null,'submitted',[], $keyHash);return $claim;
        });
    }

    /** @return array<string,mixed> */
    public function orderForCreate(string$orderPublicId,ActorContext$actor,?string$guestGrant):array
    {
        if(!preg_match('/^[a-f0-9]{32}$/',$orderPublicId))throw new DomainException('Order is unavailable.');
        $order=$this->repository->orderByPublicId($orderPublicId);$user=$actor->type()==='customer_account'?['id'=>$actor->userId()]:null;
        if(!$order||!$this->access->canAccess($order,$user,$guestGrant,false,$orderPublicId)||!in_array((string)($order['status']??''),['paid','processing','shipped','delivered'],true))throw new DomainException('Order is unavailable.');
        return$order;
    }

    public function guestOrderPublicId(string $claimPublicId): string
    {
        $order = $this->repository->parentOrder($claimPublicId);
        if (!$order) throw new DomainException('Claim unavailable.');
        return (string) $order['public_id'];
    }
    public function accountList(AuthContext$auth):array{if(!$auth->isAuthenticated()||!$auth->userId())throw new DomainException('Verified account required.');return$this->repository->customerListByOwner($auth->userId());}

    /** @return list<array<string,mixed>> */
    public function detail(string $claimPublicId, ActorContext $actor, ?string $guestGrant): array
    {
        $order = $this->repository->parentOrder($claimPublicId);
        $user = $actor->type() === 'customer_account' ? ['id' => $actor->userId()] : null;
        if (!$order || !$this->access->canAccess($order, $user, $guestGrant, false, (string) $order['public_id'])) throw new DomainException('Claim unavailable.');
        return $this->repository->customerDetail($claimPublicId);
    }
    /** @return array{summary:array<string,mixed>,events:list<array<string,mixed>>,items:list<array<string,mixed>>} */
    public function detailPayload(string $claimPublicId, ActorContext $actor, ?string $guestGrant): array
    {
        $events = $this->detail($claimPublicId, $actor, $guestGrant);
        if ($events === []) throw new DomainException('Claim unavailable.');
        $summary = $events[0];
        foreach (['event_public_id','action','old_state','new_state','public_message','event_created_at'] as $field) unset($summary[$field]);
        return ['summary' => $summary, 'events' => $events, 'items' => $this->repository->customerItems($claimPublicId)];
    }

    /** @param array<string,mixed> $data @return array<string,mixed> */
    public function transition(string $publicId, ActorContext $actor, int $expectedVersion, string $target, array $data, string $idempotencyKey): array
    {
        if ($actor->type() !== 'legacy_shared_admin' || $idempotencyKey === '') throw new DomainException('Admin required.');
        return Transactional::run($this->pdo, function () use ($publicId, $actor, $expectedVersion, $target, $data, $idempotencyKey): array {
            $current = $this->repository->lockByPublicId($publicId);
            if (!$current) throw new DomainException('Claim unavailable.');
            $keyHash = hash('sha256', $idempotencyKey);
            $requestHash = hash('sha256', json_encode([$publicId,$expectedVersion,$target,$data], JSON_THROW_ON_ERROR));
            $replay = $this->repository->transitionReplay((int)$current['id'],$keyHash);
            if($replay){if(!hash_equals((string)$replay['request_hash'],$requestHash))throw new DomainException('Idempotency conflict.');return ['id'=>$current['id'],'public_id'=>$publicId,'status'=>$replay['new_state'],'version'=>$replay['entity_version']];}
            if ((int) $current['version'] !== $expectedVersion) throw new DomainException('Version conflict.');
            $old = (string) $current['status'];
            $this->machine->assertTransition($old, $target, $data);
            $storedItems=[];
            if(in_array($target,['rejected','resolved','cancelled'],true)){
                $storedItems=$this->repository->items((int)$current['id']);
                $this->availability->lockOrderItems((int)$current['order_id'],array_map(static fn(array$item):int=>(int)$item['order_item_id'],$storedItems));
            }
            $auditActor = AuditActor::fromContext($actor);
            $correlation = bin2hex(random_bytes(16));
            if ($old === $target) {
                $this->repository->insertTransitionEvent((int)$current['id'],'state_noop',$old,$target,$expectedVersion,$auditActor,$correlation,$keyHash,$requestHash,isset($data['public_message'])?(string)$data['public_message']:null,isset($data['internal_note'])?(string)$data['internal_note']:null);
                $this->audit->record(bin2hex(random_bytes(16)),'claim',(int)$current['id'],'state_noop','ignored',$auditActor,$correlation,$old,$target,[],$keyHash);
                return $current;
            }
            if ($target === 'resolved') {
                $approved = $data['approved_items'] ?? null;
                if (!is_array($approved) || $approved === []) throw new DomainException('Approved quantities are required.');
                $normalized = [];
                foreach ($approved as $itemId => $quantity) {
                    if ((int) $itemId < 1 || (int) $quantity < 1) throw new DomainException('Invalid approved quantity.');
                    $normalized[(int) $itemId] = (int) $quantity;
                }
                $requested=[];foreach($storedItems as$item)$requested[(int)$item['order_item_id']]=(int)$item['requested_quantity'];
                foreach($normalized as$itemId=>$quantity)if(!isset($requested[$itemId])||$quantity>$requested[$itemId])throw new DomainException('Approved quantity exceeds requested quantity.');
                $this->repository->resolveItems((int) $current['id'], $normalized, (string) $data['resolution_outcome']);
            }
            $updated = $this->repository->transition((int) $current['id'], $expectedVersion, $target, $data);
            $this->repository->insertTransitionEvent((int) $current['id'], 'state_transition', $old, $target, (int)$updated['version'], $auditActor, $correlation, $keyHash, $requestHash, isset($data['public_message']) ? (string) $data['public_message'] : null, isset($data['internal_note']) ? (string) $data['internal_note'] : null);
            $this->audit->record(bin2hex(random_bytes(16)), 'claim', (int) $current['id'], 'state_transition', 'success', $auditActor, $correlation, $old, $target, [], $keyHash);
            return $updated;
        });
    }
    public function addCustomerMessage(string$id,ActorContext$actor,?string$grant,string$message,string$idem):array
    {
        $message=trim($message);if($message===''||mb_strlen($message)>2000||$idem==='')throw new DomainException('Invalid message.');$order=$this->repository->parentOrder($id);$user=$actor->type()==='customer_account'?['id'=>$actor->userId()]:null;if(!$order||!$this->access->canAccess($order,$user,$grant,false,(string)$order['public_id']))throw new DomainException('Claim unavailable.');$key=hash('sha256',$idem);$request=hash('sha256',$message);
        return Transactional::run($this->pdo,function()use($id,$actor,$message,$key,$request){$claim=$this->repository->lockByPublicId($id);if(!$claim||in_array($claim['status'],['rejected','resolved','cancelled'],true))throw new DomainException('Claim is closed.');$old=$this->repository->messageReplay((int)$claim['id'],$key);if($old){if(!hash_equals((string)$old['request_hash'],$request))throw new DomainException('Idempotency conflict.');return$old;}$a=AuditActor::fromContext($actor);$c=bin2hex(random_bytes(16));$event=$this->repository->insertCustomerMessage((int)$claim['id'],(string)$claim['status'],$a,$c,$key,$request,$message);$this->audit->record(bin2hex(random_bytes(16)),'claim',(int)$claim['id'],'customer_message','success',$a,$c,(string)$claim['status'],(string)$claim['status'],[],$key);return$event;});
    }
}
