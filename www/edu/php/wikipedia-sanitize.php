<?php
declare(strict_types=1);

/**
 * Druhá, serverová obranná vrstva pro HTML z Wikipedie.
 * Klient výsledek před vložením do DOMu znovu zpracuje DOMPurify.
 */
function vevit_wikipedia_sanitize_html(string $html): string
{
    $allowedTags = array_fill_keys([
        'article', 'section', 'div', 'span', 'p', 'br', 'hr',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u',
        's', 'small', 'sub', 'sup', 'blockquote', 'pre', 'code', 'kbd', 'var',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'figure', 'figcaption', 'picture',
        'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'a', 'img',
    ], true);
    $dropTags = array_fill_keys([
        'script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'form',
        'input', 'button', 'select', 'textarea', 'option', 'link', 'base', 'meta',
        'template', 'noscript', 'video', 'audio', 'source', 'track', 'canvas',
    ], true);
    $allowedAttributes = array_fill_keys([
        'id', 'class', 'title', 'lang', 'dir', 'href', 'src', 'alt', 'width',
        'height', 'colspan', 'rowspan', 'scope', 'loading',
    ], true);

    $document = new DOMDocument('1.0', 'UTF-8');
    $previous = libxml_use_internal_errors(true);
    $loaded = $document->loadHTML(
        '<?xml encoding="UTF-8"><div id="vevit-wiki-root">' . $html . '</div>',
        LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_NONET
    );
    libxml_clear_errors();
    libxml_use_internal_errors($previous);
    if (!$loaded) {
        return '';
    }

    $xpath = new DOMXPath($document);
    $nodes = [];
    foreach ($xpath->query('//*[@id="vevit-wiki-root"]//*') ?: [] as $node) {
        $nodes[] = $node;
    }

    foreach (array_reverse($nodes) as $node) {
        if (!$node instanceof DOMElement) {
            continue;
        }
        $tag = strtolower($node->tagName);
        if (isset($dropTags[$tag])) {
            $node->parentNode?->removeChild($node);
            continue;
        }
        if (!isset($allowedTags[$tag])) {
            $parent = $node->parentNode;
            if ($parent !== null) {
                while ($node->firstChild !== null) {
                    $parent->insertBefore($node->firstChild, $node);
                }
                $parent->removeChild($node);
            }
            continue;
        }

        $attributes = [];
        foreach ($node->attributes as $attribute) {
            $attributes[] = $attribute->name;
        }
        foreach ($attributes as $name) {
            $lower = strtolower($name);
            if (!isset($allowedAttributes[$lower]) || str_starts_with($lower, 'on') || $lower === 'srcdoc') {
                $node->removeAttribute($name);
            }
        }

        if ($node->hasAttribute('href')) {
            $href = trim($node->getAttribute('href'));
            if (str_starts_with($href, '//')) {
                $href = 'https:' . $href;
            }
            if (!preg_match('~^(?:https://|/|\./|#)~i', $href)) {
                $node->removeAttribute('href');
            } else {
                $node->setAttribute('href', $href);
            }
        }
        if ($node->hasAttribute('src')) {
            $src = trim($node->getAttribute('src'));
            if (str_starts_with($src, '//')) {
                $src = 'https:' . $src;
            }
            if (!preg_match('~^https://upload\.wikimedia\.org/~i', $src)) {
                $node->removeAttribute('src');
            } else {
                $node->setAttribute('src', $src);
            }
        }
    }

    $root = $document->getElementById('vevit-wiki-root');
    if (!$root instanceof DOMElement) {
        return '';
    }
    $result = '';
    foreach ($root->childNodes as $child) {
        $result .= $document->saveHTML($child);
    }
    return $result;
}
