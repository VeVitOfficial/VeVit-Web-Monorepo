<?php
declare(strict_types=1);

/**
 * Honeypot + timing gate shared by login, register and forgot-password.
 *
 * The honeypot input is never display:none in the markup — it is kept out
 * of the visual layout via off-screen absolute positioning and out of
 * assistive tech via aria-hidden + tabindex="-1", so sighted and
 * screen-reader users never encounter it. A bot that blindly fills every
 * input in the DOM still fills it, which is what trips this check.
 *
 * The timing field is a soft signal only: an attacker who reads the client
 * JS can fabricate a plausible value when replaying the API directly. It
 * raises the bar for generic form-spam bots and unmodified browser
 * automation, not a targeted attacker — that is what the per-identifier
 * backoff in identifier-backoff.php is for.
 */

const HP_FIELD = 'hp_confirm';
const HP_TIMESTAMP_FIELD = 'hp_ts';
const HP_MIN_MILLIS = 800;
const HP_MAX_MILLIS = 6 * 3600 * 1000;

function hpHoneypotPassed(array $body): bool {
  $value = $body[HP_FIELD] ?? '';
  return $value === '';
}

function hpTimingPassed(array $body): bool {
  $raw = $body[HP_TIMESTAMP_FIELD] ?? null;
  if (!is_int($raw) && !is_float($raw)) {
    return false;
  }

  $renderedAt = (int) $raw;
  if ($renderedAt <= 0) {
    return false;
  }

  $elapsed = (int) round(microtime(true) * 1000) - $renderedAt;
  return $elapsed >= HP_MIN_MILLIS && $elapsed <= HP_MAX_MILLIS;
}

function hpAntiBotPassed(array $body): bool {
  return hpHoneypotPassed($body) && hpTimingPassed($body);
}

/**
 * Reject a request that fails the honeypot/timing gate. Reuses the IP
 * rate-limit's own status code and message so a bot cannot distinguish
 * "detected as a bot" from "rate limited" by watching the response.
 */
function hpRequireAntiBotPassed(array $body): void {
  if (!hpAntiBotPassed($body)) {
    jsonErr('Příliš mnoho pokusů. Zkuste to za chvíli.', 429);
  }
}
