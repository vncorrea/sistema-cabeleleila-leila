<?php

namespace App\Services\Client;

use App\DTO\Client\CreateClientDTO;
use App\Models\Client;
use App\Repositories\Client\ClientRepository;
use Illuminate\Database\Eloquent\Collection;
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
            throw new InvalidArgumentException('Já existe um cliente com este e-mail.');
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
     * @return Collection<int, Client>
     */
    public function listAll(): Collection
    {
        return $this->clientRepository->listAll();
    }
}
