<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/../data/content.php';
$pdo = dbOrNull(); $action = $_GET['action'] ?? '';

if ($action === 'list') {
  $lessonId = (int)($_GET['lesson_id'] ?? 0); $list = [];
  if ($pdo) {
    try {
      $st = $pdo->prepare("SELECT id, sort_order, title, type, prompt, config, explanation, xp_reward FROM exercises WHERE lesson_id=? ORDER BY sort_order, id");
      $st->execute([$lessonId]); $list = array_map(function ($e) { $e['config'] = json_decode($e['config'], true); return $e; }, $st->fetchAll());
    } catch (Throwable $e) {}
  }
  if (!$list) $list = contentExercisesByLesson($lessonId);
  jsonResponse($list);
}

if ($action === 'submit') {
  $d = input(); $exId = (int)($d['exercise_id'] ?? 0); $answer = $d['answer'] ?? [];
  $ex = null;
  if ($pdo) { try { $st = $pdo->prepare("SELECT * FROM exercises WHERE id=?"); $st->execute([$exId]); $ex = $st->fetch(); } catch (Throwable $e) {} }
  if ($ex) {
    $correct = json_decode($ex['correct_answer'], true);
    $cfg = $ex['config'] ? json_decode($ex['config'], true) : [];
    $xpReward = (int)$ex['xp_reward'];
  } else {
    $ex = contentExercise($exId);
    if (!$ex) jsonResponse(['error' => 'Cvičení nenalezeno'], 404);
    $correct = $ex['correct_answer']; $cfg = $ex['config']; $xpReward = (int)$ex['xp_reward'];
  }
  $r = evaluateExercise($ex['type'] ?? 'multiple_choice', $answer, $correct, $cfg);
  jsonResponse(['is_correct' => $r['is_correct'], 'score' => $r['score'], 'feedback' => $r['feedback'], 'correct_answer' => $correct, 'xp_reward' => $xpReward]);
}

jsonResponse(['error' => 'Unknown action'], 404);

function evaluateExercise($type, $answer, $correct, $config) {
  $answer = $answer ?: []; $correct = $correct ?: [];
  switch ($type) {
    case 'multiple_choice': case 'true_false': {
      $sel = array_map('strval', (array)($answer['selectedIds'] ?? []));
      $cor = array_map('strval', (array)($correct['correctIds'] ?? []));
      sort($sel); sort($cor); $ok = $sel == $cor;
      return ['is_correct' => $ok, 'score' => $ok ? 100 : 0, 'feedback' => $ok ? 'Správná volba.' : 'Odpověď není správná.'];
    }
    case 'fill_blank': {
      $vals = array_map('trim', array_map('strtolower', (array)($answer['values'] ?? [])));
      $ans = array_map('trim', array_map('strtolower', (array)($correct['answers'] ?? [])));
      $match = 0; $total = max(count($ans), count($vals), 1);
      for ($i = 0; $i < $total; $i++) if (($vals[$i] ?? '') === ($ans[$i] ?? '')) $match++;
      $ok = $match === $total;
      return ['is_correct' => $ok, 'score' => (int)round($match / $total * 100), 'feedback' => $ok ? 'Vše vyplněno správně.' : "Správně $match z $total."];
    }
    case 'sorting': {
      $order = array_map('strval', (array)($answer['order'] ?? []));
      $cor = array_map('strval', (array)($correct['order'] ?? []));
      $ok = $order == $cor;
      return ['is_correct' => $ok, 'score' => $ok ? 100 : 0, 'feedback' => $ok ? 'Správné pořadí.' : 'Pořadí nesouhlasí.'];
    }
    case 'matching': {
      $pairs = $answer['pairs'] ?? []; $corPairs = $correct['pairs'] ?? [];
      $match = 0; $total = max(count($corPairs), count($pairs), 1);
      foreach ($pairs as $p) foreach ($corPairs as $c) if (strval($c['leftId']) === strval($p['leftId']) && strval($c['rightId']) === strval($p['rightId'])) { $match++; break; }
      $ok = $match === $total;
      return ['is_correct' => $ok, 'score' => (int)round($match / $total * 100), 'feedback' => $ok ? 'Vše spárováno správně.' : "Správně $match z $total párování."];
    }
    case 'drag_drop': {
      $pl = (array)($answer['placements'] ?? []); $cor = (array)($correct['placements'] ?? []);
      $match = 0; $total = max(count($cor), count($pl), 1);
      foreach ($pl as $id => $zone) if (isset($cor[$id]) && strval($cor[$id]) === strval($zone)) $match++;
      $ok = $match === $total;
      return ['is_correct' => $ok, 'score' => (int)round($match / $total * 100), 'feedback' => $ok ? 'Vše umístěno správně.' : "Správně $match z $total."];
    }
    case 'prompt_builder': {
      $order = array_map('strval', (array)($answer['order'] ?? []));
      $cor = array_map('strval', (array)($correct['order'] ?? []));
      $ok = $order == $cor;
      return ['is_correct' => $ok, 'score' => $ok ? 100 : 40, 'feedback' => $ok ? 'Perfektní struktura promptu.' : 'Struktura nesouhlasí – zkontroluj pořadí bloků.'];
    }
    case 'code_playground': {
      $code = strtolower((string)($answer['code'] ?? '')); $kws = array_map('strtolower', (array)($correct['keywords'] ?? []));
      $out = (string)($answer['output'] ?? ''); $hit = 0;
      foreach ($kws as $k) if ($k && strpos($code, $k) !== false) $hit++;
      $kwOk = count($kws) ? $hit === count($kws) : true;
      $outOk = !empty($correct['expectedOutput']) ? (trim($out) === trim($correct['expectedOutput'])) : true;
      $ok = $kwOk && $outOk; $score = ($kwOk ? 60 : $hit * 60 / max(count($kws), 1)) + ($outOk ? 40 : 0);
      return ['is_correct' => $ok, 'score' => (int)round($score), 'feedback' => $ok ? 'Kód splňuje požadavky.' : 'Kód neobsahuje všechny očekávané konstrukce.'];
    }
    case 'simulation': {
      $ok = !empty($answer['won']);
      return ['is_correct' => $ok, 'score' => $ok ? 100 : 0, 'feedback' => $ok ? 'Cíl simulace dosažen!' : 'Cíl nedosáhnut – zkus jiný přístup.'];
    }
    case 'open_response': {
      $txt = strtolower((string)($answer['text'] ?? '')); $kws = array_map('strtolower', (array)($correct['keywords'] ?? $config['keywords'] ?? []));
      $hit = 0; foreach ($kws as $k) if ($k && strpos($txt, $k) !== false) $hit++;
      $need = max(count($kws), 1); $score = (int)round($hit / $need * 100); $ok = $score >= 70;
      return ['is_correct' => $ok, 'score' => $score, 'feedback' => "Nalezeno $hit z $need klíčových prvků."];
    }
  }
  return ['is_correct' => false, 'score' => 0, 'feedback' => 'Neznámý typ cvičení.'];
}
