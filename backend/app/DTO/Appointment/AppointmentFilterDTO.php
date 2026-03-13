<?php

namespace App\DTO\Appointment;

class AppointmentFilterDTO
{
    public function __construct(
        public readonly ?string $startDate = null,
        public readonly ?string $endDate = null,
        public readonly ?int $clientId = null,
        public readonly ?string $status = null,
        public readonly ?int $assignedUserId = null,
    ) {
    }
}
