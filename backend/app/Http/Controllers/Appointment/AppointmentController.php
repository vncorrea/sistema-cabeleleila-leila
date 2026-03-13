<?php

namespace App\Http\Controllers\Appointment;

use App\DTO\Appointment\ConfirmAppointmentDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Appointment\IndexAppointmentRequest;
use App\Http\Requests\Appointment\StoreAppointmentRequest;
use App\Http\Requests\Appointment\UpdateAppointmentItemStatusRequest;
use App\Http\Requests\Appointment\UpdateAppointmentRequest;
use App\Services\Appointment\AppointmentService;
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
            $dto = $request->getFilterDTO();
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
        $request->validate([
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        try {
            $clientId = (int) $request->input('client_id');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $result = $this->appointmentService->getClientHistoryWithSuggestion($clientId, $startDate, $endDate);

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

    public function show(int $appointment): JsonResponse
    {
        try {
            $model = $this->appointmentService->getById($appointment);

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

    public function updateItemStatus(UpdateAppointmentItemStatusRequest $request, int $appointmentItem): JsonResponse
    {
        try {
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
