<?php
declare(strict_types=1);
final class StripeWebhookVerifier {
 public static function verify(string $payload, string $header, string $secret, int $now): bool {
  if ($secret === '' || $header === '') return false; $timestamp = null; $signatures=[];
  foreach (explode(',', $header) as $part) { $kv=explode('=',trim($part),2); if(count($kv)!==2) continue; if($kv[0]==='t') $timestamp=$kv[1]; if($kv[0]==='v1') $signatures[]=$kv[1]; }
  if (!is_string($timestamp) || !ctype_digit($timestamp) || abs($now-(int)$timestamp)>300) return false;
  $expected=hash_hmac('sha256',$timestamp.'.'.$payload,$secret); foreach($signatures as $signature) if(hash_equals($expected,$signature)) return true; return false;
 }
}
