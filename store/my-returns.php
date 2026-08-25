<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/customer-agenda.php';
require_once __DIR__ . '/lib/customer-page.php';
agenda_page_start('Moje vrácení');
try{$service=agenda_return_service($pdo,$storeConfig);$rows=$service->accountList(agenda_auth_context($storeConfig));if($rows===[])echo '<p class="text-on-surface-variant">Zatím nemáte žádná vrácení.</p>';foreach($rows as$row)echo '<article class="bg-surface-container border border-outline-variant rounded-xl p-5 mb-4"><h2 class="font-h2 text-h2">'.h((string)$row['reason_code']).'</h2><p>'.h((string)$row['status']).' · refund: '.h((string)$row['refund_status']).'</p><a class="text-primary underline" href="return.php?id='.rawurlencode((string)$row['public_id']).'">Detail vrácení</a></article>';}catch(DomainException){agenda_unavailable('Seznam všech vrácení vyžaduje ověřenou identitu VeVit Account. Konkrétní žádost otevřete přes zabezpečenou objednávku.');}
agenda_page_end();
