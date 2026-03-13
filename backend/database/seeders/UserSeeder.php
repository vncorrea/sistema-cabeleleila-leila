<?php

namespace Database\Seeders;

use App\Enums\UserRoleEnum;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Leila Santos',
                'email' => 'leila@cabeleleila.com',
                'password' => Hash::make('leila123'),
                'role' => UserRoleEnum::Admin,
            ],
            [
                'name' => 'Carla Mendes',
                'email' => 'carla@cabeleleila.com',
                'password' => Hash::make('carla123'),
                'role' => UserRoleEnum::Professional,
            ],
            [
                'name' => 'Maria Recepcionista',
                'email' => 'maria@cabeleleila.com',
                'password' => Hash::make('maria123'),
                'role' => UserRoleEnum::Receptionist,
            ],
        ];

        foreach ($users as $data) {
            User::updateOrCreate(
                ['email' => $data['email']],
                $data
            );
        }
    }
}
