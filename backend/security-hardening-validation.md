# Security Hardening Validation — Pedidos/Pagamentos

Data: 2026-07-29

## Cenário 1 — Acesso sem token ao pedido de outro cliente
Objetivo: garantir 403/404 para acesso não autorizado.

### Validação manual
1. Criar pedido com cliente A.
2. Autenticar como cliente B.
3. Chamar:
   - `POST /api/pagamentos/criar-preferencia/:pedidoId` sem `checkoutToken` válido.

### Resultado esperado
- Resposta `403` com mensagem genérica de não autorização.

## Cenário 2 — Reutilização de token já consumido
Objetivo: garantir bloqueio de token usado.

### Validação manual
1. Gerar token de checkout para um pedido.
2. Chamar `GET /api/pedidos/sucesso?token=<token>` uma vez (deve funcionar e consumir token).
3. Repetir a mesma chamada com o mesmo token.

### Resultado esperado
- Segunda chamada bloqueada (404 genérico do serviço).

## Cenário 3 — Token expirado
Objetivo: garantir bloqueio de token vencido.

### Validação manual
1. Definir `CHECKOUT_TOKEN_TTL_MINUTES` para valor curto no ambiente de teste (ex.: 1 minuto).
2. Gerar token para pedido.
3. Aguardar expiração.
4. Chamar `GET /api/pedidos/sucesso?token=<token>`.

### Resultado esperado
- Resposta bloqueada (404 genérico do serviço).

## Cenário 4 — Múltiplas consultas no endpoint de sucesso
Objetivo: confirmar acionamento do rate limit específico.

### Validação manual (exemplo PowerShell)
```powershell
for ($i=1; $i -le 25; $i++) {
  curl "http://localhost:3000/api/pedidos/sucesso?token=token_fake_$i"
}
```

### Resultado esperado
- Após limite configurado, retorno `429` com mensagem genérica:
  - `Não foi possível processar a solicitação.`
- Log de tentativa suspeita sem token completo.

## Regressão crítica obrigatória
- Checkout convidado funcional.
- Mercado Pago (criação de preferência) funcional.
- Fluxo de pagamento aprovado funcional.
- Página PagamentoSucesso funcional.
- Pedidos autenticados continuam funcionando.
