<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalonService extends Model
{
    protected $fillable = [
        'name',
        'duration_minutes',
        'price',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'duration_minutes' => 'integer',
            'price' => 'decimal:2',
        ];
    }

    public function appointmentItems(): HasMany
    {
        return $this->hasMany(AppointmentItem::class, 'salon_service_id');
    }
}
