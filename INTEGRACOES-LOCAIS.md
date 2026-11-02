# Google OAuth e Mercado Pago — validação local em 02/11/2026

## Nova tentativa — 02/11/2026, 14:05 UTC

Os dois relatórios foram relidos antes desta tentativa. As integrações continuam
pendentes; não houve acesso autenticado aos painéis nem alteração de suas
configurações. Não houve mudança no código ou nos arquivos .env nesta tentativa.

Impedimentos confirmados diretamente:

- Conexões TCP a 127.0.0.1 nas portas 3000, 5173 e 9222 falham com errno 1,
  `Operation not permitted`. O bloqueio é do ambiente de execução; não é uma
  resposta de conexão recusada dos servidores e não permite concluir se pararam.
- DNS de accounts.google.com e api.mercadopago.com falha com errno -3,
  `Temporary failure in name resolution` no terminal.
- Nenhuma ferramenta de controle do Brave está disponível. Não foi encontrado
  DevToolsActivePort nos diretórios consultados do Brave e temporários.
  Nenhum navegador foi encerrado ou reiniciado para habilitar depuração.
- A credencial Mercado Pago e o ID do vendedor de teste permanecem vazios.
  O backend/.env continua com permissão 0600, NODE_ENV=development,
  MERCADO_PAGO_MODE=test, mocks de email/Telegram e webhook público desabilitado.

Resultados repetidos nesta tentativa:

| Verificação | Resultado |
| --- | --- |
| node test/development.test.js | PASS — 4 testes |
| node test/payments.test.js | PASS — 11 testes |
| npm run build no frontend | PASS — aviso de bundle acima de 500 kB |
| npm run test:payment:local | BLOQUEADO — configuração de credencial ausente; nenhuma preferência criada |
| npm run test:local | BLOQUEADO — TypeError ao acessar localhost; regressão HTTP não concluída |
| git diff --check | PASS |
| backend/.env e frontend/.env ignorados | Confirmado |
| Destino PostgreSQL | Host do .env coincide com endpoint do projeto jfq-development e branch autorizado, reconfirmados pela API Neon |
| Fluxo Google | Código usa verifyIdToken com audience configurada antes da consulta/gravação Prisma; IDs frontend/backend coincidem |
| Login Google, origens/audiência e Console Brave | PENDENTES — sem acesso ao navegador/painel |

O conector Neon foi usado somente para consultar metadados do projeto de
desenvolvimento e seu endpoint. Não houve consulta SQL ou escrita em banco nesta
nova tentativa. Não foi possível conferir o banco efetivamente usado por um
processo Express em execução porque seu HTTP permanece inacessível.

Menor intervenção manual para prosseguir:

1. Google: no cliente Web cujo ID corresponde a GOOGLE_CLIENT_ID em backend/.env,
   adicionar http://localhost:5173 às origens JavaScript se ausente, sem remover
   entradas e sem alterar redirects. Conferir audiência/usuários de teste se
   houver restrição e fazer login no botão Google local. Não compartilhar token.
2. Mercado Pago: na aplicação exclusiva de desenvolvimento, obter a credencial
   da vendedora de teste e seu User ID e preencher MERCADO_PAGO_ACCESS_TOKEN e
   MERCADO_PAGO_TEST_SELLER_ID diretamente no backend/.env. O prefixo do token
   sozinho não prova que seja teste; o comando valida a identidade pela API.
3. Em um terminal normal do computador com acesso à rede, executar em backend
   `npm run test:payment:local` e `npm run test:local`. O primeiro só cria e
   consulta preferência fictícia, sem efetuar pagamento. Não publicar webhook.
4. No Brave, conferir /login, /catalogo e /checkout e o Console. Para eu realizar
   essas verificações, é necessário disponibilizar uma ferramenta de navegador
   local e execução com acesso à rede do computador; autorização textual já foi
   concedida, mas não remove a restrição técnica desta sessão.

Somente este relatório foi editado nesta nova tentativa. Build e testes
atualizaram seus artefatos locais ignorados. Produção, recursos de provedores e
dados reais não foram alterados. Nenhum pagamento, notificação real, migration,
commit, push, túnel ou mudança em janelas/configurações do sistema foi realizado.

## Resultado desta execução

Integrações externas **pendentes de validação real**. Nenhuma configuração de
painel foi salva e nenhuma cobrança foi solicitada. A execução atual está isolada
da rede do computador: não alcança localhost:3000/5173, o Brave ou a internet
pelo terminal. A consulta de documentação pública e o conector Neon funcionam
por ferramentas separadas. Isso não demonstra que os servidores locais pararam.

Os arquivos já estavam modificados pela recuperação anterior. Essas alterações
foram preservadas; a lista abaixo descreve somente o trabalho desta execução.

## Google OAuth

- `frontend/src/main.jsx`: GoogleOAuthProvider recebe VITE_GOOGLE_CLIENT_ID.
- `frontend/src/pages/Login.jsx`: GoogleLogin recebe a credencial do Google
  e envia idToken para POST /api/client-auth/google.
- `backend/src/services/clientAuth.service.js`: verifyIdToken valida assinatura
  e audience GOOGLE_CLIENT_ID; depois cria/vincula cliente e emite JWT local.
- GOOGLE_CLIENT_ID e VITE_GOOGLE_CLIENT_ID estão preenchidos e coincidem.
  Os valores não foram reproduzidos no relatório.
- Também existe suporte legado por code, usando GOOGLE_CLIENT_SECRET e
  GOOGLE_REDIRECT_URI; ambos estão vazios localmente e o frontend atual não
  utiliza esse fluxo. Não há callback GET exigido pelo botão atual.
- A tela de login e seus estilos não foram modificados.
- Não foi possível verificar origens autorizadas, carregar o botão em navegador
  nem efetuar login Google real ou verificar seu registro no banco.

### Ação no Google Cloud

1. Abra https://console.cloud.google.com/auth/clients com a conta que administra
   o projeto. Selecione o cliente Web cujo ID seja exatamente o valor de
   GOOGLE_CLIENT_ID em backend/.env, também presente em frontend/.env.
2. Acrescente http://localhost e http://localhost:5173 às origens JavaScript
   autorizadas. Se for usar 127.0.0.1 no navegador, autorize também a origem
   exata correspondente. Preserve integralmente as origens existentes.
3. Não crie redirect URI para o fluxo atual por ID token. Preserve os redirects
   existentes. O client secret não é necessário para esse botão.
4. Se a aplicação estiver em teste e o Google exigir, inclua sua conta entre os
   usuários de teste da audiência. Conclua pessoalmente login/MFA/consentimento.
5. No navegador local, abra /login, confirme o carregamento do botão e o POST
   para localhost:3000/api/client-auth/google. Não copie tokens do Network.
6. Após autenticar, confira /api/client-auth/me e o cliente correspondente no
   banco de desenvolvimento. Nenhum token Google ou conta foi simulado nesta
   execução para declarar sucesso.

Referência: [configuração oficial Google Identity Services](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

## Mercado Pago

Checkout Pro via POST https://api.mercadopago.com/checkout/preferences;
frontend redireciona para init_point. Não há necessidade de chave pública no
frontend nesse fluxo. O uso de init_point foi preservado: o isolamento depende
da conta vendedora de teste confirmada, não do nome da URL ou prefixo do token.

O webhook consulta o pagamento na API antes de atualizar o pedido; verifica
valor, preferência quando fornecida e idempotência. Nesta execução, a assinatura
passou a ser obrigatória também em desenvolvimento, em todos os aliases que
usam o mesmo controller. O manifesto usa data.id da query quando presente,
normaliza o ID em minúsculas e rejeita divergência entre query e corpo.
Assinatura hex inválida é rejeitada sem erro em timingSafeEqual.

Novas proteções locais:

- Todo ambiente diferente de production exige MERCADO_PAGO_MODE=test e
  MERCADO_PAGO_TEST_SELLER_ID preenchido antes de criar preferência.
- GET /users/me deve confirmar o ID e a tag test_user. Conta real, resposta
  inconclusiva ou falha de rede bloqueiam a operação antes do POST.
- URLs de retorno devem pertencer à origem local de FRONTEND_URL; não há
  fallback de produção aceito em teste.
- Webhook local exige live_mode=false. A resposta da consulta do pagamento
  também deve indicar live_mode=false e collector_id do vendedor autorizado.
- Trecho do access token e respostas completas de erro do provedor foram
  retirados dos logs do serviço de pagamento.
- A página de retorno só anuncia pagamento confirmado quando o backend
  informa PAID. Uma URL com status=approved não altera o estado no banco.

### Configuração local

| Variável | Estado/finalidade |
| --- | --- |
| MERCADO_PAGO_MODE | Definida como test em backend/.env |
| MERCADO_PAGO_TEST_SELLER_ID | Vazia; preencher com ID da conta vendedora de teste |
| MERCADO_PAGO_ACCESS_TOKEN | Vazia; credencial exclusiva da vendedora de teste |
| MERCADO_PAGO_WEBHOOK_SECRET | Vazia; assinatura da aplicação de desenvolvimento |
| MERCADO_PAGO_NOTIFICATION_URL | Vazia; não foi criado túnel |
| MERCADO_PAGO_ALLOW_PUBLIC_WEBHOOK | false; exposição não habilitada |
| MERCADO_PAGO_SUCCESS_URL | http://localhost:5173/pagamento/sucesso |
| MERCADO_PAGO_FAILURE_URL | http://localhost:5173/checkout |
| MERCADO_PAGO_PENDING_URL | http://localhost:5173/checkout/pendente |
| FRONTEND_URL | http://localhost:5173 |
| EMAIL_TRANSPORT / TELEGRAM_TRANSPORT | mock / mock |

MP_ACCESS_TOKEN existe como alias em um módulo de SDK, mas o serviço efetivo
de pagamentos usa MERCADO_PAGO_ACCESS_TOKEN. Não preencher o alias com token real.

### Ação no Mercado Pago Developers

1. Em https://www.mercadopago.com.br/developers/panel/app crie uma aplicação
   exclusiva de desenvolvimento. Não edite a aplicação da produção.
2. Nas credenciais, selecione o ambiente de teste. Obtenha a credencial da
   conta vendedora de teste e seu User ID; grave apenas no backend/.env local.
   Tokens de teste de Checkout Pro podem começar com APP_USR; o prefixo não
   certifica o ambiente. O backend confirma a identidade pela API.
3. Na área Contas de teste, obtenha comprador e vendedor brasileiros distintos.
   A aplicação pode fornecê-los automaticamente. Guarde senhas fora do Git.
   No checkout, use o comprador de teste em sessão separada da conta vendedora,
   com cartões de teste da documentação; não use dados de cartão real.
4. Reinicie somente o backend do projeto para carregar as variáveis, quando
   estiver no terminal normal com acesso de rede. Não é necessário reiniciar
   Fedora nem fechar o Brave.
5. Execute `cd backend && npm run test:payment:local`. O comando cria uma
   preferência fictícia de R$ 1,00 e a consulta novamente na API. Não cria
   pagamento nem pedido e não muda status no banco. Usa pedido_0, que o webhook
   não associa a pedido existente. Só declara PASS após a leitura confirmar
   vendedor, referência e produto. Esse probe não substitui checkout completo.
6. Depois teste carrinho e checkout no navegador com produto fictício do banco
   local. Verifique a criação do pedido PENDING e da preferência. Teste sucesso,
   falha e pendência sem marcar pedido manualmente como pago. A aprovação real
   de teste deve vir da consulta autenticada ao provedor pelo webhook.

O webhook ponta a ponta exige HTTPS público porque o Mercado Pago não alcança
localhost do computador. Um túnel exporia uma rota do servidor local à internet;
isso precisa ser explicado e autorizado antes de sua abertura. Nenhum túnel
foi aberto nesta execução. Após autorização, configurar somente a URL de teste
da aplicação de desenvolvimento, seu segredo e a variável local de habilitação.
Nunca desabilitar validação de assinatura para facilitar o teste.

Referências: [contas de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/test-accounts),
[teste de integração](https://www.mercadopago.com.br/developers/en/docs/checkout-pro-preferences/integration-test),
[assinatura e configuração de webhooks](https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks).

## Banco e regressão

O hostname configurado foi comparado com o endpoint listado pelo conector Neon
para o projeto jfq-development, ID autumn-rain-12939944, branch
br-jolly-pine-b8g7sy9k. A identificação do projeto foi confirmada pela API.
Uma consulta SELECT somente nesse projeto retornou database_name=neondb,
2 produtos e 2 categorias. jfq-development é o nome do projeto, não do database.
Isso confirma o destino configurado; não certifica o processo Express em execução,
que não está acessível pelo terminal isolado.

| Verificação | Resultado nesta execução |
| --- | --- |
| npm run build no frontend | PASS; aviso existente de bundle acima de 500 kB |
| npm test no backend | PASS; duas suítes |
| node test/development.test.js | PASS; 4 testes de isolamento/mocks |
| node test/payments.test.js | PASS; 11 testes, rede e banco substituídos por fixtures |
| Sintaxe dos JS de integração alterados | PASS |
| git diff --check | PASS |
| .env ignorados pelo Git | Confirmado; permissão 0600 do backend preservada |
| Banco configurado é do projeto jfq-development | Confirmado por endpoint/API e SELECT |
| Cadastro/login por senha, catálogo, carrinho/checkout via HTTP | PENDENTE; smoke-local falhou ao alcançar localhost |
| Botão e login Google real | PENDENTE; sem navegador/painel acessível |
| Preferência Mercado Pago real | BLOQUEADA; credencial e vendedor de teste ausentes |
| Assinatura webhook e rejeições de pagamento real/valor errado | PASS com fixtures; entrega externa ainda pendente |
| Retorno com approved forjado | PASS no controller com pedido fictício PENDING; nenhuma atualização |
| Console/erros críticos do navegador | PENDENTE; sem acesso ao navegador |

Os testes novos cobrem também conta vendedora incorreta, falha da API de
identidade, modo live recusado localmente, URLs de produção recusadas, webhook
público sem habilitação, HMAC adulterado/malformado e divergência de IDs.
Nenhum teste automatizado gravou pedido como pago.

## Arquivos desta etapa

- backend/.env — somente modo test, ID vazio e exposição desabilitada; ignorado.
- backend/.env.example — novas variáveis e instruções de teste.
- backend/package.json — comando test:payment:local.
- backend/src/config/paymentEnvironment.js — novo; isolamento e identidade teste.
- backend/src/services/pagamento.service.js — proteções de ambiente e HMAC/logs.
- backend/src/controllers/pagamento.controller.js — assinatura obrigatória.
- backend/scripts/test-payment-local.js — novo; probe real seguro de preferência.
- backend/scripts/smoke-local.js — aceita credenciais configuradas apenas em teste.
- backend/test/payments.test.js — novo; 11 testes sem rede/banco reais.
- frontend/src/pages/PagamentoSucesso.jsx — mensagem condicionada ao status salvo.
- INTEGRACOES-LOCAIS.md — este relatório e roteiro de continuidade.

## Preservação de produção e pendências

Nenhuma conexão SQL com produção, migration, deploy, commit ou push foi feita.
Nenhuma origem OAuth, redirect URI, aplicação ou webhook de produção foi editado.
Nenhum pagamento ou notificação real foi enviado. Não foram alterados processos,
configurações globais do Brave, Fedora, Hyprland, Quickshell ou janelas abertas.
Os erros de lint anteriores não foram corrigidos nesta etapa.

Faltam a configuração nos dois painéis, autenticação/consentimento Google,
credenciais exclusivas e contas de teste Mercado Pago, acesso ao navegador e
rede local para os testes de regressão reais. O TinyFish foi oferecido como
opção de navegador remoto; ainda não está conectado e não reutiliza a sessão
local do Brave. A conexão desse recurso é opcional; o roteiro manual acima
permite preparar os mesmos painéis. Não enviar segredos pelo chat.
