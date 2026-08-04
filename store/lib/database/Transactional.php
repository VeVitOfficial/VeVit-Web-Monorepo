<?php

declare(strict_types=1);

final class Transactional
{
    public static function run(PDO $pdo, Closure $operation): mixed
    {
        $pdo->beginTransaction();
        try {
            $result = $operation();
            $pdo->commit();
            return $result;
        } catch (Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $exception;
        }
    }
}
