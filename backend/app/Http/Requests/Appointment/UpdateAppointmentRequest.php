<?php

namespace App\Http\Requests\Appointment;

use App\DTO\Appointment\UpdateAppointmentDTO;
use Carbon\Carbon;
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
            'assigned_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function getUpdateAppointmentDTO(): UpdateAppointmentDTO
    {
        $validated = $this->validated();
        $startsAt = null;
        if (! empty($validated['starts_at'])) {
            $startsAt = Carbon::parse($validated['starts_at'], config('app.timezone'))->utc()->toIso8601String();
        }

        $assignedUserId = null;
        $assignedUserIdSet = array_key_exists('assigned_user_id', $validated);
        if ($assignedUserIdSet && $validated['assigned_user_id'] !== null && $validated['assigned_user_id'] !== '') {
            $assignedUserId = (int) $validated['assigned_user_id'];
        } elseif ($assignedUserIdSet) {
            $assignedUserId = null;
        }

        return new UpdateAppointmentDTO(
            startsAt: $startsAt,
            salonServiceIds: isset($validated['salon_service_ids']) ? array_map('intval', $validated['salon_service_ids']) : null,
            notes: $validated['notes'] ?? null,
            assignedUserId: $assignedUserId,
            assignedUserIdSet: $assignedUserIdSet,
        );
    }
}
