<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$html = file_get_contents($root . '/index.html');
$ui = file_get_contents($root . '/assets/js/ui.js');
$app = file_get_contents($root . '/assets/js/app.js');
$premium = file_get_contents($root . '/assets/js/premium.js');
$questions = is_file($root . '/copy-open-questions.md')
    ? file_get_contents($root . '/copy-open-questions.md')
    : '';
$audit = is_file($root . '/copy-audit.md')
    ? file_get_contents($root . '/copy-audit.md')
    : '';

$failures = [];

function expect_true(bool $condition, string $message): void
{
    global $failures;
    if (!$condition) {
        $failures[] = $message;
    }
}

$publicHtml = preg_replace('/<!--.*?-->/s', '', $html) ?? $html;
$publicScripts = preg_replace(
    ['~/\*.*?\*/~s', '~^\s*//.*$~m'],
    '',
    $ui . "\n" . $app . "\n" . $premium
) ?? ($ui . "\n" . $app . "\n" . $premium);
expect_true(
    preg_match('/[—–]/u', $publicHtml . "\n" . $publicScripts) === 0,
    'Public copy must not contain em or en dashes.'
);
expect_true(
    str_contains($html, '<title>VeVit | Nástroje, hry a vzdělávání</title>')
        && str_contains($html, 'Nástroje, hry a lekce na jednom místě. Bez reklam.'),
    'Page metadata must use the approved direct Czech wording.'
);

expect_true(
    str_contains($ui, "TOOLS_COUNT: '100+'"),
    'UI.values must define the approved 100+ tool count.'
);
expect_true(
    str_contains($ui, 'interpolate(') && str_contains($ui, 'this.values'),
    'UI.t() must interpolate placeholders from UI.values.'
);
expect_true(
    preg_match('/assets\/js\/ui\.js.*assets\/js\/app\.js/s', $html) === 1,
    'index.html must load ui.js before app.js.'
);
expect_true(
    preg_match('/\b(?:100\+|79\+?)\s*(?:<[^>]+>\s*)*nástroj/ui', $html) === 0,
    'index.html must not contain a hardcoded 100+/79/79+ tool count.'
);
expect_true(
    substr_count($ui, '100+') === 1,
    'ui.js must keep the approved tool count only in UI.values.'
);
expect_true(
    substr_count($html, 'data-ui-text="landing.counts.tools') >= 7,
    'Every landing tool-count occurrence must use a UI translation key.'
);
expect_true(
    preg_match('/data-ui-text="landing\.[^"]+"[^>]*>\s*[^<\s]/u', $html) === 0,
    'Landing elements hydrated from ui.js must not duplicate fallback copy in HTML.'
);

$roadmapStatuses = [
    'tools' => 'V betě',
    'edu' => 'V betě',
    'games' => 'Připravujeme',
    'services' => 'Připravujeme',
    'account' => 'V betě',
    'search' => 'Připravujeme',
    'store' => 'V plánu',
];
foreach ($roadmapStatuses as $product => $status) {
    expect_true(
        str_contains($html, 'data-ui-text="landing.roadmap.' . $product . '.status"'),
        "Roadmap card {$product} must bind its status through ui.js."
    );
    expect_true(
        str_contains($ui, "status: '{$status}'"),
        "Roadmap status {$status} must exist in the Czech translation source."
    );
}

foreach (['Q4 2025', 'Q1 2026', 'Beta · listopad', 'Launch · prosinec', 'Alpha · březen'] as $staleTerm) {
    expect_true(!str_contains($html, $staleTerm), "Expired roadmap term must be removed: {$staleTerm}");
}

expect_true(
    preg_match('/<a[^>]+href="#kontakt"[^>]+data-premium-notify[^>]+aria-label="Upozornit na spuštění VeVit Premium"[^>]*>/u', $html) === 1,
    'Premium CTA must scroll to contact and expose the approved aria-label.'
);
expect_true(
    str_contains($ui, "notifyCta: 'Upozornit na spuštění'"),
    'Premium CTA copy must come from ui.js.'
);
expect_true(
    !str_contains($html, 'Prémium připravujeme'),
    'The inconsistent Prémium heading must not remain in HTML.'
);
expect_true(
    str_contains($app, "querySelector('[data-premium-notify]')")
        && str_contains($app, "getElementById('kf-email')")
        && str_contains($app, "getElementById('kf-msg')"),
    'Premium notification CTA must prepare and focus the contact form.'
);
expect_true(
    !str_contains($questions, 'TOOLS_COUNT') && !str_contains($questions, 'blokuje finální publikaci'),
    'Open questions must not retain the resolved tool-count publication blocker.'
);
expect_true(
    str_contains($questions, 'ceník existuje v DOM, ale bez funkčního checkoutu'),
    'Open questions must retain the approved Premium checkout warning.'
);

expect_true(
    preg_match('/<div class="orbit-core">\s*<img[^>]+class="orbit-core-logo"[^>]+src="images\/logo_text\.png"[^>]+alt=""[^>]*>\s*<\/div>/u', $html) === 1,
    'The orbit core must render the supplied decorative logo image.'
);
expect_true(
    !str_contains($html, 'orbit-core-mark') && !str_contains($html, 'orbit-core-tag'),
    'The legacy Ve / CORE text must be removed from the orbit.'
);

$servicesBindings = [
    'landing.services.navigation',
    'landing.services.card',
    'landing.services.meta',
    'landing.services.roadmap',
];
foreach ($servicesBindings as $binding) {
    expect_true(
        str_contains($html, 'data-ui-text="' . $binding . '"'),
        "Services copy must bind through ui.js: {$binding}"
    );
}
expect_true(
    str_contains($ui, "card: 'Zadej poptávku nebo nabídni vlastní službu. Třeba tvorbu webu, doučování, ilustraci nebo pomoc na zahradě.'"),
    'ui.js must contain the direct Services card copy.'
);

$accountCardCopy = 'Na jednom místě se zaregistruješ a přihlásíš ke svému VeVit účtu. Můžeš použít heslo, Google, GitHub nebo Discord. Další funkce profilu připravujeme.';
$accountRoadmapCopy = 'Registrace a přihlášení jsou v betě. Na XP profil, achievementy, levely a propojení aplikací dál pracujeme.';
expect_true(
    preg_match('/<a class="dd-item" href="https:\/\/account\.vevit\.cz" role="menuitem">[\s\S]*?data-ui-text="landing\.account\.navigation"[\s\S]*?<\/a>/u', $html) === 1,
    'Account must be an active destination in the desktop applications menu.'
);
expect_true(
    preg_match('/<a class="ec ec-account" href="https:\/\/account\.vevit\.cz"[^>]*>[\s\S]*?data-ui-text="landing\.account\.card"[\s\S]*?<\/a>/u', $html) === 1,
    'The Account ecosystem card must link to account.vevit.cz.'
);
expect_true(
    str_contains($ui, "account: { status: 'V betě', progress: '{ROADMAP_ACCOUNT_PROGRESS} % hotovo' }")
        && str_contains($ui, "ROADMAP_ACCOUNT_PROGRESS: 90"),
    'Account roadmap progress must be 90% in the UI source of truth.'
);
expect_true(
    preg_match('/<div class="roadmap-track">\s*<article class="roadmap-item roadmap-account">/u', $html) === 1,
    'Account must be the first item in the roadmap.'
);
expect_true(
    str_contains($ui, "ROADMAP_EDU_PROGRESS: 30"),
    'Edu roadmap progress must be 30% in the UI source of truth.'
);
expect_true(
    str_contains($ui, "ROADMAP_GAMES_PROGRESS: 10"),
    'Games roadmap progress must be 10% in the UI source of truth.'
);
expect_true(
    str_contains($ui, "ROADMAP_SERVICES_PROGRESS: 40"),
    'Services roadmap progress must be 40% in the UI source of truth.'
);
$removedProduct = 've' . 'wi' . 'be';
$removedProductFiles = [
    'index.html' => $html,
    'assets/js/ui.js' => $ui,
    'assets/css/main.css' => file_get_contents($root . '/assets/css/main.css'),
    'assets/css/premium.css' => file_get_contents($root . '/assets/css/premium.css'),
    'api.php' => file_get_contents($root . '/api.php'),
    'api/login.php' => file_get_contents($root . '/api/login.php'),
    'api/logout.php' => file_get_contents($root . '/api/logout.php'),
    'api/user.php' => file_get_contents($root . '/api/user.php'),
    'copy-audit.md' => $audit,
];
foreach ($removedProductFiles as $file => $contents) {
    expect_true(
        stripos($contents, $removedProduct) === false,
        "Removed community product must not remain in {$file}."
    );
}
$socialIcons = [
    'https://www.instagram.com/vevit.cz/' => 'instagram',
    'https://x.com/VeVitOfficial' => 'x',
    'https://discord.gg/dJumMfWd6r' => 'discord',
];
foreach ($socialIcons as $href => $icon) {
    $pattern = '/<a class="social-link" href="' . preg_quote($href, '/')
        . '"[^>]*>\s*<svg[^>]+data-social-icon="' . $icon . '"[^>]*>/u';
    expect_true(
        preg_match($pattern, $html) === 1,
        "Social link {$href} must render its dedicated inline SVG icon."
    );
}
expect_true(
    preg_match('/<a class="social-link" href="mailto:info@vevit\.cz"[^>]+data-contact-email[^>]*>/u', $html) === 1
        && str_contains($html, 'data-email-copy-status'),
    'Contact email must preserve mailto and expose desktop-copy hooks.'
);
expect_true(
    str_contains($app, "querySelector('[data-contact-email]')")
        && str_contains($app, "matchMedia('(hover: hover) and (pointer: fine)')")
        && str_contains($app, 'event.preventDefault()')
        && str_contains($app, 'navigator.clipboard.writeText(email)'),
    'Desktop email clicks must copy while mobile clicks keep the native mailto behavior.'
);
expect_true(
    preg_match('/&copy;\s*2025\s*-\s*<span data-current-year>\d{4}<\/span>\s*VeVit\./u', $html) === 1,
    'Footer copyright must start in 2025 and expose the current year hook.'
);
expect_true(
    str_contains($app, "querySelector('[data-current-year]')")
        && str_contains($app, 'new Date().getFullYear()')
        && str_contains($app, 'initCurrentYear();'),
    'The footer must update its ending year from the visitor current date.'
);
expect_true(
    str_contains($ui, "card: '{$accountCardCopy}'")
        && str_contains($ui, "roadmap: '{$accountRoadmapCopy}'"),
    'ui.js must contain both approved Account descriptions verbatim.'
);

$latestTools = [
    ['bg-remover', 'Odstranit pozadí', 'Obrázky', true],
    ['img-compress', 'Komprese obrázku', 'Obrázky', false],
    ['pdf-compress', 'Komprese PDF', 'PDF', false],
    ['pdf-merge', 'Sloučení PDF', 'PDF', false],
    ['qr-generator', 'QR generátor', 'Dev', false],
    ['json-formatter', 'JSON formátovač', 'Dev', false],
    ['password-gen', 'Generátor hesel', 'Bezpečnost', false],
    ['translate', 'Překlad textu', 'Text', true],
];
preg_match('/<div class="tools-showcase">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/u', $html, $latestToolsMatch);
$latestToolsHtml = $latestToolsMatch[1] ?? '';
preg_match_all('/<a class="tool-mini"[\s\S]*?<\/a>/u', $latestToolsHtml, $latestToolCards);
expect_true(
    count($latestToolCards[0]) === count($latestTools),
    'The latest tools section must contain exactly eight tool cards.'
);
foreach ($latestTools as $index => [$slug, $name, $category, $recommended]) {
    $card = $latestToolCards[0][$index] ?? '';
    expect_true(
        str_contains($card, 'href="https://tools.vevit.cz/tools/' . $slug . '"')
            && str_contains($card, 'data-tool-slug="' . $slug . '"')
            && str_contains($card, '<span class="tool-name">' . $name . '</span>')
            && str_contains($card, '<span class="tool-category">' . $category . '</span>')
            && str_contains($card, '<span class="tool-use">Použít</span>'),
        "Latest tool card {$index} must use the requested route, name, category, and CTA."
    );
    expect_true(
        str_contains($card, '<span class="tool-badge">Doporučeno</span>') === $recommended,
        "Latest tool card {$name} must have the requested recommendation badge state."
    );
}
expect_true(
    !str_contains($latestToolsHtml, 'Připravujeme')
        && !str_contains($latestToolsHtml, 'Nedostupné v tomto regionu')
        && !str_contains($latestToolsHtml, 'Nedostupné na WEDOS'),
    'Latest tool cards must not include unavailable statuses.'
);
expect_true(
    str_contains($html, 'data-ui-text="landing.account.roadmap"')
        && !str_contains($html, 'SSO a XP profil')
        && !str_contains($html, 'Jeden účet napříč ekosystémem. XP profil, achievementy, level 1→100.'),
    'Account copy must be hydrated from ui.js without unverified feature promises.'
);
expect_true(
    !str_contains($questions, 'Account má veřejně dostupnou registraci'),
    'The resolved Account decision must be removed from open questions.'
);
expect_true(
    str_contains($audit, 'Access-Control-Allow-Origin')
        && str_contains($audit, '/api/me.php')
        && str_contains($audit, 'tools.vevit.cz')
        && str_contains($audit, 'blokátor budoucího SSO'),
    'The audit must record the observed CORS header gap as a potential future SSO blocker.'
);

if ($failures !== []) {
    fwrite(STDERR, "copy-p0-test: FAIL\n- " . implode("\n- ", $failures) . "\n");
    exit(1);
}

fwrite(STDOUT, "copy-p0-test: PASS\n");
