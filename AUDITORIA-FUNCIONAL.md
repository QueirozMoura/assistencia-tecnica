# Auditoria funcional e de segurança — JFQ Assistência Técnica

## Validação de concorrência e Prisma/REST — bloqueada pelo ambiente (02/11/2026)

**Resultado desta rodada: 169 testes locais aprovados; zero cenários de concorrência
real comprovados; zero fluxos Prisma/REST executados contra o ensaio. Ledger não
liberado para jfq-development.** Esta seção prevalece sobre os resultados anteriores.
Os 33 cenários PostgreSQL sequenciais da rodada anterior continuam como evidência
histórica; não foram reexecutados nem somados aos testes locais desta rodada.

### Identidade, acesso e diagnóstico de rede

Nome jfq-refresh-migration-rehearsal, projeto cool-rice-07419769, plano free_v3,
branch br-billowing-wave-bchj34qy e endpoint ep-divine-rice-bcxmkisc foram
reconfirmados no Neon antes das consultas. O host direto continua sendo
 ep-divine-rice-bcxmkisc.c-16.us-east-1.aws.neon.tech (neondb, PostgreSQL 18.6).
Produção e jfq-development não foram acessados. Nesta etapa não houve escrita em
nenhum banco nem aplicação de migration.

O projeto está acessível **pelo conector SQL**, mas o terminal não consegue
usá-lo. Evidências desta sessão:

- Resolução do endpoint e do domínio de controle neon.tech: gaierror -3;
  preflight Node: EAI_AGAIN, estágio dns, exit code 2, databaseWrites=false.
- Tentativa sem autenticação em socket TCP de loopback: PermissionError/EPERM,
  errno 1. Isso também impede a comunicação HTTP local necessária ao REST.
- Contexto do processo: NoNewPrivs=1, Seccomp=2. O conjunto é compatível com
  restrições de rede/socket do contexto de execução. Não prova defeito no DNS
  global do Fedora nem indisponibilidade do Neon; o conector remoto funciona.
  A regra interna exata que impõe o bloqueio não foi identificada ou alterada.

Não foram alterados DNS, firewall, VPN, configuração do sistema ou credenciais.
Não se tentou usar IP fixo, proxy, túnel ou outra forma de contornar o bloqueio.
Não foi iniciada uma API sem banco funcional nem substituído o teste REST por
chamada direta de controller com mocks.

### Correção segura do runner de concorrência

O runner anterior criava processos psql distintos e verificava PIDs/timestamps,
mas aceitava sobreposição de transações que poderiam executar suas mutações em
sequência. Um pg_sleep e BEGIN sobrepostos não comprovam disputa real do saldo.
Essa fragilidade de validação foi corrigida, sem mudar regra de estoque ou API:

1. Duas conexões psql são abertas. A executa sua mutação e envia holder_ready,
   mantendo a transação aberta e seus locks. B inicia a mutação concorrente.
2. Uma terceira conexão consulta pg_stat_activity e pg_blocking_pids. Exige
   três PIDs distintos, A com transação viva, B em estado active e espera Lock,
   e A presente entre os bloqueadores de B. O horário da consulta de B deve ser
   posterior à barreira de A, e a observação deve ser posterior à consulta.
3. Só após testemunhar esse bloqueio o coordenador permite COMMIT de A. Verifica
   o resultado esperado de B e consulta saldo, itens/provas e ledger após ambos.
4. Sem testemunho real, erro de conexão, timeout ou resultado inesperado, o
   runner falha. Há timeouts e cleanup somente dos filhos psql criados por ele;
   transações não confirmadas são revertidas. Nenhum registro prévio é apagado.

A matriz preparada tem cinco disputas: última unidade; cancelamentos repetidos;
mesma intenção de criação; administrador primeiro versus webhook de rejeição;
webhook de rejeição primeiro versus administrador. Nos dois últimos casos os
SQLs reproduzem a comparação de estado e a marca de evento, com rollback do
webhook perdedor e uma devolução única. **Esses SQLs não são o handler REST real.**

Agora são exigidas pelo menos três rodadas (configurável de 3 a 10), com schema
novo por rodada e snapshots de saldo/ledger na saída. Há 35 passos sequenciais
preparados por rodada (os 33 anteriores mais duas preparações dos novos casos),
seguido das cinco disputas. Nada dessa nova matriz foi executado no PostgreSQL
nesta sessão: o preflight bloqueou antes de obter credenciais ou criar fixtures.
O controle do runner também ainda depende de ensaio real para ser validado.

Quinze testes unitários novos verificam rejeição de evidência insuficiente:
mesmo backend, observador reutilizado, ausência de lock, bloqueador diferente,
A já encerrada, B inativa, timestamps inválidos e mera sobreposição temporal.
Eles validam o detector; **não contam como concorrência PostgreSQL aprovada**.

### PostgreSQL acessível: verificação somente de leitura

No schema preservado jfq_stock_20261102_b, as cinco asserções retornaram true:
nenhum saldo negativo; todo item de pedido novo tem débito correspondente;
reservas de novos cancelados têm compensação; toda devolução referencia débito
com mesmo pedido/item/produto/quantidade; histórico ambíguo 900 sem movimentos.
O ledger permanece com 15 linhas. As fixtures anteriores de refresh tokens de
public continuam preservadas. Essas consultas comprovam o estado persistido
anterior, sem afirmar nova disputa concorrente ou transporte Prisma/REST.

A evidência sanitizada desta rodada é
backend/test/fixtures/stock-validation-status.json. O arquivo anterior
stock-rehearsal-result.json foi preservado com seus resultados históricos.

### Matriz de execução e testes bloqueados

| Verificação | Resultado desta rodada |
| --- | --- |
| Testes backend locais | 144 aprovados |
| Testes frontend locais | 25 aprovados |
| Total local | **169 aprovados, zero falhas** |
| npm test em ambos os projetos | Aprovado; Node 26 resume por arquivo (6 backend, 2 frontend) |
| PostgreSQL: cinco invariantes persistidas | True, consulta real somente de leitura |
| Disputa da última unidade, conexões independentes | Bloqueada por DNS/socket; nenhuma rodada |
| Cancelamentos simultâneos e repetidos | Bloqueados; nenhuma rodada |
| Webhook × administrador, ambos os sentidos | Bloqueados; nenhuma rodada |
| Mesma intenção concorrente e repetição >=3 rodadas | Bloqueadas; nenhuma rodada |
| Aplicação da migration via Prisma no ensaio | Não executada; conexão direta indisponível |
| Criação REST legado com Prisma real | Não executada |
| Criação REST Mercado Pago com somente provedor simulado | Não executada |
| Cancelamento administrativo REST e persistência | Não executados |
| Webhooks REST assinados, duplicados, tardios e fora de ordem | Não executados |
| Histórico ambíguo, autenticação/autorização e validações via REST real | Não executados |
| Lint frontend | Zero erros/avisos |
| Build frontend | Aprovado; JS 600,89 kB, gzip 154,17 kB; aviso >500 kB permanece |
| Prisma validate | Aprovado offline com URL fictícia; não comprova aplicação da migration |
| git diff --check e sintaxe dos arquivos de teste | Aprovados |

A contagem local foi obtida executando individualmente os oito arquivos de teste:
backend audit 67, development 4, order-state 29, payments 11, stock-ledger 18,
stock-concurrency 15; frontend asyncRequest 7 e cart 18. As regressões de domínio
já existentes usam doubles de banco; não foram promovidas a testes de integração.

### Migration, Prisma e procedimento de retomada

Migration 20261102200000_order_stock_ledger **inalterada**, SHA-256
 a630c14a6707f75f01259975d6a20d72084eb79b7e1cd8cf359cda234d796058.
Aplicação anterior somente nos schemas de ensaio permanece como estava. Não houve
nova aplicação, geração de client ou alteração de schema nesta rodada.

O menor passo externo necessário é executar em contexto com DNS e sockets
permitidos, sem alterar as configurações globais do usuário:

```bash
cd ~/Projetos/assistencia-tecnica/backend
node scripts/test-stock-postgres.js --preflight
# Somente após preflight pronto e identidade do projeto de ensaio reconfirmada:
read -rs -p 'URL direta exclusivamente do ensaio: ' JFQ_STOCK_TEST_URL
export JFQ_STOCK_TEST_URL
npm run test:stock:postgres
unset JFQ_STOCK_TEST_URL
```

A URL é lida de entrada oculta, não de .env nem de argumento do processo. Não usar
URL de produção/jfq-development ou host pooler. O runner recusa outro endpoint,
retém os schemas e publica somente evidências de fixtures fictícias. Sem cinco
disputas aprovadas em pelo menos três rodadas, o bloqueio de liberação permanece.

**O runner SQL não executa Prisma/REST.** Para essa validação, preparar um banco
vazio novo no mesmo projeto isolado (sem substituir public de neondb, que contém
fixtures anteriores), confirmar sua identidade e aplicar a cadeia de migrations
pelo Prisma ali. Há referências explícitas a public nos helpers SQL do app;
apenas trocar schema= na URL para um schema de ensaio não isola essas chamadas.
Não modificar esses helpers para contornar o problema nem usar os bancos principais.
No banco novo, iniciar API de teste em porta livre de loopback, com credenciais
fictícias, e-mail/Telegram mock e somente respostas do provedor simuladas. Usar
HTTP real e Prisma real nos casos da tabela, incluindo assinatura de webhook,
401/403, identidade do cliente, preços do servidor, CAS e consulta final dos itens
/ledger/saldo. Guardar os resultados e repetir as disputas sem mocks de banco.
Não foram criados banco/serviços adicionais enquanto a rede está bloqueada.

### Propostas para os três riscos de negócio (não implementadas)

- **Reservas abandonadas:** manter acompanhamento/cancelamento manual enquanto
  não houver política aprovada. Propor TTL configurável, estados elegíveis,
  verificação financeira antes da liberação, CAS/ledger idempotentes e tratamento
  explícito de aprovação tardia. Prazo, exceções e responsabilidade pela conciliação
  exigem decisão de negócio. Nenhum job de expiração foi criado.
- **Preferência externa órfã:** propor intenção persistida antes do HTTP e etapas
  curtas de banco antes/depois, com preferência salva apenas se o pedido continuar
  elegível. Em timeout ambíguo, consultar/reconciliar antes de repetir ou cancelar;
  confirmar suporte de idempotência do endpoint do provedor antes de depender
  dele. Isso muda o fluxo/contrato de pagamento e precisa de aprovação e ensaio.
- **Chaves diferentes/ausentes:** não deduplicar pelo conteúdo do carrinho, pois
  pode ser uma segunda compra legítima. Propor intenção de checkout estável por
  compra, preservada em retry/reload, seguida de migração coordenada para chave
  obrigatória em todos os consumidores. Contrato legado opcional foi preservado;
  nenhuma rejeição nova ou fusão automática de pedidos foi introduzida.

Não há correção de negócio implementada nesta rodada. A correção local segura foi
impedir aprovação falsa de concorrência no runner e preparar os casos ausentes.

### Conclusão operacional e arquivos desta rodada

**Não aplicar ao jfq-development ainda.** Faltam evidência de disputa efetiva em
PostgreSQL e todos os fluxos Prisma/REST da tabela, com migration gerenciada pelo
Prisma em banco isolado completo. Os novos testes unitários e a leitura consistente
do ledger anterior não substituem esses requisitos.

Antes de produção futura, além disso: revisar drift/_prisma_migrations, compatibilidade
com históricos, locks/tempo da migration, coordenação de todos os escritores,
backup/recuperação sem apagar provas, acompanhamento de reservas, idempotência dos
clientes e política de conciliação. Validar credenciais e integração MP de teste
sem transação real. Não reintroduzir código antigo que devolve sem prova.

A revisão final incluiu diff acumulado e arquivos novos: zero correspondências
com segredos locais conhecidos e zero padrões de credenciais detectados, sem
imprimir valores. Nove hashes protegidos conferem (sete JSONs e dois .env), ambos
.env continuam ignorados e em modo 0600. git diff --check passou; índice sem
alterações staged. A varredura automatizada não substitui revisão antes de commit.

Arquivos desta rodada: runner test-stock-postgres.js, matriz stock-postgres.cases.js,
novos stock-concurrency.js e stock-concurrency.test.js, evidência
stock-validation-status.json, AUDITORIA-FUNCIONAL.md e PLANO-JFQ-V2.md. Código de
negócio, schema e migration não foram modificados. Sete JSONs e .env preservados;
sem commit/push, pagamento, notificação real, exclusão, reinício ou mudança de sistema.

---

## Registro da implementação anterior (resultados históricos)

## Ledger persistente implementado localmente — 02/11/2026

**Esta seção substitui as conclusões anteriores de decisão pendente.** O usuário
aprovou a reserva na criação nos fluxos legado e Mercado Pago. A implementação
local está preparada. **Atualização de 02/11/2026 (tarde):** a concorrência real em
PostgreSQL e a validação Prisma/REST completa **foram executadas e aprovadas no
projeto isolado de ensaio** (ver "Validação em PostgreSQL real e REST" abaixo).
A aplicação em jfq-development **continua pendente de autorização específica**
e de decisões listadas nos riscos. Nenhuma migration foi aplicada ao
jfq-development ou à produção. Não iniciar esta versão contra um banco sem a nova migration:
o novo Prisma Client espera as colunas e funções adicionadas.

### Diagnóstico e decisão aplicada

O legado debitava sem prova persistente; o checkout MP somente consultava o saldo;
o cancelamento administrativo devolvia sem comprovar débito; o webhook de falha
não compensava reservas. O bloqueio anterior de reabertura evitava uma segunda
compensação, mas não comprovava a primeira. Agora ambos criam pedido e itens,
registram a reserva e descontam a disponibilidade na mesma transação. MP permanece
PENDENTE/PENDING, sem paidAt: reserva não equivale a pagamento.

As transições permanecem PENDENTE→PAGO→PREPARANDO→ENVIADO→ENTREGUE, com cancelamento
antes de ENVIADO. CANCELADO e ENTREGUE são finais no servidor. Administração e
webhook mantêm comparação do estado observado. Aprovação não retrocede entrega;
evento pendente/rejeitado não desfaz pagamento já confirmado; pagamento tardio de
cancelado exige conciliação e não reabre o pedido nem retira estoque novamente.

### Arquitetura e invariantes

- EstoqueMovimento: UUID, pedido, item, produto, tipo, quantidade positiva, origem,
  timestamp e debitoOrigemId. Há unicidade por item/tipo e por débito compensado.
  O vínculo da devolução é uma FK ao débito original; as demais FKs são RESTRICT.
- Um item admite um débito e uma devolução integral. Devoluções parciais não
  faziam parte dos fluxos e não foram introduzidas. Identidade de pedido/item/
  produto e quantidade exata são verificadas pelo banco; a devolução não pode
  exceder nem apontar para outro débito.
- stockLedgerVersion=1 é gravado somente nas novas criações. Registros existentes
  recebem NULL; não há backfill por status, paidAt, preferência ou saldo atual.
- Funções SQL centrais jfq_reserve_order_stock e jfq_release_order_stock são
  chamadas pelos helpers com a mesma transação Prisma do pedido. Elas travam
  o pedido e percorrem os produtos por ID para reduzir risco de deadlock.
- Um trigger AFTER INSERT aplica o saldo. O débito usa UPDATE condicionado a
  ativo=true e estoque>=quantidade, sob lock de linha; saldo e ledger falham
  juntos. AFTER é essencial: INSERT ignorado por ON CONFLICT não movimenta saldo.
- Constraints diferidas verificam, no commit, se todos os itens novos têm débito
  e se todo débito de pedido novo cancelado tem devolução. Esquecer um helper ou
  falhar no segundo item reverte a transação inteira.
- Movimentos são imutáveis; itens com prova não podem ser editados/apagados;
  a versão não pode ser removida e cancelado não pode reabrir no banco. Exclusão
  administrativa de pedido ativo ou com ledger é recusada. Não houve exclusão.
- Funções têm privilégios do chamador e referências de schema fixas; não usam
  SECURITY DEFINER. Não há efeito externo em triggers nem notificação no SQL.

Falha na criação da preferência reverte pedido, itens, débito e saldo ainda não
confirmados pela transação. Rejeição/cancelamento posterior do pagamento devolve
somente o débito comprovado, junto ao estado e à marca de webhook processado.
Falha na devolução reverte também esses estados. Não há retry automático de uma
transação que contém a chamada ao Mercado Pago.

### Idempotência e cancelamento manual

A criação aceita creationKey de 16–128 caracteres. Chave por cliente autenticado,
hash canônico da intenção, índice único e advisory lock transacional impedem
recriar a mesma intenção. Alterar itens/endereço/fluxo mantendo a chave retorna
409. Preços/total enviados pelo cliente não participam da cobrança; preços são
obtidos pelo backend. Um retry verifica o pedido antes de consultar disponibilidade
já consumida e verifica novamente após adquirir o lock.

Retry MP reutiliza preferência/URL persistidas e emite novo token de consulta
com hash armazenado; não cria outra preferência nem outra reserva. O pedido é
relido sob lock antes de emitir o token. Pedido finalizado/pago não retorna um
checkout válido. O checkout React mantém a chave durante tentativas da mesma
intenção enquanto está montado, sem alteração visual. O novo token revoga os
tokens anteriores daquele pedido, conforme a política já existente.

**Limite explícito:** a chave é opcional para compatibilidade com consumidores
legados. Requisição sem chave ou com chave nova é nova intenção e pode criar
outro pedido/reserva. A chave do React não sobrevive ao recarregamento da página.
A idempotência de movimento por item é obrigatória no banco, mas não representa
deduplicação global de compras iguais. Antes da liberação, alinhar os consumidores
para reutilizarem a chave em retries; tornar a chave obrigatória exige migração
coordenada do contrato da API.

O PATCH administrativo existente, protegido por autenticação/permissão ADMIN,
continua permitindo PENDENTE→CANCELADO e libera a reserva comprovada exatamente
uma vez. Não foi criado endpoint público de liberação. Repetições de cancelamento
e notificações distintas referentes ao mesmo efeito não duplicam movimentos.

### Históricos e reservas abandonadas

Pedido anterior sem ledger pode ser cancelado, mas não gera devolução automática.
O cancelamento desse histórico não prova que o estoque foi reconciliado. Pode
exigir verificação manual; não há importação automática de suposta prova externa.
Débito válido já persistido pelo novo mecanismo continua compensável em outra
transação posterior. Nenhum pedido real foi alterado ou usado como fixture.

**Reservas abandonadas podem imobilizar estoque indefinidamente.** Não existe
expiração automática nesta etapa. A operação deverá acompanhar pedidos pendentes
e usar cancelamento administrativo quando apropriado. Atraso do pagamento após
cancelamento exige conciliação financeira; não é seguro reabrir automaticamente
uma reserva já liberada. Não se executa reembolso nem cobrança por este mecanismo.

### Migration e ensaio efetivamente executado

Nova migration: backend/prisma/migrations/20261102200000_order_stock_ledger/migration.sql.
SHA-256: a630c14a6707f75f01259975d6a20d72084eb79b7e1cd8cf359cda234d796058.
É transacional (BEGIN/COMMIT), aditiva, sem exclusão de colunas/registros e sem
preenchimento de histórico. Colunas novas são nullable; índices únicos aceitam
as chaves NULL existentes; FKs/checks de quantidade atingem a tabela nova.
A migration complementar de refresh tokens não foi modificada.

Antes de escrever, foram reconfirmados nome, ID, plano gratuito e branch do
projeto **jfq-refresh-migration-rehearsal / cool-rice-07419769**, branch
br-billowing-wave-bchj34qy, neondb, PostgreSQL 18. A baseline do schema Prisma
anterior ao ledger foi criada em schemas novos jfq_stock_20261102_a e
jfq_stock_20261102_b; a migration foi aplicada exclusivamente neles via conector
SQL, com referências de public redirecionadas para o schema de ensaio. O schema
_b contém a rodada final. As tabelas/linhas já existentes em public foram
preservadas; seus quatro conjuntos de fixtures continuam com um registro cada.
Nenhum schema de ensaio foi apagado ou recriado.

Isto comprova aplicação da DDL nova sobre uma baseline equivalente ao schema
anterior e preservação de um pedido criado antes dela. **Não comprova um prisma
migrate deploy de toda a cadeia histórica** nem seu registro em _prisma_migrations.
O runner e a evidência sanitizada estão em backend/scripts/test-stock-postgres.js,
backend/test/stock-postgres.cases.js e
backend/test/fixtures/stock-rehearsal-result.json.

### Testes e limites das evidências

| Suíte | Aprovados |
| --- | ---: |
| backend audit | 67 |
| backend development | 4 |
| backend order-state | 29 |
| backend payments | 11 |
| backend stock-ledger | 18 |
| frontend asyncRequest | 7 |
| frontend cart | 18 |
| Total automatizado local | **154** |

Mais **33 cenários SQL sequenciais aprovados em PostgreSQL real**, incluindo
preparação/asserções: criação nos dois fluxos, repetição de débito/devolução,
prova persistida entre transações, histórico sem prova, quantidade zero/negativa,
FK/identidade de devolução, débito já compensado, imutabilidade, chave única,
produto inativo ao devolver, falha no segundo débito, falha no segundo retorno,
rollback de estado/itens/movimentos, e detecção de helper omitido no commit.
Os testes de serviço cobrem webhooks duplicados, tardios/fora de ordem,
autorização, preços do servidor e rollback da marca de processamento.

Três sondagens foram lançadas com Promise.all para disputa de uma unidade,
cancelamento duplicado e chave de criação duplicada. Os resultados de saldo/
unicidade foram corretos, **mas não são evidência de concorrência real**: o
conector as serializou, com backend_pid=791 e tempos sem sobreposição na rodada
final. Não foram somadas aos 33 cenários nem declaradas concorrência aprovada.
O terminal não resolveu o endpoint de ensaio (gaierror -3); não houve tentativa
de contornar a restrição ou de usar produção/dev para completar o teste.

O runner opt-in npm run test:stock:postgres usa dois processos psql, confere PIDs
independentes e sobreposição temporal, impõe timeouts e recusa qualquer host que
não seja o endpoint de ensaio já identificado. Lê JFQ_STOCK_TEST_URL apenas do
ambiente do processo; não carrega/escreve .env nem imprime a URL. **Não foi
executado com rede nesta sessão.** Executar em terminal com conectividade,
fornecendo a URL direta (sem pooler) do projeto de ensaio por entrada oculta, sem gravá-la no shell:

```bash
cd ~/Projetos/assistencia-tecnica/backend
read -rs -p 'URL exclusivamente do banco isolado de ensaio: ' JFQ_STOCK_TEST_URL
export JFQ_STOCK_TEST_URL
npm run test:stock:postgres
unset JFQ_STOCK_TEST_URL
```

O runner cria um schema novo, conserva os anteriores e não limpa registros.
Seu alvo é fixo ao endpoint ep-divine-rice-bcxmkisc.c-16.us-east-1.aws.neon.tech,
no projeto isolado confirmado. Não substituir por DATABASE_URL do aplicativo.
Também falta o teste completo dos serviços Prisma/REST contra esse ensaio: os
helpers do app foram exercitados com doubles, e suas funções/constraints SQL
foram exercitadas no banco real. Mocks não foram usados para alegar locks reais.

npm test passou nos dois projetos. Node 26 agrupa a saída desse comando por
arquivo (5 backend/2 frontend); os **154 casos** foram contados executando cada
arquivo diretamente. Lint frontend sem erros/avisos; build aprovado (JS 600,89 kB,
gzip 154,17 kB; aviso >500 kB permanece). CSS Doxj6CRx inalterado. Prisma validate
passou com URL fictícia de loopback; generate passou sem acesso ao banco.
Não há ferramenta de Brave nesta sessão; a navegação visual não foi revalidada.

### Arquivos alterados nesta etapa

Schema Prisma e migration nova; serviços pedido.service.js e pagamento.service.js;
novos stockLedger.service.js/orderCreation.service.js; pedido.validator.js;
Checkout.jsx; testes audit/order-state e novos stock-ledger/stock-postgres.cases;
fixtures stock-baseline.sql e stock-rehearsal-result.json; runner de PostgreSQL;
backend/package.json e backend/.gitignore para disponibilizar o runner; estes
relatórios. O Prisma Client local foi regenerado em node_modules, ignorado.
As demais alterações do diff são acumuladas de rodadas anteriores.

### Validação em PostgreSQL real e REST — 02/11/2026 (executada e aprovada)

**Ambiente.** O terminal desta sessão alcança DNS e TCP (o EAI_AGAIN/EPERM
registrado antes não ocorreu): resolução de neon.tech/google.com, TCP de saída,
bind em loopback e `--preflight` do runner passaram. Destino: projeto
`jfq-refresh-migration-rehearsal` (cool-rice-07419769), branch
br-billowing-wave-bchj34qy, endpoint ep-divine-rice-bcxmkisc, database neondb,
confirmados no console Neon pelo navegador autenticado do usuário (projeto com
uma única branch, distinto de jfq-development, que é outro projeto da conta).
A connection string direta (sem pooler) foi copiada pelo botão "Copy snippet" e
lida do clipboard apenas dentro do processo do teste; não foi impressa, gravada em
arquivo nem colocada em .env. O clipboard foi limpo ao final. psql usou
`sslmode=verify-full` com `PGSSLROOTCERT=system`; o Prisma usou `sslmode=require`.

**Isolamento comprovado.** O runner recusa qualquer host/database diferente do
endpoint isolado, nunca lê .env, escreve somente em schemas novos
`jfq_stock_<timestamp>_<rodada>` (o baseline filtra `CREATE SCHEMA` e a migration
reescreve o qualificador de schema) e seus logs contêm só PIDs e saldos. Antes e
depois das execuções o schema `public` do ensaio (4 tabelas, 1 linha cada, 0
funções) ficou **idêntico**, comparado por nomes e contagens. Nada foi apagado;
os schemas de teste ficam retidos (`jfq_stock_1793649741213_1..3`,
`jfq_rest_1793650401616`, `..675287`, `..951966`, além dos dois anteriores).

**Concorrência real — `npm run test:stock:postgres`, 3 rodadas: 105 cenários
sequenciais e 15 disputas, todos aprovados.** Em cada disputa o holder alterou
dados e manteve a transação aberta; um observador independente registrou o waiter
`active` com `wait_event_type=Lock` e `pg_blocking_pids(waiter)` contendo o PID do
holder, com holder, waiter e observador em três PIDs distintos. Só então o holder
commitou. Resultado, idêntico nas rodadas 1, 2 e 3:

| Cenário (5 por rodada) | Bloqueio real | Resultado verificado |
| --- | --- | --- |
| Dois pedidos disputam a última unidade | 3/3 | um vence; o outro recebe JFQ_STOCK_INSUFFICIENT; estoque 0; 1 débito |
| Duas devoluções simultâneas do mesmo pedido | 3/3 | estoque restaurado uma vez; 1 devolução |
| Mesma intenção de criação (advisory lock) | 3/3 | 1 pedido, 1 débito |
| Cancelamento administrativo segura a linha, webhook rejeitado tenta CAS | 3/3 | webhook recusado (conflito); 1 devolução |
| Webhook rejeitado segura a linha, cancelamento administrativo repete | 3/3 | estado cancelado; 1 devolução; evento processado |

Ledger e estoque foram conferidos após cada disputa, sem débito ou devolução
duplicados e com estoque global não negativo. Exemplos de PIDs (rodada 1,
cancelamento vs webhook): holder 1117, waiter 1118, observador 1125, blockers [1117].

**Prisma/REST — `npm run test:rest:isolated` (novo): 28 cenários aprovados.**
Método: o runner copia `src` e `prisma` para diretório temporário trocando **somente
o literal `"public".`** (3 ocorrências no código, 39 na migration do ledger) por um
schema novo, aplica a cadeia real com `prisma migrate deploy`, sobe o Express real
em porta efêmera de loopback e simula o Mercado Pago (identidade do vendedor,
preferências, consulta de pagamento). Qualquer outra chamada externa é bloqueada
e contada: **0 requisições externas**. Cobertura:

- Cadeia de migrations: as 9 migrations aplicadas uma vez, sem falha nem rollback;
  triggers do ledger presentes. A migration do ledger foi aplicada pelo Prisma.
- Autenticação/autorização: sem token, token malformado, segredo errado, token de
  admin usado como cliente, token de cliente na API administrativa, perfil técnico
  (403); pedido vinculado ao dono do token, não ao `clienteId` do corpo; terceiros
  não leem nem pagam pedido alheio; checkout token forjado recusado.
- Fluxo legado e Mercado Pago: reserva atômica, preço sempre do servidor, falha do
  provedor (502) e identidade de vendedor errada (503) revertem pedido, estoque e
  ledger; pedido multi-item reverte o primeiro débito; `creationKey` reaproveita
  sem nova preferência nem segundo débito e rejeita payload diferente (409).
- Cancelamento administrativo: devolução única ligada ao débito original,
  repetição idempotente, sem reabertura (409), pedido pago devolve uma vez,
  entregue não cancela, exclusão com histórico de estoque recusada.
- Webhooks: assinatura ausente/inválida/ID divergente (401); live_mode, coletor e
  valor/preferência divergentes recusados ou ignorados; evento não-pagamento
  ignorado; duplicado idempotente; rejeitado devolve estoque uma vez; aprovado
  após cancelamento fica para conciliação; rejeitado/pendente após aprovado não
  regride.
- Históricos ambíguos (sem versão do ledger): cancelamento por admin e por webhook
  não inventam devolução; saldo e movimentos inalterados.
- Concorrência HTTP real (em 3 rodadas quando aplicável): duas compras pela última
  unidade (um 201 e um 400; só o vencedor chama o provedor); mesma `creationKey`
  simultânea nos dois fluxos (1 pedido, 1 débito); dois cancelamentos simultâneos;
  webhook rejeitado × cancelamento nos dois sentidos; webhook aprovado ×
  cancelamento (estados finais observados: PAGO e CANCELADO, ambos consistentes).
  Um monitor em conexão separada observou sessões bloqueadas em 16 das 17
  execuções monitoradas (informativo; a prova formal de bloqueio é a do runner SQL).
- Invariantes verificadas no banco após cada grupo: sem estoque negativo; estoque =
  semente + ledger por produto; um débito por item versionado; uma devolução por
  item cancelado e nenhuma em não cancelado; devolução ligada a débito do mesmo
  item/produto/pedido/quantidade; nenhum movimento em pedido histórico; total do
  pedido = soma dos itens.

**Totais (revisados após a regra de 02/11/2026, ver seção seguinte).** Automatizados locais: 152 backend + 25 frontend = **177 aprovados**; REST isolado: 30 cenários.
Banco real: 105 sequenciais + 15 disputas com bloqueio + 28 Prisma/REST = **148
cenários**. Lint, build (aviso >500 kB mantido), `prisma validate` e
`git diff --check` aprovados. Varredura do diff e dos arquivos novos: 0
ocorrências da senha do banco isolado e 0 padrões de connection string/token.

**Limitações desta evidência.**
1. O código da aplicação referencia `"public".` fixo em SQL cru
   (`stockLedger.service.js`, `orderCreation.service.js`). Como o `public` do
   ensaio já tem dados, o REST rodou numa cópia mecânica com apenas esse literal
   trocado; o código-fonte em si não foi alterado. Em dev/produção o schema é
   `public`. A cópia não prova a conexão do arquivo original com `public`.
2. Mercado Pago, e-mail e Telegram foram simulados: nenhum pagamento ou
   notificação real, e nenhum teste de entrega externa de webhook.
3. O teste REST usa tokens JWT gerados com segredos aleatórios do teste; os
   endpoints de login/Google/refresh não fazem parte desta evidência.
4. Ensaio em Neon gratuito de 0,25 CU: não mede carga nem duração de locks da
   migration em tabelas grandes.

**Comportamento observado → regra aprovada e implementada (ver seção seguinte).**

### Regra aprovada: confirmação de pagamento × cancelamento (02/11/2026, implementada)

**Decisão do usuário.** (1) Confirmação processada primeiro: pedido PAGO, sem
cancelamento automático pelo fluxo atual. (2) Cancelamento primeiro: CANCELADO e
estoque liberado exatamente uma vez. (3) Confirmação tardia de pedido cancelado:
preservar CANCELADO, não reservar estoque e registrar pendência de
conciliação/reembolso. (4) Nenhum reembolso automático. (5) Nenhuma confirmação
financeira tardia descartada em silêncio. (6) Idempotência, transação e proteção
contra concorrência.

**Diagnóstico da implementação anterior.** Regra 2: já atendida. Regra 1: **não
atendida** — `PAGO → CANCELADO` era transição permitida, então o cancelamento
administrativo posterior ao webhook cancelava um pedido pago (estado observado
na corrida). Regra 3: estado e estoque já eram preservados, mas a pendência ia
apenas para log e resposta HTTP 200 (o Mercado Pago não reenvia): **o fato
financeiro não ficava persistido**. Regras 4 e 6 já atendidas.

**Ajuste mínimo implementado (somente código, sem migration).**
- `orderState.js`: `isPaymentConfirmed` (paymentStatus PAID ou paidAt) e
  `assertOrderCancellable` → 409 "pagamento confirmado... reembolso/conciliação manual".
- `pedido.service.js` (`atualizarStatusPedido`): a transição real para CANCELADO
  é recusada se o pagamento está confirmado; o `updateMany` de cancelamento passa
  a comparar também o `paymentStatus` observado. Se o pagamento for confirmado
  entre a leitura e a escrita, o compare falha e a re-leitura devolve o mesmo
  409 em vez de cancelar. Repetição de cancelamento de pedido já cancelado segue
  idempotente. Pedido marcado PAGO manualmente pelo admin, **sem** confirmação do
  provedor, continua cancelável (não há dinheiro confirmado a proteger).
- Nenhum reembolso é disparado; o caminho do webhook não foi alterado.
- Efeito de UI: o botão de status do admin passa a receber 409 com mensagem
  legível ao tentar cancelar pedido pago. Nenhum arquivo de frontend alterado.

**Testes de regressão.** Backend 152 (eram 144; +8 em `order-state.test.js`):
resultado 1 e resultado 2 sequenciais; interleavings A (pagamento confirmado
entre leitura e escrita do cancelamento) e B (cancelamento commitado entre leitura
e escrita do webhook); aprovação e cancelamento simultâneos nos dois sentidos de
serialização; PAGO manual ainda cancelável; PREPARANDO/ENVIADO com pagamento
confirmado não cancelam. No banco real isolado (`test:rest:isolated`, **30
cenários aprovados**, 0 chamadas externas): cenário determinístico das regras
1 e 2/3 e corrida HTTP aprovado × cancelamento em 5 rodadas × 2 sentidos = 10
disputas, com **os dois resultados observados** (4 PAGO e 6 CANCELADO). Em PAGO:
cancelamento 409, paymentStatus PAID, 0 devoluções, estoque debitado. Em
CANCELADO: cancelamento 200, sem paidAt/PAID, 1 devolução, estoque restaurado e
webhook tardio recusado ou retido para conciliação, nunca aplicado. Invariantes
globais mantidas. O harness unitário não verifica o estado final das corridas
(reverte a mutação concorrente simulada); isso é coberto no REST.

**Pendência persistente de conciliação — proposta (APROVADA em 02/11/2026 e implementada na seção seguinte).** Hoje a confirmação tardia só aparece em
log/resposta. Persistir de forma auditável exige estrutura nova; a tabela
`mercado_pago_webhook_events` não tem motivo, valor, estado de resolução nem
responsável (reutilizá-la com `processed=false` misturaria deduplicação e
conciliação, e seria pouco auditável). Proposta: tabela `pagamento_conciliacoes`
(migration aditiva `…_payment_reconciliation`, sem backfill):
`id`, `pedidoId` (FK RESTRICT), `provider`, `paymentId`, `tipo`
(`PAGAMENTO_APROVADO_PEDIDO_CANCELADO`), `status` (`PENDENTE`, `EM_ANALISE`,
`REEMBOLSADO_MANUALMENTE`, `RESOLVIDO_SEM_REEMBOLSO`), `valor` (Decimal do
provedor), `statusProvedor`, `notificationId`, `rawPayloadHash`, `ocorrencias`,
`primeiraVezEm`, `ultimaVezEm`, `resolvidoEm`, `resolvidoPorId` (Usuario),
`observacao`; `UNIQUE(provider, paymentId, tipo)` para idempotência e índice em
`status`. Escrita por *upsert* na **mesma transação** do webhook, antes de
responder (incrementa `ocorrencias`, nunca cria duplicata); se a transação
falhar o Mercado Pago recebe não-2xx e reenvia, então nada se perde. Sem refund
automático: apenas endpoints administrativos de listagem e de marcação manual
com autoria e data, mais alerta ao admin pelo serviço de notificação existente.
Decidir ainda: se aprovações ignoradas por divergência de valor/preferência
também entram (recomendado, pois também são dinheiro recebido), e se a migration
vai junto com a do ledger no mesmo deploy (recomendado: duas migrations aditivas
em um único `migrate deploy`). **Aguardando sua aprovação antes de codificar.**

### Jfq-development: comparação somente leitura e plano de implantação (não executado)

**Verificações feitas (só leitura; `default_transaction_read_only=on`).** Projeto
jfq-development (autumn-rain-12939944), branch br-jolly-pine-b8g7sy9k, endpoint
ep-summer-bar-b8esi79j, confirmados no console Neon. Nenhuma escrita, migration ou
mudança de projeto/branch. `_prisma_migrations`: **8 migrations, todas concluídas,
nenhuma revertida, e os 8 checksums SHA-256 são idênticos aos de
`migration.sql` locais**. Pendente apenas `20261102200000_order_stock_ledger`
(a cadeia local tem 9). `prisma migrate diff` (introspecção do banco → schema.prisma)
mostra como única diferença exatamente a parte da migration do ledger: **não há
drift** (inclusive refresh tokens, já presentes e registrados). Perfil: 1 pedido
(PENDENTE, histórico), 1 item, 3 produtos (nenhum com estoque negativo), 3
clientes, 0 eventos de webhook, 0 funções `jfq_`. A migration é aditiva (4
colunas em `pedidos`, 1 tabela, constraints, triggers e funções), roda em uma
única transação (BEGIN/COMMIT), sem backfill e sem alterar linhas: o pedido
existente fica com `stockLedgerVersion` NULL e nenhum movimento inventado.

**Plano de aplicação coordenada (a executar só com autorização expressa).**
0. *Portões:* decisão sobre a tabela de conciliação (migration junto ou depois);
   revisão final do diff; testes, lint, build e REST isolado verdes.
1. *Preparar janela:* confirmar que nenhum backend local/outro escritor usa o
   banco dev (processos e abas). Sem expiração de reservas nem outros escritores.
2. *Backup/restauração:* o histórico de restauração do projeto gratuito é de apenas
   6 horas. Antes de tudo, (a) criar uma branch Neon de cópia (snapshot instantâneo
   do jfq-development) — **exige autorização por modificar o projeto** — e (b)
   `pg_dump` lógico para arquivo local 0600 fora do repositório (dados de clientes
   são pessoais). Conferir que a branch/dump abrem e têm as contagens acima.
3. *Aplicar:* somente com `npm run db:migrate:local` (recusa qualquer host que não
   seja o do jfq-development e exige NODE_ENV=development); nunca `migrate dev` nem
   `reset`. A migration é atômica: em falha nada é aplicado.
4. *Verificar o banco (SQL só leitura):* 9 linhas em `_prisma_migrations` concluídas;
   tabela `estoque_movimentos` vazia; 4 colunas novas; funções/triggers `jfq_*`
   presentes (mesmas contagens do ensaio); constraints
   `pedidos_ledger_version_check` e `estoque_movimentos_shape_check`; pedido
   histórico com versão NULL e estoque dos 3 produtos inalterado.
5. *Subir o novo backend* (o Prisma Client novo exige a migration; nunca iniciá-lo
   antes do passo 3 nem manter o antigo em paralelo) e rodar o smoke com dados
   fictícios: criar pedido legado e MP simulado, cancelar, conferir ledger/estoque.
   O smoke cria registros sintéticos no dev (exige autorização explícita).
6. *Validação posterior:* repetir as invariantes do ensaio sobre o dev; monitorar
   erros `JFQ_STOCK_*` e a fila de conciliação.
**Compatibilidade.** Backend novo + schema antigo: incompatível (colunas/funções
ausentes) — por isso a ordem migration → backend. Backend antigo + schema novo:
cria pedidos sem versão (tratados como históricos, sem débito) e não consegue
cancelar pedido versionado sem compensação (trigger diferido o impede); não
manter escritores antigos e novos simultaneamente.
**Rollback.** (i) Falha na migration: nada aplicado; corrigir e repetir.
(ii) Problema detectado *antes* de qualquer pedido novo: restaurar a branch/dump do
passo 2 (as 3 contagens e o checksum da cadeia confirmam o retorno). (iii) *Depois*
de pedidos versionados: corrigir para a frente; bloquear novas escritas de
checkout se preciso; **não** remover tabela/triggers nem voltar ao cancelamento
antigo (devoluções em duplicidade). O dev tem poucos dados, então o custo é baixo,
mas o procedimento deve ser ensaiado como se fosse produção.

### Fila persistente de conciliação financeira — implementada localmente (02/11/2026)

**Aprovado pelo usuário:** registrar na fila (1) pagamentos confirmados após cancelamento,
(2) divergências de valor, (3) divergências de preferência e (4) outros eventos
financeiros que exijam investigação manual, **diferenciando** pagamentos
efetivamente confirmados pelo Mercado Pago de eventos não verificados ou
suspeitos; migration `pagamento_conciliacoes` a ser aplicada **junto** com a do
ledger em um único deploy. A aprovação cobre apenas criar e testar localmente: **nada
foi aplicado ao jfq-development ou à produção.**

**Arquitetura.**
- *Migration* `20261102210000_pagamento_conciliacoes` (aditiva, sem backfill, atômica
  em BEGIN/COMMIT, **depois** do ledger na ordem de deploy): tabelas
  `pagamento_conciliacoes` (a pendência) e `pagamento_conciliacao_historico`
  (append-only). Nenhuma alteração em tabelas existentes além das FKs que
  referenciam `pedidos` e `usuarios` (RESTRICT).
- *Classificação (`verificacao`) é derivada do tipo e imposta por CHECK*, não por
  convenção: `CONFIRMADO_PELO_PROVEDOR` somente para pagamento aprovado lido
  de volta na API do Mercado Pago e atribuído ao pedido (tipo
  `PAGAMENTO_CONFIRMADO_PEDIDO_CANCELADO`) e para estorno/chargeback informado
  (`ESTORNO_OU_CHARGEBACK`); `NAO_VERIFICADO` para toda divergência (valor,
  preferência, pedido inexistente, referência não mapeável) — **não é presumida
  como dinheiro recebido**; `SUSPEITO` para vendedor/ambiente divergente. A
  API e o painel só mostram "dinheiro confirmado" quando verificação =
  confirmado **e** status do provedor = approved.
- *Idempotência:* `UNIQUE(provider, chaveIdempotencia, tipo)`. A chave é
  `pid:<paymentId>` **somente** quando o ID vem da leitura autenticada ao
  provedor (o ID declarado no payload fica à parte em `paymentIdInformado`); sem ID
  confiável usa `nid:<notificationId>`; sem isso `hash:<sha256 do payload>`. CHECKs
  garantem o formato e a coerência chave × paymentId. Escrita por
  `INSERT … ON CONFLICT DO UPDATE` (contador `ocorrencias`, `ultimaVezEm`) + linha de
  histórico, **na mesma transação** da decisão sobre pedido/estoque; duplicatas
  simultâneas serializam no índice único.
- *Transacionalidade e estado preservado:* pagamento tardio e estorno são
  registrados dentro da transação do webhook existente (se ela falhar, nada fica
  e o Mercado Pago recebe não-2xx e reenvia); divergências e demais casos usam
  transação própria. Pedido e estoque **não são alterados** pela fila (mesmo
  comportamento de antes). Notificações sem assinatura válida **não** são
  persistidas (dado controlado por atacante; permanecem só em log).
- *Eventos que NÃO entram:* rejeitado/pendente/em processo em pedido cancelado,
  divergência de valor/preferência com status não aprovado, tentativas
  rejeitadas antigas após pagamento aprovado — não são dinheiro recebido.
- *Dados mínimos:* só IDs, status, valores, IDs de preferência/referência
  externa e hash do payload. Não há e-mail do pagador, cartão ou payload bruto; a
  observação do administrador é limitada a 1000 caracteres e a tela orienta a não
  colar dados de cartão.
- *API administrativa* `/api/conciliacoes` (somente perfil ADMIN; sem token → 401,
  cliente → 401, técnico → 403): `GET /` (filtros status/tipo/verificacao/pedidoId,
  paginação), `GET /resumo`, `GET /:id` (evidência + histórico), `PATCH /:id/status`.
  **Não existe endpoint de reembolso.** A resolução manual exige justificativa
  (≥3 caracteres) nos status finais, registra responsável e data, é terminal
  (nova notificação do mesmo pagamento apenas incrementa o contador) e usa
  compare-and-swap: dois administradores simultâneos → um vence, o outro 409.
- *Proteções no banco:* histórico imutável (UPDATE/DELETE bloqueados); item não
  pode ser apagado; identidade (chave, tipo, verificação, pedido, paymentId, hash)
  imutável; status final imutável; **toda mudança de status exige, na mesma
  transação, uma linha de histórico com o responsável** (constraint trigger
  diferida). O pedido com pendência não pode ser excluído (409, e FK RESTRICT).
- *Painel:* `/admin/conciliacoes` (resumo, filtros, lista) e
  `/admin/conciliacoes/:id` (evidência, formulário de status, histórico), com
  aviso permanente de que não há reembolso automático.


**Testes e validação em PostgreSQL real (02/11/2026, projeto isolado, 3 rodadas no runner SQL).**
- *Automatizados locais:* **172 backend** (eram 152; +10 em `reconciliation.test.js` e +10 na fila de
  `order-state.test.js`) e **29 frontend** (+4) = **201 aprovados**; lint, build, `prisma validate` e
  `git diff --check` aprovados.
- *`npm run test:stock:postgres` (migrations ledger + conciliação, em schemas novos):* **114 cenários sequenciais e
  21 disputas com bloqueio real, todos aprovados** (eram 35 e 5 por rodada; agora 38 e 7). As 2 disputas novas por
  rodada — dois webhooks fazendo upsert da mesma chave (1 item, `ocorrencias` = 2) e dois administradores resolvendo o
  mesmo item (um vence, o outro recebe `JFQ_TEST_RESOLUTION_CONFLICT`, uma única transição auditada) — tiveram
  `wait_event_type=Lock`, waiter `active`, `pg_blocking_pids` contendo o holder e três PIDs distintos em **3/3**
  rodadas (ex.: rodada 1, upsert: holder 1262, waiter 1261, observador 1268). As 21 disputas passam na validação de
  evidência do runner.
- *`npm run test:rest:isolated` (Express real + Prisma, cadeia de **10 migrations** por `prisma migrate deploy`,
  Mercado Pago simulado, 0 chamadas externas, 0 credenciais no log): **41 cenários aprovados**.* Novos: pagamento
  tardio registrado uma vez com estado e estoque intactos; **8 notificações duplicadas simultâneas → 1 item com
  contagem exata (9) e 9 linhas de histórico**; divergências de valor, preferência, pedido inexistente e referência
  não mapeável como `NAO_VERIFICADO`; vendedor/ambiente divergente como `SUSPEITO` (403 mantido); estorno/chargeback
  registrado sem regredir o pedido; eventos que não são dinheiro não entram; notificações sem assinatura ou forjadas
  não criam item; API somente ADMIN; filtros, resumo, detalhe e ausência de campos sensíveis; resolução manual com
  justificativa, responsável, data e histórico, terminal e sem reembolso; **dois administradores simultâneos em 3
  rodadas → sempre 1 vitória e 1 × 409**; guardas no banco (histórico imutável, sem DELETE, identidade e resolução
  imutáveis, mudança de status sem histórico recusada no commit, CHECKs de classificação, chave e resolução); pedido
  com pendência não pode ser excluído; ID de pagamento não confiável cai para a chave de notificação e depois para o
  hash. A corrida aprovação × cancelamento (10 disputas, ambos os sentidos) deu **5 PAGO e 5 CANCELADO**; em
  CANCELADO, o reenvio do webhook após o conflito de CAS gera exatamente 1 pendência; em PAGO, nenhuma. Invariantes
  globais verificadas após cada grupo, incluindo as da fila. Objetos no schema de teste: 10 funções `jfq_`,
  9 triggers, 14 CHECKs e 10 migrations finalizadas.
- *Achado da validação em banco real:* a primeira execução falhou com 500 porque o SQL cru da fila usava o nome da
  tabela sem schema — o Prisma qualifica apenas as consultas que gera, nunca `$queryRaw`. Em `public` (dev e
  produção) funcionaria, mas dependia do `search_path`; o SQL passou a usar `"public".` como o ledger (agora **4**
  literais no código). Também corrigi dois erros do meu próprio teste. Execução final limpa: 41/41.
- *Inspeção da repetição interrompida do runner (somente leitura, nada excluído):* os schemas
  `jfq_stock_1793651810837_1..3` existem completos (12 tabelas, 7 funções, 6 triggers, como os demais); **nenhum
  schema parcial** e **0 sessões abertas**. Isso é esperado, pois cada migration é uma transação atômica. O `public`
  do ensaio segue idêntico (4 tabelas, mesmas contagens). Ficam **18 schemas `jfq_*` retidos**.

**Riscos e limitações pendentes.**
1. Nenhuma notificação ao administrador quando um item novo entra na fila (só consulta no painel); decidir canal e
   política (hoje não há envio real, em linha com a restrição).
2. Notificações com assinatura inválida não são persistidas, por design; ataque ou erro de configuração do segredo
   só aparece em log. Avaliar contador/alerta de rejeições.
3. O reembolso continua 100% manual e fora do sistema; a fila registra a decisão humana mas não a valida contra o
   Mercado Pago. Não há conciliação automática de extrato.
4. Divergências de valor/preferência só são registradas para status `approved`; outros estados do provedor
   (ex.: `in_process`) não entram e podem exigir revisão quando houver dados reais.
5. O REST usa cópia mecânica do código com `"public".` trocado por schema novo (4 literais); a fonte original não
   foi alterada nem executada contra o schema `public` do ensaio (que tem dados).
6. Checkout Mercado Pago real de teste segue pendente (sem credenciais de teste no dev); Mercado Pago, e-mail e
   Telegram foram simulados.
7. Riscos já conhecidos e inalterados: reservas abandonadas sem expiração, preferência externa órfã após rollback e
   chaves de idempotência de checkout ausentes ou diferentes.
8. O histórico de restauração do projeto gratuito é de 6 h: o backup por branch + `pg_dump` deve ser feito
   imediatamente antes da janela.
9. Ensaio em Neon gratuito (0,25 CU): não mede carga nem duração de locks em tabelas grandes.

### Plano de aplicação das duas migrations no jfq-development (preparado, NÃO executado)

**Escopo e autorizações.** Alvo único: jfq-development (autumn-rain-12939944, branch
br-jolly-pine-b8g7sy9k, endpoint ep-summer-bar-b8esi79j). Pendentes, nesta ordem:
`20261102200000_order_stock_ledger` e `20261102210000_pagamento_conciliacoes`, aplicadas
por **um único `prisma migrate deploy`**. Dependem de autorização expressa para
(a) criar a branch de backup (modifica o projeto Neon) e (b) aplicar. Nada disso foi feito.
Produção fica fora deste plano.

**Ferramentas preparadas (somente leitura, sem segredo em disco).**
`backend/scripts/verify-dev-deploy.js` com `--pre [--snapshot arq]` e
`--post [--compare arq]`: recusa qualquer host que não seja o direto do
jfq-development, força `default_transaction_read_only=on`, compara
`_prisma_migrations` com os checksums locais, deriva as contagens esperadas de
funções/triggers/constraints das próprias migrations, e grava só contagens.
A URL entra apenas por variável de ambiente (`read -rs` no terminal).

**Passos e portões (parar em qualquer FAIL).**
1. *Portão de código:* testes backend/frontend, lint, build, `prisma validate`,
   `test:stock:postgres` (3 rodadas) e `test:rest:isolated` verdes na mesma
   revisão que será implantada; diff revisado. Sem commit pendente de revisão.
2. *Pré-verificação (leitura):* `verify-dev-deploy.js --pre --snapshot <arq 0600 fora do repo>`.
   Esperado: 8 migrations aplicadas e idênticas, pendentes = as duas, nenhum objeto
   `jfq_*`, perfil de contagens. Qualquer divergência interrompe.
3. *Backup (exige autorização):*
   a. **Branch Neon** do jfq-development (cópia pontual instantânea e independente
      do histórico de 6 h do plano gratuito) pelo console ("Create child branch" a partir
      da branch principal, sem agendar expiração) ou `neonctl branches create`. Nome sugerido
      `backup-pre-ledger-AAAAMMDD-HHMM`. Registrar o ID da branch.
   b. **`pg_dump` lógico** (dados de clientes são pessoais; arquivo 0600 fora do repositório):
      `PGSSLROOTCERT=system pg_dump --format=custom --no-owner --no-privileges --file ~/backups/jfq-dev-pre-ledger-AAAAMMDD-HHMM.dump "$URL_DIRETA"`
      (URL direta, sem pooler, via `read -rs`; nunca gravada). Validar:
      `pg_restore --list` abre o arquivo e lista as 12 tabelas; `sha256sum` anotado;
      contagens da branch de backup = snapshot do passo 2 (consulta somente leitura).
   c. Os backups ficam retidos até o fim da janela de observação; nunca apagar antes.
4. *Congelar escritores:* garantir que não há backend/aba usando o banco dev
   (`ss -ltnp` nas portas 3000/5173 e processos node do projeto), sem expirar nem
   mover nada. O backend novo **não** deve subir antes do passo 5 e o antigo **não** deve rodar
   em paralelo.
5. *Aplicar:* somente `cd backend && npm run db:migrate:local` (recusa host diferente do
   jfq-development e exige NODE_ENV=development). Nunca `migrate dev`, `reset` ou
   `db push`. Cada migration é atômica (BEGIN/COMMIT); a primeira só adiciona colunas
   nulas, tabela, constraints e triggers (bloqueio breve; sem reescrita de linhas). Se a segunda
   falhar, o banco fica com o ledger aplicado e a segunda registrada como falha: **não subir
   o backend**; corrigir, `prisma migrate resolve --rolled-back 20261102210000_pagamento_conciliacoes` e repetir
   `migrate deploy`; ou restaurar o backup (passo de rollback).
6. *Pós-verificação (leitura):* `verify-dev-deploy.js --post --compare <snapshot>`:
   10 migrations finalizadas e idênticas, 10 funções/9 triggers/14 CHECKs, 3 tabelas novas e
   4 colunas novas, dados de negócio idênticos ao snapshot, ledger e fila vazios, pedido
   histórico sem versão.
7. *Subir o backend novo (uma instância)* e o frontend. Smoke com dados **fictícios**
   (exige autorização, pois grava no dev): `npm run test:local` e, no admin,
   conferir `/admin/conciliacoes` (vazia) e o cancelamento de um pedido fictício com débito no
   ledger. O checkout Mercado Pago real de teste continua pendente (credenciais de teste
   ausentes no dev); sua lógica está validada no ensaio isolado.
8. *Validação posterior (leitura):* sem estoque negativo; um débito por item versionado;
   uma devolução por item cancelado; devolução ligada ao débito; histórico de
   conciliação coerente com as ocorrências. Janela de observação: erros `JFQ_STOCK_*`,
   `JFQ_CONCILIACAO_*`, 5xx no webhook e itens abertos na fila.

**Compatibilidade.** Backend novo + schema antigo: incompatível (colunas/funções/tabelas
ausentes; o webhook tardio falharia com 500 e o provedor reenviaria) — por isso a
ordem é migrations → backend → frontend. Backend antigo + schema novo: roda, mas cria
pedidos sem versão (tratados como históricos, sem débito) e não registra a fila; o cancelamento
antigo não consegue cancelar pedido versionado sem compensação (trigger diferido).
Não manter escritores antigos e novos simultâneos. Frontend novo + backend antigo:
a tela de conciliação recebe 404 (sem efeito sobre o resto).

**Rollback.** (i) Falha durante `migrate deploy`: nada parcial dentro de cada migration;
corrigir e repetir ou restaurar o backup. (ii) Problema antes do primeiro pedido
versionado ou item de fila real: restaurar a branch/dump do passo 3 e reaplicar do zero depois
da correção; conferir contagens e checksums. (iii) Depois de pedidos versionados ou itens de
fila: **corrigir para a frente**; bloquear novas escritas de checkout se necessário;
não remover tabelas/triggers, não desfazer saldos em lote e não voltar ao código antigo
de cancelamento. O histórico de conciliação nunca é apagado (triggers o impedem).
No dev o custo é baixo (poucos dados), mas o procedimento deve ser ensaiado como se fosse
produção, que terá plano próprio e nova autorização.

### Condições para liberação e riscos restantes

1. ~~Executar o runner fora do isolamento e exigir três disputas...~~ **Cumprido em
   02/11/2026** (ver seção acima: 15 disputas com bloqueio comprovado e 28
   cenários Prisma/REST, todos aprovados). Reprovar a liberação se, em nova
   execução, houver deadlock sem tratamento operacional ou saldo divergente.
2. Revisar schema real, _prisma_migrations e eventual divergência das tabelas de
   refresh tokens antes de planejar deploy. Não marcar migrations como aplicadas
   só porque tabelas já existem. Nenhuma foi aplicada ao banco dev principal.
3. Após autorização específica, aplicar/revalidar em desenvolvimento. Coordenar
   migration e troca do aplicativo, sem escritores antigos e novos simultâneos.
   O binário novo não é compatível com schema antigo. Triggers diferidos também
   impedem escritor antigo de cancelar pedido novo sem gravar a compensação.
4. Confirmar todos os consumidores da chave de criação; definir acompanhamento
   manual das reservas abandonadas. Sem expiração ou liberação pelo navegador.
5. A preferência MP continua sendo chamada dentro da transação existente: locks
   podem durar até o timeout. Um efeito HTTP não é desfeito pelo rollback SQL;
   preferência órfã/pagamento tardio exigem conciliação. Credenciais e checkout MP
   real de teste continuam pendentes; não houve transação financeira nesta etapa.
6. Ajustes absolutos de estoque pelo administrador continuam fora do ledger de
   pedidos. Podem sobrescrever uma contagem baseada em tela desatualizada; este
   ledger não reconstrói inventário global nem substitui política de ajustes.
7. Rollback operacional: bloquear novas escritas de checkout e corrigir para a
   frente, conservando ledger/provas. Não remover tabela/triggers, não desfazer
   saldos em lote e não voltar cegamente ao cancelamento antigo. Ensaiar o
   procedimento com backup/recuperação antes de qualquer produção futura.

Revisão final: git diff --check passou, índice sem alterações staged; varredura
incluiu arquivos novos e diff acumulado, sem correspondência com os segredos
locais conhecidos nem padrões de chave privada/token de provedor. Os dois .env
continuam ignorados com modo 0600. Essa checagem não elimina a revisão manual
necessária antes de versionar as alterações acumuladas.

Os sete JSONs e os dois .env foram comparados por hash: **nove arquivos intactos**;
.env continuam ignorados e com permissões preservadas. Nenhum dado pessoal foi
reproduzido, commit/push feito, notificação real enviada, pagamento criado ou
configuração do sistema alterada. Produção não foi conectada nem modificada.

---

## Registro histórico anterior à aprovação (superado pela seção acima)

## Controle persistente de estoque — diagnóstico e decisão pendente (02/11/2026)

**Implementação ainda não iniciada.** O diagnóstico encontrou uma mudança de
regra de negócio inevitável no checkout Mercado Pago. Conforme a instrução desta
etapa, a decisão foi apresentada antes de alterar código/schema. Esta seção não
representa uma migration ou um ledger já implantado.

### Diagnóstico inicial

| Ponto inspecionado | Comportamento atual | Risco |
| --- | --- | --- |
| criarPedido | Cria pedido/itens e decrementa estoque na mesma transação, com estoque >= quantidade | Não grava prova persistente por item; retry de criação pode gerar outro pedido |
| criarPedidoComPagamento | Consulta estoque; cria pedido e preferência; não decrementa estoque | Dois checkouts podem prometer as mesmas unidades; falta regra para momento do débito |
| Cancelamento administrativo | Compara estado e devolve itens uma vez na transição para CANCELADO | Ainda devolve sem comprovar débito anterior |
| Webhook rejeitado/cancelado | Pode cancelar pedido pendente, sem devolver estoque | Pedido legado pode permanecer com débito não compensado |
| Webhook aprovado | Atualiza financeiro/estado, sem debitar estoque | Checkout MP não passa a ter débito nem depois da aprovação |
| Webhooks repetidos/fora de ordem | Dedupe por notificação, comparação de estado e bloqueio de regressões | Não representam prova de movimentação; eventos diferentes podem se referir ao mesmo efeito |
| Nova preferência | Confere dono, pedido pagável e estado ao salvar | Chamada externa pode ter efeito mesmo se a gravação local falhar |
| Atualizar produto | Pode alterar estoque absoluto administrativamente | Não é movimentação vinculada a pedido; saldo atual não reconstrói histórico de débito |
| Excluir pedido | Não ajusta estoque; itens possuem cascade | Um ledger futuro precisará impedir perda de vínculos auditáveis |

Estados atuais: PENDENTE→PAGO→PREPARANDO→ENVIADO→ENTREGUE; cancelamento antes do
envio; CANCELADO/ENTREGUE finais; mesmo estado idempotente. No pagamento, aprovação
não retrocede preparação/envio/entrega. Pagamento tardio de cancelado exige
conciliação. Essas regras não foram alteradas neste diagnóstico.

O checkout faz chamada HTTP ao provedor dentro de transação de banco. Uma
transação PostgreSQL não torna esse efeito externo atômico: timeout, rollback ou
perda da resposta podem deixar preferência órfã. Reexecutar transação com chamada
externa sem controle também pode repetir o efeito. Esse limite deve ser tratado
explicitamente, sem misturar idempotência de estoque com idempotência do provedor.

Os oito arquivos de migration foram inventariados. Nenhum cria movimentos de
estoque, prova de débito/devolução ou chave de idempotência da criação de pedidos.
O modelo atual de itens identifica pedido/produto/quantidade, mas não prova que a
baixa ocorreu. Status PAGO/CANCELADO, paidAt, preferenceId, logs e saldo atual não
são provas suficientes. Não foi adotada inferência ou backfill por esses campos.

### Decisão de negócio necessária antes da implementação

**Opção recomendada para aprovação:** descontar e registrar estoque na criação
nos dois fluxos, alinhando checkout MP ao pedido legado. Um pedido pendente MP
passará a reduzir disponibilidade até cancelamento. Expiração automática não é
parte desta etapa e exigirá política separada; abandono pode imobilizar estoque.
O cancelamento devolverá apenas débito comprovado, por uma regra central comum à
administração e ao webhook.

**Alternativa:** descontar MP somente no pagamento aprovado. Isso preserva o
estoque disponível durante a pendência, mas exige aprovar o tratamento de pagamento
confirmado sem unidades suficientes: conciliação/atendimento, sem marcar compra
como atendível nem iniciar reembolso real automaticamente.

Nenhuma opção foi adotada por falta de resposta. Não se presume aprovação pela
passagem de tempo ou pela autorização genérica de desenvolvimento. A implementação
que depende desse momento do débito permanece suspensa até a decisão.

### Arquitetura proposta para o ledger (não implementada)

Preferir um registro de movimentações por item, compatível com Prisma/PostgreSQL,
em vez de inferir histórico ou usar apenas dois timestamps no pedido:

- UUID por movimento; vínculo com pedido, item e produto; tipo DEBITO/DEVOLUCAO;
  quantidade positiva; data, motivo/origem e identificador de operação.
- Unicidade por item/tipo e chave de operação: um débito e uma devolução integral
  no fluxo atual de cancelamento completo. Devoluções parciais são uma evolução
  separada, não um comportamento existente presumido.
- Devolução referencia o débito original; vínculo único impede reaplicação.
  Conferir pedido/item/produto e quantidade contra o débito e o item. Usar FKs,
  unicidade e validação entre registros; não usar CHECK com subconsulta a outra
  tabela como se garantisse integridade entre linhas.
- Histórico append-only; corrigir mediante evento/fluxo explícito, não editar ou
  apagar movimentos. FKs restritivas protegem referências; não remover prova por
  cascade de pedido/item. A migration precisará explicar esse impacto na exclusão.
- Funções centrais de débito/devolução recebem a transação. Pedido, itens, saldo
  e movimento confirmam ou falham juntos. Administração e webhook chamam o mesmo
  mecanismo de devolução.
- Trancar o pedido e adquirir produtos em ordem determinística; debitar por
  atualização condicional de disponibilidade. Unicidade no banco é a última
  guarda contra duplicação, não apenas um find antes de inserir.
- Criação de pedido precisa de chave de idempotência por cliente/intenção, com
  hash do payload relevante. Mesma chave/payload recupera a operação original;
  mesma chave com outro payload retorna conflito. Payload idêntico sem uma chave
  não permite distinguir retry de uma compra intencionalmente nova.
- O frontend deverá manter a chave durante retries. A resposta de retry não pode
  disparar uma segunda preferência nem exigir armazenar tokens secretos em claro.
- Conflitos/deadlocks precisam de retry limitado somente para efeitos locais
  seguros. Não repetir automaticamente uma chamada financeira/externa dentro do
  bloco de retry do banco.

A seleção exata de constraints/FKs/trigger de validação deve ser comprovada no
ensaio da migration, não assumida pela existência de tipos no Prisma. Os checks
de quantidade e identidade precisam existir também no banco quando aplicáveis.
Nenhum tipo, campo, tabela ou trigger dessa proposta foi criado nesta etapa.

### Invariantes e evidência a produzir

| Invariante | Mecanismo proposto | Ensaio obrigatório |
| --- | --- | --- |
| Uma devolução por débito/item | Vínculo e unicidade persistidos | Duas requisições/eventos e duas conexões concorrentes |
| Não devolver acima do débito comprovado | Identidade/quantidade conferidas com o débito original | Excesso, produto/item/pedido divergentes e origem inválida |
| Pedido/saldo/movimento atômicos | Uma transação | Falha após baixa, após movimento e durante compensação |
| Saldo não negativo por disputa | Atualização condicional e locks | Dois pedidos reais disputando unidades insuficientes |
| Retry não cria novo pedido/movimento | Chave por cliente e hash do payload | Mesma chave, payload diferente, timeout e corrida de criação |
| Histórico desconhecido não recebe devolução automática | Ausência de prova exige conciliação | Pedido antigo sem prova, sem backfill presumido |
| Evento duplicado não repete efeito | Chave de movimento independente do ID da notificação | Mesma notificação e notificações diferentes para o mesmo pagamento |

Pedidos antigos permanecerão sem movimentos retroativos inventados. Não existe
hoje uma representação confiável que permita converter automaticamente o histórico
em débitos. Prova preexistente compatível, se vier a existir, precisa identificar
item/produto/quantidade/operação; seu tratamento deve ser testado sem criar um novo
débito fictício ou descontar novamente o saldo. A sinalização de conciliação deve
ser visível; omitir devolução silenciosamente não encerra a inconsistência.

Ajustes manuais de estoque continuarão sendo um caminho diferente: o ledger de
pedidos, sozinho, não reconstitui o saldo global se ajustes absolutos forem feitos
fora dele. O plano deve delimitar essa auditoria, sem afirmar cobertura inexistente.

### Ambiente isolado e limites de teste

Reconfirmado **somente em leitura** pelo conector Neon:

- Projeto jfq-refresh-migration-rehearsal, ID cool-rice-07419769.
- Branch br-billowing-wave-bchj34qy, PostgreSQL 18, plano free_v3, compute 0,25 CU.
- Endpoint separado do jfq-development e da produção.

O ensaio anterior criou pais mínimos e tabelas de refresh, não um schema completo
da aplicação. Para ensaiar o novo ledger será preciso criar objetos novos isolados
nesse projeto, sem apagar/recriar os objetos já presentes ou copiar dados reais.
A execução deverá confirmar o destino antes de cada conjunto de escritas.
Nenhuma escrita nova, migration ou credencial foi solicitada nesta fase de diagnóstico.

Os testes futuros precisam usar PostgreSQL real com sessões independentes para
locks, concorrência, unicidade e rollback. SQL testado via conector e testes dos
helpers Prisma devem ser identificados separadamente. Se a sessão não permitir
conectar o runner Prisma ao ensaio sem contornar restrições, registrar esse limite
sem declarar mocks como prova de concorrência real. Não alterar .env para isso.

### Validação e alterações efetivamente realizadas nesta rodada

A base anterior foi novamente validada: **125 testes existentes aprovados**,
lint zero erros/avisos, build aprovado e git diff --check aprovado. Não há novos
testes do ledger, pois ele ainda não foi implementado. O aviso de bundle permanece.
O único trabalho de projeto desta rodada foi atualizar estes dois relatórios com
o diagnóstico, a proposta e a decisão pendente; artefatos de testes/build são locais.

Schema, código, migrations, .env e sete JSONs permaneceram inalterados nesta rodada.
Nenhuma migration de ledger foi criada ou aplicada em qualquer banco. Não houve
conexão com produção, escrita no jfq-development, pagamento, notificação real,
exclusão, commit, push ou alteração do sistema. A próxima etapa é decidir o momento
do débito MP e então implementar/ensaiar a solução, com evidência nova e sem reutilizar
a aprovação dos 125 testes como validação de uma arquitetura ainda inexistente.

Referências técnicas consultadas: [constraints PostgreSQL](https://www.postgresql.org/docs/current/ddl-constraints.html),
[triggers PostgreSQL](https://www.postgresql.org/docs/current/trigger-definition.html),
[transações Prisma 6](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions).
As escolhas acima são propostas para o JFQ; não funcionalidades já entregues.

---

## Registro anterior ao diagnóstico do ledger

## Atualização — estados de pedido, JSONs e ensaio de migration (02/11/2026)

Estado atual: **125 testes aprovados (100 backend + 25 frontend), lint limpo e
build aprovado**. Esta atualização prevalece sobre os totais e riscos descritos
nos registros anteriores abaixo.

### Causa e alcance da correção de estoque

A devolução administrativa conferia somente se o status atual era diferente de
CANCELADO. O mesmo pedido podia ser cancelado, reaberto por outra atualização ou
por webhook e cancelado novamente. Uma segunda transição então devolvia os mesmos
itens. Não havia uma regra comum de estados terminais, e atualizações de outros
status podiam sobrescrever um cancelamento feito por uma requisição concorrente.

Correções locais, sem alterar schema ou implementar reservas:

- Regra central em backend/src/services/orderState.js: CANCELADO e ENTREGUE são
  finais; repetição do mesmo estado é idempotente. Sequência administrativa:
  PENDENTE→PAGO→PREPARANDO→ENVIADO→ENTREGUE; cancelamento permitido antes do envio.
  Transições inválidas, regressões e reabertura retornam 409.
- Atualização administrativa lê o pedido e compara o status observado dentro de
  transação Prisma. Somente a chamada que efetivamente efetua a transição para
  CANCELADO devolve itens. Se perder a corrida, não devolve estoque; aceita como
  idempotente apenas quando o estado atual já é o solicitado.
- Webhook relê o pedido dentro da transação, protege a atualização por status e
  paymentStatus observados e verifica mudança de valor/preferência desde a consulta
  externa. Conflito retorna 409 e não confirma a transação de evento.
- Webhook não reabre cancelado. Pagamento aprovado tardiamente em cancelado retorna
  ORDER_CANCELLED_REQUIRES_RECONCILIATION; exige conciliação, sem mudar pedido ou
  estoque automaticamente. Pagamento pendente/rejeitado não regride pedido pago.
- Aprovação não volta PREPARANDO/ENVIADO/ENTREGUE para PAGO; mantém o andamento,
  preserva paidAt já registrado e deduz a notificação de aprovação da leitura
  transacional, reduzindo duplicação de efeito em eventos concorrentes.
- Nova preferência exige pedido PENDENTE e sem pagamento confirmado. O salvamento
  da preferência compara novamente status, paymentStatus e preferenceId, recusando
  mudança concorrente. A chamada externa não foi movida de arquitetura nesta etapa.
- O seletor administrativo fica desabilitado em pedidos cancelados/entregues.
  A proteção real permanece no backend, não depende dessa interface.

Mapa dos caminhos inspecionados:

| Caminho | Movimento de estoque atual |
| --- | --- |
| POST /pedidos → criarPedido | Decrementa itens na transação, condicionado à disponibilidade |
| POST /pedidos/com-pagamento | Consulta disponibilidade; ainda não decrementa/reserva |
| PATCH /pedidos/:id/status → CANCELADO | Devolve uma vez na transição permitida; agora não reabre |
| PATCH para outros estados | Não movimenta estoque; agora exige transição válida e comparação de estado |
| Webhooks Mercado Pago, incluindo aliases | Alteram estado/financeiro, sem movimentar estoque; não reabrem cancelados |
| Criar preferência para pedido existente | Não movimenta estoque; não inicia pagamento de pedido finalizado |
| Exclusão administrativa de pedido | Não repõe estoque; caminho inspecionado, nenhuma exclusão executada |
| Alteração administrativa direta de produto | Ajusta estoque informado fora do ciclo de pedido; não foi alterada nesta etapa |

**Limitação deliberadamente aberta:** a base não possui prova persistida de que
cada pedido teve estoque descontado. A primeira devolução de pedido criado pelo
fluxo Mercado Pago pode aumentar estoque que nunca foi baixado; uma falha de
pagamento que cancela pedido legado pelo webhook também pode deixar o débito sem
compensação automática. Não é correto inferir isso por preferenceId: um pedido
legado pode receber preferência posteriormente. Os 24 testes novos comprovam as
proteções de transição/duplicação, não a origem de todo saldo histórico.

Foi proposta, mas não aplicada, uma mudança pequena com estoqueDebitadoEm e
estoqueDevolvidoEm registrados na transação da movimentação. Essa decisão de
schema permanece pendente. Pedidos antigos exigiriam reconciliação da origem,
sem preenchimento automático baseado em suposição. Nenhuma migration ou campo de
reserva foi acrescentado ao repositório; não se declara resolvido esse risco da
primeira devolução. A correção entregue encerra o ciclo cancelar/reabrir/cancelar.

### Testes novos e limites da evidência

backend/test/order-state.test.js acrescenta **24 testes**:

- Cancelamento inicial e repetido; cancelar/reabrir/cancelar; tentativas de sair
  de CANCELADO para cada outro estado; finais e sequência normal de atendimento.
- Chamadas concorrentes no harness transacional; comparação de estado perdida,
  cancelamento já realizado por outro fluxo e pedido inexistente.
- Webhooks pendente/aprovado/rejeitado após cancelamento; cancelar/webhook/cancelar.
- Notificação repetida com mesmo ID e notificações distintas duplicadas; regressão
  de pagamento confirmado; preservação de preparação/envio/entrega.
- Conflito na atualização de webhook desfaz a transação simulada; pedidos pagos
  ou cancelados não geram nova tentativa de pagamento.

As fixtures simulam Prisma e provedor, bloqueando rede real. O harness serializa
transações para verificar efeitos, e injeta perda de comparação para testar a
corrida. Isso não é um teste de carga ou concorrência física no PostgreSQL. Nenhum
pedido real foi pago, cancelado, reaberto ou excluído pelos testes.

### Sete JSONs legados

Os sete arquivos foram lidos localmente com suporte a BOM UTF-8. Todos contêm
campos que podem ser pessoais. Há indícios de exemplo em alguns endereços ou
padrões repetitivos de telefone, mas nomes/contatos/endereço não têm origem
comprovada. Classificação conservadora: **indeterminados, potencialmente reais**,
não certificados como fictícios. Nenhum valor pessoal é reproduzido aqui.

| Arquivo | Conclusão |
| --- | --- |
| backend/.tmp-pedido-e2e-ok.json | Potencialmente pessoal; indício de endereço de teste não comprova o contato |
| backend/.tmp-pedido-mp-e2e-ok.json | Potencialmente pessoal; indício de endereço de teste não comprova o contato |
| backend/.tmp-pedido-itens-vazio.json | Potencialmente pessoal; formato de exemplo não comprova origem |
| backend/.tmp-pedido-ok.json | Potencialmente pessoal; formato de exemplo não comprova origem |
| backend/.tmp-pedido-pagamento-sem-nome.json | Contato/endereço potencialmente pessoal, mesmo sem nome |
| backend/.tmp-pedido-pagamento.json | Potencialmente pessoal; formato de exemplo não comprova origem |
| backend/.tmp-pedido-sem-nome.json | Contato/endereço potencialmente pessoal, mesmo sem nome |

Os sete permanecem **idênticos byte a byte**, conferidos por SHA-256, sem exclusão,
edição, staging ou publicação. Não houve reescrita do histórico. Nenhum deles
será incluído nos commits de trabalho propostos.

Estratégia proposta para aprovação separada: confirmar a origem; guardar cópia
privada se necessário; conservar no projeto apenas exemplos novos explicitamente
sintéticos; retirar os sete caminhos do índice com uma operação específica, sem
apagar a cópia local; adicionar os caminhos ao ignore e revisar o diff preparado.
Um ignore isolado não remove arquivos já rastreados. A publicação de uma release
ou do repositório inteiro ainda carrega o conteúdo já presente no histórico: se
houver dado real, decidir a revisão do histórico/acessos antes dessa publicação.
Não executar rewrite/force-push por conta própria. A retirada do índice também
não foi executada nesta etapa.

### Migration: comparação e ensaio real isolado

- Prisma validate: PASS. A CLI local gerou DDL a partir do schema atual, sem
  conexão ao banco. As **12 declarações** relativas às duas tabelas de refresh
  são equivalentes às 12 da migration complementar após normalização de espaços.
- Os sete arquivos anteriores de migration não criam essas duas tabelas; a
  complementar preenche a lacuna. SQL complementar preservado, SHA-256:
  eb047988af0305f43e59c4de89bc8fb4c3e71a607dee4062623c2e05ab77a90f.
- Não há servidor PostgreSQL local disponível; somente o cliente psql. O conector
  de branch não oferece criação sem copiar dados. Para não copiar registros nem
  tocar no jfq-development, foi criado um projeto vazio **independente**.
- Projeto: jfq-refresh-migration-rehearsal, ID cool-rice-07419769; branch
  br-billowing-wave-bchj34qy; PostgreSQL 18, compute limitado a 0,25 CU.
  A API confirmou owner no plano free_v3, sem upgrade ou contratação paga.
- O plano gratuito recusou configurar manualmente o intervalo de suspensão
  (HTTP 412); a tentativa não criou projeto. A criação seguinte usou os padrões
  gerenciados do plano. Não foram alteradas configurações de projetos existentes.
- Antes do DDL, a leitura confirmou zero tabelas públicas. Foram criadas somente
  duas tabelas-pai mínimas de ensaio (usuarios/clientes, com id) e aplicadas as
  12 declarações originais da complementar numa transação via conector.
- O conector exige um comando por item de query preparada; o primeiro envio
  multicomando falhou sem aplicar o DDL. Separar as declarações corrigiu o envio;
  não foi necessário alterar o SQL versionado.
- Confirmados 12 campos, oito índices além das PKs e duas FKs com ON UPDATE/DELETE
  CASCADE. Dois registros-pai e dois hashes fictícios de refresh foram inseridos.
- Casos negativos no descartável: hash duplicado, dono inexistente e expiresAt
  nulo foram rejeitados. Reaplicação do primeiro CREATE TABLE também foi rejeitada,
  demonstrando que a migration não é idempotente sobre tabelas existentes.
  A releitura manteve um token de cada tipo; nenhuma linha foi apagada.
- O ensaio é do **SQL complementar**, com pais mínimos, não do comando completo
  prisma migrate deploy, histórico integral, dados reais, volume, locks de produção
  ou comportamento de cascade por exclusão. Nenhum DELETE foi usado para testá-lo.
- CLI Prisma 6.19.3 versus pacote @prisma/client 6.16.2 permanece como atenção.
  O ensaio não autoriza aplicação futura em produção sem revisar drift/histórico.

O projeto descartável foi mantido para inspeção no plano gratuito; não foi
excluído automaticamente. Não há credenciais dele em .env nem conexão dele usada
pelo Express. jfq-development e produção não receberam escrita ou migration.

### Resultado de validação e arquivos desta etapa

| Verificação | Resultado atual |
| --- | --- |
| Backend audit.test.js / development.test.js / payments.test.js | 61 + 4 + 11 PASS |
| Backend order-state.test.js | 24 PASS |
| Frontend cart.test.js / asyncRequest.test.js | 18 + 7 PASS |
| Total | **125 PASS; zero falhas** |
| npm test em backend e frontend | PASS |
| npm run lint | PASS — zero erros/avisos |
| npm run build | PASS — aviso existente de bundle >500 kB |
| .env backend/frontend | Ignorados e com permissão 0600 |
| git diff --check | PASS |
| Sete JSONs / migration complementar | Conteúdo original preservado |

Código desta etapa: backend/src/services/orderState.js (novo), pedido.service.js,
pagamento.service.js, backend/src/controllers/pagamento.controller.js,
backend/test/order-state.test.js (novo), fixture de cancelamento em
backend/test/audit.test.js e frontend/src/admin/pages/Pedidos/PedidoDetail.jsx.
Documentação atualizada: AUDITORIA-FUNCIONAL.md e PLANO-JFQ-V2.md.

Nenhum commit/push, pagamento ou notificação real, alteração de dados existentes,
reset, operação destrutiva, rewrite de histórico ou configuração de sistema foi
realizado. O único recurso externo novo foi o projeto descartável gratuito. Não
foi implementada arquitetura de reservas ou sessões revogáveis. As limitações
HTTP/Brave, conciliação de pagamentos tardios, prova histórica de débito e remoção
segura dos JSONs continuam registradas como pendências explícitas.

---

## Histórico anterior a esta correção

## Estabilização — resultado atual (02/11/2026)

Esta atualização substitui os totais, o estado do lint e as pendências de
persistência do registro anterior, mantido abaixo como histórico.

**101 testes aprovados (76 backend + 25 frontend), lint com zero erros e zero
avisos, build aprovado.** Foram adicionados 12 testes nesta etapa: 7 de requisições
assíncronas, 3 de checkout/preços/indisponibilidade e 2 de concorrência em senhas.
Nenhuma regra de lint, dependência ou lockfile foi alterado.

### Correções locais desta etapa

- Os seis carregamentos agora usam `useAsyncData`, um hook pequeno que associa
  cada resultado ao loader/revisão atual. Loading deriva da consulta pendente;
  o efeito apenas registra o resultado assíncrono. Não há reset síncrono de
  loading no efeito, timers artificiais ou supressões de regra.
- Cleanup invalida a resposta de requisições antigas ou de telas desmontadas.
  Botões de retry/atualização continuam funcionando por uma revisão explícita
  da consulta. Dados anteriores ficam disponíveis durante o carregamento,
  enquanto erro anterior é ocultado até a conclusão da nova consulta.
- Produto por slug continua reiniciando quantidade e imagem ao mudar de produto.
  Corrigida também a classificação da falha inicial de rede: ela não aparece
  mais como produto inexistente. Um 404 continua sendo tratado como inexistência.
- Criação da primeira senha e reset agora gravam com condição atômica no backend.
  Se outra requisição já criou a senha ou consumiu/expirou o reset token depois
  da leitura inicial, a gravação é recusada (409/400), sem sobrescrever a senha.
  Isso não implementa revogação de JWTs e não altera o schema.
- A revisão do diff encontrou `scripts/test-payment-local.js` ainda ignorado,
  embora referenciado por package.json. Acrescentada uma exceção específica em
  backend/.gitignore, deixando o script seguro visível para revisão/versionamento.
  Nenhum arquivo de credenciais foi liberado pelo ignore.

Telas ajustadas: CategoriasList, ProdutosList, Pedidos administrativos, Catalog,
Home e ProductDetail. Estilos, animações, markup das páginas e fluxo de login
foram preservados; o CSS gerado continua `index-Doxj6CRx.css`. A verificação visual
continua pendente, portanto esse hash não substitui a inspeção no Brave.

### Regressões de segurança revisadas

| Controle | Onde é aplicado | Evidência atual |
| --- | --- | --- |
| Dono do pedido | Middleware cliente + controller + consulta Prisma por id/clienteId | Anônimo recebe 401; cliente errado recebe 404 |
| Identidade no checkout | Os dois serviços de pedido usam somente clienteAutenticadoId | ID 999 adulterado no payload não substitui cliente autenticado 1 |
| Preço/total | Backend lê produtos e calcula valores em centavos | Testes nos dois fluxos: preço 0,01 e total 0,03 enviados pelo cliente são ignorados; valor calculado 30,30 |
| Preferência Mercado Pago | Serviço de pagamento recebe itens calculados no backend | Teste verifica payload fictício com unit_price 10,10, quantity 3 e comprador autenticado; fetch totalmente simulado |
| Produto indisponível/inativo | Validação do backend antes de preferência | Testes recusam antes de qualquer chamada externa |
| Primeira senha | Backend recusa senha existente e condiciona update a senha IS NULL | Testes de senha existente e corrida após a leitura |
| Reset de senha | Backend condiciona update ao hash e prazo do token ainda válidos | Testes de consumo, reutilização, expiração e perda da corrida |
| Estoque legado | Transação Prisma com updateMany condicionado a estoque >= quantidade | Regressões de estoque insuficiente, corrida e total adulterado |
| Cancelamento | Transição condicional na transação | Cancelamentos repetidos não devolvem estoque novamente |

Logo, autorização, identidade e preços não dependem apenas do frontend. O
checkout Mercado Pago ainda não faz reserva: a aprovação dos testes não resolve
essa pendência arquitetural. O risco da primeira devolução de estoque nesse
fluxo permanece descrito nas alternativas abaixo.

### Persistência real no jfq-development

Antes de escrever, foram reconfirmados pela API Neon:

- Projeto **jfq-development**, ID `autumn-rain-12939944`.
- Branch `br-jolly-pine-b8g7sy9k`.
- Endpoint correspondente ao DATABASE_URL e DEV_DATABASE_HOST locais.
- Database `neondb` e presença das seis tabelas usadas no teste.
- NODE_ENV=development, transportes de e-mail/Telegram em mock e .env modo 0600.

A escrita foi um único comando SQL com CTEs de INSERT, restrito explicitamente
àquele projeto/branch/database. Depois foi executado outro SELECT, independente,
que releu os registros persistidos e suas relações. Não foi apenas uma resposta
mock nem uma transação descartada por rollback.

Marcador exclusivo: **jfq-estabilizacao-1793641084898**.

| Registro fictício | ID persistido |
| --- | ---: |
| Cliente | 3 |
| Categoria | 3 |
| Produto | 3 |
| Agendamento | 1 |
| Pedido | 1 |
| Item do pedido | 1 |

A releitura confirmou agendamento e pedido PENDENTE, paymentStatus=PENDING,
paidAt e paymentId nulos, estoque 3, total 19,90 igual ao subtotal do item e ao
preço promocional do produto. Nome, contato, e-mail `.invalid`, equipamento e
observações são fictícios. Não foi criado pagamento ou preferência externa.

Todos esses registros foram mantidos e identificados pelo marcador. Nenhum
registro anterior foi apagado ou atualizado. Não houve DELETE, TRUNCATE, DROP,
reset ou migration. Não há limpeza automática preparada para dados existentes.

**Limite:** esta é uma prova real de persistência SQL e integridade das relações
no Neon. Não é um teste ponta a ponta do Express/Prisma via HTTP. A lógica dos
serviços foi exercitada em memória; o terminal da sessão continua sem acesso à
rede local. Nenhum sucesso HTTP, login real ou screenshot é inferido da gravação.

### Testes e verificações finais

| Verificação | Resultado |
| --- | --- |
| backend npm test | PASS — três arquivos de teste |
| backend/test/audit.test.js | 61 PASS |
| backend/test/payments.test.js | 11 PASS |
| backend/test/development.test.js | 4 PASS |
| frontend npm test | PASS — dois arquivos de teste |
| frontend/test/cart.test.js | 18 PASS |
| frontend/test/asyncRequest.test.js | 7 PASS |
| Total de casos, conferido por execução individual | **101 PASS; zero falhas** |
| npm run lint | **PASS — zero erros/avisos** |
| npm run build | PASS — aviso mantido de bundle acima de 500 kB |
| git diff --check | PASS |
| ESLint config e lockfiles | Sem alterações contra HEAD |
| .env do frontend/backend | Ignorados; nenhum segredo reproduzido |
| Persistência Neon | INSERT + SELECT independentes confirmados somente no projeto dev |

Não há ferramenta disponível nesta sessão para controlar a sessão local do
Brave. Não foi tentado contornar o isolamento, instalar controle remoto ou mudar
suas configurações. Login, navegação, Console e regressão HTTP continuam pendentes.
O sucesso Google informado pelo usuário antes da auditoria foi preservado como
informação do usuário, sem ser apresentado como novo teste realizado pelo agente.

### JWTs: alternativas, riscos e recomendação (não implementadas)

| Alternativa | Vantagens | Limitações/riscos |
| --- | --- | --- |
| JWT curto + refresh revogável | Menor alteração e janela de exposição menor | Não oferece revogação imediata do JWT já emitido |
| Denylist por jti/hash até a expiração | Revoga tokens específicos | Requer consulta confiável a cada requisição, limpeza e conhecimento de todos os tokens a revogar no reset |
| tokenVersion por usuário | Simples para invalidar todos os dispositivos; pode usar a consulta de usuário já existente | Exige campo/compatibilidade; não distingue logout de um dispositivo |
| Sessão persistida por dispositivo, JWT com sid | Logout individual, revogação global no reset e trilha de sessão clara | Exige contrato de sessão, rotação/replay do refresh, consultas e política de falha/cache |

**Recomendação para este projeto:** sessão persistida por dispositivo com sid no
JWT, verificando validade/revogação no backend. Revisar o reaproveitamento das
tabelas refresh_tokens/client_refresh_tokens; elas não devem ser consideradas
sessões completas sem analisar suas relações, expiração e rotação. Reset deve
revogar todas as sessões; logout deve revogar a sessão atual. A migração precisa
definir o tratamento de JWTs antigos e testes de refresh simultâneo/replay. Cache
com atraso de invalidação contradiz a promessa de revogação imediata; falha do
armazenamento deve recusar a sessão, com impacto de disponibilidade documentado.
Nenhuma dessas mudanças foi implementada ou autorizada por inferência.

Base técnica: [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet),
[OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
A recomendação acima é uma decisão proposta para o projeto, não uma configuração
já existente.

### Estoque no checkout Mercado Pago: alternativas (não implementadas)

| Alternativa | Vantagens | Limitações/riscos |
| --- | --- | --- |
| Decrementar somente após pagamento aprovado | Não imobiliza estoque em carrinhos abandonados | Pode cobrar sem estoque; exige política de exceção/reembolso e transição transacional |
| Reservar em todo pedido pendente até cancelamento | Implementação conceitual simples | Pedidos abandonados podem bloquear estoque indefinidamente |
| Reserva explícita com prazo e estados | Controla concorrência, abandono e liberação auditável | Exige registro de reserva, expiração, conciliação e tratamento de pagamento tardio |

**Recomendação:** reserva explícita e transacional antes de iniciar o checkout,
com quantidade, pedido, estado e prazo registrados. Validar/disputar estoque de
forma atômica, sem manter transação aberta durante chamada ao provedor. Se criar
a preferência falhar, compensar somente a reserva daquela tentativa. A aprovação
verificada converte reserva em venda uma única vez; cancelamento/expiração libera
somente reserva comprovadamente existente. É necessário escolher a política de
pagamento aprovado depois da liberação (nova tentativa de estoque ou exceção
administrativa), sem aprovar pedido automaticamente por URL de retorno.

Vigência da preferência e pagamentos pendentes precisam de conciliação; o prazo
local não pode ser tratado como prova de inexistência de pagamento. O schema e a
política final precisam de autorização antes de implementar. Não usar preferenceId
como indicador de reserva: pedidos legados também podem receber uma preferência.
A primeira devolução no fluxo atual Mercado Pago pode aumentar estoque sem
reserva anterior; esse risco continua aberto. Assinaturas, valor/vendedor e
idempotência de eventos devem ser preservados.

Base técnica: [PostgreSQL — locks por linha](https://www.postgresql.org/docs/17/explicit-locking.html),
[Mercado Pago — vigência da preferência](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/additional-settings/term-of-preference).
A recomendação de reserva é uma proposta de engenharia para este projeto.

### Diff acumulado desde a recuperação

Conferidos `git diff HEAD`, estado do índice e arquivos novos não ignorados:
**49 caminhos rastreados alterados/removidos + 21 arquivos novos não rastreados**.
Não há alterações preparadas no índice. O diff resumido de arquivos rastreados não inclui o conteúdo
dos arquivos novos; por isso eles estão listados separadamente abaixo.

Grupos revisados: ambiente/ignore; bind e proteção do destino de banco; transportes
simulados e uploads locais; integração/assinaturas Mercado Pago; autorização,
senhas e preços; carrinho/retornos; componentes e carregamentos; testes/scripts;
documentação e migration complementar. Nenhuma dependência foi atualizada.

A única migration nova é
backend/prisma/migrations/20261102070000_add_missing_refresh_tokens/migration.sql.
Não há migration existente modificada. A consulta de leitura confirmou essa
migration aplicada no desenvolvimento, conforme a recuperação anterior. Ela
não foi reaplicada nesta etapa. O arquivo continua novo no Git, assim como
scripts e testes da recuperação. O desaparecimento de CookieConsent.jsx no diff
é acompanhado de PrivacyPreferences.jsx e do import atualizado; não é uma tela
removida sem substituição.

Inventário completo no momento desta revisão (`M` modificado, `D` removido,
`??` novo; nenhuma inclusão no índice foi feita):

```text
M	.gitignore
M	backend/.env.example
M	backend/.gitignore
M	backend/package.json
M	backend/src/config/prisma.js
M	backend/src/controllers/pagamento.controller.js
M	backend/src/controllers/pedido.controller.js
M	backend/src/dtos/pedido.dto.js
M	backend/src/middlewares/auth.middleware.js
M	backend/src/middlewares/clientAuth.middleware.js
M	backend/src/middlewares/error.middleware.js
M	backend/src/routes/pedido.routes.js
M	backend/src/server.js
M	backend/src/services/agendamento.service.js
M	backend/src/services/clientAuth.service.js
M	backend/src/services/cloudinary-upload.service.js
M	backend/src/services/email.service.js
M	backend/src/services/pagamento.service.js
M	backend/src/services/pedido.service.js
M	backend/src/services/telegram.service.js
M	backend/src/validators/agendamento.validator.js
M	backend/src/validators/clientAuth.validator.js
M	backend/src/validators/produto.validator.js
M	frontend/package.json
M	frontend/src/admin/components/AdminSearchBar.jsx
M	frontend/src/admin/pages/Categorias/CategoriasList.jsx
M	frontend/src/admin/pages/Pedidos/Pedidos.jsx
M	frontend/src/admin/pages/Produtos/ProdutosList.jsx
D	frontend/src/components/layout/CookieConsent.jsx
M	frontend/src/components/layout/Layout.jsx
M	frontend/src/components/ui/ProductCard.jsx
M	frontend/src/contexts/AuthContext.jsx
M	frontend/src/contexts/ClientAuthContext.jsx
M	frontend/src/hooks/useAuth.js
M	frontend/src/hooks/useCart.js
M	frontend/src/hooks/useClientAuth.js
M	frontend/src/pages/About.jsx
M	frontend/src/pages/Catalog.jsx
M	frontend/src/pages/Checkout.jsx
M	frontend/src/pages/CheckoutPendente.jsx
M	frontend/src/pages/Contact.jsx
M	frontend/src/pages/Home.jsx
M	frontend/src/pages/MeusPedidos.jsx
M	frontend/src/pages/PagamentoSucesso.jsx
M	frontend/src/pages/PedidoDetalhes.jsx
M	frontend/src/pages/ProductDetail.jsx
M	frontend/src/pages/RedefinirSenha.jsx
M	frontend/src/services/adminApi.js
M	frontend/src/services/imageMap.js
??	AUDITORIA-FUNCIONAL.md
??	INTEGRACOES-LOCAIS.md
??	RECUPERACAO-LOCAL.md
??	backend/prisma/migrations/20261102070000_add_missing_refresh_tokens/migration.sql
??	backend/scripts/migrate-local.js
??	backend/scripts/setup-local.js
??	backend/scripts/smoke-local.js
??	backend/scripts/test-payment-local.js
??	backend/src/config/paymentEnvironment.js
??	backend/test/audit.test.js
??	backend/test/development.test.js
??	backend/test/payments.test.js
??	frontend/.env.example
??	frontend/src/components/layout/PrivacyPreferences.jsx
??	frontend/src/contexts/auth-context.js
??	frontend/src/contexts/client-auth-context.js
??	frontend/src/hooks/useAsyncData.js
??	frontend/src/utils/asyncRequest.js
??	frontend/src/utils/cart.js
??	frontend/test/asyncRequest.test.js
??	frontend/test/cart.test.js
```

Arquivos alterados especificamente nesta etapa: os seis componentes de consulta,
backend/.gitignore, backend/src/services/clientAuth.service.js,
backend/test/audit.test.js e este relatório; novos frontend/src/hooks/useAsyncData.js,
frontend/src/utils/asyncRequest.js e frontend/test/asyncRequest.test.js.

### Preservação e próximos passos

Produção não foi acessada para escrita nem alterada. Nenhum pagamento, e-mail ou
mensagem real, migration, operação destrutiva, commit, push, deploy ou mudança de
configuração do sistema foi feito. Os seis registros novos existem somente no
projeto jfq-development. Fedora, Brave, Hyprland, Quickshell e VS Code foram
preservados. As alternativas arquiteturais acima aguardam decisão explícita.

Restam a regressão HTTP/visual no computador, as credenciais de teste Mercado Pago,
a decisão sobre sessões/estoque e o aviso de tamanho do bundle. Não há novo erro
de lint pendente. O histórico abaixo registra o estado anterior; suas referências
a 89 testes, seis erros de lint e ausência de escrita SQL não descrevem esta etapa.

---

## Histórico — auditoria anterior à estabilização

Data: 02/11/2026. Projeto: ~/Projetos/assistencia-tecnica.

## Resultado

**89 testes aprovados: 71 no backend e 18 no frontend.** Foram adicionados
56 testes no backend e 18 no carrinho, preservando os 15 testes anteriores.
Build aprovado. Lint passou de 23 erros e 1 aviso para **6 erros e zero avisos**;
portanto, o lint ainda não está aprovado. Nenhuma regra foi desativada.

O login Google real no Brave foi informado como bem-sucedido pelo usuário antes
desta auditoria. Não foi repetido ou automatizado consentimento da conta. Após
as correções, a validação Google foi exercitada com tokens RSA locais, sem conta
real, incluindo assinatura inválida, audiência incorreta e expiração.

Não foi possível validar visualmente o Brave ou executar HTTP contra os processos
locais nesta sessão isolada. Não houve tentativa de contornar o isolamento,
habilitar depuração, reiniciar navegador ou expor portas. Os testes de rotas
abaixo despacham routers em memória, sem abrir servidor ou socket.

## Escopo e limites da evidência

| Funcionalidade | Evidência nesta auditoria |
| --- | --- |
| Cadastro/login cliente | Serviços reais com bcrypt/JWT e Prisma substituído por fixtures; duplicidade, normalização, senha incorreta e dados sigilosos omitidos |
| Google OAuth | Biblioteca Google verifica tokens RSA com certificados locais; criação/vínculo, audiência, assinatura, expiração e e-mail verificado testados |
| Refresh administrativo | Geração aleatória, hash, expiração, revogação, usuário inativo, emissão de JWT e cookie httpOnly testados |
| Logout administrativo | Controller revoga refresh e limpa cookie; frontend passou a chamar o endpoint com credentials; JWT de acesso ainda não é revogável imediatamente |
| Logout cliente | Limpeza local revisada; não existe logout de cliente no backend nem refresh de cliente ativo |
| Recuperação/reset | Hashes, prazo consultado, resposta genérica, troca de senha, consumo/reutilização e token inválido testados; envio mock |
| Rotas privadas e permissões | Ausência/expiração de token, separação entre chaves/tipos, ADMIN/TECNICO, dono de pedido e histórico de agendamento testados |
| Produtos/categorias | Filtros, booleanos em query, limite inferior zero, listagem e inexistência/404 testados com fixtures |
| Carrinho | Adição, mesclagem, remoção por quantidade zero, estoque, quantidades inválidas, preço promocional, restauração e cálculo em centavos testados |
| Preços no backend | Preço/total adulterados no payload ignorados; total calculado a partir do produto retornado pelo Prisma |
| Estoque | Atualização condicional no pedido legado; falta de estoque concorrente aborta a operação; cancelamento repetido não devolve novamente |
| Serviços | Rotas/páginas existentes e encaminhamento ao agendamento inspecionados; nenhuma funcionalidade nova implementada |
| Agendamentos | Validação, cadastro anônimo, associação autenticada, chamadas Prisma, respostas 201/400, histórico por cliente, proteção administrativa e transições testados |
| Persistência real de agendamento | **Pendente**; fixtures comprovam o contrato da chamada, não gravação no Neon pelo processo local |
| Mercado Pago | 11 testes existentes aprovados, com atualização da fixture para o retorno autenticado; nenhuma chamada financeira real |
| Navegação, estados visuais e Console Brave | **Pendentes de verificação no navegador**; revisão de código e build não substituem teste visual |

Os testes novos bloqueiam fetch externo e chamadas ORM não previstas. O banco
usado por eles é uma URL fictícia de loopback inacessível; não usam credenciais
do projeto para escrever dados. Mocks de e-mail/Telegram foram mantidos.

## Problemas confirmados e correções

| Problema | Correção local |
| --- | --- |
| Consulta de retorno por ID era pública e devolvia dados do pedido sem verificar dono | Middleware cliente obrigatório e consulta por id + clienteId autenticado |
| Criação de pedido aceitava identidade do payload | Middleware obrigatório nas duas rotas e serviço usa exclusivamente clienteAutenticadoId |
| Google podia vincular e-mail sem conferir email_verified e aceitar identidade já vinculada diferente | Rejeição antes de atualizar/criar cliente |
| Endpoint criar senha permitia sobrescrever senha existente sem a senha anterior | Resposta 409; recuperação de senha continua disponível |
| JWTs assinados com formato inadequado chegavam à consulta Prisma | Exigência de ID inteiro positivo, HS256 e domínio/tipo compatível |
| Logout admin não chamava backend e login não recebia cookie em fetch entre origens | Chamada de logout e credentials: include; revogação imediata do JWT continua pendente |
| Zod 4 usa issues; error middleware acessava errors.map | Compatibilidade com issues e resposta 400, sem falha adicional |
| URL completa de erro podia incluir token de recuperação/checkout | Sanitização da URL no error middleware |
| Query ativo=false/destaque=false virava true com coerção booleana | Conversão explícita de true/false e recusa de valores inválidos |
| Filtro até R$ 500 enviava precoMin=0, recusado pela API | Limites não negativos aceitos |
| Agendamento com CEP opcional vazio era rejeitado | Campo vazio aceito; comprimentos mínimos aplicados depois do trim |
| Cadastro validava nome antes de remover espaços | Trim antes dos mínimos; e-mail normalizado antes da validação |
| Serviço de agendamento ainda aceitava clienteId não autenticado, embora a rota já bloqueasse esse campo | Vínculo deriva somente do cliente autenticado; convidado permanece sem vínculo |
| Card e carrinho não usavam consistentemente o preço promocional | Promoção aplicada no card, carrinho e detalhe, conforme o preço usado no backend |
| Detalhe anunciava desconto à vista de 5% não aplicado no pedido | Removida a promessa e exibido o valor efetivamente usado |
| Checkout prometia cálculo de frete numa etapa inexistente | Texto informa que frete não está incluído; nenhum cálculo novo criado |
| Carrinho aceitava frações, NaN, strings inconsistentes, indisponibilidade e excesso do estoque conhecido | Funções de domínio validam quantidade, normalizam armazenamento e limitam estoque; backend continua autoritativo |
| Total podia acumular artefatos de ponto flutuante | Soma em centavos no carrinho e nos dois serviços de pedido |
| Pedido legado conferia estoque fora da transação e decrementava sem condição | updateMany com estoque >= quantidade; falha aborta a transação |
| Cancelamento repetido/concorrente devolvia estoque mais de uma vez | Transição condicional dentro da transação antes de devolver itens |
| Consulta pelo token de checkout consumia o token na primeira leitura e DTO não tinha status de pagamento | Leitura sem consumo, mantendo validade/revogação/prazo; DTO inclui id, paymentStatus e paidAt para acompanhar pendência |
| Componentes de filtro criados durante cada render | FilterSection movido para fora do componente, preservando classes/ações |
| Sincronização de filtros iniciava consulta na página antiga antes de resetar paginação | Página reiniciada no mesmo evento que altera filtro |
| Retorno dentro de finally podia substituir fluxo anterior | Atualização de loading condicionada sem return no finally |
| Contextos e providers no mesmo módulo quebravam Fast Refresh | Identidades movidas a dois módulos JS; hooks/providers usam a mesma identidade |
| Formulário de contato exibia mensagem enviada, mas não tinha chamada de envio | Mensagem honesta de não envio e indicação dos canais existentes; sem implementar endpoint |

O token de checkout continua sendo uma capacidade temporária para ler um resumo
mascarado, com as verificações de validade/revogação/expiração existentes. A
consulta por ID exige JWT do dono. Os fetches das páginas de retorno passaram a
enviar o JWT do cliente quando disponível. Nenhuma leitura marca pagamento como
aprovado, e a regressão de status=approved forjado permanece coberta.

Não foram alterados CSS, animações, layout da tela de login ou dependências.
O hash do CSS gerado permaneceu index-Doxj6CRx.css. Isso não certifica aparência
ou comportamento visual; a revisão no Brave permanece pendente.

## Classificação dos 23 erros iniciais de lint

| Regra | Inicial | Final | Tratamento |
| --- | ---: | ---: | --- |
| react-hooks/set-state-in-effect | 11 | 6 | Sincronização de busca, paginação, preferências e erro de reset corrigida; seis carregamentos assíncronos ainda sinalizados |
| no-unused-vars | 6 | 0 | Imports, variáveis e função sem uso removidos |
| react-refresh/only-export-components | 2 | 0 | Contextos separados dos providers |
| react-hooks/static-components | 2 | 0 | Componente de filtro estabilizado |
| no-unsafe-finally | 2 | 0 | Returns removidos de finally |
| react-hooks/exhaustive-deps (aviso) | 1 | 0 | Array do checkout estabilizado e cálculo compartilhado |

Restam set-state-in-effect nos carregamentos de:

- frontend/src/admin/pages/Categorias/CategoriasList.jsx
- frontend/src/admin/pages/Pedidos/Pedidos.jsx
- frontend/src/admin/pages/Produtos/ProdutosList.jsx
- frontend/src/pages/Catalog.jsx
- frontend/src/pages/Home.jsx
- frontend/src/pages/ProductDetail.jsx

São inicializações de loading/erro nos efeitos que disparam requisições. A regra
aponta renderizações adicionais; esta auditoria não demonstrou loop infinito
nesses seis casos. Foram mantidas para preservar os estados de carregamento.
Uma revisão dessas cargas deve incluir cancelamento/obsolescência de respostas
e testes de navegação rápida; não foram usados timers, wrappers ou supressões
apenas para esconder os diagnósticos.

## Migration e ambiente

Revista a migration 20261102070000_add_missing_refresh_tokens e os modelos Prisma:

- Criação aditiva de refresh_tokens e client_refresh_tokens, sem DROP/DELETE.
- tokenHash único, referências de usuário/cliente, expiresAt, createdAt e
  revokedAt; índices por proprietário, expiração e revogação.
- Chaves estrangeiras com ON DELETE CASCADE e ON UPDATE CASCADE, coerentes
  com o schema. CASCADE faz parte da definição; nenhum usuário foi excluído.
- Prisma validate aprovado. Não houve execução ou alteração da migration.
- SELECT somente de metadados no projeto autumn-rain-12939944, branch
  br-jolly-pine-b8g7sy9k, confirmou colunas, tipos e nulabilidade das duas tabelas.
  Não foi realizado diff completo de schema/índices/constraints contra o servidor.
- Host de DATABASE_URL e DEV_DATABASE_HOST correspondem ao endpoint já confirmado
  como jfq-development. Nenhuma conexão com o banco de produção foi feita.
- .env do frontend/backend continuam ignorados. Backend/.env permanece 0600.
  Nenhum .env foi editado ou incluído em commit nesta auditoria.

ClientRefreshToken existe no schema/migration, mas não é utilizado por endpoints
de refresh/logout do cliente. A existência da tabela não representa um fluxo de
sessões de cliente implementado.

## Verificações executadas

- Backend: npm test aprovado em três arquivos; execução individual confirmou
  56 testes em audit.test.js, 11 em payments.test.js e 4 em development.test.js.
- Frontend: npm test aprovado; execução individual confirmou 18 testes de carrinho.
- npm run build aprovado, com aviso mantido de bundle JavaScript acima de 500 kB.
- Lint completo: 6 erros e zero avisos, todos listados acima.
- node --check: 74 arquivos JS de src/test do backend sem falhas.
- Prisma validate aprovado; aviso existente de configuração package.json#prisma
  depreciada foi mantido, sem migração de versão/configuração.
- git diff --check aprovado.
- Nenhum test:payment:local, checkout externo, cobrança ou envio real foi iniciado.
- O smoke HTTP test:local não foi executado novamente nesta auditoria: exige
  acesso ao localhost que já estava bloqueado nesta sessão. Sua aprovação anterior
  não foi reutilizada como prova de regressão após estas alterações.

## Pendências e plano que exige autorização

1. **Sessões revogáveis:** atualmente logout cliente só remove dados locais;
   logout admin revoga o refresh, mas JWTs existentes permanecem utilizáveis até
   expirar. Reset de senha também não revoga JWTs antigos. Foi apresentada uma
   proposta e solicitada autorização específica; nenhuma mudança arquitetural
   foi aplicada. Plano: revisar/reaproveitar as tabelas existentes de sessões,
   vincular JWT a uma sessão, implementar revogação no logout/reset, validar
   rotação/replay e testar somente em desenvolvimento antes de qualquer deploy.
   O esquema final, compatibilidade com tokens existentes e necessidade de
   migration devem ser apresentados antes da implementação.
2. **Reserva de estoque no checkout Mercado Pago:** o fluxo com pagamento consulta
   estoque, mas não o reserva/decrementa; o fluxo legado reserva. A primeira
   devolução ao cancelar um pedido do checkout pode aumentar estoque que não foi
   reservado. A idempotência foi corrigida, mas essa inconsistência de política
   permanece. preferenceId não serve como marcador de reserva: um pedido legado
   também pode ganhar preferência depois. Plano: definir momento da reserva,
   liberação/expiração e confirmação, com marcador persistido e atualização
   transacional. Isso altera modelo e fluxo; aguarda autorização.
3. **Retentativas/ordenação de webhooks:** os testes atuais cobrem assinatura,
   ambiente e valor divergentes. Não comprovam todos os casos de eventos
   simultâneos ou fora de ordem. Validar ao concluir o checkout de teste.
4. **Persistência/HTTP e navegador:** executar smoke no terminal normal e conferir
   agendamento real no jfq-development; testar páginas, filtros, carrinho,
   logout e Google no Brave após as mudanças. Conferir Console e requisições.
5. **Mercado Pago:** continua aguardando credenciais exclusivas de teste. Nenhuma
   integração foi declarada concluída por passar testes com fixtures.
6. **Contato:** não há envio implementado. O texto agora informa a limitação;
   implementar um canal de envio é nova funcionalidade, fora do escopo autorizado.
7. **Lint:** concluir revisão dos seis carregamentos restantes sem desativar regras.

## Arquivos modificados nesta auditoria

As modificações anteriores de recuperação e integrações foram preservadas. Esta
lista não atribui à auditoria as alterações já existentes em .env.example,
server.js, prisma.js, transportes simulados, pagamento.service.js, ou a renomeação
anterior de CookieConsent.jsx.

Backend:

- src/controllers/pedido.controller.js
- src/dtos/pedido.dto.js
- src/middlewares/auth.middleware.js
- src/middlewares/clientAuth.middleware.js
- src/middlewares/error.middleware.js
- src/routes/pedido.routes.js
- src/services/agendamento.service.js
- src/services/clientAuth.service.js
- src/services/pedido.service.js
- src/validators/agendamento.validator.js
- src/validators/clientAuth.validator.js
- src/validators/produto.validator.js
- test/audit.test.js (novo)
- test/payments.test.js (fixture do retorno adaptada à autenticação obrigatória)

Frontend:

- package.json (comando npm test)
- src/admin/components/AdminSearchBar.jsx
- src/admin/pages/Categorias/CategoriasList.jsx
- src/admin/pages/Produtos/ProdutosList.jsx
- src/components/layout/Layout.jsx
- src/components/layout/PrivacyPreferences.jsx
- src/components/ui/ProductCard.jsx
- src/contexts/AuthContext.jsx e ClientAuthContext.jsx
- src/contexts/auth-context.js e client-auth-context.js (novos)
- src/hooks/useAuth.js, useClientAuth.js e useCart.js
- src/pages/About.jsx, Catalog.jsx, Checkout.jsx e CheckoutPendente.jsx
- src/pages/Contact.jsx, MeusPedidos.jsx, PagamentoSucesso.jsx e PedidoDetalhes.jsx
- src/pages/ProductDetail.jsx e RedefinirSenha.jsx
- src/services/adminApi.js e imageMap.js
- src/utils/cart.js (novo)
- test/cart.test.js (novo)

Na raiz: AUDITORIA-FUNCIONAL.md (este relatório). Artefatos de build e logs de
testes foram gerados localmente; não houve commit/push.

## Preservação

Produção e dados reais não foram alterados. Nenhum dado existente foi apagado;
nenhuma migration foi aplicada, nenhuma escrita SQL foi executada e nenhum
pagamento, e-mail ou mensagem real foi enviado. A única consulta ao Neon nesta
auditoria foi SELECT de metadados do schema de desenvolvimento. Não houve
alteração em painéis externos, aplicações, webhooks ou origens OAuth. Fedora,
Brave, Hyprland, Quickshell, VS Code e demais aplicações não foram reiniciados,
encerrados ou reconfigurados. Nenhum commit ou push foi realizado.
