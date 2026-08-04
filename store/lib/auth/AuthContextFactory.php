<?php

declare(strict_types=1);

final class AuthContextFactory
{
    /** @param array<string,mixed> $config */
    public function __construct(private readonly array $config)
    {
    }

    /** @param array<string,mixed> $request */
    public function fromRequest(array $request = []): AuthContext
    {
        unset($request);
        return new AnonymousAuthContext('vevit_account_contract_unavailable');
    }
}
