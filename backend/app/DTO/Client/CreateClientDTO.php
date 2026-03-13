<?php

namespace App\DTO\Client;

use Illuminate\Support\Collection;

class CreateClientDTO
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $phone = null,
    ) {
    }

    public function toCollection(): Collection
    {
        return collect([
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
        ])->filter(fn ($value) => $value !== null);
    }
}
