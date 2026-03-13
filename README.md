# Cabeleleila Leila – Sistema de Agendamento (Salão de Beleza)

Monorepo com **backend Laravel** (API) e **frontend React** (Vite + shadcn + Tailwind).

---

## Como rodar na sua máquina

### Pré-requisitos

- **PHP 8.2+** e Composer
- **Node.js 18+** e npm
- **SQLite** (já vem com PHP) ou MySQL/PostgreSQL – o Laravel usa SQLite por padrão (arquivo `backend/database/database.sqlite`)

### 1. Backend (Laravel)

Abra um terminal na pasta do projeto:

```bash
cd backend
```

Copie o ambiente e gere a chave da aplicação:

```bash
cp .env.example .env
php artisan key:generate
```

O `.env` já vem configurado para SQLite. Se quiser usar MySQL/PostgreSQL, edite as variáveis `DB_*` no `.env`.

Rode as migrations e os seeders (cria as tabelas e insere os serviços do salão):

```bash
php artisan migrate
php artisan db:seed
```

Suba o servidor da API:

```bash
php artisan serve
```

A API fica em **http://localhost:8000**.  
Os endpoints da aplicação estão em **http://localhost:8000/api/v1/** (ex.: `GET /api/v1/salon-services`, `POST /api/v1/appointments`).

**Autenticação:** a API usa **Laravel Sanctum** com Bearer token. Rotas públicas: `POST /auth/login`, `GET /salon-services`, `POST /appointments` (permite agendar sem login com nome/e-mail do cliente). As demais rotas exigem o header `Authorization: Bearer <token>`.

**Contas do seed (após `php artisan db:seed`):**

| Papel           | E-mail                  | Senha    | Acesso |
|-----------------|-------------------------|----------|--------|
| Leila (admin)   | leila@cabeleleila.com   | leila123 | Tudo   |
| Cabelereira     | carla@cabeleleila.com   | carla123 | Só agendamentos atribuídos a ela |
| Recepcionista   | maria@cabeleleila.com   | maria123 | Agenda e pode agendar |

Deixe esse terminal aberto enquanto usa o sistema.

---

### 2. Frontend (React)

Abra **outro** terminal na pasta do projeto:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Instale os componentes de UI do shadcn usados pelo projeto (textarea, collapsible, checkbox, tabs, avatar). Se perguntar se quer sobrescrever arquivo existente, responda `y`:

```bash
npx shadcn@latest add textarea collapsible checkbox tabs avatar
```

(Opcional) Crie um arquivo `.env` na pasta `frontend` para o frontend saber onde está a API:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Se não criar o `.env`, o frontend usa essa mesma URL por padrão.

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O Vite deve mostrar algo como:

```
  ➜  Local:   http://localhost:5173/
```

Acesse **http://localhost:5173** no navegador. Você deve ver a tela inicial do Cabeleleila Leila.

---

### 3. Testando o fluxo

1. **Início** – Página inicial com links.
2. **Agendar** – Abra “Cadastrar novo cliente”, preencha nome e e-mail, cadastre. Depois selecione o cliente, data/hora e um ou mais serviços e clique em “Agendar”.
3. **Histórico** – Escolha o cliente e um período (data início e fim) e clique em “Buscar”. Se já existir agendamento na semana, aparece a sugestão de agendar outros serviços no mesmo dia.
4. **Equipe** – Lista de agendamentos; é possível “Confirmar” e “Cancelar” (com confirmação).

---

### Resumo dos comandos

| Onde      | Comandos |
|----------|----------|
| Backend  | `cd backend` → `cp .env.example .env` → `php artisan key:generate` → `php artisan migrate` → `php artisan db:seed` → `php artisan serve` |
| Frontend | `cd frontend` → `npm install` → (opcional) criar `frontend/.env` com `VITE_API_URL=http://localhost:8000/api/v1` → `npm run dev` |

Backend: http://localhost:8000  
Frontend: http://localhost:5173  

---

## Estrutura do projeto

- **`backend/`** – Laravel 12, API REST. Camadas: Controller → Form Request → DTO → Service → **Repository** (acesso ao banco).
- **`frontend/`** – React 19, Vite, shadcn/ui, Tailwind CSS.

## Escopo

- **Cliente:** agendar um ou mais serviços; alterar/cancelar até 2 dias antes; histórico por período; sugestão de agendar outros serviços no mesmo dia quando já existe agendamento na semana.
- **Equipe:** listar agendamentos, confirmar, alterar (incluindo com menos de 2 dias), gerenciar status dos itens do agendamento.

## Regras de negócio

- Alteração/cancelamento pelo **cliente** só até **2 dias antes** do agendamento; com menos de 2 dias, a alteração é feita pela **equipe** (`by_staff`).
- **Sugestão:** se o cliente já tem agendamento na mesma semana, o sistema sugere a data desse agendamento para agendar outros serviços no mesmo dia.
