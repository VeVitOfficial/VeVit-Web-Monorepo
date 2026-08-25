<?php
declare(strict_types=1);

const HUB_ROOT = __DIR__ . '/../..';
const HUB_REQUIREMENT_KEYS = ['browser_features', 'local_assets', 'php_extensions', 'external_services', 'hosting_constraints'];
const HUB_VERIFIED_LEVELS = ['none', 'structural', 'browser_smoke', 'happy_path'];

function hub_fail(string $message): never {
    fwrite(STDERR, "FAIL: {$message}\n");
    exit(1);
}

function hub_assert(bool $condition, string $message): void {
    if (!$condition) hub_fail($message);
}

function hub_json(string $path): array {
    try {
        $value = json_decode((string)file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    } catch (Throwable $error) {
        hub_fail('invalid JSON ' . $path . ': ' . $error->getMessage());
    }
    hub_assert(is_array($value), 'JSON root must be an object: ' . $path);
    return $value;
}

function hub_baseline(): array {
    return require __DIR__ . '/baseline.php';
}

function hub_command(array $command, ?string &$output = null): int {
    $descriptors = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    $process = proc_open($command, $descriptors, $pipes, HUB_ROOT);
    if (!is_resource($process)) hub_fail('cannot start command');
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]); fclose($pipes[2]);
    $status = proc_close($process);
    $output = $stdout . $stderr;
    return $status;
}

function hub_free_port(): int {
    $socket = stream_socket_server('tcp://127.0.0.1:0', $errno, $error);
    if ($socket === false) hub_fail('cannot reserve test port: ' . $error);
    $name = (string)stream_socket_get_name($socket, false);
    fclose($socket);
    return (int)substr(strrchr($name, ':'), 1);
}

function hub_http(string $url): array {
    $context = stream_context_create(['http' => ['ignore_errors' => true, 'timeout' => 5]]);
    $body = @file_get_contents($url, false, $context);
    $headers = $http_response_header ?? [];
    $status = 0;
    foreach ($headers as $header) {
        if (preg_match('#^HTTP/\\S+\\s+(\\d{3})#', $header, $match)) $status = (int)$match[1];
    }
    return ['status' => $status, 'body' => is_string($body) ? $body : '', 'headers' => $headers];
}

function hub_start_server(): array {
    $port = hub_free_port();
    $descriptors = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    $process = proc_open([PHP_BINARY, '-S', '127.0.0.1:' . $port, 'router.php'], $descriptors, $pipes, HUB_ROOT);
    if (!is_resource($process)) hub_fail('cannot start PHP test server');
    fclose($pipes[0]);
    $url = 'http://127.0.0.1:' . $port;
    for ($attempt = 0; $attempt < 30; $attempt++) {
        if (hub_http($url . '/')['status'] === 200) return [$process, $pipes, $url];
        usleep(100000);
    }
    $stderr = stream_get_contents($pipes[2]);
    proc_terminate($process);
    hub_fail('PHP test server did not start: ' . $stderr);
}

function hub_stop_server(array $server): void {
    [$process, $pipes] = $server;
    foreach ([1, 2] as $index) if (isset($pipes[$index]) && is_resource($pipes[$index])) fclose($pipes[$index]);
    if (is_resource($process)) {
        proc_terminate($process);
        proc_close($process);
    }
}
