<?php

namespace App\DTO\Appointment;

use Illuminate\Support\Collection;

class CreateAppointmentDTO
{
    /**
     * @param  array<int>  $salonServiceIds
     */
    public function __construct(
        public readonly ?int $clientId,
        public readonly string $startsAt,
        public readonly array $salonServiceIds,
        public readonly ?string $notes = null,
        public readonly ?int $assignedUserId = null,
        public readonly ?string $clientName = null,
        public readonly ?string $clientEmail = null,
        public readonly ?string $clientPhone = null,
    ) {
    }

    public function toCollection(): Collection
    {
        return collect([
            'client_id' => $this->clientId,
            'assigned_user_id' => $this->assignedUserId,
            'starts_at' => $this->startsAt,
            'notes' => $this->notes,
        ])->filter(fn ($value) => $value !== null);
    }
}
