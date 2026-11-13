-- P1.2 fase 1: novo tipo de conciliação PAGAMENTO_DUPLICADO.
-- Um pedido já pago por um pagamento recebeu a aprovação de OUTRO paymentId. O pedido fica como está (paymentId, paymentMethod,
-- paidAt e status originais) e o segundo pagamento é registrado aqui para análise manual. A fila nunca emite reembolso.
--
-- Só RELAXA duas constraints (aceita um valor a mais). Nenhuma linha existente passa a violar as regras e nenhum dado é alterado.
-- ORDEM DE APLICAÇÃO: aplicar esta migration ANTES de publicar o código que registra PAGAMENTO_DUPLICADO. Código novo com a
-- migration ainda não aplicada falha com violação de CHECK dentro da transação do webhook (rollback, sem corromper o pedido);
-- o Mercado Pago reenvia a notificação. Código antigo com a migration já aplicada não é afetado.

ALTER TABLE "pagamento_conciliacoes" DROP CONSTRAINT "pagamento_conciliacoes_tipo_check";
ALTER TABLE "pagamento_conciliacoes" ADD CONSTRAINT "pagamento_conciliacoes_tipo_check" CHECK ("tipo" IN (
  'PAGAMENTO_CONFIRMADO_PEDIDO_CANCELADO', 'DIVERGENCIA_VALOR', 'DIVERGENCIA_PREFERENCIA', 'PEDIDO_NAO_ENCONTRADO',
  'REFERENCIA_NAO_MAPEAVEL', 'ESTORNO_OU_CHARGEBACK', 'VENDEDOR_OU_AMBIENTE_DIVERGENTE', 'PAGAMENTO_DUPLICADO'));

-- Classificação derivada do tipo: o duplicado só existe como pagamento lido de volta do provedor, aprovado, com paymentId.
ALTER TABLE "pagamento_conciliacoes" DROP CONSTRAINT "pagamento_conciliacoes_classificacao_check";
ALTER TABLE "pagamento_conciliacoes" ADD CONSTRAINT "pagamento_conciliacoes_classificacao_check" CHECK (
  ("tipo" = 'PAGAMENTO_CONFIRMADO_PEDIDO_CANCELADO' AND "verificacao" = 'CONFIRMADO_PELO_PROVEDOR' AND "statusProvedor" = 'approved' AND "paymentId" IS NOT NULL) OR
  ("tipo" = 'PAGAMENTO_DUPLICADO' AND "verificacao" = 'CONFIRMADO_PELO_PROVEDOR' AND "statusProvedor" = 'approved' AND "paymentId" IS NOT NULL) OR
  ("tipo" = 'ESTORNO_OU_CHARGEBACK' AND "verificacao" = 'CONFIRMADO_PELO_PROVEDOR' AND "paymentId" IS NOT NULL) OR
  ("tipo" IN ('DIVERGENCIA_VALOR', 'DIVERGENCIA_PREFERENCIA', 'PEDIDO_NAO_ENCONTRADO', 'REFERENCIA_NAO_MAPEAVEL') AND "verificacao" = 'NAO_VERIFICADO') OR
  ("tipo" = 'VENDEDOR_OU_AMBIENTE_DIVERGENTE' AND "verificacao" = 'SUSPEITO'));
