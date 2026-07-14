# TODO - Checkout endereço no Pedido

- [x] Atualizar Prisma schema com campos de entrega em Pedido
- [x] Gerar migration sem perda de dados
- [x] Atualizar validação Zod de pedido
- [x] Persistir dados de entrega no serviço de pedidos (com e sem pagamento)
- [x] Atualizar Checkout frontend com validações por campo e UX de erro
- [x] Atualizar detalhe de pedido no admin para exibir dados de entrega com fallback
- [ ] Rodar validações finais (Prisma + build frontend) e revisar impactos
- [ ] Executar testes completos frontend (checkout + admin)
- [ ] Executar testes completos de endpoints backend (/api/pedidos e /api/pedidos/com-pagamento)
- [ ] Validar persistência dos dados de entrega no banco
- [ ] Validar compatibilidade com pedidos antigos (fallback "Não informado")
