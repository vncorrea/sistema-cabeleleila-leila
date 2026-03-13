<?php

namespace App\Http\Requests\Appointment;

use App\DTO\Appointment\AppointmentFilterDTO;
use Illuminate\Foundation\Http\FormRequest;

class IndexAppointmentRequest extends FormRequest
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
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
            'status' => ['nullable', 'string', 'in:pending,confirmed,completed,cancelled'],
        ];
    }

    public function getFilterDTO(?int $assignedUserId = null): AppointmentFilterDTO
    {
        $validated = $this->validated();

        return new AppointmentFilterDTO(
            startDate: $validated['start_date'] ?? null,
            endDate: $validated['end_date'] ?? null,
            clientId: isset($validated['client_id']) ? (int) $validated['client_id'] : null,
            status: $validated['status'] ?? null,
            assignedUserId: $assignedUserId,
        );
    }
}
