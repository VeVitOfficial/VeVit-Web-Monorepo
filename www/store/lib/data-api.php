<?php
declare(strict_types=1);

final class StoreDataApiException extends RuntimeException
{
}

final class StoreDataApi
{
    /** @var null|Closure(string,string,array<int,string>,?string):array{status:int,headers:array<string,string>,body:string} */
    private readonly ?Closure $transport;

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $secretKey,
        ?callable $transport = null,
    ) {
        $this->transport = $transport === null ? null : Closure::fromCallable($transport);
    }

    /** @return array<int, array<string, mixed>> */
    public function select(string $table, array $query = []): array
    {
        if (preg_match('/^[a-z][a-z0-9_]*$/', $table) !== 1) {
            throw new InvalidArgumentException('Invalid Data API table name.');
        }

        $url = rtrim($this->baseUrl, '/') . '/rest/v1/' . $table;
        if ($query !== []) {
            $url .= '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
        }

        $response = $this->request('GET', $url, null);
        try {
            $decoded = json_decode($response['body'], true, 64, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new StoreDataApiException('Data API returned invalid JSON.', 0, $exception);
        }
        if (!is_array($decoded) || !array_is_list($decoded)) {
            throw new StoreDataApiException('Data API returned an invalid collection.');
        }

        return $decoded;
    }

    /** @return array{status:int,headers:array<string,string>,body:string} */
    private function request(string $method, string $url, ?string $body): array
    {
        $headers = [
            'apikey: ' . $this->secretKey,
            'Accept: application/json',
        ];

        if ($this->transport !== null) {
            $response = ($this->transport)($method, $url, $headers, $body);
        } else {
            $curl = curl_init($url);
            curl_setopt_array($curl, [
                CURLOPT_CUSTOMREQUEST => $method,
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HEADER => true,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_TIMEOUT => 15,
            ]);
            if ($body !== null) {
                curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
            }
            $raw = curl_exec($curl);
            if (!is_string($raw)) {
                throw new StoreDataApiException('Data API is unavailable: ' . curl_error($curl));
            }
            $headerSize = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
            $response = [
                'status' => curl_getinfo($curl, CURLINFO_RESPONSE_CODE),
                'headers' => [],
                'body' => substr($raw, $headerSize),
            ];
        }

        if ($response['status'] < 200 || $response['status'] >= 300) {
            throw new StoreDataApiException('Data API request failed with HTTP ' . $response['status'] . '.');
        }

        return $response;
    }
}
