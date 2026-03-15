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
        public readonly ?int $assignedUserId = null,
        public readonly bool $assignedUserIdSet = false,
    ) {
    }

    public function toCollection(): Collection
    {
        $data = collect([
            'starts_at' => $this->startsAt,
            'notes' => $this->notes,
        ])->filter(fn ($value) => $value !== null);

        if ($this->assignedUserIdSet) {
            $data['assigned_user_id'] = $this->assignedUserId;
        }

        return $data;
    }
}
