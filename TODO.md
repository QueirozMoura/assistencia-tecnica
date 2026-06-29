# TODO - Integração Mercado Pago Real (mínima alteração)

- [ ] Instalar dependência `mercadopago` no backend
- [ ] Criar `backend/src/config/mercadopago.js` com client configurado por `MP_ACCESS_TOKEN` (fallback compatível para variável existente)
- [ ] Ajustar `backend/src/services/pagamento.service.js` para usar SDK oficial sem quebrar endpoints atuais
- [ ] Criar controller de pagamentos para:
  - [ ] `POST /api/pagamentos/criar-preferencia/:pedidoId`
  - [ ] `POST /api/pagamentos/webhook`
- [ ] Criar `backend/src/routes/pagamento.routes.js`
- [ ] Registrar rotas de pagamento em `backend/src/routes/index.js`
- [ ] Validar compatibilidade do fluxo existente `/api/pedidos/com-pagamento`
- [ ] Rodar checagem de build/lint básica sem alterar módulos fora de Pagamentos/Pedidos
- [ ] Testar endpoints principais via curl (criar preferência + webhook)
- [ ] Consolidar evidências de não-regressão
