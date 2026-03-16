# Cabeleleila Leila – Sistema de Agendamento (Salão de Beleza)

Sistema para agendamento de serviços em salão de beleza: o cliente pode agendar pela web (com ou sem login), ver e reagendar seus agendamentos pela área do cliente; a equipe (recepcionista e admin) agenda, confirma, cancela e gerencia os horários; a cabelereira vê só seu calendário; o admin ainda gerencia usuários (cabelereiras e recepcionistas).

**Vídeo de demonstração:** [https://youtu.be/62SiVqkZ-C8](https://youtu.be/62SiVqkZ-C8)  
Na pasta **`projeto/`** ficam o link do vídeo e os **prints** do sistema (ver `projeto/README.md`).

---

## Como rodar na sua máquina

### Pré-requisitos

- **PHP 8.2+** e Composer  
- **Node.js 18+** e npm  
- **SQLite** (já vem com PHP) ou MySQL/PostgreSQL

### 1. Backend

```bash
cd backend
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

A API sobe em **http://localhost:8000**.  
Após o seed, use estas contas para testar:

| Papel           | E-mail                  | Senha    | Acesso |
|-----------------|-------------------------|----------|--------|
| Leila (admin)   | leila@cabeleleila.com   | leila123 | Tudo (inclui usuários) |
| Cabelereira     | carla@cabeleleila.com   | carla123 | Início e Calendário |
| Recepcionista   | maria@cabeleleila.com   | maria123 | Início, Agendar, Histórico, Equipe |

**Testes:**

```bash
cd backend
php artisan test
```

### 2. Frontend

Em **outro** terminal:

```bash
cd frontend
npm install
npx shadcn@latest add textarea collapsible checkbox tabs avatar
```

(Opcional) Crie `frontend/.env` com:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Depois:

```bash
npm run dev
```

Acesse **http://localhost:5173**.

---

### 3. Fluxo rápido

1. **Início** – Links; “Continuar sem login” leva à Área do cliente (acesso por e-mail).
2. **Agendar** – Com login: cliente, cabelereira, data/hora e serviços (só aparecem horários livres da cabelereira). Sem login: nome, e-mail, telefone e serviços (se o e-mail já existir, o sistema usa o cliente cadastrado).
3. **Histórico** – Filtros opcionais (cliente, datas). Ao abrir, carrega os últimos 30 dias. Sugere data quando o cliente já tem agendamento na semana.
4. **Equipe** – Lista de agendamentos; filtro por cabelereira; confirmar, cancelar, trocar cabelereira, reagendar.
5. **Área do cliente** – Acesso por e-mail; lista de agendamentos; reagendar (quando permitido) e link para novo agendamento.
6. **Usuários** (só admin) – Criar, editar e excluir cabelereiras e recepcionistas.

---

### Resumo dos comandos

| Onde      | Comandos |
|----------|----------|
| Backend  | `cd backend` → `cp .env.example .env` → `php artisan key:generate` → `php artisan migrate` → `php artisan db:seed` → `php artisan serve` |
| Frontend | `cd frontend` → `npm install` → (opcional) `frontend/.env` → `npm run dev` |
| Testes   | `cd backend` → `php artisan test` |

Backend: http://localhost:8000  
Frontend: http://localhost:5173  

---

## Pastas

- **`backend/`** – API (Laravel). Responsável pelos dados, regras e autenticação.
- **`frontend/`** – Interface em React (Vite + Tailwind). Onde o usuário acessa o sistema no navegador.
- **`projeto/`** – Vídeo de demonstração e prints do sistema.

---

## Regras de negócio

- **Dois dias antes:** o cliente só pode alterar ou cancelar até 2 dias antes do horário. Com menos de 2 dias, só a equipe pode fazer isso.
- **Horário por cabelereira:** ao agendar com uma cabelereira, o sistema mostra só os horários em que ela está livre; não permite marcar em horário já ocupado.
- **Sugestão no histórico:** se o cliente já tem agendamento na semana, o histórico sugere essa data para agendar outros serviços no mesmo dia.
- **Cliente por e-mail:** no agendamento sem login, se o e-mail já estiver cadastrado, o sistema usa esse cliente em vez de criar outro.
