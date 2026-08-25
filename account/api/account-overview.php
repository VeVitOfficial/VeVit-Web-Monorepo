<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/auth-helpers.php';

/**
 * Calculate profile completion from user-editable profile fields.
 *
 * @return array{completion:int, missing:list<string>}
 */
function account_overview_profile(array $user): array {
  $fields = [
    'full_name' => 'jméno a příjmení',
    'nickname' => 'přezdívka',
    'bio' => 'bio',
    'location' => 'lokalita',
    'birth_date' => 'datum narození',
    'avatar_url' => 'profilová fotografie',
  ];
  $missing = [];
  foreach ($fields as $field => $label) {
    $value = $user[$field] ?? null;
    if (!is_string($value) || trim($value) === '') {
      $missing[] = $label;
    }
  }

  $present = count($fields) - count($missing);
  return [
    'completion' => (int) round(($present / count($fields)) * 100),
    'missing' => $missing,
  ];
}

/**
 * Return the security summary without exposing session records.
 *
 * @param list<array<string,mixed>> $sessions
 * @param list<array<string,mixed>> $activities
 * @return array{two_factor_enabled:bool, active_sessions:int, last_password_change:?string}
 */
function account_overview_security(
  array $user,
  array $sessions,
  array $activities
): array {
  $lastPasswordChange = null;
  foreach ($activities as $activity) {
    if (($activity['kind'] ?? null) !== 'password_change') {
      continue;
    }
    $createdAt = $activity['created_at'] ?? null;
    if (
      is_string($createdAt)
      && ($lastPasswordChange === null || strcmp($createdAt, $lastPasswordChange) > 0)
    ) {
      $lastPasswordChange = $createdAt;
    }
  }

  return [
    'two_factor_enabled' => ($user['two_factor_enabled'] ?? false) === true,
    'active_sessions' => count($sessions),
    'last_password_change' => $lastPasswordChange,
  ];
}

function account_overview_bounded_text(string $value, int $maxBytes): string {
  if (strlen($value) <= $maxBytes) {
    return $value;
  }

  $bounded = substr($value, 0, $maxBytes);
  while ($bounded !== '' && preg_match('//u', $bounded) !== 1) {
    $bounded = substr($bounded, 0, -1);
  }
  return $bounded;
}

/**
 * Normalize and bound account activity for browser display.
 *
 * @param list<array<string,mixed>> $rows
 * @return list<array{kind:string, detail:string, created_at:string}>
 */
function account_overview_activity(array $rows): array {
  usort($rows, static function (array $left, array $right): int {
    return strcmp(
      (string) ($right['created_at'] ?? ''),
      (string) ($left['created_at'] ?? '')
    );
  });

  $safe = [];
  foreach (array_slice($rows, 0, 8) as $row) {
    $kind = $row['kind'] ?? null;
    $createdAt = $row['created_at'] ?? null;
    if (!is_string($kind) || $kind === '' || !is_string($createdAt) || $createdAt === '') {
      continue;
    }
    $detail = is_string($row['detail'] ?? null) ? trim($row['detail']) : '';
    $detail = preg_replace('/\b(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}\b/', '$1.$2.*.*', $detail) ?? '';
    $safe[] = [
      'kind' => account_overview_bounded_text($kind, 40),
      'detail' => account_overview_bounded_text($detail, 160),
      'created_at' => $createdAt,
    ];
  }
  return $safe;
}

function account_overview_run(array $cfg): never {
  beginJson($cfg);
  if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    jsonErr('Method not allowed', 405);
  }

  $user = requireAuth($cfg);
  $errors = [];

  $sessionResult = _auth_filtered_get(
    $cfg,
    'sessions',
    [
      ['user_id', 'eq', (string) $user['id']],
      ['expires_at', 'gt', gmdate('Y-m-d\TH:i:s\Z')],
    ],
    'id,created_at,expires_at',
    100
  );
  $sessions = $sessionResult['data'] ?? [];
  if (!is_array($sessions) || isset($sessionResult['error'])) {
    $sessions = [];
    $errors['security'] = 'Bezpečnostní souhrn není právě dostupný.';
  }

  $activityResult = _auth_filtered_get(
    $cfg,
    'account_activity',
    [['user_id', 'eq', (string) $user['id']]],
    'kind,detail,created_at',
    100
  );
  $activityRows = $activityResult['data'] ?? [];
  if (!is_array($activityRows) || isset($activityResult['error'])) {
    $activityRows = [];
    $errors['activity'] = 'Aktivitu účtu se nepodařilo načíst.';
  }

  jsonOk([
    'profile' => account_overview_profile($user),
    'security' => account_overview_security($user, $sessions, $activityRows),
    'activity' => account_overview_activity($activityRows),
    'errors' => $errors,
  ]);
}

if (!defined('ACCOUNT_OVERVIEW_NO_MAIN')) {
  account_overview_run(auth_load_config());
}
