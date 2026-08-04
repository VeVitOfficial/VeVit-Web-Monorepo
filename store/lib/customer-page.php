<?php
declare(strict_types=1);

function agenda_page_start(string $title, string $subtitle = ''): void
{
    $GLOBALS['pageTitle'] = $title . ' — VeVit Store';
    $GLOBALS['activeNav'] = 'account';
    $GLOBALS['noindex'] = true;
    require __DIR__ . '/header.php';
    echo '<main id="main-content" class="flex-1 w-full max-w-store mx-auto px-4 md:px-margin py-10">';
    echo '<div class="mb-8"><p class="font-mono-label text-primary uppercase tracking-widest">Zákaznická agenda</p><h1 class="font-display text-h1 mt-2">' . h($title) . '</h1>';
    if ($subtitle !== '') echo '<p class="text-on-surface-variant mt-2 max-w-2xl">' . h($subtitle) . '</p>';
    echo '</div>';
}

function agenda_page_end(): void
{
    echo '</main><script src="assets/js/customer-agenda.js"></script>';
    require __DIR__ . '/footer.php';
}

function agenda_unavailable(string $message): void
{
    echo '<section class="bg-surface-container border border-outline-variant rounded-xl p-6" role="status"><h2 class="font-h2 text-h2">Funkce je dočasně nedostupná</h2><p class="text-on-surface-variant mt-2">' . h($message) . '</p><a class="btn btn-primary mt-5 inline-flex" href="catalog.php">Přejít do katalogu</a></section>';
}

/** @param list<array<string,mixed>> $events */
function agenda_timeline(array $events): void
{
    echo '<ol class="space-y-3 mt-4">';
    foreach ($events as $event) {
        echo '<li class="border-l-2 border-primary pl-4 py-1"><div class="font-semibold">' . h((string) ($event['new_state'] ?? $event['action'] ?? 'Aktualizace')) . '</div>';
        if (!empty($event['public_message'])) echo '<p class="text-on-surface-variant">' . h((string) $event['public_message']) . '</p>';
        echo '<time class="font-caption text-on-surface-variant">' . h((string) ($event['event_created_at'] ?? '')) . '</time></li>';
    }
    echo '</ol>';
}

function agenda_attachments(string$type,string$caseId,ActorContext$actor,?string$grant,AttachmentService$service):void
{
    $attachments=$service->list($type,$caseId,$actor,$grant);
    echo '<section class="mt-7 border-t border-outline-variant pt-5"><h3 class="font-h2 text-h2">Přílohy</h3><ul class="mt-3 space-y-2">';
    foreach($attachments as$file)echo '<li><form method="post" action="case-attachment.php"><input type="hidden" name="csrf" value="'.h(store_csrf_token('customer_agenda')).'"><input type="hidden" name="attachment_id" value="'.h((string)$file['public_id']).'"><button class="text-primary underline" type="submit">'.h((string)$file['original_filename']).' ('.(int)$file['byte_size'].' B)</button></form></li>';
    if($attachments===[])echo '<li class="text-on-surface-variant">Zatím bez příloh.</li>';
    echo '</ul><form data-agenda-upload class="mt-5" method="post" enctype="multipart/form-data" action="api/attachments/upload.php"><input type="hidden" name="csrf" value="'.h(store_csrf_token('customer_agenda')).'"><input type="hidden" name="case_type" value="'.h($type).'"><input type="hidden" name="case_id" value="'.h($caseId).'"><label class="block">Nová příloha (JPEG, PNG, WebP nebo PDF)<input class="block mt-2" type="file" name="attachment" accept="image/jpeg,image/png,image/webp,application/pdf" required></label><button class="btn btn-outline mt-3" type="submit">Nahrát přílohu</button><output class="block mt-2" aria-live="polite"></output></form></section>';
}
