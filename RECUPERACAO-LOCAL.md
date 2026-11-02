# Recuperacao local JFQ — 2026-11-02

## Atualizacao final — ambiente local operacional

Esta secao substitui o estado inicial registrado no historico abaixo.

### Componentes e servicos

- Frontend existente preservado, em http://localhost:5173 (bind 127.0.0.1).
- Backend em http://localhost:3000, modo development com bind 127.0.0.1.
- Neon conectado ao NOVO projeto vazio `jfq-development`, ID
  `autumn-rain-12939944`, branch `main` / `br-jolly-pine-b8g7sy9k`.
  Criado na organizacao com plano free, compute 0.25 CU; sem alteracao de plano.
- O projeto de producao `billowing-smoke-43121817` nao foi usado em conexoes SQL.
  A branch production continua archived com updated_at inalterado na verificacao final.
- Vercel, Render, Google Cloud, Mercado Pago, Resend, Cloudinary e Telegram nao
  tiveram seus paineis autenticados acessados: nao ha conexao correspondente nem
  ferramenta de controle do Brave disponivel nesta sessao. Nenhum servico hospedado
  foi alterado. A autorizacao do usuario nao estabelece uma conexao de ferramenta.

### Banco e seguranca

- O projeto foi criado vazio; consulta inicial retornou zero tabelas. Nao deriva de
  uma copia de production e nao contem dados reais de clientes.
- Sete migrations existentes aplicadas somente ao novo projeto.
- O teste de login encontrou uma lacuna no historico: tabelas refresh_tokens e
  client_refresh_tokens estavam no schema mas nao nas migrations.
- Migration ADITIVA `20261102070000_add_missing_refresh_tokens` criada e aplicada
  SOMENTE no banco de desenvolvimento. Oito migrations concluidas; comparacao do
  banco com schema.prisma sem diferencas.
- Admin, categorias, produtos e um cliente ficticios criados; os testes preservam
  os dados sinteticos para exploracao local, sem excluir dados existentes.
- `db:migrate:local`, setup e smoke verificam o hostname exato do novo projeto.
  Nao usar os scripts genericos de migrate/reset/seed do README nesta recuperacao.
- backend/.env e frontend/.env com permissao 0600 e ignorados; sem commit/push.
- Nenhuma credencial secreta de producao foi recuperada ou reutilizada.

### Variaveis configuradas (somente nomes)

Frontend: VITE_API_URL, VITE_GOOGLE_CLIENT_ID.

Backend: NODE_ENV, HOST, PORT, DATABASE_URL, DEV_DATABASE_HOST, JWT_SECRET,
JWT_CLIENT_SECRET, JWT_EXPIRES_IN, JWT_CLIENT_EXPIRES_IN, REFRESH_TOKEN_TTL_DAYS,
CHECKOUT_TOKEN_TTL_MINUTES, GOOGLE_CLIENT_ID, FRONTEND_URL, CORS_ORIGINS, LOG_LEVEL,
EMAIL_TRANSPORT, TELEGRAM_TRANSPORT, UPLOAD_DRIVER, DEV_ADMIN_EMAIL,
DEV_ADMIN_PASSWORD, MERCADO_PAGO_SUCCESS_URL, MERCADO_PAGO_FAILURE_URL,
MERCADO_PAGO_PENDING_URL.

DATABASE_URL veio do novo projeto Neon e usa o endpoint direto para o backend
persistente e migrations. JWTs e senha administrativa foram gerados localmente.
GOOGLE_CLIENT_ID e VITE_GOOGLE_CLIENT_ID foram recuperados do JavaScript publico
do JFQ, sem chave secreta. Demais valores sao configuracoes locais.

As credenciais do admin local ficam SOMENTE nas variaveis DEV_ADMIN_EMAIL e
DEV_ADMIN_PASSWORD de backend/.env; abrir esse arquivo privadamente para login
em http://localhost:5173/admin/login . Nao compartilhar o arquivo ou sua captura.

### Integracoes locais

- EMAIL_TRANSPORT=mock: evita a instanciacao do Resend em desenvolvimento. Cadastro,
  verificacao, recuperacao e notificacao administrativa simulam envio; logs nao
  incluem destinatario, corpo, token ou link. Nao ha caixa de entrada de e-mails;
  o teste de confirmacao/reset prepara tokens sinteticos apenas para o cliente
  ficticio que acabou de criar, sem alterar o fluxo de autenticacao da aplicacao.
- TELEGRAM_TRANSPORT=mock: mensagens nao sao enviadas e seu conteudo nao e logado.
- UPLOAD_DRIVER=local: imagens ficam em backend/uploads/dev/ (ignorado pelo Git),
  servidas pela API local; Cloudinary nao e chamado.
- Os tres modos so funcionam com NODE_ENV=development. Producao continua usando
  os provedores originais; nenhum deploy foi feito.
- Google OAuth: client IDs publicos configurados e backend recarregado. O frontend
  usa idToken; nao precisa de client secret ou callback GET nesse fluxo. Origens
  autorizadas e login interativo ainda nao puderam ser verificados. Nao foi feita
  alteracao no Google Cloud e nenhum login bem-sucedido Google e afirmado.
- Mercado Pago: access tokens e webhook secret continuam vazios. Nao foi possivel
  acessar as credenciais TEST da conta. Checkout externo/webhook nao estao operacionais;
  nenhum pagamento foi criado, real ou de teste. Nao preencher com credenciais live.

### Verificacoes finais

- npm test: 4 testes aprovados, incluindo ausencia de envio/log de dados sensiveis
  nos mocks, impossibilidade de ativar mock de email em production sem a chave
  real e recusa de host incorreto por runtime e migrador.
- npm run test:local: frontend HTTP 200, API health/CORS, protecao 401,
  validacao 400, login admin/me/refresh/logout, cadastro e login cliente,
  leitura de pedidos, forgot-password, verify-email e reset-password: PASS.
- Criacao/leitura/atualizacao de categorias/produtos sinteticos via API: PASS.
- Upload multipart de PNG sintetico e recuperacao identica do arquivo: PASS local,
  sem contato com Cloudinary.
- O cliente criado por HTTP foi lido pelo Prisma no banco autorizado, confirmando
  que o backend usa o mesmo banco isolado dos testes.
- Prisma schema/database diff: PASS, sem diferencas; bcrypt e sintaxe: PASS.
- npm run build: PASS com Node 26.13.0/npm 11.20.0. Mantido aviso de bundle >500 kB.
- npm run lint: 23 erros e 1 aviso PREEXISTENTES, sem novos arquivos de frontend
  alterados. Detalhes em backend/logs/frontend-lint.log (ignorado pelo Git).
  Nao foram silenciadas regras nem feitas refatoracoes gerais fora da recuperacao.
- Nenhuma atualizacao de dependencias; lockfiles preservados. O package.json do
  backend recebeu somente scripts para testes e operacoes locais protegidas.

### Comandos atuais

Os dois servidores foram deixados rodando. Para iniciar quando estiverem parados,
em dois terminais separados:

```bash
cd ~/Projetos/assistencia-tecnica/backend
npm run dev
```

```bash
cd ~/Projetos/assistencia-tecnica/frontend
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

```bash
# Testes sem banco / testes integrados locais (criam dados ficticios):
cd ~/Projetos/assistencia-tecnica/backend
npm test
npm run test:local

# Somente no projeto de desenvolvimento autorizado:
npm run db:migrate:local
npm run db:setup:local
```

Pendencias externas: confirmar localhost no Google OAuth e obter credenciais de
teste Mercado Pago. Email e Telegram reais e Cloudinary nao sao necessarios para
desenvolver os fluxos locais configurados acima. Acesso visual ao navegador e
testes interativos OAuth/pagamento nao foram realizados.

---

## Historico da auditoria inicial (antes da autorizacao ampliada)

## Estado

Repositorio existente em `~/Projetos/assistencia-tecnica`, origem GitHub confirmada.
Frontend React 19/Vite 8; backend Express 5/Prisma 6/PostgreSQL.
Nenhum codigo de aplicacao foi alterado. Nenhum commit, push, deploy, migracao,
seed, pagamento ou consulta a dados de clientes foi realizado.

## Dependencias e runtime

- Node 26.13.0 e npm 11.20.0 existentes.
- `npm ci --ignore-scripts --no-audit --no-fund` em frontend e backend:
  154 e 261 pacotes, respectivamente, sem alterar manifests ou lockfiles.
- Geracao explicita do cliente Prisma com `npm run db:generate` concluida.
- Lockfile existente combina CLI Prisma 6.19.3 e pacote @prisma/client 6.16.2;
  a geracao informou cliente gerado 6.19.3. Versoes foram preservadas.
- Sucesso nos testes locais com Node 26 nao certifica compatibilidade de todas
  as dependencias; a matriz publicada para Prisma 6 nao lista Node 26.
- npm avisou sobre dependencias transitivas depreciadas glob e node-domexception;
  nenhuma atualizacao automatica ou auditoria remota de dependencias foi feita.

## Arquivos de ambiente

- `backend/.env` e `frontend/.env`: criados com permissao 0600, ignorados pelo Git.
- Dois JWT secretos independentes foram gerados localmente, sem exposicao em logs.
- `.gitignore` ampliado para `.env.*`, mantendo `.env.example` versionavel.
- `backend/.env.example` corrigido; `frontend/.env.example` criado.
- Banco e credenciais externas pendentes permanecem vazios. Nao sao valores validos
  de producao nem apontam para producao.
- Arquivos ignorados nao foram incluidos em commits; nenhum commit foi criado.

## Inventario de variaveis (nomes e origem, sem segredos)

Configuracao local derivada do codigo:

- Frontend: `VITE_API_URL` (localhost:3000/api).
- Backend: `NODE_ENV`, `PORT`, `FRONTEND_URL`, `CORS_ORIGINS`, `LOG_LEVEL`,
  `JWT_EXPIRES_IN`, `JWT_CLIENT_EXPIRES_IN`, `REFRESH_TOKEN_TTL_DAYS`,
  `CHECKOUT_TOKEN_TTL_MINUTES`, `MERCADO_PAGO_SUCCESS_URL`,
  `MERCADO_PAGO_FAILURE_URL`, `MERCADO_PAGO_PENDING_URL`.
- Gerados localmente: `JWT_SECRET`, `JWT_CLIENT_SECRET`.

Pendentes, identificados pelo codigo:

- Banco: `DATABASE_URL`. `DIRECT_URL` aparece na validacao de startup, mas nao
  e usada pelo datasource Prisma; so ela nao configura o banco.
- Google: `VITE_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID` (mesmo client ID);
  `GOOGLE_CLIENT_SECRET` e `GOOGLE_REDIRECT_URI` somente no fluxo legado por code.
- Email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`.
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
- Upload: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- Pagamentos: `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`,
  `MERCADO_PAGO_NOTIFICATION_URL`. `MP_ACCESS_TOKEN` e alias apenas no modulo
  de configuracao; o servico de pagamentos usa MERCADO_PAGO_ACCESS_TOKEN.

O exemplo anterior tinha CLIENT_JWT_SECRET, CLIENT_JWT_EXPIRES_IN, EMAIL_FROM,
UPLOAD_DIR, MAX_FILE_SIZE_MB e MERCADO_PAGO_PUBLIC_KEY, que nao sao lidas pelo
codigo atual. Esses nomes foram removidos do exemplo.

## Servicos externos: somente leitura

- Site publico confirmado: https://assistencia-tecnica-mauve.vercel.app/ (HTTP 200,
  titulo JFQ). URL publica da API extraida do bundle publicado:
  https://assistencia-tecnica-piu4.onrender.com/api . Nao foi usada no .env local.
- Um client ID publico Google foi identificado no bundle. Nao foi ativado no
  ambiente local porque as origens autorizadas ainda nao foram confirmadas.
- Vercel/Render: integracoes disponiveis, mas nao conectadas nesta sessao;
  nao foi possivel consultar as variaveis dos paineis. Controle do Brave indisponivel.
- Neon: projeto assistencia-tecnica, billowing-smoke-43121817; unico branch listado:
  production (primary/default), current_state=archived conforme API.
  Nenhuma conexao PostgreSQL nem recuperacao de senha/connection string realizada.
- Branch de desenvolvimento inexistente. Proposta: branch somente com schema,
  sem dados pessoais, sujeita a autorizacao. Nada foi criado.
- Google: frontend atual usa GoogleLogin/idToken e POST /api/client-auth/google;
  nao existe callback GET OAuth nesse fluxo. Confirmar origem autorizada
  http://localhost:5173 antes de habilitar. Nao inventar redirect URI para o fluxo
  legado; verificar a configuracao Google existente se esse fluxo for necessario.
- Mercado Pago: credenciais de teste pendentes; nenhum checkout ou webhook testado.
  Webhook externo requer HTTPS publico de desenvolvimento (nao localhost nem URL
  de producao). Nenhum tunel foi criado. Checkout permanece sem token.

## Banco

Schema Prisma com usuarios administrativos, clientes, produtos, categorias,
agendamentos, pedidos, itens, refresh tokens, tokens de checkout e eventos de
webhook. Contem campos pessoais (CPF, contatos, enderecos) e hashes de autenticacao.
Nao copiar dados de production para desenvolvimento.

Nenhum migrate dev/deploy, db push, seed, reset ou db pull foi executado.
Validacao do schema feita com URL sintetica loopback, sem conexao ao banco.

## Resultados

- Frontend build: PASS; aviso de bundle maior que 500 kB.
- Frontend lint: FAIL, 23 erros e 1 aviso preexistentes. Inclui set-state-in-effect,
  static-components, no-unused-vars e no-unsafe-finally. Sem correcoes automaticas.
- Backend: verificacao de sintaxe de todos os arquivos src/*.js PASS.
- bcrypt: hash/comparacao com dado sintetico PASS.
- Prisma generate e validate: PASS, sem conexao com banco.
- Backend import normal: BLOQUEADO por Resend sem chave. Instanciacao ocorre no
  carregamento de email.service.js; integrar email opcional/lazy em desenvolvimento
  seria uma correcao de codigo separada, ou usar credencial de desenvolvimento.
- Smoke HTTP isolado: / e /api/health HTTP 200; CORS com credentials para
  localhost:5173 PASS. Usou chave Resend ficticia somente em memoria e URL de banco
  loopback inacessivel, sem chamadas externas e sem dados. Servidor de teste encerrado.
  Health nao verifica banco: resultado nao significa CRUD ou autenticacao funcionando.
- Vite iniciado somente em 127.0.0.1:5173, HTTP 200 e titulo JFQ confirmado.
- Nenhum script de testes automatizados/typecheck definido nos package.json.
- Login, CRUD, Google OAuth, email, upload, Telegram, checkout e webhooks nao testados.

## Como iniciar

Frontend (ja iniciado durante a recuperacao, nao abrir outra instancia na mesma porta):

```bash
cd ~/Projetos/assistencia-tecnica/frontend
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Backend, APOS preencher DATABASE_URL exclusivamente de desenvolvimento e resolver
a dependencia obrigatoria do Resend:

```bash
cd ~/Projetos/assistencia-tecnica/backend
npm run dev
```

API esperada em http://localhost:3000 ; frontend em http://localhost:5173 .
O servidor original usa app.listen(PORT) sem host explicito: quando for iniciado,
pode escutar em todas as interfaces. Para uso restrito a loopback, ajustar o bind
em mudanca local revisada antes de iniciar em rede nao confiavel.

Proximos passos dependem de autorizacao de recursos externos/conexao dos servicos.
Nao reutilizar segredos de producao e nao seguir migracoes/seeds do README antes
de confirmar o banco isolado e revisar os dados sinteticos.
