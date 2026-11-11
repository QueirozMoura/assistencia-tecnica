# Recuperação do banco de produção — 02/11/2026

**Situação.** O código do JFQ 2.0 (commits `e5eeaaf`, `ec08dd2`, `c2ba4e6`) está em produção (Render e Vercel), mas o banco
Neon de produção não recebeu as migrations. Efeito comprovado em cópia: `prisma.pedido.*` falha com `P2022
pedidos.stockLedgerVersion` (criar/abrir/listar pedido e processar webhook); catálogo, produtos e login não são afetados.
As transações revertem por inteiro (falha fechada, sem dado corrompido).

**Banco.** Projeto Neon `assistencia-tecnica` (`billowing-smoke-43121817`), branch `production`
(`br-crimson-wildflower-atne9k4i`), endpoint `ep-rough-surf-at6q5dm9`. Nada foi alterado nele até este registro.

## Backups (preservados, sem expiração automática)

| Item | Identificação |
| --- | --- |
| Branch Neon de backup | `backup-prod-pre-ledger-20261102-1946` — `br-solitary-cherry-athvslu0` (pai `production`, 19:55) |
| `pg_dump` completo | `~/backups/jfq-prod-pre-recovery-20261102-1956.dump` (0600, 64 584 bytes, SHA-256 no arquivo `.sha256`) |
| Branch de ensaio 1 | `rehearsal-prod-migrations-20261102-1958` — `br-noisy-violet-atga1oz5` |
| Branch de ensaio 2 (script) | `rehearsal2-script-prod-20261102-2030` — `br-twilight-bird-atptb7yc` |

O dump tem 115 entradas, 12 tabelas e 12 blocos de dados; foi restaurado por completo (schema e dados) num schema temporário
com `ROLLBACK`: 12/12 tabelas com as mesmas linhas do dump, 95 constraints, nenhum resíduo.

## Tratamento exato das três migrations pendentes

1. `20261102070000_add_missing_refresh_tokens` — **não é executada**. As tabelas `refresh_tokens` e `client_refresh_tokens`
   já existem em produção (a segunda criada pela migration `20260802000000_add_client_refresh_tokens`, que está só no banco).
   O SQL da migration foi aplicado num schema temporário e as 36 propriedades (colunas, tipos, nulidade, defaults, índices e
   constraints) das duas tabelas são **idênticas** às de produção. Então: `prisma migrate resolve --applied`.
2. `20261102200000_order_stock_ledger` e 3. `20261102210000_pagamento_conciliacoes` — aplicadas por `prisma migrate deploy`
   (aditivas, uma transação cada).

Não se modifica o histórico existente: `20260714190000` (checksum do banco difere do arquivo, nunca alterado no Git) e
`20260802000000` (só no banco) permanecem como estão; `20260729_auth_token_hash_hardening` já tinha, antes de tudo, uma linha
revertida e outra concluída. O `migrate deploy` e o `migrate status` do Prisma não se opõem a nenhuma dessas diferenças.

## Resultado do ensaio (cópia de produção)

Schema: 0 linhas removidas ou alteradas, 129 adicionadas = 4 colunas em `pedidos` + 3 tabelas + índices, constraints,
10 funções e 9 triggers `jfq_*` (14 CHECKs). Dados: contagens idênticas nas 12 tabelas pré-existentes; novas tabelas vazias;
os 87 pedidos existentes continuam sem versão de ledger (nenhum débito inventado). Histórico de migrations: nenhuma linha
anterior alterada, +3 linhas. Compatibilidade: o código publicado lê os 87 pedidos reais (admin, "meus pedidos", dashboard,
conciliação, 63 eventos de webhook); suíte REST em modo ensaio 41/42 aprovados (o único reprovado era uma asserção do teste,
já corrigida) com Mercado Pago simulado.

## Procedimento para produção (aguarda autorização final)

```
cd ~/Projetos/assistencia-tecnica/backend
# 1) conexão DIRETA (sem pooler) do banco principal para a área de transferência (console Neon → production → Connect)
./scripts/recover-prod-migrations.sh --check-only   # 5 portões; não altera nada
./scripts/recover-prod-migrations.sh --apply        # portões + resolve + deploy + verificação
```

O script recusa qualquer endpoint que não seja o de produção, exige que o schema e o histórico sejam idênticos aos ensaiados e
verifica o resultado contra a impressão digital do ensaio (`~/backups/rehearsal-expected-schema-after.txt`). Aborta **antes**
de escrever se qualquer portão falhar. Depois: conferir os logs do Render (sem `P2022`) e uma compra de teste sem pagamento real.

**Reversão.** Falha dentro de uma migration não deixa estado parcial (cada uma é atômica). Se a verificação falhar: não
prosseguir, preservar a saída e o backup; restaurar pelo console Neon (branch `production` → Restore a partir de
`backup-prod-pre-ledger-20261102-1946`) ou por `pg_restore` do dump. Dados gravados depois do backup seriam perdidos nessa
reversão; até a última verificação não havia nenhum (contagens iguais às do backup).

## Execução em produção — 02/11/2026 (autorizada pelo usuário)

`recover-prod-migrations.sh --check-only` (5 portões) e depois `--apply`, no banco principal (`ep-rough-surf-at6q5dm9`,
branch `production`). Antes: script e migrations idênticos aos ensaiados (checksums iguais aos registrados na cópia), dump
íntegro, branch de backup existente e **nenhuma escrita nova desde o backup** (todas as contagens iguais às do dump).

Resultado: `migrate resolve --applied 20261102070000_add_missing_refresh_tokens`; `migrate deploy` aplicou
`20261102200000_order_stock_ledger` e `20261102210000_pagamento_conciliacoes`. Verificação do script: schema idêntico ao
ensaio (impressão digital), contagens de todas as tabelas de negócio idênticas, novas tabelas vazias, nenhum pedido existente
ganhou versão de ledger, histórico anterior intacto (+3 linhas), 10 funções e 9 triggers. `prisma migrate status`: "Database
schema is up to date!". Preservados: 87 pedidos, 88 itens, 10 clientes, 16 produtos, 63 eventos de webhook.

Pós-verificação somente-leitura: o código publicado lê produção sem erro (`pedido.findMany()`, que dava `P2022`, lê as 87
linhas; admin, "meus pedidos", dashboard e conciliação). Render: `/api/health`, `/api/produtos` e `/api/categorias` 200;
`/api/pedidos`, `/api/dashboard/stats` e `/api/conciliacoes` 401 sem token; logs sem `P2022`, sem erro, sem aviso e sem webhook
pendente. Backups preservados (branch `backup-prod-pre-ledger-20261102-1946` e dump). Sem commit, push, deploy ou alteração
de credenciais.

## Verificação funcional do site publicado — 02/11/2026 (somente leitura, sem pedidos nem pagamentos)

Vercel (`assistencia-tecnica-mauve.vercel.app`) e Render (`assistencia-tecnica-piu4.onrender.com`) acessíveis. Páginas públicas
verificadas no navegador, sem erros de console, sem requisições com falha e sem imagens quebradas: início, catálogo (APIs 200),
produto (APIs 200), serviços, agendamento, sobre, contato e login. Carrinho funcional (item, total e botão "Finalizar Compra";
o item de teste foi removido). `/checkout` sem sessão de cliente leva ao login, como projetado. Logs do Render após a navegação:
0 `P2022`, 0 tabelas ausentes, 0 erros, 0 avisos, nenhum webhook.

**Não testado (exige ação do titular ou autorização):** painel administrativo publicado (não há sessão de administrador de
produção no navegador), checkout até a preferência do Mercado Pago e reserva de estoque em produção. Observação a confirmar
manualmente: ao clicar em "Finalizar Compra" com o aviso de cookies aberto, o clique de teste não navegou (a navegação direta
para `/checkout` funciona).

## Verificação do painel administrativo de produção — 02/11/2026 (somente leitura, sessão já autenticada)

Funcionaram (sem erro de rede, `P2022` ou aviso nos logs do Render): dashboard (API correta: 87 pedidos), lista de pedidos
("Página 1 de 9", ids 3 a 89 sem buracos nem duplicados, 87/87), detalhe de pedidos antigo (#3) e recente (#89), produtos
(13 ativos somam 128 unidades, os 3 inativos 29, total 157 = banco, produto a produto) e conciliação (0 itens, estado vazio).

Defeitos encontrados (nenhum causado pela recuperação; correções **locais**, ainda não publicadas):
1. **Dashboard abre vazio** ("Sem dados para exibir", R$ 0,00 e zeros) até clicar em "Atualizar dados": nenhuma versão chamava
   `fetchStats` ao carregar. Correção local: `useAsyncData` em `frontend/src/admin/pages/Dashboard.jsx`.
2. **Dashboard publicado ignora pedidos PREPARANDO** (soma 84 de 87; receita sem os 3 pedidos pagos em preparação). Correção local
   já existente: `backend/src/services/dashboard.service.js` (+ `dashboard.test.js`).
3. **Banner de cookies cobre o botão "Finalizar Compra"** do carrinho lateral (banner z-60 acima do carrinho z-50; o centro do
   botão fica coberto pelo "Configurar cookies"). Correção local: `CartDrawer.jsx` com `z-[65]` (abaixo do modal de preferências, z-70).
Observação: "Todos os status" em Produtos lista só os ativos (padrão antigo); os inativos aparecem no filtro "Inativos".

## Publicação das 3 correções — 02/11/2026 (autorizada)

Commit `b45dbc5` (4 arquivos: `dashboard.service.js`, `dashboard.test.js`, `Dashboard.jsx`, `CartDrawer.jsx`) enviado à `main`.
Render: "Deploy live for b45dbc5" (21:31); Vercel: b45dbc5 Ready (Production). Verificado no site publicado: o CSS novo contém
`z-[65]`; com o banner de cookies aberto e sem consentimento salvo, "Finalizar Compra" é clicável (5/5 pontos) em 1920×1080 e na
janela de 936 px que reproduzia o defeito; o dashboard carrega sozinho e fecha em 87 pedidos (Preparando 3; receita R$ 618,49);
logs do Render sem erro, aviso ou `P2022`. Banco de produção, migrations e pedidos não foram tocados.
