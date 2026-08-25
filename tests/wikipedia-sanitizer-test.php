<?php
declare(strict_types=1);

require_once __DIR__ . '/../edu/php/wikipedia-sanitize.php';

function assert_safe(string $payload): void
{
    $clean = vevit_wikipedia_sanitize_html($payload);
    $forbidden = [
        '/<\/?(?:script|iframe|object|embed|svg|math|form|input|button|style|link|base)\b/i',
        '/\son[a-z]+\s*=/i',
        '/(?:href|src)\s*=\s*["\']?\s*(?:javascript|data):/i',
        '/\ssrcdoc\s*=/i',
    ];
    foreach ($forbidden as $pattern) {
        if (preg_match($pattern, $clean) === 1) {
            throw new RuntimeException("Nebezpečný výstup pro payload: {$payload}\n{$clean}");
        }
    }
}

$payloads = [
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)><circle></circle></svg>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
    '<object data="javascript:alert(1)"></object>',
    '<embed src="data:text/html,<script>alert(1)</script>">',
    '<a href="javascript:alert(1)">odkaz</a>',
    '<img src="data:image/svg+xml,<svg onload=alert(1)>">',
    '<math><mtext><table><mglyph><style><!--</style><img title="--></mglyph><img src=1 onerror=alert(1)>">',
    '<noscript><p title="</noscript><img src=x onerror=alert(1)>">x</p>',
];

foreach ($payloads as $payload) {
    assert_safe($payload);
}

$safe = vevit_wikipedia_sanitize_html('<article><h2 id="sekce">Titulek</h2><p>Text <strong>tučně</strong>.</p></article>');
if (!str_contains($safe, 'Titulek') || !str_contains($safe, '<strong>tučně</strong>')) {
    throw new RuntimeException('Sanitizace odstranila bezpečný obsah.');
}

fwrite(STDOUT, "wikipedia-sanitizer-test: PASS\n");
