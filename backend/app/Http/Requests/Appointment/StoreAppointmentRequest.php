<?php

namespace App\Http\Requests\Appointment;

use App\DTO\Appointment\CreateAppointmentDTO;
use Carbon\Carbon;
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
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
            'client_name' => ['nullable', 'required_without:client_id', 'string', 'max:255'],
            'client_email' => ['nullable', 'required_without:client_id', 'email'],
            'client_phone' => ['nullable', 'string', 'max:50'],
            'starts_at' => ['required', 'date', 'after:now'],
            'salon_service_ids' => ['required', 'array', 'min:1'],
            'salon_service_ids.*' => ['integer', 'exists:salon_services,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'assigned_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function getCreateAppointmentDTO(): CreateAppointmentDTO
    {
        $validated = $this->validated();
        $clientId = isset($validated['client_id']) ? (int) $validated['client_id'] : null;
        $clientName = $validated['client_name'] ?? null;
        $clientEmail = $validated['client_email'] ?? null;
        $clientPhone = $validated['client_phone'] ?? null;

        $startsAt = Carbon::parse($validated['starts_at'], config('app.timezone'))->utc()->toIso8601String();

        return new CreateAppointmentDTO(
            clientId: $clientId,
            startsAt: $startsAt,
            salonServiceIds: array_map('intval', $validated['salon_service_ids']),
            notes: $validated['notes'] ?? null,
            assignedUserId: isset($validated['assigned_user_id']) ? (int) $validated['assigned_user_id'] : null,
            clientName: $clientName,
            clientEmail: $clientEmail,
            clientPhone: $clientPhone,
        );
    }
}
