<?php

namespace Tests\Unit\Appointment;

use App\DTO\Appointment\CreateAppointmentDTO;
use App\Models\Appointment;
use App\Models\Client;
use App\Repositories\Appointment\AppointmentItemRepository;
use App\Repositories\Appointment\AppointmentRepository;
use App\Repositories\Client\ClientRepository;
use App\Repositories\SalonService\SalonServiceRepository;
use App\Services\Appointment\AppointmentService;
use Illuminate\Database\Eloquent\Collection;
use InvalidArgumentException;
use LogicException;
use Mockery;
use Tests\TestCase;

class AppointmentServiceTest extends TestCase
{
    private AppointmentRepository $appointmentRepository;

    private AppointmentItemRepository $appointmentItemRepository;

    private ClientRepository $clientRepository;

    private SalonServiceRepository $salonServiceRepository;

    private AppointmentService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->appointmentRepository = Mockery::mock(AppointmentRepository::class);
        $this->appointmentItemRepository = Mockery::mock(AppointmentItemRepository::class);
        $this->clientRepository = Mockery::mock(ClientRepository::class);
        $this->salonServiceRepository = Mockery::mock(SalonServiceRepository::class);

        $this->service = new AppointmentService(
            $this->appointmentRepository,
            $this->appointmentItemRepository,
            $this->clientRepository,
            $this->salonServiceRepository
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_create_throws_when_no_client_id_and_no_name_email(): void
    {
        $dto = new CreateAppointmentDTO(
            clientId: null,
            startsAt: '2026-03-20T09:00:00.000000Z',
            salonServiceIds: [1],
            clientName: null,
            clientEmail: null
        );

        $this->salonServiceRepository->shouldNotReceive('getByIds');
        $this->appointmentRepository->shouldNotReceive('create');

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('É necessário informar client_id ou nome e e-mail do cliente.');

        $this->service->create($dto);
    }

    public function test_create_throws_when_invalid_salon_service_ids(): void
    {
        $dto = new CreateAppointmentDTO(
            clientId: 1,
            startsAt: '2026-03-20T09:00:00.000000Z',
            salonServiceIds: [1, 2],
            clientName: null,
            clientEmail: null
        );

        $this->clientRepository->shouldReceive('getByIdOrFail')->with(1)->once();
        $this->salonServiceRepository->shouldReceive('getByIds')->with([1, 2])->once()
            ->andReturn(Collection::make([(object) ['id' => 1]]));

        $this->appointmentRepository->shouldNotReceive('create');

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Um ou mais IDs de serviço são inválidos.');

        $this->service->create($dto);
    }

    public function test_create_throws_when_assigned_professional_slot_occupied(): void
    {
        $dto = new CreateAppointmentDTO(
            clientId: 1,
            startsAt: '2026-03-20T12:00:00.000000Z',
            salonServiceIds: [1],
            assignedUserId: 5,
            clientName: null,
            clientEmail: null
        );

        $this->clientRepository->shouldReceive('getByIdOrFail')->with(1)->once();
        $this->salonServiceRepository->shouldReceive('getByIds')->with([1])->once()
            ->andReturn(Collection::make([(object) ['id' => 1]]));
        $this->appointmentRepository->shouldReceive('getOccupiedTimeSlotsForProfessional')
            ->with('2026-03-20', 5)
            ->once()
            ->andReturn(['09:00', '09:30']);

        $this->appointmentRepository->shouldNotReceive('create');

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Este horário já está ocupado para a profissional selecionada.');

        $this->service->create($dto);
    }

    public function test_create_success_with_client_id(): void
    {
        $dto = new CreateAppointmentDTO(
            clientId: 1,
            startsAt: '2026-03-20T12:00:00.000000Z',
            salonServiceIds: [1, 2],
            clientName: null,
            clientEmail: null
        );

        $this->clientRepository->shouldReceive('getByIdOrFail')->with(1)->once();
        $this->salonServiceRepository->shouldReceive('getByIds')->with([1, 2])->once()
            ->andReturn(Collection::make([(object) ['id' => 1], (object) ['id' => 2]]));

        $appointment = new Appointment(['client_id' => 1]);
        $appointment->id = 10;
        $this->appointmentRepository->shouldReceive('create')->once()
            ->andReturn($appointment);
        $this->appointmentItemRepository->shouldReceive('createMany')->once();
        $this->appointmentRepository->shouldReceive('getByIdWithRelations')->with(10)->once()
            ->andReturn($appointment);

        $result = $this->service->create($dto);

        $this->assertSame($appointment, $result);
    }

    public function test_create_uses_existing_client_when_email_matches(): void
    {
        $dto = new CreateAppointmentDTO(
            clientId: null,
            startsAt: '2026-03-20T12:00:00.000000Z',
            salonServiceIds: [1],
            clientName: 'Jane',
            clientEmail: 'jane@example.com',
            clientPhone: null
        );

        $existingClient = new Client(['id' => 2, 'name' => 'Jane', 'email' => 'jane@example.com']);
        $this->clientRepository->shouldReceive('findByEmail')->with('jane@example.com')->once()
            ->andReturn($existingClient);
        $this->clientRepository->shouldNotReceive('create');
        $this->salonServiceRepository->shouldReceive('getByIds')->with([1])->once()
            ->andReturn(Collection::make([(object) ['id' => 1]]));

        $appointment = new Appointment(['client_id' => 2]);
        $appointment->id = 11;
        $this->appointmentRepository->shouldReceive('create')->once()
            ->andReturn($appointment);
        $this->appointmentItemRepository->shouldReceive('createMany')->once();
        $this->appointmentRepository->shouldReceive('getByIdWithRelations')->with(11)->once()
            ->andReturn($appointment);

        $result = $this->service->create($dto);

        $this->assertSame($appointment, $result);
    }

    public function test_client_can_edit_appointment_returns_true_when_more_than_2_days_ahead(): void
    {
        $future = now()->addDays(3)->format('Y-m-d H:i:s');
        $result = $this->service->clientCanEditAppointment($future);
        $this->assertTrue($result);
    }

    public function test_client_can_edit_appointment_returns_false_when_less_than_2_days(): void
    {
        $tomorrow = now()->addDay()->format('Y-m-d H:i:s');
        $result = $this->service->clientCanEditAppointment($tomorrow);
        $this->assertFalse($result);
    }

    public function test_get_occupied_time_slots_delegates_to_repository(): void
    {
        $this->appointmentRepository->shouldReceive('getOccupiedTimeSlotsForProfessional')
            ->with('2026-03-20', 3)
            ->once()
            ->andReturn(['09:00', '10:00']);

        $result = $this->service->getOccupiedTimeSlotsForProfessional('2026-03-20', 3);

        $this->assertSame(['09:00', '10:00'], $result);
    }

    public function test_get_history_with_optional_filters_uses_repository(): void
    {
        $dto = new \App\DTO\Appointment\AppointmentFilterDTO(
            startDate: '2026-03-01',
            endDate: '2026-03-30',
            clientId: null,
            assignedUserId: null,
            status: null
        );
        $collection = Collection::make([]);
        $this->appointmentRepository->shouldReceive('listByFilter')->once()
            ->andReturn($collection);
        $this->appointmentRepository->shouldReceive('getClientAppointmentsInWeek')->never();

        $result = $this->service->getHistoryWithOptionalFilters(null, '2026-03-01', '2026-03-30');

        $this->assertArrayHasKey('appointments', $result);
        $this->assertArrayHasKey('suggested_date', $result);
        $this->assertSame($collection, $result['appointments']);
        $this->assertNull($result['suggested_date']);
    }

    public function test_cancel_throws_when_client_and_less_than_2_days(): void
    {
        $appointment = new Appointment([
            'id' => 1,
            'starts_at' => now()->addDay(),
        ]);

        $this->appointmentRepository->shouldReceive('getByIdOrFail')->with(1)->once()
            ->andReturn($appointment);
        $this->appointmentRepository->shouldNotReceive('update');

        $this->expectException(LogicException::class);
        $this->expectExceptionMessage('O cancelamento é permitido apenas até 2 dias antes');

        $this->service->cancel(1, false);
    }

    public function test_cancel_success_when_by_staff(): void
    {
        $appointment = new Appointment(['starts_at' => now()->addDay()]);
        $appointment->id = 1;

        $this->appointmentRepository->shouldReceive('getByIdOrFail')->with(1)->once()
            ->andReturn($appointment);
        $this->appointmentRepository->shouldReceive('update')->once()->andReturn($appointment);
        $this->appointmentRepository->shouldReceive('getByIdWithRelations')->with(1)->once()
            ->andReturn($appointment);

        $result = $this->service->cancel(1, true);

        $this->assertSame($appointment, $result);
    }
}
