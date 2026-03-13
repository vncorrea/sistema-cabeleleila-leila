<?php

namespace App\Http\Requests\Appointment;

use App\DTO\Appointment\UpdateAppointmentDTO;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentRequest extends FormRequest
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
            'starts_at' => ['sometimes', 'date', 'after:now'],
            'salon_service_ids' => ['sometimes', 'array', 'min:1'],
            'salon_service_ids.*' => ['integer', 'exists:salon_services,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function getUpdateAppointmentDTO(): UpdateAppointmentDTO
    {
        $validated = $this->validated();

        return new UpdateAppointmentDTO(
            startsAt: isset($validated['starts_at']) ? $validated['starts_at'] : null,
            salonServiceIds: isset($validated['salon_service_ids']) ? array_map('intval', $validated['salon_service_ids']) : null,
            notes: $validated['notes'] ?? null,
        );
    }
}
