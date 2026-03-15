<?php

namespace App\Http\Controllers\User;

use App\Enums\UserRoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function professionals(): JsonResponse
    {
        $users = User::query()
            ->where('role', UserRoleEnum::Professional)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return response()->json([
            'message' => 'OK',
            'data' => $users,
        ]);
    }

    public function index(\Illuminate\Http\Request $request): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $users = User::query()
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return response()->json([
            'message' => 'OK',
            'data' => $users,
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'data' => $user->only(['id', 'name', 'email', 'role']),
        ], 201);
    }

    public function update(UpdateUserRequest $request, int $user): JsonResponse
    {
        $model = User::findOrFail($user);

        if ($model->isAdmin()) {
            return response()->json(['message' => 'Cannot edit admin user'], 422);
        }

        $validated = $request->validated();
        if (isset($validated['name'])) {
            $model->name = $validated['name'];
        }
        if (isset($validated['email'])) {
            $model->email = $validated['email'];
        }
        if (! empty($validated['password'])) {
            $model->password = Hash::make($validated['password']);
        }
        if (isset($validated['role'])) {
            $model->role = $validated['role'];
        }
        $model->save();

        return response()->json([
            'message' => 'User updated successfully',
            'data' => $model->only(['id', 'name', 'email', 'role']),
        ]);
    }

    public function destroy(\Illuminate\Http\Request $request, int $user): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $model = User::findOrFail($user);

        if ($model->isAdmin()) {
            return response()->json(['message' => 'Cannot delete admin user'], 422);
        }

        try {
            $model->delete();

            return response()->json([
                'message' => 'User deleted successfully',
            ]);
        } catch (Exception $e) {
            Log::error('UserController@destroy', ['exception' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
