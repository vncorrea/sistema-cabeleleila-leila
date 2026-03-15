<?php

namespace App\Services\Client;

use App\DTO\Client\CreateClientDTO;
use App\Models\Client;
use App\Repositories\Client\ClientRepository;
use InvalidArgumentException;

class ClientService
{
    public function __construct(
        private readonly ClientRepository $clientRepository
    ) {
    }

    public function create(CreateClientDTO $dto): Client
    {
        $existing = $this->clientRepository->findByEmail($dto->email);

        if ($existing !== null) {
            throw new InvalidArgumentException('A client with this email already exists.');
        }

        $data = $dto->toCollection()->filter(fn ($value) => $value !== null)->all();

        return $this->clientRepository->create($data);
    }

    public function getById(int $id): Client
    {
        return $this->clientRepository->getByIdOrFail($id);
    }

    public function findByEmail(string $email): ?Client
    {
        return $this->clientRepository->findByEmail($email);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, Client>
     */
    public function listAll(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->clientRepository->listAll();
    }
}
