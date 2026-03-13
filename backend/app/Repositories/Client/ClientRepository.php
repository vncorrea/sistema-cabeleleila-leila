<?php

namespace App\Repositories\Client;

use App\Models\Client;
use Illuminate\Database\Eloquent\Collection;

class ClientRepository
{
    public function getById(int $id): ?Client
    {
        return Client::find($id);
    }

    public function getByIdOrFail(int $id): Client
    {
        return Client::findOrFail($id);
    }

    public function create(array $data): Client
    {
        return Client::create($data);
    }

    public function update(Client $client, array $data): Client
    {
        $client->update($data);

        return $client->fresh();
    }

    /**
     * @return Collection<int, Client>
     */
    public function listAll(): Collection
    {
        return Client::orderBy('name')->get();
    }

    public function findByEmail(string $email): ?Client
    {
        return Client::where('email', $email)->first();
    }
}
