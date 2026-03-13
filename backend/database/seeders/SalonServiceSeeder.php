<?php

namespace Database\Seeders;

use App\Models\SalonService;
use Illuminate\Database\Seeder;

class SalonServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            ['name' => 'Haircut', 'duration_minutes' => 45, 'price' => 50.00, 'description' => 'Classic haircut'],
            ['name' => 'Coloring', 'duration_minutes' => 120, 'price' => 150.00, 'description' => 'Full hair coloring'],
            ['name' => 'Manicure', 'duration_minutes' => 60, 'price' => 35.00, 'description' => 'Nail care and polish'],
            ['name' => 'Pedicure', 'duration_minutes' => 60, 'price' => 45.00, 'description' => 'Foot care and polish'],
            ['name' => 'Blow dry', 'duration_minutes' => 30, 'price' => 25.00, 'description' => 'Styling and blow dry'],
        ];

        foreach ($services as $service) {
            SalonService::firstOrCreate(
                ['name' => $service['name']],
                $service
            );
        }
    }
}
