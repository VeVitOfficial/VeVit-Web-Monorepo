<?php
declare(strict_types=1);

final class Money
{
    public static function decimalToMinor(string $value): int
    {
        $value = trim($value);
        if (!preg_match('/^([0-9]+)(?:\.([0-9]{1,2}))?$/', $value, $matches)) {
            throw new InvalidArgumentException('Invalid decimal money value.');
        }
        if (strlen($matches[1]) > 16) {
            throw new InvalidArgumentException('Money value is too large.');
        }
        $whole = (int) $matches[1];
        if ($whole > intdiv(PHP_INT_MAX, 100)) {
            throw new InvalidArgumentException('Money value is too large.');
        }
        return ($whole * 100) + (int) str_pad($matches[2] ?? '', 2, '0');
    }

    public static function minorToDecimal(int $minor): string
    {
        if ($minor < 0) throw new InvalidArgumentException('Money must not be negative.');
        return intdiv($minor, 100) . '.' . str_pad((string) ($minor % 100), 2, '0', STR_PAD_LEFT);
    }
}
