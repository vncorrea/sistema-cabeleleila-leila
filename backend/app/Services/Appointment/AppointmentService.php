<?php

namespace App\Services\Appointment;

use App\DTO\Appointment\AppointmentFilterDTO;
use App\DTO\Appointment\ConfirmAppointmentDTO;
use App\DTO\Appointment\CreateAppointmentDTO;
use App\DTO\Appointment\UpdateAppointmentDTO;
use App\DTO\Appointment\UpdateAppointmentItemStatusDTO;
use App\Enums\AppointmentItemStatusEnum;
use App\Enums\AppointmentStatusEnum;
use App\Models\Appointment;
use App\Repositories\Appointment\AppointmentItemRepository;
use App\Repositories\Appointment\AppointmentRepository;
use App\Repositories\Client\ClientRepository;
use App\Repositories\SalonService\SalonServiceRepository;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use InvalidArgumentException;
use LogicException;

class AppointmentService
{
    private const MIN_DAYS_FOR_CLIENT_EDIT = 2;

    public function __construct(
        private readonly AppointmentRepository $appointmentRepository,
        private readonly AppointmentItemRepository $appointmentItemRepository,
        private readonly ClientRepository $clientRepository,
        private readonly SalonServiceRepository $salonServiceRepository
    ) {
    }

    public function create(CreateAppointmentDTO $dto): Appointment
    {
        $this->clientRepository->getByIdOrFail($dto->clientId);

        $services = $this->salonServiceRepository->getByIds($dto->salonServiceIds);

        if ($services->count() !== count($dto->salonServiceIds)) {
            throw new InvalidArgumentException('One or more salon service IDs are invalid.');
        }

        $appointmentData = $dto->toCollection()->all();
        $appointment = $this->appointmentRepository->create($appointmentData);

        $items = [];
        foreach ($dto->salonServiceIds as $salonServiceId) {
            $items[] = [
                'appointment_id' => $appointment->id,
                'salon_service_id' => $salonServiceId,
                'status' => AppointmentItemStatusEnum::Pending->value,
            ];
        }
        $this->appointmentItemRepository->createMany($items);

        return $this->appointmentRepository->getByIdWithRelations($appointment->id);
    }

    public function update(int $appointmentId, UpdateAppointmentDTO $dto, bool $byStaff = false): Appointment
    {
        $appointment = $this->appointmentRepository->getByIdOrFail($appointmentId);

        if (! $byStaff && ! $this->clientCanEditAppointment($appointment->starts_at)) {
            throw new LogicException(
                'Changes are only allowed until 2 days before the appointment. Please contact the salon by phone for last-minute changes.'
            );
        }

        $updateData = $dto->toCollection()->all();

        if (! empty($updateData)) {
            $this->appointmentRepository->update($appointment, $updateData);
        }

        if ($dto->salonServiceIds !== null) {
            $this->appointmentItemRepository->deleteByAppointmentId($appointment->id);
            $services = $this->salonServiceRepository->getByIds($dto->salonServiceIds);
            if ($services->count() !== count($dto->salonServiceIds)) {
                throw new InvalidArgumentException('One or more salon service IDs are invalid.');
            }
            $items = [];
            foreach ($dto->salonServiceIds as $salonServiceId) {
                $items[] = [
                    'appointment_id' => $appointment->id,
                    'salon_service_id' => $salonServiceId,
                    'status' => AppointmentItemStatusEnum::Pending->value,
                ];
            }
            $this->appointmentItemRepository->createMany($items);
        }

        return $this->appointmentRepository->getByIdWithRelations($appointment->id);
    }

    public function getById(int $id): Appointment
    {
        return $this->appointmentRepository->getByIdWithRelations($id);
    }

    /**
     * @return Collection<int, Appointment>
     */
    public function listByFilter(AppointmentFilterDTO $dto): Collection
    {
        return $this->appointmentRepository->listByFilter($dto);
    }

    public function paginateByFilter(AppointmentFilterDTO $dto, int $perPage = 15): LengthAwarePaginator
    {
        return $this->appointmentRepository->paginateByFilter($dto, $perPage);
    }

    public function confirm(ConfirmAppointmentDTO $dto): Appointment
    {
        $appointment = $this->appointmentRepository->getByIdOrFail($dto->appointmentId);
        $this->appointmentRepository->update($appointment, ['status' => AppointmentStatusEnum::Confirmed->value]);

        return $this->appointmentRepository->getByIdWithRelations($appointment->id);
    }

    public function updateItemStatus(UpdateAppointmentItemStatusDTO $dto): Appointment
    {
        $item = $this->appointmentItemRepository->getByIdOrFail($dto->appointmentItemId);
        $this->appointmentItemRepository->updateStatus($item, $dto->status);

        return $this->appointmentRepository->getByIdWithRelations($item->appointment_id);
    }

    public function cancel(int $appointmentId, bool $byStaff = false): Appointment
    {
        $appointment = $this->appointmentRepository->getByIdOrFail($appointmentId);

        if (! $byStaff && ! $this->clientCanEditAppointment($appointment->starts_at)) {
            throw new LogicException(
                'Cancellation is only allowed until 2 days before the appointment. Please contact the salon by phone.'
            );
        }

        $this->appointmentRepository->update($appointment, ['status' => AppointmentStatusEnum::Cancelled->value]);

        return $this->appointmentRepository->getByIdWithRelations($appointment->id);
    }

    /**
     * When the client has an appointment in the same week, suggest scheduling other services on the same date.
     *
     * @return array{appointments: Collection, suggested_date: string|null}
     */
    public function getClientHistoryWithSuggestion(int $clientId, string $startDate, string $endDate): array
    {
        $dto = new AppointmentFilterDTO(
            startDate: $startDate,
            endDate: $endDate,
            clientId: $clientId
        );
        $appointments = $this->appointmentRepository->listByFilter($dto);

        $suggestedDate = null;
        $firstInWeek = $this->appointmentRepository->getClientAppointmentsInWeek($clientId, $startDate)->first();
        if ($firstInWeek !== null) {
            $suggestedDate = $firstInWeek->starts_at->format('Y-m-d');
        }

        return [
            'appointments' => $appointments,
            'suggested_date' => $suggestedDate,
        ];
    }

    public function clientCanEditAppointment(string|\DateTimeInterface $startsAt): bool
    {
        $appointmentDate = Carbon::parse($startsAt)->startOfDay();
        $deadline = Carbon::today()->addDays(self::MIN_DAYS_FOR_CLIENT_EDIT);

        return $appointmentDate->gte($deadline);
    }
}
