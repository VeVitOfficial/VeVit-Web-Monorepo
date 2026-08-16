<?php
declare(strict_types=1);

/**
 * Deterministicky změní pořadí veřejných voleb, ale nikdy je nenechá v
 * kanonickém pořadí, které server používá jako klíč odpovědi.
 *
 * @param list<mixed> $items
 * @return list<mixed>
 */
function quiz_public_rotate(array $items, string $seed): array {
  $items = array_values($items);
  $count = count($items);
  if ($count < 2) return $items;
  $offset = 1 + (hexdec(substr(hash('sha256', $seed), 0, 8)) % ($count - 1));
  return array_values(array_merge(array_slice($items, $offset), array_slice($items, 0, $offset)));
}

/**
 * Vytvoří browserový tvar otázky bez klíče správné odpovědi.
 */
function quiz_public_question(array $question): array {
  $payload = is_array($question['payload'] ?? null) ? $question['payload'] : [];
  $type = (string)($question['type'] ?? '');
  $id = (string)($question['id'] ?? $type);

  if ($type === 'order' && is_array($payload['items'] ?? null)) {
    $payload['items'] = quiz_public_rotate($payload['items'], $id . ':order');
  }

  if ($type === 'match' && is_array($payload['pairs'] ?? null)) {
    $rights = [];
    $publicPairs = [];
    foreach ($payload['pairs'] as $pair) {
      if (!is_array($pair)) continue;
      $publicPairs[] = ['left' => (string)($pair['left'] ?? '')];
      if (array_key_exists('right', $pair)) $rights[] = (string)$pair['right'];
    }
    foreach (($payload['distractorsRight'] ?? []) as $right) $rights[] = (string)$right;
    $payload['pairs'] = $publicPairs;
    $payload['rightOptions'] = quiz_public_rotate($rights, $id . ':match');
    unset($payload['distractorsRight']);
  }

  if ($type === 'branching') unset($payload['correctEndings']);

  $strip = static function (mixed $value) use (&$strip): mixed {
    if (!is_array($value)) return $value;
    $result = [];
    foreach ($value as $key => $item) {
      if (in_array((string)$key, ['correct', 'answer', 'isFalse', 'source', 'correctValue'], true)) continue;
      $result[$key] = $strip($item);
    }
    return $result;
  };

  $question['payload'] = $strip($payload);
  $question['serverEvaluated'] = true;
  return $question;
}
