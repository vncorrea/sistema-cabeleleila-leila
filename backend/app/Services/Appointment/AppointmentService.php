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
        $clientId = $dto->clientId;
        if ($clientId === null) {
            if (empty($dto->clientName) || empty($dto->clientEmail)) {
                throw new InvalidArgumentException('Either client_id or client_name and client_email are required.');
            }
            $existing = $this->clientRepository->findByEmail($dto->clientEmail);
            if ($existing !== null) {
                $clientId = $existing->id;
            } else {
                $client = $this->clientRepository->create([
                    'name' => $dto->clientName,
                    'email' => $dto->clientEmail,
                    'phone' => $dto->clientPhone,
                ]);
                $clientId = $client->id;
            }
        } else {
            $this->clientRepository->getByIdOrFail($clientId);
        }

        $services = $this->salonServiceRepository->getByIds($dto->salonServiceIds);

        if ($services->count() !== count($dto->salonServiceIds)) {
            throw new InvalidArgumentException('One or more salon service IDs are invalid.');
        }

        $appointmentData = $dto->toCollection()->all();
        $appointmentData['client_id'] = $clientId;
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
     * History with optional filters. When no dates given, last 30 days. suggested_date only when client_id is set.
     *
     * @return array{appointments: Collection, suggested_date: string|null}
     */
    public function getHistoryWithOptionalFilters(?int $clientId, ?string $startDate, ?string $endDate): array
    {
        if ($startDate === null || $endDate === null) {
            $endDate = Carbon::today()->format('Y-m-d');
            $startDate = Carbon::today()->subDays(30)->format('Y-m-d');
        }

        $dto = new AppointmentFilterDTO(
            startDate: $startDate,
            endDate: $endDate,
            clientId: $clientId
        );
        $appointments = $this->appointmentRepository->listByFilter($dto);

        $suggestedDate = null;
        if ($clientId !== null) {
            $firstInWeek = $this->appointmentRepository->getClientAppointmentsInWeek($clientId, $startDate)->first();
            if ($firstInWeek !== null) {
                $suggestedDate = $firstInWeek->starts_at->format('Y-m-d');
            }
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

    /**
     * List appointments for a client identified by email (for client area without login).
     *
     * @return Collection<int, Appointment>
     */
    public function getAppointmentsByClientEmail(string $email): Collection
    {
        $client = $this->clientRepository->findByEmail($email);
        if ($client === null) {
            return new Collection([]);
        }

        $dto = new AppointmentFilterDTO(
            startDate: null,
            endDate: null,
            clientId: $client->id
        );

        return $this->appointmentRepository->listByFilter($dto);
    }

    /**
     * Reschedule an appointment by client (no auth). Verifies client email and 2-day rule.
     */
    public function clientReschedule(int $appointmentId, string $email, UpdateAppointmentDTO $dto): Appointment
    {
        $appointment = $this->appointmentRepository->getByIdWithRelations($appointmentId);
        $client = $appointment->client;
        if ($client === null || strtolower($client->email) !== strtolower($email)) {
            throw new InvalidArgumentException('Appointment not found or email does not match.');
        }

        return $this->update($appointmentId, $dto, false);
    }
}
