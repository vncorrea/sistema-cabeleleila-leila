<?php

namespace App\Http\Requests\Appointment;

use App\DTO\Appointment\UpdateAppointmentItemStatusDTO;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentItemStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:pending,in_progress,completed,cancelled'],
        ];
    }

    public function getUpdateStatusDTO(int $appointmentItemId): UpdateAppointmentItemStatusDTO
    {
        return new UpdateAppointmentItemStatusDTO(
            appointmentItemId: $appointmentItemId,
            status: $this->validated('status'),
        );
    }
}
