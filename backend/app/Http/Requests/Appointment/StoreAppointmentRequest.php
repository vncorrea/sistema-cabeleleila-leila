<?php

namespace App\Http\Requests\Appointment;

use App\DTO\Appointment\CreateAppointmentDTO;
use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
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
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'starts_at' => ['required', 'date', 'after:now'],
            'salon_service_ids' => ['required', 'array', 'min:1'],
            'salon_service_ids.*' => ['integer', 'exists:salon_services,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function getCreateAppointmentDTO(): CreateAppointmentDTO
    {
        return new CreateAppointmentDTO(
            clientId: (int) $this->validated('client_id'),
            startsAt: $this->validated('starts_at'),
            salonServiceIds: array_map('intval', $this->validated('salon_service_ids')),
            notes: $this->validated('notes'),
        );
    }
}
