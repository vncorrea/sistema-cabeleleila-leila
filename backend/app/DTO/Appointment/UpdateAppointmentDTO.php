<?php

namespace App\DTO\Appointment;

use Illuminate\Support\Collection;

class UpdateAppointmentDTO
{
    /**
     * @param  array<int>|null  $salonServiceIds
     */
    public function __construct(
        public readonly ?string $startsAt = null,
        public readonly ?array $salonServiceIds = null,
        public readonly ?string $notes = null,
    ) {
    }

    public function toCollection(): Collection
    {
        return collect([
            'starts_at' => $this->startsAt,
            'notes' => $this->notes,
        ])->filter(fn ($value) => $value !== null);
    }
}
