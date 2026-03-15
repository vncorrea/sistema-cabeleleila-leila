<?php

namespace App\Http\Controllers\Appointment;

use App\DTO\Appointment\ConfirmAppointmentDTO;
use App\DTO\Appointment\UpdateAppointmentDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Appointment\IndexAppointmentRequest;
use App\Http\Requests\Appointment\StoreAppointmentRequest;
use App\Http\Requests\Appointment\UpdateAppointmentItemStatusRequest;
use App\Http\Requests\Appointment\UpdateAppointmentRequest;
use App\Services\Appointment\AppointmentService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AppointmentController extends Controller
{
    public function __construct(
        private readonly AppointmentService $appointmentService
    ) {
    }

    public function index(IndexAppointmentRequest $request): JsonResponse
    {
        try {
            $assignedUserId = null;
            if ($request->user()?->isProfessional()) {
                $assignedUserId = $request->user()->id;
            }
            $dto = $request->getFilterDTO($assignedUserId);
            $perPage = $request->integer('per_page', 15);
            $appointments = $this->appointmentService->paginateByFilter($dto, $perPage);

            return response()->json([
                'message' => 'OK',
                'data' => $appointments->items(),
                'current_page' => $appointments->currentPage(),
                'per_page' => $appointments->perPage(),
                'total' => $appointments->total(),
                'last_page' => $appointments->lastPage(),
            ]);
        } catch (\Exception $e) {
            Log::error('AppointmentController@index', ['exception' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        try {
            $dto = $request->getCreateAppointmentDTO();
            $user = $request->user();
            if ($user && ($user->isAdmin() || $user->isReceptionist()) && $dto->assignedUserId !== null) {
                // Staff can set assigned_user_id; keep DTO as is
            } elseif ($user && $user->isProfessional()) {
                $dto = new \App\DTO\Appointment\CreateAppointmentDTO(
                    clientId: $dto->clientId,
                    startsAt: $dto->startsAt,
                    salonServiceIds: $dto->salonServiceIds,
                    notes: $dto->notes,
                    assignedUserId: $user->id,
                    clientName: $dto->clientName,
                    clientEmail: $dto->clientEmail,
                    clientPhone: $dto->clientPhone,
                );
            } else {
                $dto = new \App\DTO\Appointment\CreateAppointmentDTO(
                    clientId: $dto->clientId,
                    startsAt: $dto->startsAt,
                    salonServiceIds: $dto->salonServiceIds,
                    notes: $dto->notes,
                    assignedUserId: null,
                    clientName: $dto->clientName,
                    clientEmail: $dto->clientEmail,
                    clientPhone: $dto->clientPhone,
                );
            }
            $appointment = $this->appointmentService->create($dto);

            return response()->json([
                'message' => 'Appointment created successfully',
                'data' => $appointment,
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('AppointmentController@store', ['exception' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function historyWithSuggestion(Request $request): JsonResponse
    {
        if ($request->user()?->isProfessional()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $request->validate([
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        try {
            $clientId = $request->filled('client_id') ? (int) $request->input('client_id') : null;
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $result = $this->appointmentService->getHistoryWithOptionalFilters($clientId, $startDate, $endDate);

            return response()->json([
                'message' => 'OK',
                'data' => [
                    'appointments' => $result['appointments'],
                    'suggested_date' => $result['suggested_date'],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('AppointmentController@historyWithSuggestion', ['exception' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function show(\Illuminate\Http\Request $request, int $appointment): JsonResponse
    {
        try {
            $model = $this->appointmentService->getById($appointment);
            if ($request->user()?->isProfessional() && (int) $model->assigned_user_id !== (int) $request->user()->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            return response()->json([
                'message' => 'OK',
                'data' => $model,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Appointment not found'], 404);
        } catch (\Exception $e) {
            Log::error('AppointmentController@show', ['exception' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function update(UpdateAppointmentRequest $request, int $appointment): JsonResponse
    {
        try {
            $existing = $this->appointmentService->getById($appointment);
            if ($request->user()?->isProfessional() && (int) $existing->assigned_user_id !== (int) $request->user()->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
            $dto = $request->getUpdateAppointmentDTO();
            $byStaff = $request->boolean('by_staff', false);
            $model = $this->appointmentService->update($appointment, $dto, $byStaff);

            return response()->json([
                'message' => 'Appointment updated successfully',
                'data' => $model,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Appointment not found'], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\LogicException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('AppointmentController@update', ['exception' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function destroy(Request $request, int $appointment): JsonResponse
    {
        try {
            $existing = $this->appointmentService->getById($appointment);
            if ($request->user()?->isProfessional() && (int) $existing->assigned_user_id !== (int) $request->user()->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
            $byStaff = $request->boolean('by_staff', false);
            $model = $this->appointmentService->cancel($appointment, $byStaff);

            return response()->json([
                'message' => 'Appointment cancelled successfully',
                'data' => $model,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Appointment not found'], 404);
        } catch (\LogicException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('AppointmentController@destroy', ['exception' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function confirm(Request $request, int $appointment): JsonResponse
    {
        try {
            $existing = $this->appointmentService->getById($appointment);
            if ($request->user()?->isProfessional() && (int) $existing->assigned_user_id !== (int) $request->user()->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
            $dto = new ConfirmAppointmentDTO(appointmentId: $appointment);
            $model = $this->appointmentService->confirm($dto);

            return response()->json([
                'message' => 'Appointment confirmed successfully',
                'data' => $model,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Appointment not found'], 404);
        } catch (\Exception $e) {
            Log::error('AppointmentController@confirm', ['exception' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function listByClientEmail(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);
        $email = $request->input('email');
        $appointments = $this->appointmentService->getAppointmentsByClientEmail($email);

        return response()->json([
            'message' => 'OK',
            'data' => $appointments->values()->all(),
        ]);
    }

    public function clientReschedule(Request $request, int $appointment): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'starts_at' => ['required', 'date', 'after:now'],
        ]);
        $email = $request->input('email');
        $startsAt = Carbon::parse($request->input('starts_at'), config('app.timezone'))->utc()->toIso8601String();
        $dto = new UpdateAppointmentDTO(startsAt: $startsAt, salonServiceIds: null, notes: null);

        try {
            $model = $this->appointmentService->clientReschedule($appointment, $email, $dto);

            return response()->json([
                'message' => 'Appointment rescheduled successfully',
                'data' => $model,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        } catch (\LogicException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('AppointmentController@clientReschedule', ['exception' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function updateItemStatus(UpdateAppointmentItemStatusRequest $request, int $appointmentItem): JsonResponse
    {
        try {
            $item = \App\Models\AppointmentItem::findOrFail($appointmentItem);
            $appointment = $this->appointmentService->getById($item->appointment_id);
            if ($request->user()?->isProfessional() && (int) $appointment->assigned_user_id !== (int) $request->user()->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
            $dto = $request->getUpdateStatusDTO($appointmentItem);
            $model = $this->appointmentService->updateItemStatus($dto);

            return response()->json([
                'message' => 'Item status updated successfully',
                'data' => $model,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Appointment item not found'], 404);
        } catch (\Exception $e) {
            Log::error('AppointmentController@updateItemStatus', ['exception' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
