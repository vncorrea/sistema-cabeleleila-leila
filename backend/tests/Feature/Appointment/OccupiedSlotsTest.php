<?php

namespace Tests\Feature\Appointment;

use App\Models\Appointment;
use App\Models\Client;
use App\Models\User;
use App\Enums\UserRoleEnum;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OccupiedSlotsTest extends TestCase
{
    use RefreshDatabase;

    public function test_occupied_slots_returns_authenticated_user_occupied_times(): void
    {
        $professional = User::factory()->create(['role' => UserRoleEnum::Professional]);
        $receptionist = User::factory()->create(['role' => UserRoleEnum::Receptionist]);
        $client = Client::create(['name' => 'Test Client', 'email' => 'client@test.com', 'phone' => null]);

        $date = '2026-03-20';
        $startsAt = Carbon::parse($date . ' 09:00:00', 'America/Sao_Paulo');

        Appointment::create([
            'client_id' => $client->id,
            'assigned_user_id' => $professional->id,
            'starts_at' => $startsAt,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($receptionist)
            ->getJson('/api/v1/appointments/occupied-slots?date=' . $date . '&assigned_user_id=' . $professional->id);

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'OK');
        $response->assertJsonPath('data.occupied_slots', ['09:00']);
    }

    public function test_occupied_slots_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/appointments/occupied-slots?date=2026-03-20&assigned_user_id=1');

        $response->assertStatus(401);
    }

    public function test_occupied_slots_validates_date_and_assigned_user_id(): void
    {
        $receptionist = User::factory()->create(['role' => UserRoleEnum::Receptionist]);

        $response = $this->actingAs($receptionist)
            ->getJson('/api/v1/appointments/occupied-slots');

        $response->assertStatus(422);
    }
}
