<?php

namespace App\DTO\Appointment;

use Illuminate\Support\Collection;

class CreateAppointmentDTO
{
    /**
     * @param  array<int>  $salonServiceIds
     */
    public function __construct(
        public readonly int $clientId,
        public readonly string $startsAt,
        public readonly array $salonServiceIds,
        public readonly ?string $notes = null,
    ) {
    }

    public function toCollection(): Collection
    {
        return collect([
            'client_id' => $this->clientId,
            'starts_at' => $this->startsAt,
            'notes' => $this->notes,
        ])->filter(fn ($value) => $value !== null);
    }
}
