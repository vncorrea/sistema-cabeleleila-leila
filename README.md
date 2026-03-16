# Cabeleleila Leila – Sistema de Agendamento (Salão de Beleza)

Monorepo com **backend Laravel** (API) e **frontend React** (Vite + shadcn + Tailwind).

**Vídeo de demonstração:** [https://youtu.be/62SiVqkZ-C8](https://youtu.be/62SiVqkZ-C8)  
Na pasta **`projeto/`** estão o link do vídeo e os **prints** do sistema (ver `projeto/README.md`).

---

## Como rodar na sua máquina

### Pré-requisitos

- **PHP 8.2+** e Composer
- **Node.js 18+** e npm
- **SQLite** (já vem com PHP) ou MySQL/PostgreSQL – o Laravel usa SQLite por padrão (arquivo `backend/database/database.sqlite`)

### 1. Backend (Laravel)

```bash
cd backend
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

A API fica em **http://localhost:8000**. Endpoints em **http://localhost:8000/api/v1/**.

**Autenticação:** Laravel Sanctum (Bearer token). Rotas públicas: `POST /auth/login`, `GET /salon-services`, `GET /clients/lookup`, `POST /appointments` (com optional_sanctum: aceita agendar com ou sem token; se logado como recepcionista/admin, pode enviar `assigned_user_id`). Demais rotas exigem `Authorization: Bearer <token>`.

**Contas do seed:**

| Papel           | E-mail                  | Senha    | Acesso |
|-----------------|-------------------------|----------|--------|
| Leila (admin)   | leila@cabeleleila.com   | leila123 | Tudo (inclui CRUD de usuários) |
| Cabelereira     | carla@cabeleleila.com   | carla123 | Início e Calendário (só agendamentos dela) |
| Recepcionista   | maria@cabeleleila.com   | maria123 | Agenda, Histórico, Equipe (sem Usuários) |

**Testes (backend):**

```bash
cd backend
php artisan test
```

---

### 2. Frontend (React)

Em **outro** terminal:

```bash
cd frontend
npm install
npx shadcn@latest add textarea collapsible checkbox tabs avatar
```

(Opcional) Crie `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Inicie o dev server:

```bash
npm run dev
```

Acesse **http://localhost:5173**.

---

### 3. Fluxo rápido

1. **Início** – Links; “Continuar sem login” leva à Área do cliente (acesso por e-mail).
2. **Agendar** – Com login: selecione cliente, cabelereira, data/hora e serviços. O select de horário mostra só horários livres da cabelereira escolhida (trava de agendamento). Sem login: preencha nome/e-mail/telefone e agende (se o e-mail já existir, o sistema usa o cliente cadastrado).
3. **Histórico** – Filtros opcionais (cliente, data início/fim). Ao abrir a página, carrega os últimos 30 dias. Sugestão de data quando o cliente já tem agendamento na semana.
4. **Equipe** – Lista de agendamentos; filtro por cabelereira; confirmar, cancelar, trocar cabelereira, reagendar (sem regra dos 2 dias).
5. **Área do cliente** – Acesso por e-mail; lista agendamentos; reagendar (respeitando 2 dias antes) e link para novo agendamento.
6. **Usuários** (só admin) – CRUD de cabelereiras e recepcionistas.

---

### Resumo dos comandos

| Onde      | Comandos |
|----------|----------|
| Backend  | `cd backend` → `cp .env.example .env` → `php artisan key:generate` → `php artisan migrate` → `php artisan db:seed` → `php artisan serve` |
| Frontend | `cd frontend` → `npm install` → (opcional) `frontend/.env` com `VITE_API_URL=http://localhost:8000/api/v1` → `npm run dev` |
| Testes   | `cd backend` → `php artisan test` |

Backend: http://localhost:8000  
Frontend: http://localhost:5173  

---

## Estrutura do projeto

- **`backend/`** – Laravel 12, API REST. Camadas: Controller → Form Request → DTO → Service → Repository. Fuso: America/Sao_Paulo (GMT-3). Mensagens de exceção em português.
- **`frontend/`** – React 19, Vite, shadcn/ui (Base UI), Tailwind CSS. Exibição de datas/horas no fuso do salão (America/Sao_Paulo).

---

## Escopo

- **Cliente (sem login):** agendar com nome/e-mail/telefone; área do cliente por e-mail; reagendar/cancelar até 2 dias antes; histórico por período; sugestão de agendar no mesmo dia quando já tem agendamento na semana.
- **Recepcionista/Admin:** agendar com cliente e cabelereira; horários disponíveis por cabelereira (trava); histórico com filtros opcionais; equipe com filtro por cabelereira, troca de cabelereira e reagendar sem limite de 2 dias.
- **Cabelereira:** só vê Início e Calendário (agendamentos atribuídos a ela).
- **Admin:** além do acima, CRUD de usuários (cabelereira/recepcionista).

---

## Regras de negócio

- **Regra dos 2 dias:** alteração/cancelamento pelo **cliente** só até 2 dias antes do agendamento; com menos de 2 dias, apenas a **equipe** pode alterar/cancelar (`by_staff`).
- **Trava de agendamento:** ao escolher data e cabelereira, o sistema exibe apenas horários em que a cabelereira está livre; o backend valida conflito ao criar.
- **Sugestão:** se o cliente já tem agendamento na mesma semana, o histórico sugere essa data para agendar outros serviços no mesmo dia.
- **Cliente por e-mail:** em agendamento sem login, se o e-mail já existir, o sistema usa o cliente cadastrado (evita duplicata). Endpoint `GET /clients/lookup?email=` para pré-preencher dados no frontend.
