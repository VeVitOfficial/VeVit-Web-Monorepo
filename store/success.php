<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/orders/OrderAccessService.php';

header('Cache-Control: no-store, private');
header('Pragma: no-cache');
header('Referrer-Policy: no-referrer');

$publicId = $_GET['order'] ?? '';
$order = null;
$items = [];
if (is_string($publicId) && preg_match('/^[a-f0-9]{32}$/', $publicId)) {
    $statement = $pdo->prepare('SELECT * FROM store_orders WHERE public_id = ? LIMIT 1');
    $statement->execute([$publicId]);
    $candidate = $statement->fetch();
    $user = getCurrentUser();
    $access = new OrderAccessService(new DateTimeImmutable('now', new DateTimeZone('UTC')));
    if ($candidate && $access->canAccess($candidate, $user, OrderAccessService::sessionGrant($publicId), !empty($_SESSION['admin']), $publicId)) {
        $order = $candidate;
        $itemsStatement = $pdo->prepare('SELECT id, product_name, product_type, quantity, unit_price FROM store_order_items WHERE order_id = ? ORDER BY id');
        $itemsStatement->execute([$order['id']]);
        $items = $itemsStatement->fetchAll();
    }
}
if ($order === null) {
    store_log_security_event('order_access_rejected', ['public_id_prefix' => is_string($publicId) ? substr($publicId, 0, 8) : 'invalid']);
    http_response_code(404);
    exit('Stránka nebyla nalezena.');
}

// Determine visual state
$isPaid         = in_array($order['status'], ['paid', 'processing', 'shipped', 'delivered'], true);
$isPending      = in_array($order['status'], ['pending', 'pending_checkout', 'awaiting_payment'], true);
$isManualReview = $order['status'] === 'manual_review';
$isCancelled    = in_array($order['status'], ['cancelled', 'refunded'], true);

$canRequestDownloads = ($order['payment_status'] ?? null) === 'paid'
    && !$isManualReview
    && $isPaid;

$statusConfig = [
    'pending'          => ['icon' => null,            'type' => 'pending', 'title' => 'Platba se zpracovává',       'desc' => 'Ověřujeme průběh platby. Tato stránka se neaktualizuje automaticky — stav zkontrolujte za chvíli nebo sledujte e-mail.'],
    'pending_checkout' => ['icon' => null,            'type' => 'pending', 'title' => 'Čekáme na zahájení platby', 'desc' => 'Platební relace ještě nebyla zahájena. Vraťte se do košíku a zkuste to znovu.'],
    'awaiting_payment' => ['icon' => null,            'type' => 'pending', 'title' => 'Čekáme na potvrzení platby','desc' => 'Platba je evidována a čekáme na její potvrzení od poskytovatele. Obvykle to trvá jen chvíli.'],
    'paid'             => ['icon' => 'check_circle',  'type' => 'success', 'title' => 'Platba potvrzena',           'desc' => 'Vaše objednávka byla úspěšně zaplacena a je připravena ke zpracování.'],
    'processing'       => ['icon' => 'check_circle',  'type' => 'success', 'title' => 'Objednávka se zpracovává',  'desc' => 'Vaše platba proběhla. Objednávku nyní zpracováváme.'],
    'shipped'          => ['icon' => 'local_shipping','type' => 'success', 'title' => 'Objednávka odeslána',        'desc' => 'Vaše zásilka je na cestě. Sledovací číslo vám přijde e-mailem.'],
    'delivered'        => ['icon' => 'inventory_2',   'type' => 'success', 'title' => 'Objednávka doručena',        'desc' => 'Vaše zásilka byla doručena. Děkujeme za nákup!'],
    'manual_review'    => ['icon' => 'policy',        'type' => 'review',  'title' => 'Objednávka čeká na ověření','desc' => 'Platba byla pravděpodobně přijata, ale objednávka vyžaduje ruční kontrolu. Platbu NEOPAKUJTE. Budeme vás kontaktovat e-mailem.'],
    'cancelled'        => ['icon' => 'cancel',        'type' => 'error',   'title' => 'Objednávka zrušena',         'desc' => 'Tato objednávka byla zrušena. Kontaktujte nás, pokud si myslíte, že se jedná o chybu.'],
    'refunded'         => ['icon' => 'currency_exchange','type' => 'error','title' => 'Platba vrácena',             'desc' => 'Platba za tuto objednávku byla vrácena. O stavu budete informováni e-mailem.'],
];
$sc = $statusConfig[$order['status']] ?? ['icon' => 'help', 'type' => 'pending', 'title' => 'Stav objednávky', 'desc' => 'Stav platby je ověřován na serveru. Návrat z platební brány sám o sobě platbu nepotvrzuje.'];

$pageTitle = $sc['title'] . ' — VeVit Store';
$activeNav = '';
$noindex   = true;
include __DIR__ . '/lib/header.php';
$csrf = store_csrf_token('download');
?>
<main class="flex-1 w-full max-w-[680px] mx-auto px-margin py-12 flex flex-col gap-6">

  <!-- Status header -->
  <div class="flex flex-col items-center text-center gap-5">
    <!-- Status icon -->
    <div class="order-status-icon <?= $sc['type'] ?>">
      <?php if ($sc['type'] === 'pending'): ?>
        <span class="vevit-spinner" style="width:36px;height:36px;border-width:3px;color:var(--clr-warning)" role="status" aria-label="Načítání"></span>
      <?php else: ?>
        <span class="material-symbols-outlined icon-filled text-[40px] <?= match($sc['type']) {
          'success' => 'text-success',
          'review'  => 'text-primary',
          'error'   => 'text-error',
          default   => 'text-warning'
        } ?>" aria-hidden="true"><?= h($sc['icon']) ?></span>
      <?php endif; ?>
    </div>

    <div>
      <span class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest block mb-2">Objednávka č. <strong class="text-primary"><?= h($order['order_number']) ?></strong></span>
      <h1 class="font-display text-h1 text-on-surface mb-3"><?= h($sc['title']) ?></h1>
      <p class="font-body-md text-on-surface-variant max-w-sm mx-auto"><?= h($sc['desc']) ?></p>
    </div>

    <?php if ($isPending): ?>
    <div class="flex items-center gap-2 bg-warning/10 border border-warning/30 text-warning rounded-xl px-5 py-3 text-sm">
      <span class="material-symbols-outlined text-[18px] icon-filled flex-shrink-0" aria-hidden="true">info</span>
      Platba se ověřuje. Tuto stránku ještě nezavírejte.
    </div>
    <?php endif; ?>

    <?php if ($isManualReview): ?>
    <div class="flex items-start gap-3 bg-primary/8 border border-primary/30 text-on-surface rounded-xl px-5 py-4 text-sm text-left max-w-md">
      <span class="material-symbols-outlined text-primary text-[18px] icon-filled flex-shrink-0 mt-0.5" aria-hidden="true">warning</span>
      <div>
        <strong class="text-on-surface block mb-1">Platbu neopakujte</strong>
        <span class="text-on-surface-variant">Vaše platba mohla být přijata. Objednávku manuálně ověřujeme a budeme vás kontaktovat e-mailem.</span>
      </div>
    </div>
    <?php endif; ?>
  </div>

  <!-- Order summary -->
  <section class="bg-surface-container border border-outline-variant rounded-xl overflow-hidden" aria-labelledby="order-summary-heading">
    <div class="px-6 py-4 border-b border-outline-variant">
      <h2 id="order-summary-heading" class="font-h2 text-[18px] font-bold text-on-surface">Souhrn objednávky</h2>
    </div>
    <div class="p-6 flex flex-col gap-0">
      <?php foreach ($items as $item): ?>
      <div class="flex flex-col gap-3 py-4 <?= !($item === end($items)) ? 'border-b border-outline-variant/50' : '' ?>">
        <div class="flex justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-1 flex-wrap">
              <?php if ($item['product_type'] === 'digital'): ?>
                <span class="badge badge-primary">Digitální</span>
              <?php else: ?>
                <span class="badge badge-neutral">Fyzický</span>
              <?php endif; ?>
            </div>
            <p class="font-body-md font-semibold text-on-surface"><?= h($item['product_name']) ?></p>
            <p class="font-caption text-caption text-on-surface-variant mt-0.5">Počet: <?= (int)$item['quantity'] ?> ks &times; <?= number_format((float)$item['unit_price'], 0, ',', ' ') ?> Kč</p>
          </div>
          <div class="font-display text-[18px] font-bold text-on-surface whitespace-nowrap">
            <?= number_format((float)$item['unit_price'] * (int)$item['quantity'], 0, ',', ' ') ?> Kč
          </div>
        </div>

        <?php if ($canRequestDownloads && $item['product_type'] === 'digital'): ?>
        <div class="bg-primary/8 border border-primary/25 rounded-lg p-4">
          <p class="font-body-md text-sm text-on-surface-variant mb-3">
            <span class="material-symbols-outlined text-primary text-[16px] icon-filled align-text-bottom" aria-hidden="true">download</span>
            Digitální soubor je připraven ke stažení. Odkaz k jednorázovému stažení bude vygenerován po kliknutí na tlačítko.
          </p>
          <button class="request-download btn btn-primary btn-sm" data-item-id="<?= (int)$item['id'] ?>"
            aria-live="polite">
            <span class="material-symbols-outlined text-[16px]" aria-hidden="true">download</span>
            Připravit stažení
          </button>
        </div>
        <?php endif; ?>
      </div>
      <?php endforeach; ?>

      <?php if (!empty($order['total_amount'])): ?>
      <div class="flex justify-between items-center pt-4 border-t border-outline-variant mt-2">
        <span class="font-mono-label text-mono-label text-on-surface-variant uppercase">Celkem</span>
        <span class="font-display text-h2 font-bold text-primary"><?= number_format((float)$order['total_amount'], 0, ',', ' ') ?> Kč</span>
      </div>
      <?php endif; ?>
    </div>
  </section>

  <!-- Actions -->
  <div class="flex flex-col sm:flex-row gap-3 justify-center">
    <a href="index.html" class="btn btn-outline">
      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">home</span>
      Zpět domů
    </a>
    <a href="catalog.php" class="btn btn-primary">
      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">storefront</span>
      Pokračovat v nákupu
    </a>
  </div>
</main>

<script>
document.querySelectorAll('.request-download').forEach(function(button) {
  button.addEventListener('click', async function() {
    const btn = this;
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="vevit-spinner"></span> Připravuji…';
    try {
      const response = await fetch('api/request-download.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': <?= json_encode($csrf) ?> },
        body: JSON.stringify({ order: <?= json_encode($publicId) ?>, item_id: Number(btn.dataset.itemId) })
      });
      const data = await response.json();
      if (!data.download?.token) {
        window.showToast?.(data.error?.message || 'Stažení není k dispozici.', 'error');
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        return;
      }
      // Submit token via hidden form (POST — token must NOT appear in URL or logs)
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'download.php';
      [['token', data.download.token], ['csrf', <?= json_encode($csrf) ?>]].forEach(function([name, value]) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
      // Remove form from DOM immediately after submit (token only in POST body, not in history)
      setTimeout(() => form.remove(), 0);
      btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span> Stahování zahájeno';
    } catch {
      window.showToast?.('Chyba při komunikaci. Zkuste to znovu.', 'error');
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  });
});
</script>
<?php include __DIR__ . '/lib/footer.php'; ?>
