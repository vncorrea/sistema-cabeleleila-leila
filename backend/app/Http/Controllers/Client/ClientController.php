<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreClientRequest;
use App\Services\Client\ClientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ClientController extends Controller
{
    public function __construct(
        private readonly ClientService $clientService
    ) {
    }

    public function lookup(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);
        $client = $this->clientService->findByEmail($request->input('email'));
        if ($client === null) {
            return response()->json(['message' => 'Client not found'], 404);
        }

        return response()->json([
            'message' => 'OK',
            'data' => [
                'id' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
            ],
        ]);
    }

    public function index(): JsonResponse
    {
        try {
            $clients = $this->clientService->listAll();

            return response()->json([
                'message' => 'OK',
                'data' => $clients,
            ]);
        } catch (\Exception $e) {
            Log::error('ClientController@index', ['exception' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        try {
            $dto = $request->getCreateClientDTO();
            $client = $this->clientService->create($dto);

            return response()->json([
                'message' => 'Client created successfully',
                'data' => $client,
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('ClientController@store', ['exception' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function show(Request $request, int $client): JsonResponse
    {
        try {
            $clientModel = $this->clientService->getById($client);

            return response()->json([
                'message' => 'OK',
                'data' => $clientModel,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Client not found'], 404);
        } catch (\Exception $e) {
            Log::error('ClientController@show', ['exception' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
