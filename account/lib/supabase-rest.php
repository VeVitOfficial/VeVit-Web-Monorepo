<?php
declare(strict_types=1);

/**
 * Minimal PostgREST wrapper. Requires PHP's cURL extension.
 * All query-string values must be pre-encoded by caller.
 */

function _sb_secret_key(array $cfg): string {
  $key = $cfg['SUPABASE_SECRET_KEY'] ?? $cfg['SUPABASE_SERVICE_ROLE'] ?? null;
  return is_string($key) ? $key : '';
}

function _sb_base_headers(array $cfg): array {
  $key = _sb_secret_key($cfg);
  $headers = [
    'apikey: ' . _sb_secret_key($cfg),
    'Content-Type: application/json',
    'Accept: application/json',
  ];
  // Přechod bez výpadku: legacy JWT vyžaduje Bearer, nový sb_secret_ jej nesmí dostat.
  if ($key !== '' && !str_starts_with($key, 'sb_secret_')) {
    $headers[] = 'Authorization: Bearer ' . $key;
  }
  return $headers;
}

function _sb_curl(string $method, string $url, array $headers, ?string $body = null): array {
  $ch = curl_init($url);
  $opts = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_CUSTOMREQUEST  => $method,
  ];
  if ($body !== null) $opts[CURLOPT_POSTFIELDS] = $body;
  curl_setopt_array($ch, $opts);
  $raw  = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err  = curl_error($ch);
  curl_close($ch);
  if ($err) return ['http' => 0, 'body' => null, 'error' => $err];
  return ['http' => $code, 'body' => $raw ?: ''];
}

function _sb_parse(array $res): array {
  if (isset($res['error'])) return ['error' => $res['error']];
  $code = $res['http'];
  $body = $res['body'];
  if ($code === 204) return ['data' => []];
  $decoded = json_decode((string)$body, true);
  if ($code < 200 || $code >= 300) {
    // PostgREST error: {"code":"23505","message":"...","details":"..."}
    $msg  = is_array($decoded) ? ($decoded['message'] ?? $body) : $body;
    $pgCode = is_array($decoded) ? ($decoded['code'] ?? '') : '';
    return ['error' => $msg, 'code' => $pgCode, 'http' => $code];
  }
  return ['data' => $decoded];
}

/**
 * SELECT from a table.
 * $eq: ['col' => 'value'] — all become AND eq conditions.
 */
function sb_get(array $cfg, string $table, array $eq = [], string $select = '*', ?int $limit = null): array {
  $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/' . rawurlencode($table);
  $qs   = ['select=' . rawurlencode($select)];
  foreach ($eq as $col => $val) {
    $qs[] = rawurlencode($col) . '=eq.' . rawurlencode((string)$val);
  }
  if ($limit !== null) $qs[] = 'limit=' . (int)$limit;
  $url  = $base . '?' . implode('&', $qs);
  $hdrs = _sb_base_headers($cfg);
  $res  = _sb_curl('GET', $url, $hdrs);
  return _sb_parse($res);
}

/**
 * INSERT a single row. Returns the inserted row (Prefer: return=representation).
 */
function sb_insert(array $cfg, string $table, array $row): array {
  $url  = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/' . rawurlencode($table);
  $hdrs = array_merge(_sb_base_headers($cfg), ['Prefer: return=representation']);
  $res  = _sb_curl('POST', $url, $hdrs, json_encode($row));
  $parsed = _sb_parse($res);
  if (isset($parsed['data']) && is_array($parsed['data']) && isset($parsed['data'][0])) {
    $parsed['data'] = $parsed['data'][0];
  }
  return $parsed;
}

/**
 * UPDATE rows matching $eq. Returns updated rows.
 */
function sb_update(array $cfg, string $table, array $eq, array $patch): array {
  $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/' . rawurlencode($table);
  $qs   = [];
  foreach ($eq as $col => $val) {
    $qs[] = rawurlencode($col) . '=eq.' . rawurlencode((string)$val);
  }
  $url  = $base . '?' . implode('&', $qs);
  $hdrs = array_merge(_sb_base_headers($cfg), ['Prefer: return=representation']);
  $res  = _sb_curl('PATCH', $url, $hdrs, json_encode($patch));
  return _sb_parse($res);
}

/**
 * DELETE rows matching $eq. Returns true on success.
 */
function sb_delete(array $cfg, string $table, array $eq): bool {
  $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/' . rawurlencode($table);
  $qs   = [];
  foreach ($eq as $col => $val) {
    $qs[] = rawurlencode($col) . '=eq.' . rawurlencode((string)$val);
  }
  $url = $base . '?' . implode('&', $qs);
  $res = _sb_curl('DELETE', $url, _sb_base_headers($cfg));
  return $res['http'] >= 200 && $res['http'] < 300;
}

/**
 * Call a Postgres RPC function.
 */
function sb_rpc(array $cfg, string $fn, array $args): array {
  $url = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/rpc/' . rawurlencode($fn);
  $res = _sb_curl('POST', $url, _sb_base_headers($cfg), json_encode($args));
  return _sb_parse($res);
}

/**
 * Convenience: fetch a single row by one equality condition, null if not found.
 * Returns ['data' => row] or ['error' => '...'].
 */
function sb_find_one(array $cfg, string $table, array $eq, string $select = '*'): array {
  $res = sb_get($cfg, $table, $eq, $select, 1);
  if (isset($res['error'])) return $res;
  $rows = $res['data'] ?? [];
  if (empty($rows)) return ['data' => null];
  return ['data' => $rows[0]];
}

/**
 * Count rows matching conditions (uses PostgREST HEAD + Prefer:count=exact).
 * Returns int or -1 on error.
 */
function sb_count(array $cfg, string $table, array $eq): int {
  $base = rtrim($cfg['SUPABASE_URL'], '/') . '/rest/v1/' . rawurlencode($table);
  $qs   = ['select=id'];
  foreach ($eq as $col => $val) {
    $qs[] = rawurlencode($col) . '=eq.' . rawurlencode((string)$val);
  }
  $url  = $base . '?' . implode('&', $qs);
  $hdrs = array_merge(_sb_base_headers($cfg), ['Prefer: count=exact']);
  $ch   = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_NOBODY         => true,  // HEAD
    CURLOPT_HTTPHEADER     => $hdrs,
    CURLOPT_TIMEOUT        => 10,
  ]);
  curl_exec($ch);
  $range = curl_getinfo($ch, CURLINFO_CONTENT_RANGE) ?: '';
  // Content-Range: 0-0/N — we need to read response headers differently
  // Use a simpler approach: GET with limit=0 and count header
  curl_close($ch);
  // Fallback: just get all and count
  $res = sb_get($cfg, $table, $eq, 'id', 1000);
  return isset($res['data']) ? count($res['data']) : -1;
}
