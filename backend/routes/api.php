<?php

use App\Http\Controllers\Appointment\AppointmentController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Client\ClientController;
use App\Http\Controllers\SalonService\SalonServiceController;
use App\Http\Controllers\User\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::get('salon-services', [SalonServiceController::class, 'index']);
    Route::post('appointments', [AppointmentController::class, 'store'])->middleware('optional_sanctum');
    Route::get('appointments/by-client-email', [AppointmentController::class, 'listByClientEmail']);
    Route::put('appointments/{appointment}/client-reschedule', [AppointmentController::class, 'clientReschedule']);
    Route::get('clients/lookup', [ClientController::class, 'lookup']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::get('users/professionals', [UserController::class, 'professionals']);
        Route::get('users', [UserController::class, 'index']);
        Route::post('users', [UserController::class, 'store']);
        Route::put('users/{user}', [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);

        Route::apiResource('clients', ClientController::class)->only(['index', 'store', 'show']);

        Route::get('appointments/occupied-slots', [AppointmentController::class, 'occupiedSlots']);
        Route::get('appointments/history-with-suggestion', [AppointmentController::class, 'historyWithSuggestion']);
        Route::get('appointments', [AppointmentController::class, 'index']);
        Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
        Route::put('appointments/{appointment}', [AppointmentController::class, 'update']);
        Route::delete('appointments/{appointment}', [AppointmentController::class, 'destroy']);
        Route::post('appointments/{appointment}/confirm', [AppointmentController::class, 'confirm']);
        Route::put('appointment-items/{appointmentItem}/status', [AppointmentController::class, 'updateItemStatus']);
    });
});
