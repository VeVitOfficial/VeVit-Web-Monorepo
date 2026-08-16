<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/customer-agenda.php';
require_once __DIR__ . '/lib/customer-page.php';
agenda_page_start('Moje reklamace');
try{$service=new ClaimService($pdo,new ClaimRepository($pdo),new CaseQuantityAvailability($pdo),new OrderAccessService(new DateTimeImmutable('now',new DateTimeZone('UTC'))),new AuditService($pdo));$rows=$service->accountList(agenda_auth_context($storeConfig));if($rows===[])echo '<p class="text-on-surface-variant">Zatím nemáte žádné reklamace.</p>';foreach($rows as$row)echo '<article class="bg-surface-container border border-outline-variant rounded-xl p-5 mb-4"><h2 class="font-h2 text-h2">'.h((string)$row['reason_code']).'</h2><p>'.h((string)$row['status']).'</p><a class="text-primary underline" href="claim.php?id='.rawurlencode((string)$row['public_id']).'">Detail reklamace</a></article>';}catch(DomainException){agenda_unavailable('Seznam všech reklamací vyžaduje ověřenou identitu VeVit Account. Reklamaci konkrétní guest objednávky otevřete bezpečným odkazem.');}
agenda_page_end();
