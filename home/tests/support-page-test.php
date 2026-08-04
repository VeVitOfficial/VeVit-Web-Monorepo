<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$home = file_get_contents($root . '/index.html');
$support = is_file($root . '/support.html') ? file_get_contents($root . '/support.html') : '';
$supportCss = is_file($root . '/assets/css/support.css') ? file_get_contents($root . '/assets/css/support.css') : '';
$supportJs = is_file($root . '/assets/js/support.js') ? file_get_contents($root . '/assets/js/support.js') : '';
$failures = [];

function expect_support(bool $condition, string $message): void
{
    global $failures;
    if (!$condition) {
        $failures[] = $message;
    }
}

$requiredHomepageLinks = [
    'href="/"',
    'href="https://account.vevit.cz/login.html"',
    'href="https://account.vevit.cz/register.html"',
    'href="#premium"',
    'href="/support.html#contact"',
    'href="/support.html#faq"',
    'href="https://github.com/VeVitOfficial"',
    'href="https://x.com/VeVitOfficial"',
];
foreach ($requiredHomepageLinks as $link) {
    expect_support(str_contains($home, $link), "Missing homepage link: {$link}");
}
expect_support(
    str_contains($home, '<li><a href="/support.html">Support</a></li>'),
    'Homepage footer must link Support to the top of the support page.'
);
expect_support(
    !str_contains($home, '>Nahlásit chybu</a>'),
    'Homepage footer must not use the old Nahlásit chybu label.'
);

$forbiddenHomepageLinks = [
    'href="#"',
    '/login.php',
    'href="https://account.vevit.cz/login"',
    '/register.php',
    'href="https://account.vevit.cz/premium"',
    'href="https://github.com"',
    'href="https://twitter.com"',
    'href="https://ko-fi.com"',
    'href="https://games.vevit.cz"',
];
foreach ($forbiddenHomepageLinks as $link) {
    expect_support(!str_contains($home, $link), "Broken homepage destination remains: {$link}");
}

$requiredSupportHooks = [
    'id="support-main"',
    'id="support-search"',
    'data-support-category="all"',
    'id="faq"',
    'data-faq-item',
    'data-faq-question',
    'aria-expanded="false"',
    'id="support-no-results"',
    'id="contact"',
    'id="support-form"',
    'name="application"',
    'name="request_type"',
    'id="support-status"',
    'data-contact-email',
    'data-email-copy-status',
    'data-current-year',
    'assets/css/support.css',
    'assets/js/support.js',
];
foreach ($requiredSupportHooks as $hook) {
    expect_support(str_contains($support, $hook), "Missing support page hook: {$hook}");
}

expect_support(
    substr_count($support, 'data-faq-item') === 8,
    'Support page must contain exactly eight FAQ items.'
);
foreach (['account', 'tools', 'edu', 'services', 'other'] as $category) {
    expect_support(
        str_contains($support, 'data-category="' . $category . '"'),
        "Support FAQ must include the {$category} category."
    );
}
foreach (['https://account.vevit.cz/login.html', 'https://account.vevit.cz/register.html'] as $accountLink) {
    expect_support(
        str_contains($support, 'href="' . $accountLink . '"'),
        "Support page must use confirmed Account link {$accountLink}."
    );
}

$requiredJsContracts = [
    'normalizeSearch',
    'filterFaq',
    'initFaq',
    'initSupportForm',
    'new Date().getFullYear()',
    "fetch('https://formsubmit.co/ajax/info@vevit.cz'",
    'form.checkValidity()',
    'form.reportValidity()',
    'submitButton.disabled = true',
    'Zpráva byla odeslána. Děkujeme.',
    'Zprávu se nepodařilo odeslat. Napište na info@vevit.cz.',
    'initContactEmail',
    "matchMedia('(hover: hover) and (pointer: fine)')",
    'navigator.clipboard.writeText(email)',
];
foreach ($requiredJsContracts as $contract) {
    expect_support(str_contains($supportJs, $contract), "Missing support behavior: {$contract}");
}

$requiredCssSelectors = [
    '.support-hero',
    '.support-search',
    '.support-layout',
    '.support-categories',
    '.faq-item',
    '.support-form',
    '.support-no-results',
    ':focus-visible',
    '@media (max-width: 760px)',
    'prefers-reduced-motion: reduce',
];
foreach ($requiredCssSelectors as $selector) {
    expect_support(str_contains($supportCss, $selector), "Missing support style: {$selector}");
}

if ($failures !== []) {
    fwrite(STDERR, "support-page-test: FAIL\n- " . implode("\n- ", $failures) . "\n");
    exit(1);
}

fwrite(STDOUT, "support-page-test: PASS\n");
