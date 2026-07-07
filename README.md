# Assistência Técnica + E-commerce

Aplicação full-stack para gerenciar um negócio de assistência técnica com um catálogo de produtos, agendamento de serviços, checkout para pagamentos e um painel administrativo completo.

O projeto foi estruturado com um frontend em React/Vite, um backend em Express e Prisma, e uma base de dados PostgreSQL. Ele contempla tanto a experiência pública para clientes quanto o painel interno para gestão operacional.

## Visão geral

Este sistema permite:

- Expor um site público com catálogo de produtos, detalhes de produtos, serviços e páginas institucionais.
- Permitir que clientes se cadastrem, façam login, recuperem senha e acompanhem pedidos e agendamentos.
- Oferecer um painel administrativo para criar e editar categorias, produtos, clientes, pedidos e agendamentos.
- Processar pagamentos com Mercado Pago e receber webhooks de atualização de status.
- Fazer upload de imagens de produtos e servir os arquivos através do backend.

## Stack principal

| Camada | Tecnologias |
| --- | --- |
| Frontend | React, Vite, React Router, Tailwind CSS, Lucide React |
| Backend | Node.js, Express, Prisma, PostgreSQL, JWT, Zod, Multer |
| Autenticação | JWT para painel/admin, JWT para clientes, login com Google |
| Integrações | Mercado Pago, Resend (e-mails), Google OAuth |
| Qualidade | ESLint, middleware de validação e tratamento de erros |

## Funcionalidades principais

### Público / cliente
- Catálogo de produtos com destaque e filtros.
- Página de detalhes do produto.
- Página de serviços e agendamento de assistência técnica.
- Cadastro e login de clientes.
- Recuperação de senha e confirmação de e-mail.
- Área logada com pedidos e agendamentos.
- Checkout com integração ao Mercado Pago.

### Administração
- Login de usuários administrativos.
- Dashboard com visão geral de dados.
- CRUD de categorias e produtos.
- Gestão de clientes, pedidos e agendamentos.
- Upload de imagens para produtos.

## Arquitetura

O repositório está organizado em dois módulos principais:

- Frontend: interface web em [frontend](frontend)
- Backend: API REST e regras de negócio em [backend](backend)

Estrutura principal:

- [frontend/src](frontend/src): páginas, rotas, componentes, contexto e serviços do cliente/admin.
- [backend/src](backend/src): controllers, services, middlewares, validators, routes e configuração da API.
- [backend/prisma](backend/prisma): schema do Prisma e migrações.
- [backend/uploads](backend/uploads): armazenamento local de imagens enviadas para produtos.

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL configurado via `DATABASE_URL` (ou `DIRECT_URL`)
- Chaves de ambiente para integrações opcionais: Mercado Pago, Google OAuth e Resend

## Configuração local

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd assistencia-tecnica
```

### 2. Instale as dependências

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Configure as variáveis de ambiente

No backend, crie um arquivo `.env` com as seguintes variáveis mínimas:

```env
PORT=3000
DATABASE_URL=postgresql://usuario:senha@localhost:5432/assistencia
DIRECT_URL=postgresql://usuario:senha@localhost:5432/assistencia
JWT_SECRET=seu_jwt_secret
JWT_CLIENT_SECRET=seu_jwt_client_secret
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

Variáveis adicionais recomendadas:

```env
GOOGLE_CLIENT_ID=seu_google_client_id
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token
RESEND_API_KEY=sua_chave_resend
RESEND_FROM_EMAIL=noreply@seu-dominio.com
```

### 4. Prepare o banco de dados

```bash
cd backend
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

### 5. Execute o projeto

Terminal 1 — backend:

```bash
cd backend
npm run dev
```

Terminal 2 — frontend:

```bash
cd frontend
npm run dev
```

A aplicação ficará disponível em:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Scripts disponíveis

### Backend

```bash
npm run dev
npm run start
npm run db:migrate
npm run db:generate
npm run db:seed
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Integrações

- Mercado Pago: criação de preferências de pagamento e recebimento de webhooks.
- Google OAuth: autenticação de clientes via Google.
- Resend: envio de e-mails de verificação e recuperação de senha.
- Upload de imagens: arquivos enviados pelo painel admin são salvos localmente em [backend/uploads/produtos](backend/uploads/produtos).

## Observações de implementação

- O backend expõe rotas REST para produtos, categorias, clientes, pedidos, agendamentos, uploads, autenticação e webhooks.
- O frontend possui rotas públicas e uma área protegida para clientes e administradores.
- A interface foi pensada para funcionar bem em dispositivos móveis e desktops.

## Contribuição

Contribuições são bem-vindas. Para alterações relevantes, recomenda-se:

1. Criar uma branch para a mudança.
2. Implementar a funcionalidade ou correção.
3. Validar o fluxo no frontend e backend.
4. Abrir um pull request com contexto claro.

## Licença

Licença definida no projeto como ISC.
