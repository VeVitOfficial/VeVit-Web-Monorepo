<?php
declare(strict_types=1);

/**
 * Progressive per-identifier throttle, independent of source IP. Complements
 * checkRateLimit() in auth-helpers.php: an attacker rotating IPs to
 * brute-force one account (or mail-bomb one victim's forgot-password
 * inbox) still accumulates a count against the identifier itself.
 *
 * Must behave identically whether or not the identifier maps to a real
 * account: callers key this purely off the normalized identifier value and
 * call it strictly before any lookup against the users table, so an
 * attacker cannot distinguish "wrong password" from "no such account" by
 * watching how — or whether — the backoff escalates.
 *
 * Escalation is tiered rather than a single flat threshold: a short burst
 * costs a short cooldown, sustained abuse against the same identifier costs
 * a much longer one — a graduated backoff instead of one fixed lockout.
 */

/** @return list<array{0:int,1:int}> [windowMinutes, maxAttemptsInWindow], ascending */
function identifierBackoffTiers(): array {
  return [
    [1, 2],
    [5, 4],
    [15, 7],
    [60, 12],
    [1440, 25],
  ];
}

function identifierBackoffHash(string $action, string $normalizedIdentifier): string {
  return hash('sha256', $action . ':' . $normalizedIdentifier);
}

/**
 * True while every tier's attempt budget still has room. Call BEFORE any
 * account lookup so real and non-existent identifiers are indistinguishable.
 *
 * Fetches once (the widest tier's window, capped at its attempt limit,
 * newest first) and buckets the result per tier in PHP — one round trip
 * regardless of tier count.
 */
function identifierBackoffAllowed(array $cfg, string $identifierHash, string $action): bool {
  $tiers = identifierBackoffTiers();
  $widestTier = end($tiers);
  [$widestWindowMinutes, $widestLimit] = $widestTier;

  $since = gmdate('Y-m-d\TH:i:s\Z', time() - ($widestWindowMinutes * 60));
  $result = _auth_filtered_get(
    $cfg,
    'login_attempts',
    [
      ['identifier_hash', 'eq', $identifierHash],
      ['action', 'eq', $action],
      ['attempt_time', 'gt', $since],
    ],
    'attempt_time',
    $widestLimit,
    'attempt_time.desc'
  );
  $rows = $result['data'] ?? null;
  if (!is_array($rows)) {
    return false;
  }

  foreach ($tiers as [$windowMinutes, $limit]) {
    $cutoff = gmdate('Y-m-d\TH:i:s\Z', time() - ($windowMinutes * 60));
    $count = 0;
    foreach ($rows as $row) {
      $attemptTime = is_array($row) ? ($row['attempt_time'] ?? null) : null;
      if (is_string($attemptTime) && $attemptTime > $cutoff) {
        $count++;
      }
    }
    if ($count >= $limit) {
      return false;
    }
  }

  return true;
}

/**
 * Record one attempt against the identifier. Stored as its own row (no
 * ip_address) under a dedicated action name, so it never inflates the
 * IP-scoped counters checkRateLimit() reads from the same table.
 */
function identifierBackoffRecord(array $cfg, string $identifierHash, string $action): void {
  $result = _auth_insert($cfg, 'login_attempts', [
    'identifier_hash' => $identifierHash,
    'action' => $action,
    'attempt_time' => gmdate('Y-m-d\TH:i:s\Z'),
  ]);
  if (!isset($result['data']) || !is_array($result['data'])) {
    jsonErr('Unable to process request', 503);
  }
}
