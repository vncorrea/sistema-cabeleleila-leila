<?php

namespace App\DTO\Appointment;

class ConfirmAppointmentDTO
{
    public function __construct(
        public readonly int $appointmentId,
    ) {
    }
}
