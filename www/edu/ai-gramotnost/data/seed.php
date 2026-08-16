<?php
// Seeder – naplní DB kurzem AI Gramotnost (36 lekcí, 108+ cvičení, 10 achievementů).
// Spusť jednorázově:  php data/seed.php   (nebo navštív /data/seed.php).
// ⚙️  Nejprve: 1) vyplň DB údaje v api/config.php  2) naimportuj data/schema.sql
require_once __DIR__ . '/content.php';      // buildery + $ACHS + $CHAPTERS + $LESSONS
require_once __DIR__ . '/../api/config.php';
$pdo = db();
if (DB_NAME === 'YOUR_DB_NAME') { http_response_code(500); echo json_encode(['error' => 'Vyplň DB údaje v api/config.php']); exit; }
header('Content-Type: text/plain; charset=utf-8');

$pdo->beginTransaction();
foreach (['user_achievements','xp_history','exercise_submissions','user_progress','exercises','lessons','chapters','courses','achievements'] as $tb) $pdo->exec("DELETE FROM `$tb`");

// Achievementy
foreach ($ACHS as $a) $pdo->prepare("INSERT INTO achievements (name,description,icon,condition_type,condition_value,xp_reward) VALUES (?,?,?,?,?,?)")->execute($a);

// Kurz
$pdo->prepare("INSERT INTO courses (slug,title,description,icon,color,total_xp,estimated_hours,difficulty) VALUES (?,?,?,?,?,?,?,?)")
    ->execute(['ai-gramotnost','AI Gramotnost','Kompletní kurz AI gramotnosti – od základů po pokročilé techniky prompt engineeringu a integrace AI nástrojů.','brain','#10B981',0,20,'beginner']);
$courseId = (int)$pdo->lastInsertId();

// Kapitoly
$chId = [];
foreach ($CHAPTERS as $i => $c) {
  $pdo->prepare("INSERT INTO chapters (course_id,sort_order,title,description) VALUES (?,?,?,?)")->execute([$courseId, $i, $c[0], $c[1]]);
  $chId[$i] = (int)$pdo->lastInsertId();
}

// Lekce + cvičení
$lessonCount = 0; $exCount = 0;
$insL = $pdo->prepare("INSERT INTO lessons (chapter_id,sort_order,title,slug,description,content,duration,xp_reward) VALUES (?,?,?,?,?,?,?,?)");
$insE = $pdo->prepare("INSERT INTO exercises (lesson_id,sort_order,title,type,prompt,config,correct_answer,explanation,xp_reward) VALUES (?,?,?,?,?,?,?,?,?)");
foreach ($LESSONS as $L) {
  [$ch, $sort, $title, $slug, $dur, $xp, $content, $exs] = $L;
  $desc = trim(strip_tags(mb_substr($content, 0, 160)));
  $insL->execute([$chId[$ch], $sort, $title, $slug, $desc, $content, $dur, $xp]);
  $lessonId = (int)$pdo->lastInsertId();
  $lessonCount++;
  foreach ($exs as $i => $ex) {
    $insE->execute([$lessonId, $i + 1, $ex['title'], $ex['type'], $ex['prompt'], json_encode($ex['config'], JSON_UNESCAPED_UNICODE), json_encode($ex['correct_answer'], JSON_UNESCAPED_UNICODE), $ex['explanation'], $ex['xp']]);
    $exCount++;
  }
}
$pdo->prepare("UPDATE courses SET total_xp=(SELECT COALESCE(SUM(xp_reward),0) FROM lessons l JOIN chapters ch ON ch.id=l.chapter_id WHERE ch.course_id=?) WHERE id=?")->execute([$courseId, $courseId]);

$pdo->commit();
echo "OK: seeded $lessonCount lessons, $exCount exercises, " . count($ACHS) . " achievements.\n";
echo "Next: vytvoř uživatele přes registrační formulář (první uživatel se stane adminem).\n";
