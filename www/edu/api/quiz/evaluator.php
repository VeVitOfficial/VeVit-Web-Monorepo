<?php
declare(strict_types=1);

function quiz_eval_result(?bool $correct, float $scorePct, array $detail = [], bool $valid = true): array {
  return ['valid' => $valid, 'correct' => $correct, 'scorePct' => max(0, min(100, (int) round($scorePct))), 'detail' => $detail];
}
function quiz_eval_indices(mixed $value): array {
  if (!is_array($value)) return [];
  return array_values(array_unique(array_filter(array_map(static fn($x) => is_numeric($x) ? (int) $x : null, $value), static fn($x) => $x !== null)));
}
function quiz_eval_set_score(array $actual, array $expected): float {
  $actual = array_unique($actual); $expected = array_unique($expected);
  $intersection = count(array_intersect($actual, $expected));
  $union = count(array_unique(array_merge($actual, $expected)));
  return $union === 0 ? 100 : $intersection / $union * 100;
}
function quiz_evaluate_question(array $answer, array $question): array {
  $payload = is_array($question['payload'] ?? null) ? $question['payload'] : [];
  $type = $question['type'] ?? '';
  if ($type === 'mcq') {
    $index = isset($answer['optionIndex']) ? (int) $answer['optionIndex'] : -1; $option = $payload['options'][$index] ?? null;
    return quiz_eval_result(is_array($option) && ($option['correct'] ?? false) === true, is_array($option) && ($option['correct'] ?? false) === true ? 100 : 0);
  }
  if ($type === 'multi') {
    $actual = quiz_eval_indices($answer['optionIndices'] ?? []); $expected = [];
    foreach (($payload['options'] ?? []) as $index => $option) if (($option['correct'] ?? false) === true) $expected[] = $index;
    $score = ($payload['partialCredit'] ?? '') === 'jaccard' ? quiz_eval_set_score($actual, $expected) : (count($actual) === count($expected) && !array_diff($actual, $expected) ? 100 : 0);
    return quiz_eval_result($score >= 100, $score);
  }
  if ($type === 'truefalse_rapid') {
    $items = $payload['statements'] ?? []; $answers = $answer['answers'] ?? []; if (!is_array($items) || !$items) return quiz_eval_result(false, 0);
    $correct = 0; foreach ($items as $index => $item) if (($answers[$index] ?? null) === ($item['answer'] ?? null)) $correct++;
    $score = $correct / count($items) * 100; return quiz_eval_result($score >= 100, $score, ['correctCount' => $correct]);
  }
  if ($type === 'sort_buckets') {
    $items = $payload['items'] ?? []; $assignments = is_array($answer['assignments'] ?? null) ? $answer['assignments'] : []; if (!$items) return quiz_eval_result(false, 0);
    $correct = 0; foreach ($items as $index => $item) if (($assignments[(string) $index] ?? $assignments[$index] ?? null) === ($item['correct'] ?? null)) $correct++;
    $score = $correct / count($items) * 100; return quiz_eval_result($score >= 100, $score);
  }
  if ($type === 'order') {
    if (is_array($answer['orderItems'] ?? null)) {
      $orderItems = array_map('strval', array_values($answer['orderItems']));
      $items = array_map('strval', array_values($payload['items'] ?? []));
      if (!$items || count($orderItems) !== count($items)) return quiz_eval_result(false, 0);
      $positions = []; foreach ($orderItems as $item) { $position = array_search($item, $items, true); if ($position === false) return quiz_eval_result(false, 0); $positions[] = $position; }
      if (($payload['scoring'] ?? 'exact') === 'kendall') { $good = 0; $total = 0; foreach ($positions as $i => $left) foreach (array_slice($positions, $i + 1) as $right) { $total++; if ($left < $right) $good++; } $score = $total ? $good / $total * 100 : 100; }
      else { $correct = 0; foreach ($orderItems as $index => $value) if (($items[$index] ?? null) === $value) $correct++; $score = $correct / count($items) * 100; }
      return quiz_eval_result($score >= 100, $score);
    }
    $order = quiz_eval_indices($answer['order'] ?? []); $items = $payload['items'] ?? []; if (count($order) !== count($items) || !$items) return quiz_eval_result(false, 0);
    if (($payload['scoring'] ?? 'exact') === 'kendall') { $good = 0; $total = 0; foreach ($order as $i => $left) foreach (array_slice($order, $i + 1) as $right) { $total++; if ($left < $right) $good++; } $score = $total ? $good / $total * 100 : 100; }
    else { $correct = 0; foreach ($order as $index => $value) if ($index === $value) $correct++; $score = $correct / count($items) * 100; }
    return quiz_eval_result($score >= 100, $score);
  }
  if ($type === 'match') {
    $pairs = $payload['pairs'] ?? []; $matches = is_array($answer['matches'] ?? null) ? $answer['matches'] : []; if (!$pairs) return quiz_eval_result(false, 0);
    $correct = 0; foreach ($pairs as $index => $pair) { $value = $matches[(string) $index] ?? $matches[$index] ?? null; if ((is_string($value) && $value === ($pair['right'] ?? null)) || (!is_string($value) && (int)$value === $index)) $correct++; }
    $score = $correct / count($pairs) * 100; return quiz_eval_result($score >= 100, $score);
  }
  if ($type === 'slider') { $value = $answer['value'] ?? null; if (!is_numeric($value)) return quiz_eval_result(false, 0); $correct = abs((float)$value - (float)($payload['correctValue'] ?? 0)) <= (float)($payload['tolerance'] ?? 0); return quiz_eval_result($correct, $correct ? 100 : 0); }
  if ($type === 'hotspot' || $type === 'hallucination_hunt') {
    $key = $type === 'hotspot' ? 'correct' : 'isFalse'; $items = $payload['text']['spans'] ?? $payload['regions'] ?? []; $expected = []; foreach ($items as $index => $item) if (($item[$key] ?? false) === true) $expected[] = $index;
    $score = quiz_eval_set_score(quiz_eval_indices($answer['selected'] ?? []), $expected); return quiz_eval_result($score >= 100, $score);
  }
  if ($type === 'blind_test') { $items = $payload['items'] ?? []; $sources = $answer['sources'] ?? []; if (!$items) return quiz_eval_result(false, 0); $correct = 0; foreach ($items as $index => $item) if (($sources[$index] ?? null) === ($item['source'] ?? null)) $correct++; $score = $correct / count($items) * 100; return quiz_eval_result($score >= 100, $score); }
  if ($type === 'wager') {
    if (is_array($payload['rounds'] ?? null)) {
      $answers = is_array($answer['rounds'] ?? null) ? $answer['rounds'] : [];
      if (count($answers) !== count($payload['rounds'])) return quiz_eval_result(false, 0, ['error' => 'Dokonči všech šest sázek.'], false);
      $details = []; $correct = 0; $wagerXp = 0;
      foreach ($payload['rounds'] as $index => $round) {
        $stake = (int)($answers[$index]['stake'] ?? 0);
        if (!in_array($stake, [5, 15, 30], true) || !in_array($stake, $payload['stakes'] ?? [], true)) return quiz_eval_result(false, 0, ['error' => 'Neplatná sázka.'], false);
        $inner = quiz_evaluate_question(is_array($answers[$index]['answer'] ?? null) ? $answers[$index]['answer'] : [], ['type' => $round['type'] ?? '', 'payload' => $round['payload'] ?? []]);
        if (($inner['valid'] ?? false) !== true) return quiz_eval_result(false, 0, ['error' => 'Některá sázka není platná.'], false);
        $isCorrect = ($inner['correct'] ?? false) === true; if ($isCorrect) $correct++;
        $delta = $isCorrect ? $stake : -$stake; $wagerXp += $delta; $details[] = ['correct' => $isCorrect, 'stake' => $stake, 'wagerXp' => $delta];
      }
      $score = count($details) ? $correct / count($details) * 100 : 0;
      return quiz_eval_result($correct === count($details), $score, ['rounds' => $details, 'correctCount' => $correct, 'wagerXp' => $wagerXp]);
    }
    $stake = (int)($answer['stake'] ?? 0); if (!in_array($stake, [5, 15, 30], true) || !in_array($stake, $payload['stakes'] ?? [], true)) return quiz_eval_result(false, 0, ['error' => 'Neplatná sázka.'], false); $inner = quiz_evaluate_question(is_array($answer['answer'] ?? null) ? $answer['answer'] : [], ['type' => $payload['inner']['type'] ?? '', 'payload' => $payload['inner']['payload'] ?? []]); $inner['detail']['stake'] = $stake; $inner['detail']['wagerXp'] = $inner['correct'] === true ? $stake : -$stake; return $inner;
  }
  if ($type === 'poll') { $index = isset($answer['optionIndex']) ? (int)$answer['optionIndex'] : -1; $reason = trim((string)($answer['reason'] ?? '')); $valid = array_key_exists($index, $payload['options'] ?? []) && strlen($reason) >= 3; return $valid ? quiz_eval_result(null, 100) : quiz_eval_result(null, 0, ['error' => 'Doplň volbu a krátké odůvodnění.'], false); }
  if ($type === 'branching') {
    $ending = $answer['ending'] ?? null;
    $valid = is_string($ending) && in_array($ending, $payload['endings'] ?? [], true);
    if (!$valid) return quiz_eval_result(false, 0, ['error' => 'Scénář ještě není dokončený.'], false);
    $correctEndings = is_array($payload['correctEndings'] ?? null) ? $payload['correctEndings'] : ($payload['endings'] ?? []);
    $correct = in_array($ending, $correctEndings, true);
    return quiz_eval_result($correct, $correct ? 100 : 0, ['ending' => $ending]);
  }
  if ($type === 'prompt_lab' || $type === 'open_rubric') {
    $text = trim((string)($answer['text'] ?? '')); $minimum = (int)($payload[$type === 'prompt_lab' ? 'minChars' : 'minWords'] ?? 1);
    $length = $type === 'prompt_lab' ? strlen($text) : count(preg_split('/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY));
    if ($length < $minimum) return quiz_eval_result(null, 0, ['error' => 'Odpověď je příliš krátká.'], false);
    $rubric = is_array($payload['rubric'] ?? null) ? array_values($payload['rubric']) : [];
    $scores = is_array($answer['selfScores'] ?? null) ? array_values($answer['selfScores']) : [];
    $validScores = count($rubric) > 0 && count($scores) === count($rubric);
    foreach ($scores as $score) if (!is_int($score) || $score < 0 || $score > 5) $validScores = false;
    if (!$validScores) return quiz_eval_result(null, 0, ['error' => 'Vyplň sebehodnocení 0–5 u všech kritérií.'], false);
    $selfScorePct = array_sum($scores) / (count($rubric) * 5) * 100;
    return quiz_eval_result(null, 100, ['selfScores' => $scores, 'selfScorePct' => $selfScorePct]);
  }
  if ($type === 'microtask') { $hasText = trim((string)($answer['text'] ?? '')) !== ''; $valid = ($answer['confirmed'] ?? false) === true && (($payload['proof'] ?? 'none') !== 'text' || $hasText); return $valid ? quiz_eval_result(null, 100) : quiz_eval_result(null, 0, ['error' => 'Dokonči mikro-úkol.'], false); }
  return quiz_eval_result(false, 0, ['error' => 'Nepodporovaný typ otázky.'], false);
}
