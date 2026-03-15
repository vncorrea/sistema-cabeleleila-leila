<?php

namespace App\Http\Controllers\SalonService;

use App\Http\Controllers\Controller;
use App\Services\SalonService\SalonServiceListService;
use Exception;
use Illuminate\Http\JsonResponse;

class SalonServiceController extends Controller
{
    public function __construct(
        private readonly SalonServiceListService $salonServiceListService
    ) {
    }

    public function index(): JsonResponse
    {
        try {
            $services = $this->salonServiceListService->listAll();

            return response()->json([
                'message' => 'OK',
                'data' => $services,
            ]);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
