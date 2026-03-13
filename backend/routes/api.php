<?php

use App\Http\Controllers\Appointment\AppointmentController;
use App\Http\Controllers\Client\ClientController;
use App\Http\Controllers\SalonService\SalonServiceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::apiResource('clients', ClientController::class)->only(['index', 'store', 'show']);
    Route::get('salon-services', [SalonServiceController::class, 'index']);

    Route::get('appointments/history-with-suggestion', [AppointmentController::class, 'historyWithSuggestion']);
    Route::get('appointments', [AppointmentController::class, 'index']);
    Route::post('appointments', [AppointmentController::class, 'store']);
    Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::put('appointments/{appointment}', [AppointmentController::class, 'update']);
    Route::delete('appointments/{appointment}', [AppointmentController::class, 'destroy']);
    Route::post('appointments/{appointment}/confirm', [AppointmentController::class, 'confirm']);
    Route::put('appointment-items/{appointmentItem}/status', [AppointmentController::class, 'updateItemStatus']);
});
