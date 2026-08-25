<?php

declare(strict_types=1);

function test_assert_true(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

function test_assert_same(mixed $expected, mixed $actual, string $message): void
{
    test_assert_true($expected === $actual, $message . ' (expected ' . var_export($expected, true) . ', got ' . var_export($actual, true) . ')');
}

function test_complete(string $name): void
{
    fwrite(STDOUT, "PASS: {$name}\n");
}
