<?php
declare(strict_types=1);

function adminAgendaStart(string $title): void
{
    echo '<!doctype html><html class="dark" lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . ' — Admin</title><link rel="stylesheet" href="/assets/css/vevit-tailwind.css"><link rel="stylesheet" href="../assets/css/style.css"></head><body data-admin-csrf="' . htmlspecialchars(store_csrf_token('admin_mutation'), ENT_QUOTES, 'UTF-8') . '" class="bg-background text-on-surface min-h-screen"><main class="max-w-6xl mx-auto px-4 py-8"><nav class="flex flex-wrap gap-4 mb-6"><a href="index.php">Dashboard</a><a href="claims.php">Reklamace</a><a href="returns.php">Vrácení</a><a href="deliveries.php">Doručení</a></nav><div class="border border-amber-500/50 bg-amber-500/10 text-amber-100 rounded-lg p-4 mb-6" role="note">Administrace používá dočasný sdílený účet. Jednotlivé administrátorské identity zatím nejsou ověřené.</div><h1 class="font-display text-3xl font-bold mb-6">' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '</h1>';
}

function adminAgendaEnd(): void
{
    echo '<form method="post" action="logout.php" class="mt-10"><input type="hidden" name="csrf" value="' . htmlspecialchars(csrfToken(), ENT_QUOTES, 'UTF-8') . '"><button class="border border-outline-variant px-4 py-2 rounded" type="submit">Ukončit admin relaci</button></form></main><script src="../assets/js/admin-agenda.js"></script></body></html>';
}

function adminAgendaFilter(array$states):void
{
    $selected=(string)($_GET['status']??'');echo '<form method="get" class="flex flex-wrap gap-3 mb-6"><label>Filtrovat podle stavu<select name="status" class="ml-2 bg-surface border border-outline-variant rounded px-3 py-2"><option value="">Všechny stavy</option>';foreach($states as$state)echo '<option value="'.htmlspecialchars($state,ENT_QUOTES,'UTF-8').'"'.($selected===$state?' selected':'').'>'.htmlspecialchars($state,ENT_QUOTES,'UTF-8').'</option>';echo '</select></label><button class="border border-outline-variant rounded px-4 py-2" type="submit">Filtrovat</button></form>';
}

/** @param list<array<string,mixed>> $orders */
function adminAgendaDeliveryCreate(array$orders,string$endpoint):void
{
    echo '<details class="bg-surface-container border border-outline-variant rounded-lg p-5 mb-6"><summary class="font-bold cursor-pointer">Založit novou zásilku</summary><div class="space-y-5 mt-4">';
    foreach($orders as$order){echo '<form class="admin-delivery-create grid md:grid-cols-3 gap-3 border-t border-outline-variant pt-4" data-endpoint="'.htmlspecialchars($endpoint,ENT_QUOTES,'UTF-8').'"><input type="hidden" name="order_id" value="'.(int)$order['order_id'].'"><strong class="md:col-span-3">'.htmlspecialchars((string)$order['order_number'],ENT_QUOTES,'UTF-8').' · '.htmlspecialchars((string)$order['status'],ENT_QUOTES,'UTF-8').'</strong><input name="carrier_code" maxlength="64" placeholder="Kód dopravce" class="bg-surface border border-outline-variant rounded px-3 py-2"><input name="tracking_number" maxlength="255" placeholder="Tracking číslo" class="bg-surface border border-outline-variant rounded px-3 py-2"><input name="tracking_url" type="url" placeholder="HTTPS tracking URL" class="bg-surface border border-outline-variant rounded px-3 py-2">';foreach($order['items']as$item)echo '<label>'.htmlspecialchars((string)$item['product_name'],ENT_QUOTES,'UTF-8').' — množství<input data-delivery-item="'.(int)$item['order_item_id'].'" type="number" min="0" max="'.(int)$item['quantity'].'" value="0" class="block bg-surface border border-outline-variant rounded px-3 py-2"></label>';echo '<button class="bg-primary text-black rounded px-4 py-2" type="submit">Založit zásilku</button><output aria-live="polite"></output></form>';}
    if($orders===[])echo '<p>Žádná způsobilá fyzická objednávka.</p>';
    echo '</div></details>';
}

/** @param list<array<string,mixed>> $rows */
function adminAgendaTable(array $rows, string $entity, string $endpoint, array $targets): void
{
    if ($rows === []) {
        echo '<p class="text-on-surface-variant">Žádné záznamy.</p>';
        return;
    }
    echo '<div class="space-y-4">';
    foreach ($rows as $row) {
        echo '<article class="bg-surface-container border border-outline-variant rounded-lg p-5"><div class="flex flex-wrap justify-between gap-3"><div><strong>' . htmlspecialchars((string) ($row['order_number'] ?? ''), ENT_QUOTES, 'UTF-8') . '</strong><p class="text-on-surface-variant">' . htmlspecialchars((string) $row['public_id'], ENT_QUOTES, 'UTF-8') . '</p><a class="text-primary underline" href="?id='.rawurlencode((string)$row['public_id']).'">Otevřít detail</a></div><span>' . htmlspecialchars((string) $row['status'], ENT_QUOTES, 'UTF-8') . ' · v' . (int) $row['version'] . '</span></div>';
        adminAgendaMutationForm($row,$entity,$endpoint,$targets,false);
        echo '</article>';
    }
    echo '</div>';
}

function adminAgendaMutationForm(array$row,string$entity,string$endpoint,array$targets,bool$detailed):void
{
    echo '<form class="admin-agenda-form grid md:grid-cols-3 gap-3 mt-4" data-entity="'.htmlspecialchars($entity,ENT_QUOTES,'UTF-8').'" data-endpoint="'.htmlspecialchars($endpoint,ENT_QUOTES,'UTF-8').'"><input type="hidden" name="id" value="'.htmlspecialchars((string)$row['public_id'],ENT_QUOTES,'UTF-8').'"><input type="hidden" name="expected_version" value="'.(int)$row['version'].'"><select name="target_status" required class="bg-surface border border-outline-variant rounded px-3 py-2"><option value="">Nový stav</option><option value="'.htmlspecialchars((string)$row['status'],ENT_QUOTES,'UTF-8').'">'.htmlspecialchars((string)$row['status'],ENT_QUOTES,'UTF-8').' (zpráva bez změny)</option>';
    foreach($targets as$target)if($target!==$row['status'])echo '<option>'.htmlspecialchars($target,ENT_QUOTES,'UTF-8').'</option>';
    echo '</select><input name="public_message" maxlength="2000" placeholder="Veřejná zpráva" class="bg-surface border border-outline-variant rounded px-3 py-2"><input name="internal_note" maxlength="2000" placeholder="Interní poznámka" class="bg-surface border border-outline-variant rounded px-3 py-2">';
    if($detailed&&$entity==='claim'){echo '<select name="resolution_outcome" class="bg-surface border border-outline-variant rounded px-3 py-2"><option value="">Výsledek řešení</option><option value="repair">Oprava</option><option value="replacement">Výměna</option><option value="refund">Refund</option><option value="store_credit">Kredit</option><option value="other">Jiné</option></select>';foreach($row['items']??[]as$item)echo '<label>'.htmlspecialchars((string)$item['product_name'],ENT_QUOTES,'UTF-8').' — schválené množství<input data-item-quantity="'.(int)$item['order_item_id'].'" type="number" min="0" max="'.(int)$item['requested_quantity'].'" value="'.(int)($item['approved_quantity']??0).'" class="block bg-surface border border-outline-variant rounded px-3 py-2"></label>';}
    if($detailed&&$entity==='return'){echo '<select name="decision" class="bg-surface border border-outline-variant rounded px-3 py-2"><option value="">Rozhodnutí</option><option value="refund">Refund</option><option value="replacement">Výměna</option><option value="repair">Oprava</option><option value="other">Jiné</option></select><label>Přijato<input name="received_at" type="datetime-local" class="block bg-surface border border-outline-variant rounded px-3 py-2"></label><label>Zkontrolováno<input name="inspected_at" type="datetime-local" class="block bg-surface border border-outline-variant rounded px-3 py-2"></label>';foreach($row['items']??[]as$item)echo '<label>'.htmlspecialchars((string)$item['product_name'],ENT_QUOTES,'UTF-8').' — množství pro aktuální krok<input data-item-quantity="'.(int)$item['order_item_id'].'" type="number" min="0" max="'.(int)$item['requested_quantity'].'" value="'.(int)($item['received_quantity']??0).'" class="block bg-surface border border-outline-variant rounded px-3 py-2"></label>';}
    if($entity==='delivery')echo '<input name="carrier_code" maxlength="64" placeholder="Kód dopravce" class="bg-surface border border-outline-variant rounded px-3 py-2"><input name="tracking_number" maxlength="255" placeholder="Tracking číslo" class="bg-surface border border-outline-variant rounded px-3 py-2"><input name="tracking_url" type="url" placeholder="HTTPS tracking URL" class="bg-surface border border-outline-variant rounded px-3 py-2"><label>Předáno dopravci<input name="shipped_at" type="datetime-local" class="block bg-surface border border-outline-variant rounded px-3 py-2"></label><label>Odhad doručení<input name="estimated_delivery_at" type="datetime-local" class="block bg-surface border border-outline-variant rounded px-3 py-2"></label><label>Skutečné doručení<input name="delivered_at" type="datetime-local" class="block bg-surface border border-outline-variant rounded px-3 py-2"></label>';
    echo '<button class="bg-primary text-black rounded px-4 py-2" type="submit">Uložit změnu</button><output class="text-sm" aria-live="polite"></output></form>';
}

function adminAgendaDetail(?array$row,string$entity,string$endpoint,array$targets):void
{
    if(!$row){echo '<p>Záznam nebyl nalezen.</p>';return;}echo '<section class="bg-surface-container border border-outline-variant rounded-lg p-5 mb-6"><dl class="grid md:grid-cols-3 gap-3"><div><dt>Objednávka</dt><dd>'.htmlspecialchars((string)($row['order_number']??''),ENT_QUOTES,'UTF-8').'</dd></div><div><dt>Stav</dt><dd>'.htmlspecialchars((string)($row['status']??''),ENT_QUOTES,'UTF-8').'</dd></div><div><dt>Verze</dt><dd>'.(int)($row['version']??0).'</dd></div></dl>';
    if(isset($row['internal_note']))echo '<h2 class="font-bold mt-5">Interní poznámka</h2><p class="whitespace-pre-wrap">'.htmlspecialchars((string)$row['internal_note'],ENT_QUOTES,'UTF-8').'</p>';
    echo '<h2 class="font-bold mt-5">Položky</h2><ul class="mt-2">';foreach($row['items']??[]as$item)echo '<li>'.htmlspecialchars((string)$item['product_name'],ENT_QUOTES,'UTF-8').' × '.(int)($item['requested_quantity']??$item['shipped_quantity']??0).'</li>';echo '</ul>';
    echo '<h2 class="font-bold mt-5">Historie</h2><ol class="space-y-3 mt-2">';foreach($row['events']??[]as$event)echo '<li class="border-l-2 border-primary pl-3"><strong>'.htmlspecialchars((string)$event['action'],ENT_QUOTES,'UTF-8').'</strong><p>'.htmlspecialchars((string)($event['public_message']??''),ENT_QUOTES,'UTF-8').'</p><p class="text-amber-200">'.htmlspecialchars((string)($event['internal_note']??''),ENT_QUOTES,'UTF-8').'</p></li>';echo '</ol>';
    if(isset($row['attachments'])){echo '<h2 class="font-bold mt-5">Přílohy</h2><ul>';foreach($row['attachments']as$file)echo '<li>'.htmlspecialchars((string)$file['original_filename'],ENT_QUOTES,'UTF-8').' · '.htmlspecialchars((string)$file['scan_status'],ENT_QUOTES,'UTF-8').'</li>';echo '</ul>';}adminAgendaMutationForm($row,$entity,$endpoint,$targets,true);echo '</section>';
}
