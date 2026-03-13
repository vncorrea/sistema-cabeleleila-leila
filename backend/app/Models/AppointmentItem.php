<?php

namespace App\Models;

use App\Enums\AppointmentItemStatusEnum;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentItem extends Model
{
    protected $fillable = [
        'appointment_id',
        'salon_service_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => AppointmentItemStatusEnum::class,
        ];
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function salonService(): BelongsTo
    {
        return $this->belongsTo(SalonService::class, 'salon_service_id');
    }
}
