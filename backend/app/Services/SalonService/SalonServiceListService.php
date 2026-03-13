<?php

namespace App\Services\SalonService;

use App\Repositories\SalonService\SalonServiceRepository;
use Illuminate\Database\Eloquent\Collection;

class SalonServiceListService
{
    public function __construct(
        private readonly SalonServiceRepository $salonServiceRepository
    ) {
    }

    /**
     * @return Collection<int, \App\Models\SalonService>
     */
    public function listAll(): Collection
    {
        return $this->salonServiceRepository->listAll();
    }
}
