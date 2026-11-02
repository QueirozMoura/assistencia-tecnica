# PLANO-JFQ-V2 — revisão final e proposta de evolução

## Validação do ledger — impedimento confirmado, sem liberação (02/11/2026)

Esta atualização prevalece sobre a rodada anterior de 154 testes. Agora são
**169 testes locais aprovados** (144 backend, 25 frontend), incluindo 15 novos
casos do detector de evidência. Lint limpo, build aprovado, Prisma validate offline
e git diff --check aprovados. Esses números não comprovam concorrência real.

### Situação comprovada

- Projeto gratuito de ensaio cool-rice-07419769, sua branch e endpoint foram
  reconfirmados. SQL pelo conector acessível; somente leituras nesta rodada.
- Cinco invariantes do ledger anterior retornaram true: saldo não negativo,
  débitos completos nos itens novos, compensação de reservas canceladas,
  referências/quantidades corretas e histórico ambíguo sem movimentos. Ledger
  preservado com 15 linhas. Os 33 cenários SQL anteriores são evidência histórica,
  não uma nova execução de integração nesta etapa.
- Terminal: EAI_AGAIN/gaierror -3 no DNS externo; EPERM em socket de loopback.
  NoNewPrivs=1/Seccomp=2 são compatíveis com isolamento do processo. Não foi
  diagnosticada falha global do Fedora nem feita alteração de DNS/firewall/VPN.
- **Zero disputas concorrentes reais comprovadas; zero fluxos Prisma/REST reais
  executados no ensaio.** Migration inalterada e nenhuma aplicação nesta rodada.
  Produção/jfq-development não acessados. Não liberar nem aplicar no dev principal.

### Melhoria segura implementada

O runner anterior podia aceitar transações sobrepostas cujas mutações fossem
serializadas. Agora A mantém seu lock após a mutação e B executa a operação
concorrente; uma terceira conexão deve observar B em espera Lock, bloqueada por
A em pg_blocking_pids, com PIDs distintos e horários válidos. Só então libera A
e verifica resultado, saldo e ledger. Sem testemunho, falha sem declarar PASS.

Foram preparados os dois sentidos webhook de rejeição × cancelamento admin,
além da última unidade, cancelamento duplicado e criação com a mesma intenção.
Exige ao menos três rodadas, schemas novos e evidência por caso. Os SQLs novos
não são o endpoint REST e não substituem seu teste. O próprio runner revisado
ainda não foi validado com processos conectados ao banco: seu preflight encerrou
com exit 2 antes de qualquer escrita. Há 35 passos sequenciais e cinco disputas
por rodada preparados, sem alegar que foram executados.

### Retomada obrigatória

1. Executar preflight e runner em contexto com rede/sockets permitidos. Usar
   somente URL direta do ensaio, fornecida ao ambiente do processo por entrada
   oculta, sem editar .env. Procedimento em AUDITORIA-FUNCIONAL.md.
2. Exigir cinco casos com bloqueio real observado em pelo menos três rodadas;
   guardar PIDs, testemunho temporal e snapshots de saldo/ledger.
3. Preparar banco vazio adicional no mesmo projeto isolado para a cadeia Prisma
   e API real. Preservar public/fixtures de neondb. Helpers do app qualificam
   public explicitamente: trocar apenas schema= na URL não isola essas funções.
4. Aplicar/validar migrations via Prisma no banco novo, iniciar API de teste em
   porta livre e executar HTTP real: dois checkouts, cancelamento, assinatura e
   repetição/ordenação de webhooks, históricos e 401/403/validações. Somente
   Mercado Pago e notificações devem ser simulados; não mockar o banco.
5. Reavaliar liberação para jfq-development somente com essas evidências e
   autorização específica de aplicação. Para produção futura, revisar drift,
   writers, locks, backup/recuperação e procedimentos de conciliação/estoque.

### Propostas que aguardam decisão de negócio

- Reservas abandonadas: manter cancelamento manual; definir TTL, exceções e
  conciliação de aprovação tardia antes de qualquer expiração automática.
- Preferências órfãs: persistir intenção e mover HTTP para fora da transação
  longa, com reconciliação de timeout e idempotência do provedor previamente
  verificada. Aprovar o novo fluxo de pagamento antes de implementar.
- Chaves ausentes/diferentes: intenção estável por compra e migração coordenada
  para chave obrigatória; não deduplicar compras por semelhança. Preservada a
  compatibilidade atual até decisão de contrato.

Revisão final de diff/arquivos novos sem correspondência com segredos conhecidos
ou padrões de credenciais; sete JSONs e dois .env intactos por hash. .env seguem
ignorados, modo 0600, e não há alterações staged.

Evidências: backend/test/fixtures/stock-validation-status.json e a seção mais
recente da auditoria. Nenhuma nova funcionalidade, migration, alteração de .env,
edição dos sete JSONs, commit/push ou operação em produção foi realizada.

---

## Registro da rodada anterior (resultados históricos)

## Estoque persistente — implementação local e liberação pendente (02/11/2026)

Esta atualização prevalece sobre a proposta anterior de decisão pendente. O usuário
aprovou a reserva na criação tanto no legado quanto no Mercado Pago. O código e a
migration estão preparados e, em 02/11/2026, **a concorrência real e a validação
Prisma/REST foram aprovadas no projeto isolado de ensaio**. Continuam **não
aplicados ao jfq-development** — a aplicação depende de autorização específica.
O detalhamento e as evidências estão na seção "Validação em PostgreSQL real e REST"
de AUDITORIA-FUNCIONAL.md.

### Implementado

- Ledger por item com UUID, origem, tipo, quantidade e vínculo obrigatório de
  devolução ao débito original. Unicidade item/tipo e débito compensado.
- Reserva atômica e condicionada a disponibilidade/atividade no PostgreSQL;
  funções SQL compartilhadas por criação, cancelamento administrativo e webhook.
  Pedido, itens, saldo e prova confirmam ou revertem juntos.
- Locks por pedido, produtos em ordem de ID, constraints diferidas de completude
  e ledger/itens comprovados imutáveis. Cancelados permanecem finais.
- Pedidos novos usam stockLedgerVersion=1; históricos ficam NULL, sem inferência
  por estado/pagamento e sem devolução automática não comprovada. Não há backfill.
- creationKey por cliente e hash da intenção, índice único e advisory lock.
  Retry com a mesma chave reutiliza pedido/preferência; não refaz débito. Chave
  alterada é nova intenção. Compatibilidade mantém chave opcional em chamadas
  legadas; React a conserva somente enquanto o checkout está montado.
- PATCH administrativo existente libera reserva de pendente ao cancelar; falha
  no pagamento também compensa uma única vez. Pending/PENDING nunca vira pago
  só por reservar. Aprovação tardia de cancelado exige conciliação manual.

### Validação e migration

**169 testes locais aprovados** (144 backend, 25 frontend), lint limpo, build
aprovado e Prisma validate aprovado (revalidados em 02/11/2026). **33 cenários
sequenciais SQL reais** na rodada anterior e, na rodada final, 105 sequenciais +
15 disputas com bloqueio comprovado + 28 cenários Prisma/REST.

Migration 20261102200000_order_stock_ledger aplicada somente nos schemas novos
jfq_stock_20261102_a/b do projeto gratuito de ensaio cool-rice-07419769, cuja
identidade/branch foram reconfirmadas antes das escritas. Migration anterior de
refresh tokens inalterada. Nenhuma migration aplicada ao jfq-development ou à
produção. O ensaio utilizou baseline equivalente ao schema anterior; ainda falta
validar a cadeia completa/metadata do Prisma antes de deploy futuro.

**Concorrência real — comprovada (02/11/2026).** `npm run test:stock:postgres`,
3 rodadas: 105 cenários sequenciais e 15 disputas, com três PIDs distintos,
`wait_event_type=Lock` e `pg_blocking_pids` contendo o holder em todas; estoque e
ledger consistentes, sem débito/devolução duplicados. As sondagens anteriores do
conector (serializadas) seguem sem valor como prova. **Prisma/REST — comprovado:**
`npm run test:rest:isolated`, 28 cenários (cadeia de 9 migrations via
`prisma migrate deploy`, autenticação/autorização, legado e Mercado Pago
simulado, reserva, cancelamento, webhooks duplicados/fora de ordem, históricos
ambíguos, corridas HTTP) e 0 chamadas externas. Total: 169 testes locais + 148
cenários em banco real. Limitação: o REST usou cópia mecânica do código com o
literal `"public".` trocado por schema novo (o `public` do ensaio tem dados);
fonte original inalterada. O `public` do ensaio ficou idêntico.

### Regra de pagamento × cancelamento e plano para o dev (02/11/2026)

**Regra aprovada e implementada (código, sem migration):** pagamento confirmado
primeiro → PAGO e cancelamento administrativo recusado (409); cancelamento primeiro
→ CANCELADO, estoque liberado uma vez, aprovação tardia retida sem reservar estoque.
Sem reembolso automático. 152 testes backend + 25 frontend; REST isolado 30/30,
10 corridas aprovado × cancelamento com os dois resultados observados (4 PAGO,
6 CANCELADO). **Pendente de aprovação:** tabela persistente `pagamento_conciliacoes`
(nova migration aditiva) para a fila de conciliação/reembolso manual — hoje a
aprovação tardia só aparece em log e resposta. Proposta completa e decisões
em aberto na seção correspondente de AUDITORIA-FUNCIONAL.md.

**jfq-development (somente leitura):** 8 migrations aplicadas, checksums idênticos
aos locais, sem drift; só a do ledger está pendente (1 pedido histórico, 3
produtos). Plano coordenado (backup por branch Neon + pg_dump, `db:migrate:local`,
verificação SQL, backend novo só após a migration, smoke fictício, rollback
antes/depois do primeiro pedido versionado) está na auditoria. **Nada aplicado.**

### Fila de conciliação financeira e plano das duas migrations (02/11/2026)

**Aprovado e implementado localmente:** tabela `pagamento_conciliacoes` (+ histórico imutável) na migration
`20261102210000_pagamento_conciliacoes`, para ser aplicada **junto** com a do ledger em um único deploy. Registra
pagamentos confirmados após cancelamento, divergências de valor/preferência e outros eventos financeiros,
distinguindo **confirmado pelo Mercado Pago** de **não verificado** e **suspeito** (classificação imposta por CHECK;
divergência nunca é presumida como dinheiro). Idempotente por provedor + paymentId confiável (senão notificação,
senão hash do payload) + tipo; gravada na mesma transação do webhook; API e painel só para ADMIN; resolução manual
com responsável, data e histórico auditável; **sem reembolso automático**. **201 testes locais** (172 backend + 29
frontend); no banco isolado: **114 sequenciais + 21 disputas com bloqueio real (3 rodadas) e 41 cenários
Prisma/REST**, todos aprovados. A validação real achou e corrigiu uma dependência de `search_path` no SQL cru.
Inspeção do runner interrompido: nenhum schema parcial, 0 sessões abertas, `public` do ensaio intacto, 18 schemas
`jfq_*` retidos.

**Nada foi aplicado ao jfq-development nem à produção.** O plano completo (backup por branch Neon + `pg_dump`, pré e
pós-verificação somente leitura com `backend/scripts/verify-dev-deploy.js`, aplicação por `db:migrate:local`, smoke
fictício, compatibilidade e rollback) está em AUDITORIA-FUNCIONAL.md. **Decisões ainda abertas:** canal de alerta ao
admin para itens novos, política para estados `in_process` e para rejeições de assinatura, e autorização expressa
para criar o backup e aplicar.

### Implantação no jfq-development — executada (02/11/2026)

Backup validado (branch Neon `backup-pre-ledger-20261102-1835` + `pg_dump` 0600 fora do repositório) e portões
aprovados; as duas migrations (ledger e `pagamento_conciliacoes`) foram aplicadas, nesta ordem, **somente** no
jfq-development, depois de o usuário parar o `nodemon` que usava o banco. Pós-verificação 11/11 com dados idênticos ao
snapshot; backend atualizado e frontend no ar; smoke fictício 11/11 e regressão `test:local` 27/27. Indicador de
pendências implementado (interno); `in_process` nunca é dinheiro; assinatura inválida só gera log de segurança.
**Pendente:** conferência visual autenticada do painel pelo usuário, checkout Mercado Pago de teste (sem credencial no
dev) e plano/autorização próprios para produção. Detalhes em AUDITORIA-FUNCIONAL.md.

### Próxima etapa para liberação segura

1. ~~Executar runner e testes de serviços no ensaio~~ — **concluído** (acima).
2. Conferir divergência real de schema e _prisma_migrations de jfq-development,
   incluindo refresh tokens. Planejar aplicação autorizada em desenvolvimento e
   smoke test antes de liberar o aplicativo. Novo Prisma Client exige a migration;
   não iniciar contra schema antigo. Nenhuma autorização de migração principal
   foi presumida. **Decidir:** webhook aprovado × cancelamento administrativo pode
   deixar pedido CANCELADO com pagamento aprovado (conciliação manual).
3. Coordenar atualização de todos os escritores/consumidores. Não misturar
   cancelamento antigo com pedidos novos; adotar chave estável nos retries.
4. Definir acompanhamento manual de reservas abandonadas e conciliação de
   pagamento tardio. Só então validar checkout MP com credenciais de teste.

### Riscos e evolução posterior

- **Reservas abandonadas imobilizam estoque sem prazo.** Não existe expiração
  automática nesta versão. Cancelamento manual administrativo é o mecanismo
  implementado; expiração exige política aprovada em etapa posterior.
- Sem chave estável, repetição HTTP/reload pode criar outro pedido e outra
  reserva. Não há deduplicação de compras por semelhança; alinhar contratos e,
  em mudança coordenada posterior, considerar chave obrigatória.
- Preferência MP ainda é chamada dentro da transação. Timeout pode deixar efeito
  externo órfão; banco não desfaz HTTP. Evoluir para intenção persistente e
  reconciliação/outbox em etapa própria, sem retry cego da transação atual.
- Ajustes absolutos de estoque administrativo não integram este ledger; não há
  reconstituição global do inventário. Evoluir política de ajustes com auditoria
  e controle de versão para evitar sobrescrever saldo por tela desatualizada.
- Recuperação deve preservar provas e corrigir para a frente, com suspensão de
  novas escritas se necessário. Não remover triggers/ledger para voltar ao código
  antigo. Ensaiar backup/recuperação e medir locks da migration antes de produção.
- Revogação imediata de JWT, code splitting e demais propostas anteriores
  continuam futuras. Bundle atual 600,89 kB (gzip 154,17 kB); aviso >500 kB mantido.
- Sete JSONs potencialmente pessoais e .env intactos; sem commit/push, pagamento,
  notificação real ou conexão com produção nesta etapa.

Organização proposta para revisão futura: schema+migration+helpers+integração dos
serviços; depois testes/runner/evidências; depois documentação e ajuste de chave
no checkout (preferencialmente revisado junto à API). Não versionar os sete JSONs,
.env, logs, node_modules ou builds. Nenhum commit foi executado.

---

## Registro histórico anterior à aprovação (superado pela seção acima)

## Ledger de estoque — diagnóstico e aprovação pendente (02/11/2026)

A proposta atual é um histórico persistente por item com UUID, tipo, quantidade,
vínculo ao pedido/produto, data/origem e chave única. Devolução referencia um débito
único, com identidade e quantidade verificadas. Pedido/saldo/movimentos devem ser
atômicos; histórico não deve ser apagado ou inferido de status. Helpers centrais,
constraints e locks devem ser testados em PostgreSQL real. Criação de pedido também
precisa de chave de idempotência por intenção, não apenas dedupe de webhook.

**Ainda não implementado.** O diagnóstico confirmou uma decisão de negócio:
criarPedido desconta estoque na criação; criarPedidoComPagamento não desconta na
criação nem na aprovação. Recomenda-se alinhar ambos pela baixa na criação; isso
reduzirá disponibilidade durante a pendência MP até cancelamento, sem expiração
automática nesta etapa. A alternativa é baixa na aprovação, mas precisa de uma
política explícita para pagamento aprovado sem estoque. A decisão foi solicitada
e não foi presumida. Nenhum comportamento, schema ou migration foi alterado.

O detalhamento de fluxos, invariantes, arquitetura e matriz de testes está na
nova primeira seção de [AUDITORIA-FUNCIONAL.md](AUDITORIA-FUNCIONAL.md). As fases de
implementação/migration do ledger aguardam essa decisão; os 125 testes atuais
continuam aprovados, com lint limpo e build aprovado, e não validam o futuro ledger.

O projeto de ensaio cool-rice-07419769 e sua branch foram reconfirmados no plano
gratuito, somente por leitura de metadados. Não houve ensaio novo ou escrita nele.
Não houve backfill, mudança em .env, alteração dos sete JSONs, commit/push ou operação
em produção/jfq-development. Apenas a documentação foi atualizada nesta rodada.

---

## Registro anterior ao diagnóstico do ledger

## Atualização de estabilização — 02/11/2026

Estado atual: **125 testes aprovados**, lint sem erros/avisos e build aprovado.
Esta atualização prevalece sobre a fotografia anterior de 101 testes abaixo.
O resultado detalhado está em [AUDITORIA-FUNCIONAL.md](AUDITORIA-FUNCIONAL.md).

### Risco cancelar/reabrir/cancelar

Corrigido no backend: CANCELADO e ENTREGUE são finais; o fluxo administrativo
valida transições e compara o estado na transação. Somente a transição vencedora
para CANCELADO devolve itens. Chamadas repetidas não repetem a devolução. O webhook
não reabre cancelados, preserva andamento de entrega e recusa regressão de estado
financeiro confirmado. Pedido cancelado/pago não pode iniciar nova preferência.
O seletor administrativo impede reabertura, mas a regra está no servidor.

As 24 regressões novas incluem reabertura administrativa, webhook tardio/duplicado,
cancelamento simultâneo em harness transacional, perda da comparação de estado e
preservação do andamento. Não é um ensaio de carga/conexões concorrentes reais.

**Permanece aberto:** não há prova persistida de débito por pedido. A primeira
compensação de um pedido MP sem débito e o cancelamento por webhook de um pedido
legado precisam de conciliação. Foi proposta uma pequena mudança com
estoqueDebitadoEm/estoqueDevolvidoEm; não foi implementada nem aplicada sem decisão
sobre schema. Não inferir esses campos de preferenceId ou do saldo atual.
A arquitetura completa de reservas permanece futura.

### JSONs e versionamento

Os sete .tmp-pedido*.json com dados de destinatário/contato/endereço foram revistos
sem reproduzir valores. Há indícios de exemplos em parte deles, mas a origem não
é comprovada. Tratar como **potencialmente pessoais**, não como fixtures seguras.
Todos foram preservados byte a byte, sem exclusão ou edição. Nenhum entrou no
índice e nenhum será incluído nos commits de trabalho propostos.

O grupo 0 do plano de commits continua pendente de aprovação: confirmar origem,
preservar cópia privada, substituir exemplos necessários por fixtures sintéticas,
retirar especificamente os caminhos do índice mantendo cópia local e ignorá-los.
Não foi executado git rm --cached nem reescrita de histórico. Um checkout/release
completo ainda inclui o histórico já existente; avaliar o histórico e audiência
antes de publicar o repositório, mesmo sem novo commit desses arquivos.

### Ensaio da complementar

A migration de refresh tokens equivale ao DDL atual em 12 declarações. Foi aplicada
e testada por SQL em projeto vazio separado, gratuito (free_v3), PostgreSQL 18 e
compute 0,25 CU: jfq-refresh-migration-rehearsal, ID cool-rice-07419769, branch
br-billowing-wave-bchj34qy. O jfq-development não foi afetado nem teve seu .env
substituído. Foram usados pais mínimos, sem copiar dados de qualquer ambiente.
Índices/FKs e rejeições de duplicidade, referência ausente e prazo nulo passaram.
Reaplicação em tabelas existentes falhou, como esperado. Não foi ensaio completo
do Prisma Migrate/histórico nem simulação de produção. O projeto foi mantido para
inspeção, sem exclusão automática; não há segredo dele neste relatório ou no .env.

### Impacto no inventário e plano de commits

O inventário passa de 71 para **74 caminhos**: 50 rastreados alterados/removidos e
24 novos, sem alterações preparadas no índice. Acrescentar ao grupo backend de
segurança/consistência orderState.js e order-state.test.js, junto dos serviços e
controller de pagamento/pedido; a fixture antiga de audit.test.js foi alinhada ao
novo contrato. O ajuste de PedidoDetail.jsx deve acompanhar a regra de estados.

| Caminho novo no inventário | Classificação | Motivo |
| --- | --- | --- |
| backend/src/services/orderState.js | Correção de segurança/funcional | Regras de transição e pagamento de pedidos |
| backend/test/order-state.test.js | Teste | 24 regressões de estados, concorrência simulada e notificações |
| frontend/src/admin/pages/Pedidos/PedidoDetail.jsx | Correção funcional | Desabilita seleção em estados terminais |

Os caminhos já listados pedido.service.js, pagamento.service.js,
pagamento.controller.js e audit.test.js receberam as correções acima. A migration
complementar permanece sem edição; não há nova migration de estoque. Nenhum commit,
push, pagamento real, notificação real, operação destrutiva ou mudança de sistema
foi feito. Produção e dados existentes foram preservados.

---

## Registro anterior à correção de estados

Data: 02/11/2026. Escopo: base estável de desenvolvimento, sem deploy.

## 1. Situação geral e critério de estabilidade

A base local está aprovada nos checks automatizados: **101 testes, lint sem erros
ou avisos e build aprovado**. O Google foi testado manualmente com sucesso pelo
usuário; os testes automáticos Google usam tokens/certificados locais. Mercado
Pago ainda aguarda credenciais exclusivas de teste. Não é uma versão certificada
para produção: sessões revogáveis, estoque do checkout e regressão HTTP/visual
continuam como riscos explícitos.

O estado atual da auditoria prevalece sobre os números antigos nos históricos
RECUPERACAO-LOCAL.md e INTEGRACOES-LOCAIS.md. A persistência real registrada na
estabilização anterior foi INSERT + SELECT de seis registros fictícios no projeto
jfq-development. Isso não comprova o fluxo HTTP completo do Express. **Nesta
revisão não houve acesso ou escrita em banco**, nem alteração de arquitetura.

| Verificação repetida nesta etapa | Resultado |
| --- | --- |
| Backend — audit.test.js | 61 PASS |
| Backend — development.test.js | 4 PASS |
| Backend — payments.test.js | 11 PASS |
| Frontend — cart.test.js | 18 PASS |
| Frontend — asyncRequest.test.js | 7 PASS |
| npm test nas duas aplicações | PASS; contagem por arquivo conferida em execução individual |
| Total de casos | **101 PASS, zero falhas** |
| npm run lint | PASS — zero erros/avisos |
| npm run build | PASS — JavaScript 600,70 kB, gzip 154,04 kB |
| CSS gerado | 86,67 kB, gzip 14,78 kB; hash preservado |
| git diff --check | PASS |

Não houve novo teste de localhost/Brave nesta sessão isolada, auditoria remota de
dependências ou pentest. As suítes novas isolam transporte/ORM; sua aprovação não
prova concorrência real no PostgreSQL, fluxo de pagamento externo ou aparência.
Os testes geraram somente artefatos locais ignorados; não fizeram cobrança real.

## 2. Revisão de segurança e preparação dos arquivos

A revisão considerou o diff contra HEAD (incluindo índice) e todos os arquivos
novos não ignorados: **70 caminhos antes deste documento** (49 rastreados
alterados/removidos + 21 novos). O arquivo removido CookieConsent.jsx não tem
conteúdo atual; foram lidos 69 arquivos presentes, além do diff. Este plano
acrescenta um arquivo de documentação: o inventário abaixo passa a **71 caminhos**.
Nenhuma alteração está preparada no índice; nenhum commit foi criado.

### Segredos e dados pessoais

- Comparação literal dos segredos não vazios dos .env locais com os arquivos
  candidatos e o diff: **nenhuma correspondência**. Nenhum valor foi registrado
  nos resultados da varredura.
- Busca por chaves privadas, JWTs literais, prefixos de tokens Mercado Pago,
  segredos Google, chaves AWS e URLs PostgreSQL com senha: somente duas URLs
  fictícias de loopback em testes, com contexto explícito de fixture.
- Senhas/chaves sintéticas dos testes são dados de teste; não são credenciais
  recuperadas de contas. Não foi encontrado segredo real nesses candidatos.
- Os contatos comerciais em frontend/src/pages/Contact.jsx já existem em HEAD;
  não foram introduzidos pela recuperação. Seus valores não são reproduzidos aqui.
- .env de backend/frontend continuam ignorados; backend/.env permanece 0600.
  Só VITE_API_URL e VITE_GOOGLE_CLIENT_ID estão definidos no ambiente frontend.
  VITE_* é público no bundle; nenhum segredo deve ser colocado nessas variáveis.
- Logs, node_modules, dist e uploads locais continuam fora do conjunto candidato.
  Nenhum sourcemap foi encontrado no dist produzido nesta etapa.
- O scan é local, por padrões e comparação literal; não substitui uma ferramenta
  especializada nem revisa todo o histórico Git. Dados codificados, credenciais
  externas não presentes no ambiente e dados sem formato reconhecível podem
  exigir revisão humana. Não foram enviados arquivos privados a scanners externos.

### Temporários rastreados fora do diff atual

Há **nove JSONs temporários já rastreados**. Sete têm campos de destinatário,
telefone ou endereço; não foi identificada chave de token/senha nem padrão de
JWT/token de provedor nesses arquivos. O parser precisou tratar BOM UTF-8 em parte
deles. Não foi presumido que os dados pessoais sejam fictícios.

| Arquivo preexistente | Atenção |
| --- | --- |
| backend/.tmp-pedido-e2e-ok.json | Destinatário, telefone/endereço |
| backend/.tmp-pedido-itens-vazio.json | Destinatário, telefone/endereço |
| backend/.tmp-pedido-mp-e2e-ok.json | Destinatário, telefone/endereço |
| backend/.tmp-pedido-ok.json | Destinatário, telefone/endereço |
| backend/.tmp-pedido-pagamento-sem-nome.json | Telefone/endereço |
| backend/.tmp-pedido-pagamento.json | Destinatário, telefone/endereço |
| backend/.tmp-pedido-sem-nome.json | Telefone/endereço |
| backend/tmp-pedido-body.json | Payload manual; revisar necessidade de manter |
| backend/tmp-pedido-ok.json | Payload manual; revisar necessidade de manter |

**Antes de publicação ampla:** confirmar a origem desses dados, substituir apenas
os exemplos necessários por fixtures explicitamente sintéticas e retirar os
artefatos descartáveis do conjunto versionado, preservando cópia privada se
necessário. Isso é trabalho proposto, não executado. Um ignore novo não remove
um arquivo já rastreado nem seus dados no histórico. Se houver dado pessoal real,
a revisão do histórico/acessos deve ser uma decisão separada e autorizada.

Os relatórios anteriores também contêm identificadores de infraestrutura e
caminhos locais: não são senhas, mas sua necessidade deve ser revisada conforme
a audiência do repositório. Não publicar dumps, logs ou prints de painéis.

## 3. Classificação de cada alteração acumulada

A classificação é por caminho, com mais de uma categoria quando o arquivo reúne
mudanças de naturezas diferentes. Limpezas de lint sem efeito de produto foram
incluídas em correção funcional/qualidade; não são novas funcionalidades.

| Caminho | Classificação | Motivo |
| --- | --- | --- |
| `.gitignore` | Configuração de desenvolvimento; segurança | Proteção de ambientes/uploads e exceções explícitas para scripts revisáveis |
| `AUDITORIA-FUNCIONAL.md` | Documentação | Evidências, limitações, estado atual e plano de evolução/versionamento |
| `INTEGRACOES-LOCAIS.md` | Documentação | Evidências, limitações, estado atual e plano de evolução/versionamento |
| `PLANO-JFQ-V2.md` | Documentação | Evidências, limitações, estado atual e plano de evolução/versionamento |
| `RECUPERACAO-LOCAL.md` | Documentação | Evidências, limitações, estado atual e plano de evolução/versionamento |
| `backend/.env.example` | Configuração de desenvolvimento | Contrato de variáveis sem credenciais preenchidas |
| `backend/.gitignore` | Configuração de desenvolvimento; segurança | Proteção de ambientes/uploads e exceções explícitas para scripts revisáveis |
| `backend/package.json` | Configuração de desenvolvimento; teste | Comandos locais protegidos e suítes de testes; scripts genéricos de produção continuam exigindo revisão |
| `backend/prisma/migrations/20261102070000_add_missing_refresh_tokens/migration.sql` | Correção funcional; configuração de desenvolvimento | Completa tabelas/índices/FKs já previstos pelo schema; aplicação futura requer análise de drift |
| `backend/scripts/migrate-local.js` | Configuração de desenvolvimento | Operações de setup/migration limitadas ao endpoint dev autorizado |
| `backend/scripts/setup-local.js` | Configuração de desenvolvimento | Operações de setup/migration limitadas ao endpoint dev autorizado |
| `backend/scripts/smoke-local.js` | Teste; configuração de desenvolvimento | Smoke com dados fictícios e probe de preferência sem cobrança |
| `backend/scripts/test-payment-local.js` | Teste; configuração de desenvolvimento | Smoke com dados fictícios e probe de preferência sem cobrança |
| `backend/src/config/paymentEnvironment.js` | Correção de segurança; correção funcional | Isolamento teste, identidade do vendedor, assinatura e validação de pagamentos; logs sem trecho do token |
| `backend/src/config/prisma.js` | Configuração de desenvolvimento; segurança | Guarda de hostname e bind local no desenvolvimento |
| `backend/src/controllers/pagamento.controller.js` | Correção de segurança; correção funcional | Isolamento teste, identidade do vendedor, assinatura e validação de pagamentos; logs sem trecho do token |
| `backend/src/controllers/pedido.controller.js` | Correção de segurança | Autenticação no backend, separação de domínio e verificação do dono do pedido |
| `backend/src/dtos/pedido.dto.js` | Correção funcional | Contrato de retorno contém ID e estado real de pagamento |
| `backend/src/middlewares/auth.middleware.js` | Correção de segurança | Autenticação no backend, separação de domínio e verificação do dono do pedido |
| `backend/src/middlewares/clientAuth.middleware.js` | Correção de segurança | Autenticação no backend, separação de domínio e verificação do dono do pedido |
| `backend/src/middlewares/error.middleware.js` | Correção funcional; segurança | Compatibilidade Zod e sanitização de URL no tratamento de erro |
| `backend/src/routes/pedido.routes.js` | Correção de segurança | Autenticação no backend, separação de domínio e verificação do dono do pedido |
| `backend/src/server.js` | Configuração de desenvolvimento; segurança | Guarda de hostname e bind local no desenvolvimento |
| `backend/src/services/agendamento.service.js` | Correção de segurança; correção funcional | Associação somente à identidade autenticada, mantendo solicitações de convidados |
| `backend/src/services/clientAuth.service.js` | Correção de segurança | Vínculo Google validado e mutações condicionais de senha/reset |
| `backend/src/services/cloudinary-upload.service.js` | Configuração de desenvolvimento | Uploads locais e transportes simulados restritos a development |
| `backend/src/services/email.service.js` | Configuração de desenvolvimento | Uploads locais e transportes simulados restritos a development |
| `backend/src/services/pagamento.service.js` | Correção de segurança; correção funcional | Isolamento teste, identidade do vendedor, assinatura e validação de pagamentos; logs sem trecho do token |
| `backend/src/services/pedido.service.js` | Correção de segurança; correção funcional | Identidade/preços do servidor, estoque legado condicional e cancelamento idempotente |
| `backend/src/services/telegram.service.js` | Configuração de desenvolvimento | Uploads locais e transportes simulados restritos a development |
| `backend/src/validators/agendamento.validator.js` | Correção funcional | Campos opcionais, trim, booleanos em query e limites de preço |
| `backend/src/validators/clientAuth.validator.js` | Correção funcional | Campos opcionais, trim, booleanos em query e limites de preço |
| `backend/src/validators/produto.validator.js` | Correção funcional | Campos opcionais, trim, booleanos em query e limites de preço |
| `backend/test/audit.test.js` | Teste | Regressões de segurança, isolamento, carrinho e respostas assíncronas obsoletas |
| `backend/test/development.test.js` | Teste | Regressões de segurança, isolamento, carrinho e respostas assíncronas obsoletas |
| `backend/test/payments.test.js` | Teste | Regressões de segurança, isolamento, carrinho e respostas assíncronas obsoletas |
| `frontend/.env.example` | Configuração de desenvolvimento | Contrato de variáveis sem credenciais preenchidas |
| `frontend/package.json` | Teste | Comando npm test sem novas dependências |
| `frontend/src/admin/components/AdminSearchBar.jsx` | Correção funcional | Sincronização da busca/debounce sem reset em efeito |
| `frontend/src/admin/pages/Categorias/CategoriasList.jsx` | Correção funcional | Carregamentos associados à consulta, descarte de respostas antigas, filtros e estados de erro; inclui correções de preço no detalhe |
| `frontend/src/admin/pages/Pedidos/Pedidos.jsx` | Correção funcional | Carregamentos associados à consulta, descarte de respostas antigas, filtros e estados de erro; inclui correções de preço no detalhe |
| `frontend/src/admin/pages/Produtos/ProdutosList.jsx` | Correção funcional | Carregamentos associados à consulta, descarte de respostas antigas, filtros e estados de erro; inclui correções de preço no detalhe |
| `frontend/src/components/layout/CookieConsent.jsx` | Correção funcional | Renomeação de consentimento que recuperou Brave, preferências e import correspondente; preservar como conjunto |
| `frontend/src/components/layout/Layout.jsx` | Correção funcional | Renomeação de consentimento que recuperou Brave, preferências e import correspondente; preservar como conjunto |
| `frontend/src/components/layout/PrivacyPreferences.jsx` | Correção funcional | Renomeação de consentimento que recuperou Brave, preferências e import correspondente; preservar como conjunto |
| `frontend/src/components/ui/ProductCard.jsx` | Correção funcional | Promoção, quantidades/estoque conhecidos, totais em centavos e contrato de checkout |
| `frontend/src/contexts/AuthContext.jsx` | Correção funcional; segurança | Identidade dos contextos, Fast Refresh, cookies e chamada de logout administrativo |
| `frontend/src/contexts/ClientAuthContext.jsx` | Correção funcional; segurança | Identidade dos contextos, Fast Refresh, cookies e chamada de logout administrativo |
| `frontend/src/contexts/auth-context.js` | Correção funcional; segurança | Identidade dos contextos, Fast Refresh, cookies e chamada de logout administrativo |
| `frontend/src/contexts/client-auth-context.js` | Correção funcional; segurança | Identidade dos contextos, Fast Refresh, cookies e chamada de logout administrativo |
| `frontend/src/hooks/useAsyncData.js` | Correção funcional | Carregamentos associados à consulta, descarte de respostas antigas, filtros e estados de erro; inclui correções de preço no detalhe |
| `frontend/src/hooks/useAuth.js` | Correção funcional; segurança | Identidade dos contextos, Fast Refresh, cookies e chamada de logout administrativo |
| `frontend/src/hooks/useCart.js` | Correção funcional | Promoção, quantidades/estoque conhecidos, totais em centavos e contrato de checkout |
| `frontend/src/hooks/useClientAuth.js` | Correção funcional; segurança | Identidade dos contextos, Fast Refresh, cookies e chamada de logout administrativo |
| `frontend/src/pages/About.jsx` | Correção funcional | Limpeza de código sem uso apontado pelo lint, sem funcionalidade nova |
| `frontend/src/pages/Catalog.jsx` | Correção funcional | Carregamentos associados à consulta, descarte de respostas antigas, filtros e estados de erro; inclui correções de preço no detalhe |
| `frontend/src/pages/Checkout.jsx` | Correção funcional | Promoção, quantidades/estoque conhecidos, totais em centavos e contrato de checkout |
| `frontend/src/pages/CheckoutPendente.jsx` | Correção funcional; segurança | Retornos autenticados, estado real do backend e finally sem desviar controle |
| `frontend/src/pages/Contact.jsx` | Correção funcional | Remove afirmação de envio que não possui integração; contatos públicos preservados |
| `frontend/src/pages/Home.jsx` | Correção funcional | Carregamentos associados à consulta, descarte de respostas antigas, filtros e estados de erro; inclui correções de preço no detalhe |
| `frontend/src/pages/MeusPedidos.jsx` | Correção funcional | Limpeza de código sem uso apontado pelo lint, sem funcionalidade nova |
| `frontend/src/pages/PagamentoSucesso.jsx` | Correção funcional; segurança | Retornos autenticados, estado real do backend e finally sem desviar controle |
| `frontend/src/pages/PedidoDetalhes.jsx` | Correção funcional; segurança | Retornos autenticados, estado real do backend e finally sem desviar controle |
| `frontend/src/pages/ProductDetail.jsx` | Correção funcional | Carregamentos associados à consulta, descarte de respostas antigas, filtros e estados de erro; inclui correções de preço no detalhe |
| `frontend/src/pages/RedefinirSenha.jsx` | Correção funcional | Erro de link ausente derivado durante renderização |
| `frontend/src/services/adminApi.js` | Correção funcional; segurança | Identidade dos contextos, Fast Refresh, cookies e chamada de logout administrativo |
| `frontend/src/services/imageMap.js` | Correção funcional | Limpeza de código sem uso apontado pelo lint, sem funcionalidade nova |
| `frontend/src/utils/asyncRequest.js` | Correção funcional | Carregamentos associados à consulta, descarte de respostas antigas, filtros e estados de erro; inclui correções de preço no detalhe |
| `frontend/src/utils/cart.js` | Correção funcional | Promoção, quantidades/estoque conhecidos, totais em centavos e contrato de checkout |
| `frontend/test/asyncRequest.test.js` | Teste | Regressões de segurança, isolamento, carrinho e respostas assíncronas obsoletas |
| `frontend/test/cart.test.js` | Teste | Regressões de segurança, isolamento, carrinho e respostas assíncronas obsoletas |

Os nove temporários listados acima são atenção adicional do repositório base;
não integram essas 71 alterações porque não mudaram contra HEAD. A remoção de
CookieConsent.jsx e adição de PrivacyPreferences.jsx devem ser revisadas e
versionadas juntas, com o import do Layout. Não foi uma exclusão de tela sem
substituição.

## 4. Migration complementar: risco de aplicação futura

Arquivo: backend/prisma/migrations/20261102070000_add_missing_refresh_tokens/migration.sql.
É a única migration nova no diff; migrations anteriores não foram modificadas.

Ela cria refresh_tokens e client_refresh_tokens, índices únicos para tokenHash,
índices por proprietário/expiração/revogação e FKs com ON DELETE/UPDATE CASCADE.
O schema já previa essas relações. A migration foi aplicada somente no ambiente
dev durante a recuperação; o histórico relata a confirmação de aplicação. Nenhuma
migration foi aplicada ou alterada nesta revisão.

| Risco em uma aplicação futura | Verificação/mitigação proposta |
| --- | --- |
| Tabelas/índices já existem por criação manual ou histórico divergente | Comparar schema real e _prisma_migrations em ambiente autorizado; não executar CREATE TABLE cegamente |
| Aplicar todo o histórico pendente por engano | Revisar a lista completa de migrations; migrate deploy não é seletivo só para este arquivo |
| Falha parcial de DDL | O arquivo não contém BEGIN/COMMIT; não presumir rollback integral. Ensaiar falha e recuperação com a CLI fixada |
| Locks ao criar FKs referenciando usuários/clientes | Ensaio isolado e observação do tempo de lock; planejar janela e timeout antes de produção |
| Permissões insuficientes de CREATE/INDEX/REFERENCES | Validar o papel de migrations em um ensaio; não usar credencial da aplicação por conveniência |
| Cascade remove refresh tokens ao excluir usuário/cliente | Confirmar intenção e política de retenção; não confundir com auditoria permanente de sessões |
| Histórico/checksum alterado após aplicação | Preservar este SQL aplicado; correções futuras devem ter migration própria e plano de reconciliação |
| Versões divergentes da ferramenta e cliente | CLI instalada 6.19.3 e pacote @prisma/client 6.16.2; alinhar versões e regenerar em uma etapa própria, com nova rodada de testes |

Plano futuro de aplicação: confirmar destino por identidade/endpoint, revisar
schema/histórico somente em leitura, preparar recuperação testada, ensaiar sobre
cópia isolada apropriada, aprovar SQL e rollout, aplicar por tarefa explícita e
conferir schema e autenticação após aplicação. Se já houver tabelas equivalentes,
tratar baseline/reconciliação com evidência, não marcar como aplicada apenas para
ocultar erro. Não usar migrate dev/reset/db push/seed em produção.

A tabela client_refresh_tokens ainda não é um fluxo de refresh de cliente ativo.
A migration corrige a lacuna de schema; ela não resolve revogação imediata nem
rotação/replay. Também não deve ser modificada para embutir a nova arquitetura.

Referências primárias: [baselining Prisma](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining),
[CLI migrate versionada](https://docs.prisma.io/docs/cli/v7/migrate).
As páginas de Prisma atuais também descrevem versões posteriores; esta base usa
Prisma 6 e deve usar comandos confirmados pela CLI local. Nenhuma migração para
Prisma 7/8 foi proposta como requisito desta revisão.

## 5. Estratégia de autenticação para a evolução

**Recomendação:** manter Express/Prisma/PostgreSQL e vincular cada JWT de acesso
a uma sessão persistida por dispositivo, identificada por sid. Verificar expiração,
revogação e proprietário no backend; manter domínios cliente/admin separados.
Reutilizar as estruturas de refresh onde forem adequadas, sem assumir que bastam
sem campos/relações adicionais. Não introduzir outro provedor de identidade ou
Redis antes de medir necessidade.

| Opção | Vantagem | Limitação |
| --- | --- | --- |
| JWT curto + refresh revogável | Menor custo de mudança | Não é revogação imediata do JWT existente |
| Denylist por jti/hash | Revoga token individual | Consulta/limpeza confiáveis; reset precisa abranger todos os tokens |
| Versão por usuário | Invalida todos os dispositivos facilmente | Não representa logout individual por sessão |
| Sessão persistida por sid | Logout individual e revogação global no reset | Requer contrato, armazenamento e tratamento de concorrência/indisponibilidade |

Critérios de aceitação propostos:

- Logout invalida imediatamente a sessão atual; reset invalida todas as sessões
  do usuário. Requisição já em execução precisa de limite de garantia documentado.
- Refresh tem rotação atômica e detecção de reutilização, com política para família
  comprometida e para duas requisições legítimas concorrentes.
- Migração define o tratamento de JWTs antigos sem sid e o rollout cliente/admin;
  não prolongar silenciosamente a validade dos tokens antigos.
- Consulta de sessão falha de forma fechada. Cache com atraso de revogação não
  pode ser anunciado como invalidação imediata; medir latência antes de cachear.
- Planejar redução da exposição do token em localStorage e estratégia de cookies,
  CORS/CSRF/XSS conjuntamente; não trocar apenas o meio de armazenamento.
- Testar logout/reset, replay, usuário desativado, sessão expirada, domínio errado
  e autorização por proprietário com banco real de teste e fixtures isoladas.

Hoje, logout cliente limpa o navegador; logout admin revoga refresh, mas ambos
podem deixar JWTs já emitidos válidos até expirar. Isso permanece aberto.
Base: [OWASP JWT](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet),
[OWASP sessões](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet).

## 6. Estoque e pagamentos na evolução

**Recomendação:** reserva explícita por pedido/item com quantidade, estado e
prazo, no mesmo PostgreSQL. A mudança exige aprovação de modelo e fluxo.

Alternativas: baixar estoque somente após aprovação evita reservas abandonadas,
mas pode cobrar sem disponibilidade; reservar todo pedido sem prazo impede
vendas por abandono. A reserva com prazo exige conciliação, mas torna liberação
e consumo auditáveis e compatíveis com o backend atual.

Fluxo proposto para revisão:

1. Validar identidade, itens e preços no servidor; reservar quantidade disponível
   atomicamente, em ordem determinística de produtos para reduzir deadlocks.
2. Persistir pedido pendente e tentativa de checkout; finalizar a transação antes
   de chamar Mercado Pago. Usar identificador estável da tentativa na reconciliação.
3. Se a criação da preferência falhar, compensar somente aquela reserva. Timeout
   exige verificar o resultado externo antes de repetir criação/liberação.
4. Confirmar evento por assinatura e consulta autenticada; validar vendedor,
   ambiente, referência, valor/moeda e vínculo com o pedido. Atualizar estado e
   converter reserva em venda de forma idempotente e transacional.
5. Cancelamento/expiração libera somente reserva efetivamente ativa. Pagamento
   tardio depois da liberação exige política explícita de nova alocação ou exceção,
   nunca aprovação automática pela URL de retorno.

Hoje, o fluxo legado reserva estoque, mas o checkout Mercado Pago não faz a
mesma reserva. O primeiro cancelamento de um pedido desse checkout pode devolver
estoque não reservado; repetição já tem guarda, mas não corrige essa primeira
inconsistência. preferenceId não demonstra reserva, pois pedidos legados também
podem receber preferência depois. A chamada externa ainda ocorre dentro da
transação de criação: risco de timeout/locks que deve sair no redesenho aprovado.
Também faltam regressões completas para eventos fora de ordem e concorrentes.

Outra lacuna confirmada por inspeção em
backend/src/services/pedido.service.js, atualizarStatusPedido: a rota é
administrativa, mas o serviço permite transições sem uma matriz de estados. Um
pedido CANCELADO pode voltar a PENDENTE e depois ser cancelado de novo, liberando
estoque novamente. A guarda atual cobre cancelamentos consecutivos/concorrentes,
não reabertura. Não foi executada essa sequência no banco. O redesenho deve
definir estados terminais e testar CANCELADO→PENDENTE→CANCELADO, alterações
administrativas e webhooks concorrentes, além da existência real da reserva.

A expiração de preferência e a expiração/liberação de reserva não substituem
reconciliação de pagamentos pendentes ou tardios. Aprovar a política comercial
antes da implementação. Nenhum teste desta revisão efetua transação real.
Referências: [locks PostgreSQL](https://www.postgresql.org/docs/17/explicit-locking.html),
[vigência de preferências Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/additional-settings/term-of-preference).

## 7. Performance: avaliação do bundle, sem refatoração

O build gera um único JavaScript de **600,70 kB minificado / 154,04 kB gzip**.
O aviso de 500 kB se refere ao tamanho do chunk, não ao tamanho gzip nem a uma
medição de lentidão. Não houve medição de LCP/INP ou CPU no Brave; não atribuir
culpa a uma biblioteca sem análise de composição.

Evidência: frontend/src/routes/AppRoutes.jsx importa estaticamente páginas públicas,
checkout, área cliente, layout admin, dashboard e formulários administrativos.
Não há lazy/Suspense nas rotas. O provider Google também está no topo do main.jsx.

| Prioridade | Oportunidade | Validação necessária |
| --- | --- | --- |
| 1 | Separar área /admin por import dinâmico | Visita pública não deve carregar a UI administrativa; testar redirects e sessão |
| 2 | Carregar checkout, conta, pedidos/agendamentos e páginas secundárias por rota | Suspense mantém layout, estados de carregamento e animações; testar refresh direto |
| 3 | Avaliar escopo do provider/SDK Google nas rotas que o utilizam | Não quebrar botão/login nem contexto; conferir requests e consentimento manual |
| 4 | Medir dependências comuns antes de definir chunks manuais | Evitar duplicação, ciclos e waterfalls; separar vendor por si só não reduz bytes usados |
| 5 | Rever carregamento/formato das fotos de produto | Medir bytes e dimensões por viewport; imagens são assets separados e não explicam sozinhas o JS de 600 kB |

Antes/depois propostos: bytes JS/CSS iniciais em visita pública sem cache, chunks
solicitados por rota, parse/execução em CPU limitada, LCP/INP e navegação admin.
Preservar imports seletivos de ícones e evitar preload indiscriminado de todas as
rotas. Estabelecer orçamento por rota após a primeira medição. Não aumentar o
limite do aviso só para silenciá-lo. Nenhuma dessas otimizações foi implementada.

Base: [React lazy](https://react.dev/reference/react/lazy),
[React Suspense](https://react.dev/reference/react/Suspense),
[Vite — carregamento de chunks](https://vite.dev/guide/features).

## 8. Proposta inicial JFQ 2.0

Manter a arquitetura atual e evoluir por entregas pequenas, com autorização antes
das migrations e do redesenho de sessões/estoque. Não há justificativa demonstrada
para reescrever o frontend, trocar o banco ou separar microsserviços nesta fase.

### Melhorias essenciais

| Etapa | Entrega proposta | Critério de saída |
| --- | --- | --- |
| Base estável dev | Higiene dos temporários/documentos, commits revisados e ambiente reproduzível | Sem segredos/dados pessoais indevidos; 101 testes, lint e build; smoke HTTP/visual registrado |
| Sessões | Implementar o contrato sid/refresh/logout/reset aprovado | Revogação/replay/concorrência comprovados em dev; plano de compatibilidade |
| Estoque + checkout | Reserva explícita, reconciliação e eventos idempotentes | Sem cobrança sem disponibilidade tratável; cancelamento libera só reserva existente |
| Mercado Pago teste | Credenciais exclusivas e testes reais autorizados de preferência/retorno/webhook | Vendedor/ambiente verificados; proteções mantidas; nenhum token live reutilizado |
| Operação | Checks automatizados em CI, versões Prisma alinhadas, logs estruturados redigidos | Pipeline reproduzível; dados sigilosos omitidos; diagnóstico sem expor usuários |
| Performance | Divisão de rotas e medição antes/depois | Menor carga inicial pública sem regressão de navegação/design |

O logger atual formata mensagem/stack, sem serializar os metadados arbitrários
recebidos nas chamadas. Planejar logs estruturados com redaction por padrão;
simplesmente imprimir os objetos pode reintroduzir dados pessoais/tokens.

### Funcionalidades futuras, sujeitas a priorização

- Ordem de serviço: diagnóstico, orçamento, autorização do cliente e acompanhamento.
- Agenda operacional: disponibilidade, atribuição a técnico e histórico de estado.
- Área do cliente com detalhes de serviço, pedidos e documentos apropriados.
- Fluxo de contato/orçamento com envio real e estados honestos; hoje não há envio
  integrado no formulário. Newsletter também requer definição de integração antes
  de anunciar inscrição efetiva.
- Notificações reais opt-in com ambientes separados, templates e prevenção de envio
  duplicado; continuam simuladas durante o desenvolvimento atual.
- Gestão de peças e movimentações de estoque, com trilha e perfis de acesso.
- Frete e condições comerciais somente após regras definidas; o checkout atual
  não aplica cálculo de frete nem o antigo desconto à vista anunciado.
- Acessibilidade, experiência móvel e busca aprimorada, validadas com usuários.

Essas funcionalidades são propostas, não constam como entregas prontas. O detalhe
administrativo do cliente ainda tem placeholder; não confundir navegação com uma
funcionalidade implementada.

### Riscos e decisões pendentes

| Prioridade | Risco | Próxima decisão |
| --- | --- | --- |
| Alta | JWT de acesso continua utilizável após logout/reset | Aprovar contrato de sessão e rollout |
| Alta | Reserva/devolução inconsistente no checkout MP | Aprovar modelo de reserva e pagamento tardio antes de liberar uso financeiro |
| Alta | Reabertura administrativa de pedido cancelado pode repetir devolução | Definir transições válidas e regressões de estados terminais; evidência por inspeção, sem escrita no banco |
| Alta para publicação | JSONs legados com campos pessoais | Confirmar origem, higienizar exemplos e decidir tratamento do histórico |
| Alta para deploy | Drift/histórico da migration em produção desconhecido | Pré-análise autorizada somente leitura e ensaio isolado |
| Média | Testes HTTP/visual atuais incompletos na sessão isolada | Registrar smoke e revisão Brave no computador |
| Média | Prisma CLI/cliente desalinhados e runtime fora de matriz previamente registrada | Definir versões suportadas e testar atualização separada |
| Média | Mock de pagamento não prova integração externa | Obter credenciais de teste e completar validação real |
| Média | Bundle único e metadados de log limitados | Medir rotas/CPU e aprovar evolução de observabilidade |
| Média | Histórico dos relatórios mistura estados antigos | Usar cabeçalhos de estado atual e manter evidência datada |

## 9. Plano de commits — proposta, nenhum executado

Preparar caminhos/hunks explicitamente e revisar o diff preparado em cada etapa;
evitar inclusão global de arquivos. Os arquivos compartilhados precisam de
separação por hunk quando a ordem abaixo criar dependência. Esta lista não é
aprovação de merge/deploy nem autorização para aplicar migrations em produção.

| Ordem | Título proposto | Conteúdo e dependências |
| --- | --- | --- |
| 0, antes de publicação | chore(repo): higienizar payloads manuais legados | Após confirmar a origem dos campos pessoais: conservar só fixtures sintéticas necessárias e retirar temporários versionados; não executado nesta revisão |
| 1 | chore(dev): isolar ambiente local e provedores simulados | Ignores/exemplos, prisma guard, bind local, email/Telegram mock, uploads, scripts migrate/setup/smoke e development.test.js; hunks correspondentes de backend/package.json |
| 2 | fix(db): completar tabelas de refresh tokens | Somente a migration complementar e nota de aplicação; preservar checksum e separar de alterações futuras de sessão |
| 3 | fix(api): proteger autenticação pedidos e pagamentos de teste | Middlewares/controllers/serviços/DTOs/validators de segurança e funcionalidade backend, paymentEnvironment, scripts/test-payment-local.js, audit.test.js e payments.test.js; comandos restantes do backend/package.json |
| 4 | fix(web): alinhar autenticação carrinho e retornos | Contextos/providers/hooks em conjunto, adminApi/cookies/logout, utilitário de carrinho e 18 testes, preços/retornos, correções finally/contato/reset, renomeação CookieConsent→PrivacyPreferences e Layout; frontend/package.json |
| 5 | fix(web): estabilizar consultas e filtros assíncronos | useAsyncData, observeRequest, sete testes, seis telas, filtros/debounce e limpezas de lint; incluir ProductDetail/Home/Catalog e listas administrativas como conjunto |
| 6 | docs: registrar recuperação auditoria e plano JFQ 2.0 | RECUPERACAO-LOCAL.md, INTEGRACOES-LOCAIS.md, AUDITORIA-FUNCIONAL.md e este plano, com estado atual inequívoco |

Detalhes de preparação:

- backend/package.json contém scripts de vários grupos: não deixar comando
  referenciar arquivo ausente numa versão intermediária.
- A suíte audit.test.js cobre vários controles; manter com o conjunto backend do
  grupo 3 para não separar teste de suas dependências. Se dividir esse commit,
  separar também as suítes por responsabilidade e validar cada etapa.
- ProductDetail tem correção de preço e mudança de carregamento: separar o hunk
  de preço no grupo 4 ou mover o arquivo inteiro ao grupo 5. Não incluir import
  de useAsyncData antes do hook existir.
- Contextos e hooks consumidores precisam entrar juntos; o Layout deve apontar
  para PrivacyPreferences no mesmo commit que sua adição/remoção antiga.
- Comandos de aceitação por etapa: testes aplicáveis, sintaxe/build; na fotografia
  final executar todos os 101, lint, build, diff-check e nova revisão de segredos.
- Manter .env, backups de tokens, logs, uploads, dist e relatórios privados brutos
  fora dos commits. Identificadores e contatos de documentos devem ser revistos
  conforme a audiência, mesmo quando não são credenciais.
- O grupo 0 ainda produzirá alterações novas e exige revisão própria; nenhum
  arquivo temporário foi apagado ou removido do índice nesta execução.

## 10. Conclusão da revisão e preservação

A base possui checks automatizados aprovados e alterações classificadas. Está
pronta para revisão e organização dos commits de desenvolvimento, com pendências
explícitas antes de publicação ampla e sem liberação de produção/pagamento real.

Nesta etapa, a única mudança de projeto é a criação deste documento. Código,
arquitetura, migration, dependências, configuração do sistema e dados do banco
permaneceram inalterados. Nenhum commit, push, pagamento, notificação real, deploy
ou operação de banco foi realizado. Fedora, Brave, Hyprland, Quickshell e VS Code
foram preservados.
