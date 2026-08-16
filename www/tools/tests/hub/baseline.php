<?php
declare(strict_types=1);

return [
    // The initial inventory was audited on 2026-07-29. A different count is
    // intentional only when the registry and this reviewed baseline change together.
    'expected_unique_tool_count' => 107,
    'expected_unique_tool_count_reason' => 'Schválená baseline VeVit Tools obsahuje 107 unikátních slugů; sekce Nejnovější zobrazuje duplicity karet pouze vizuálně.',
    'informational_slugs' => ['pdf-password', 'screenshot-tool', 'ai-image-gen'],
];
