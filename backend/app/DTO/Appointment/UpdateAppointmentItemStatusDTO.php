<?php

namespace App\DTO\Appointment;

class UpdateAppointmentItemStatusDTO
{
    public function __construct(
        public readonly int $appointmentItemId,
        public readonly string $status,
    ) {
    }
}
