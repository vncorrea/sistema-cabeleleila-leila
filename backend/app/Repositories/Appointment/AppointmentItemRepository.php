<?php

namespace App\Repositories\Appointment;

use App\Models\AppointmentItem;
use Illuminate\Support\Collection;

class AppointmentItemRepository
{
    public function getByIdOrFail(int $id): AppointmentItem
    {
        return AppointmentItem::with(['appointment', 'salonService'])->findOrFail($id);
    }

    public function create(array $data): AppointmentItem
    {
        return AppointmentItem::create($data);
    }

    public function updateStatus(AppointmentItem $item, string $status): AppointmentItem
    {
        $item->update(['status' => $status]);

        return $item->fresh();
    }

    /**
     * @param  array<array{appointment_id: int, salon_service_id: int, status: string}>  $items
     * @return Collection<int, AppointmentItem>
     */
    public function createMany(array $items): Collection
    {
        $created = collect();

        foreach ($items as $row) {
            $created->push($this->create($row));
        }

        return $created;
    }

    public function deleteByAppointmentId(int $appointmentId): void
    {
        AppointmentItem::where('appointment_id', $appointmentId)->delete();
    }
}
