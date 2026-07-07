# Assistência Técnica + E-commerce

Aplicação full-stack para gestão de uma operação de assistência técnica com catálogo de produtos, agendamento de serviços, checkout e painel administrativo.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite) ![Node.js](https://img.shields.io/badge/Node.js-Available-339933?logo=node.js) ![Express](https://img.shields.io/badge/Express-5-000000?logo=express) ![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Available-4169E1?logo=postgresql) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss) ![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens) ![Google OAuth](https://img.shields.io/badge/Google%20OAuth-Enabled-4285F4?logo=google) ![Mercado Pago](https://img.shields.io/badge/Mercado%20Pago-Enabled-00B1EA) ![License](https://img.shields.io/badge/License-ISC-8A2BE2)

---

## 📌 Índice

- [Sobre o projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Scripts](#-scripts)
- [Integrações](#-integrações)
- [Deploy](#-deploy)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)
- [Autor](#-autor)

---

## 🧭 Sobre o projeto

Este repositório reúne um sistema completo para operar um negócio de assistência técnica com uma camada comercial estruturada. A solução conta com:

- uma interface pública para clientes;
- um fluxo de catálogo e compra;
- um módulo de agendamento de serviços;
- um painel administrativo para gestão operacional;
- integração com pagamentos e autenticação.

A proposta é oferecer uma base sólida para apresentar um projeto de portfólio com arquitetura organizada, integração real e experiência de uso completa.

---

## 🧩 Funcionalidades

### Público / cliente

- ✅ Catálogo de produtos
- ✅ Página de detalhes do produto
- ✅ Página de serviços e agendamento
- ✅ Cadastro de clientes
- ✅ Login de clientes
- ✅ Recuperação de senha
- ✅ Verificação de e-mail
- ✅ Login com Google
- ✅ Área logada para pedidos e agendamentos
- ✅ Checkout com Mercado Pago

### Administração

- ✅ Login administrativo
- ✅ Dashboard com visão geral
- ✅ CRUD de categorias
- ✅ CRUD de produtos
- ✅ Gestão de clientes
- ✅ Gestão de pedidos
- ✅ Gestão de agendamentos
- ✅ Upload de imagens de produtos
- ✅ Responsividade em telas menores

---

## 🛠️ Tecnologias

### Frontend

| Tecnologia | Uso |
| --- | --- |
| React | Interface do usuário |
| Vite | Build e desenvolvimento rápido |
| React Router | Rotas públicas e privadas |
| Tailwind CSS | Estilização da interface |
| Lucide React | Ícones visuais |

### Backend

| Tecnologia | Uso |
| --- | --- |
| Node.js | Runtime da API |
| Express | Servidor e rotas REST |
| Prisma | ORM e acesso ao banco |
| Zod | Validação de dados |
| JWT | Autenticação |
| Multer | Upload de arquivos |

### Banco e armazenamento

| Tecnologia | Uso |
| --- | --- |
| PostgreSQL | Banco relacional principal |
| Upload local | Armazenamento de imagens em [backend/uploads](backend/uploads) |

### Integrações

| Tecnologia | Uso |
| --- | --- |
| Google OAuth | Autenticação de clientes via Google |
| Mercado Pago | Criação de preferências de pagamento |
| Resend | Envio de e-mails de verificação e recuperação |

---

## 🏗️ Arquitetura

O projeto está organizado em dois módulos principais:

- [frontend](frontend): aplicação web para clientes e administração
- [backend](backend): API REST, regras de negócio e integração com banco de dados

Estrutura principal:

```text
assistencia-tecnica/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   └── validators/
│   └── uploads/
├── frontend/
│   ├── public/
│   └── src/
│       ├── admin/
│       ├── components/
│       ├── pages/
│       ├── routes/
│       └── services/
└── README.md
```

---

## 🚀 Instalação

### 1. Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL disponível para conexão

### 2. Clone o repositório

```bash
git clone <url-do-repositorio>
cd assistencia-tecnica
```

### 3. Backend

```bash
cd backend
npm install
```

### 4. Frontend

```bash
cd ../frontend
npm install
```

### 5. Banco de dados

```bash
cd ../backend
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

### 6. Execução local

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

---

## ⚙️ Variáveis de ambiente

### Backend

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta do servidor backend |
| `DATABASE_URL` | String de conexão com o PostgreSQL |
| `DIRECT_URL` | URL direta do banco, utilizada em alguns ambientes |
| `JWT_SECRET` | Segredo para autenticação do painel administrativo |
| `JWT_CLIENT_SECRET` | Segredo para autenticação de clientes |
| `FRONTEND_URL` | URL do frontend usada em e-mails |
| `CORS_ORIGINS` | Origens permitidas para o CORS |
| `GOOGLE_CLIENT_ID` | Credencial do Google OAuth |
| `MERCADO_PAGO_ACCESS_TOKEN` | Token de acesso para pagamentos |
| `RESEND_API_KEY` | Chave da API do Resend |
| `RESEND_FROM_EMAIL` | E-mail remetente para envios |

Exemplo mínimo:

```env
PORT=3000
DATABASE_URL=postgresql://usuario:senha@localhost:5432/assistencia
DIRECT_URL=postgresql://usuario:senha@localhost:5432/assistencia
JWT_SECRET=seu_jwt_secret
JWT_CLIENT_SECRET=seu_jwt_client_secret
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

---

## 📜 Scripts

| Pasta | Script | Função |
| --- | --- | --- |
| Backend | `npm run dev` | Inicia o servidor em modo desenvolvimento |
| Backend | `npm run start` | Inicia o servidor em modo produção |
| Backend | `npm run db:migrate` | Executa migrações do Prisma |
| Backend | `npm run db:generate` | Gera cliente Prisma |
| Backend | `npm run db:seed` | Popula dados iniciais |
| Frontend | `npm run dev` | Inicia o Vite localmente |
| Frontend | `npm run build` | Gera build de produção |
| Frontend | `npm run lint` | Executa ESLint |
| Frontend | `npm run preview` | Visualiza a build localmente |

---

## 🔄 Fluxo do sistema

```mermaid
flowchart TD
    A[Cliente] --> B[Login ou cadastro]
    B --> C[Catálogo de produtos]
    C --> D[Agendamento ou checkout]
    D --> E[Mercado Pago]
    E --> F[Webhook de atualização]
    F --> G[Pedido e status atualizados]
```

---

## 🔗 Integrações

- Mercado Pago: criação de preferências de pagamento e atualização via webhook.
- Google OAuth: autenticação de clientes por meio do Google.
- Resend: envio de e-mails de verificação e recuperação de senha.
- Upload de imagens: arquivos salvos no backend para uso em produtos.

---

## 🚢 Deploy

- O frontend possui configuração para deploy em ambientes compatíveis com Vite e já inclui suporte para Vercel em [frontend/vercel.json](frontend/vercel.json).
- O backend pode ser publicado em ambientes compatíveis com Node.js e Express, com a base PostgreSQL configurada via variáveis de ambiente.

---

## 📸 Screenshots

> Placeholder para imagem da home do projeto.

### 🏠 Home

> Adicionar screenshot da página inicial aqui.

### 🛍️ Catálogo

> Adicionar screenshot do catálogo de produtos aqui.

### 📄 Produto

> Adicionar screenshot da página de detalhes do produto aqui.

### 🛒 Checkout

> Adicionar screenshot do fluxo de checkout aqui.

### 📱 Área do cliente

> Adicionar screenshot da área logada do cliente aqui.

### ⚙️ Dashboard Admin

> Adicionar screenshot do painel administrativo aqui.

### 📦 Produtos

> Adicionar screenshot da gestão de produtos aqui.

### 👥 Clientes

> Adicionar screenshot da gestão de clientes aqui.

### 📋 Pedidos

> Adicionar screenshot da gestão de pedidos aqui.

### 📅 Agendamentos

> Adicionar screenshot da gestão de agendamentos aqui.

---

## 🗺️ Roadmap

Próximas melhorias planejadas:

- 🔐 Refinos no fluxo de autenticação
- 📸 Captura de imagem pela câmera no celular
- 📊 Dashboard com métricas mais detalhadas
- 🧾 Relatórios em PDF
- 📦 Controle avançado de estoque
- 🔔 Notificações em tempo real

---

## 👤 Autor

Nome: Seu nome

GitHub: seu-github

LinkedIn: seu-linkedin

Email: seu-email@exemplo.com

---

## 🤝 Contribuição

Contribuições são bem-vindas. Para sugestões ou melhorias, abra uma issue ou envie um pull request com contexto claro.
