<?php

namespace App\Repositories\SalonService;

use App\Models\SalonService;
use Illuminate\Database\Eloquent\Collection;

class SalonServiceRepository
{
    public function getById(int $id): ?SalonService
    {
        return SalonService::find($id);
    }

    public function getByIdOrFail(int $id): SalonService
    {
        return SalonService::findOrFail($id);
    }

    /**
     * @return Collection<int, SalonService>
     */
    public function listAll(): Collection
    {
        return SalonService::orderBy('name')->get();
    }

    /**
     * @param  array<int>  $ids
     * @return Collection<int, SalonService>
     */
    public function getByIds(array $ids): Collection
    {
        return SalonService::whereIn('id', $ids)->get();
    }
}
