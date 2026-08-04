<?php
// Simple Stripe API wrapper (no Composer)

class Stripe {
    private static string $sk = '';

    public static function setApiKey(string $key): void {
        self::$sk = $key;
    }

    public static function request(string $method, string $endpoint, array $params = [], ?string $idempotencyKey = null): array {
        $url = 'https://api.stripe.com/v1/' . ltrim($endpoint, '/');
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
        curl_setopt($ch, CURLOPT_USERPWD, self::$sk . ':');
        $headers = ['Content-Type: application/x-www-form-urlencoded'];
        if ($idempotencyKey !== null) $headers[] = 'Idempotency-Key: ' . $idempotencyKey;
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        if ($params) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        }
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = $resp === false ? curl_error($ch) : null;
        curl_close($ch);
        return ['code' => $code, 'body' => json_decode((string)$resp, true) ?? [], 'error' => $error];
    }
}
