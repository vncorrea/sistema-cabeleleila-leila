<?php

namespace App\Repositories\Appointment;

use App\DTO\Appointment\AppointmentFilterDTO;
use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class AppointmentRepository
{
    public function getById(int $id): ?Appointment
    {
        return Appointment::find($id);
    }

    public function getByIdOrFail(int $id): Appointment
    {
        return Appointment::findOrFail($id);
    }

    public function getByIdWithRelations(int $id): Appointment
    {
        return Appointment::with(['client', 'assignedTo', 'items.salonService'])->findOrFail($id);
    }

    public function create(array $data): Appointment
    {
        return Appointment::create($data);
    }

    public function update(Appointment $appointment, array $data): Appointment
    {
        $appointment->update($data);

        return $appointment->fresh();
    }

    /**
     * @return Builder<Appointment>
     */
    public function queryByFilter(AppointmentFilterDTO $dto): Builder
    {
        $query = Appointment::with(['client', 'assignedTo', 'items.salonService']);

        if ($dto->startDate !== null) {
            $query->whereDate('starts_at', '>=', $dto->startDate);
        }

        if ($dto->endDate !== null) {
            $query->whereDate('starts_at', '<=', $dto->endDate);
        }

        if ($dto->clientId !== null) {
            $query->where('client_id', $dto->clientId);
        }

        if ($dto->assignedUserId !== null) {
            $query->where('assigned_user_id', $dto->assignedUserId);
        }

        if ($dto->status !== null) {
            $query->where('status', $dto->status);
        }

        return $query->orderBy('starts_at', 'desc');
    }

    /**
     * @return Collection<int, Appointment>
     */
    public function listByFilter(AppointmentFilterDTO $dto): Collection
    {
        return $this->queryByFilter($dto)->get();
    }

    public function paginateByFilter(AppointmentFilterDTO $dto, int $perPage = 15): LengthAwarePaginator
    {
        return $this->queryByFilter($dto)->paginate($perPage);
    }

    /**
     * Time slots (H:i in salon timezone) already occupied by the given professional on the given date.
     * Excludes cancelled appointments.
     *
     * @return array<int, string>
     */
    public function getOccupiedTimeSlotsForProfessional(string $date, int $assignedUserId): array
    {
        $tz = 'America/Sao_Paulo';
        $start = Carbon::parse($date, $tz)->startOfDay()->utc();
        $end = Carbon::parse($date, $tz)->endOfDay()->utc();

        $appointments = Appointment::query()
            ->where('assigned_user_id', $assignedUserId)
            ->whereBetween('starts_at', [$start, $end])
            ->whereNotIn('status', ['cancelled'])
            ->orderBy('starts_at')
            ->get();

        $slots = [];
        foreach ($appointments as $apt) {
            $slots[] = Carbon::parse($apt->starts_at)->tz($tz)->format('H:i');
        }

        return $slots;
    }

    /**
     * Appointments for a client in the same week as $date.
     *
     * @return Collection<int, Appointment>
     */
    public function getClientAppointmentsInWeek(int $clientId, string $date): Collection
    {
        $startOfWeek = date('Y-m-d', strtotime('monday this week', strtotime($date)));
        $endOfWeek = date('Y-m-d', strtotime('sunday this week', strtotime($date)));

        return Appointment::with(['items.salonService'])
            ->where('client_id', $clientId)
            ->whereDate('starts_at', '>=', $startOfWeek)
            ->whereDate('starts_at', '<=', $endOfWeek)
            ->whereNotIn('status', ['cancelled'])
            ->orderBy('starts_at')
            ->get();
    }
}
