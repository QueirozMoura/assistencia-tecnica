BEGIN;

-- CreateTable
CREATE TABLE "pagamento_conciliacoes" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mercadopago',
    "chaveIdempotencia" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "verificacao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "pedidoId" INTEGER,
    "paymentId" TEXT,
    "paymentIdInformado" TEXT,
    "notificationId" TEXT,
    "rawPayloadHash" TEXT NOT NULL,
    "referenciaExterna" TEXT,
    "statusProvedor" TEXT,
    "statusPedido" TEXT,
    "valorProvedor" DECIMAL(10,2),
    "valorPedido" DECIMAL(10,2),
    "preferenciaProvedor" TEXT,
    "preferenciaPedido" TEXT,
    "ocorrencias" INTEGER NOT NULL DEFAULT 1,
    "primeiraVezEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaVezEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidoEm" TIMESTAMP(3),
    "resolvidoPorId" INTEGER,
    "observacao" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamento_conciliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento_conciliacao_historico" (
    "id" SERIAL NOT NULL,
    "conciliacaoId" INTEGER NOT NULL,
    "acao" TEXT NOT NULL,
    "statusAnterior" TEXT,
    "statusNovo" TEXT,
    "usuarioId" INTEGER,
    "observacao" TEXT,
    "notificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagamento_conciliacao_historico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pagamento_conciliacoes_status_tipo_idx" ON "pagamento_conciliacoes"("status", "tipo");

-- CreateIndex
CREATE INDEX "pagamento_conciliacoes_pedidoId_idx" ON "pagamento_conciliacoes"("pedidoId");

-- CreateIndex
CREATE INDEX "pagamento_conciliacoes_paymentId_idx" ON "pagamento_conciliacoes"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "pagamento_conciliacoes_provider_chaveIdempotencia_tipo_key" ON "pagamento_conciliacoes"("provider", "chaveIdempotencia", "tipo");

-- CreateIndex
CREATE INDEX "pagamento_conciliacao_historico_conciliacaoId_createdAt_idx" ON "pagamento_conciliacao_historico"("conciliacaoId", "createdAt");

-- AddForeignKey
ALTER TABLE "pagamento_conciliacoes" ADD CONSTRAINT "pagamento_conciliacoes_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_conciliacoes" ADD CONSTRAINT "pagamento_conciliacoes_resolvidoPorId_fkey" FOREIGN KEY ("resolvidoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_conciliacao_historico" ADD CONSTRAINT "pagamento_conciliacao_historico_conciliacaoId_fkey" FOREIGN KEY ("conciliacaoId") REFERENCES "pagamento_conciliacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_conciliacao_historico" ADD CONSTRAINT "pagamento_conciliacao_historico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------------------------
-- Reconciliation queue invariants. This table NEVER triggers a refund: it only records, for a
-- human, financial facts that the order flow cannot apply. No payer data and no raw payload.
-- ---------------------------------------------------------------------------------------------
ALTER TABLE "pagamento_conciliacoes" ADD CONSTRAINT "pagamento_conciliacoes_tipo_check" CHECK ("tipo" IN (
  'PAGAMENTO_CONFIRMADO_PEDIDO_CANCELADO', 'DIVERGENCIA_VALOR', 'DIVERGENCIA_PREFERENCIA', 'PEDIDO_NAO_ENCONTRADO',
  'REFERENCIA_NAO_MAPEAVEL', 'ESTORNO_OU_CHARGEBACK', 'VENDEDOR_OU_AMBIENTE_DIVERGENTE'));
ALTER TABLE "pagamento_conciliacoes" ADD CONSTRAINT "pagamento_conciliacoes_status_check" CHECK ("status" IN (
  'PENDENTE', 'EM_ANALISE', 'REEMBOLSADO_MANUALMENTE', 'RESOLVIDO_SEM_REEMBOLSO', 'FALSO_POSITIVO'));
ALTER TABLE "pagamento_conciliacoes" ADD CONSTRAINT "pagamento_conciliacoes_verificacao_check" CHECK ("verificacao" IN (
  'CONFIRMADO_PELO_PROVEDOR', 'NAO_VERIFICADO', 'SUSPEITO'));
-- Classification is derived from the type and cannot be stored inconsistently: only a payment read back
-- from the provider API and attributed to the order is "confirmed"; every divergence is "not verified".
ALTER TABLE "pagamento_conciliacoes" ADD CONSTRAINT "pagamento_conciliacoes_classificacao_check" CHECK (
  ("tipo" = 'PAGAMENTO_CONFIRMADO_PEDIDO_CANCELADO' AND "verificacao" = 'CONFIRMADO_PELO_PROVEDOR' AND "statusProvedor" = 'approved' AND "paymentId" IS NOT NULL) OR
  ("tipo" = 'ESTORNO_OU_CHARGEBACK' AND "verificacao" = 'CONFIRMADO_PELO_PROVEDOR' AND "paymentId" IS NOT NULL) OR
  ("tipo" IN ('DIVERGENCIA_VALOR', 'DIVERGENCIA_PREFERENCIA', 'PEDIDO_NAO_ENCONTRADO', 'REFERENCIA_NAO_MAPEAVEL') AND "verificacao" = 'NAO_VERIFICADO') OR
  ("tipo" = 'VENDEDOR_OU_AMBIENTE_DIVERGENTE' AND "verificacao" = 'SUSPEITO'));
ALTER TABLE "pagamento_conciliacoes" ADD CONSTRAINT "pagamento_conciliacoes_pedido_check" CHECK (
  "pedidoId" IS NOT NULL OR "tipo" IN ('PEDIDO_NAO_ENCONTRADO', 'REFERENCIA_NAO_MAPEAVEL', 'VENDEDOR_OU_AMBIENTE_DIVERGENTE'));
-- Idempotency identity: pid:<provider-verified paymentId> | nid:<notificationId> | hash:<payload hash>.
ALTER TABLE "pagamento_conciliacoes" ADD CONSTRAINT "pagamento_conciliacoes_chave_check" CHECK (
  ("chaveIdempotencia" ~ '^pid:[0-9]{1,20}$' AND "paymentId" IS NOT NULL AND "chaveIdempotencia" = 'pid:' || "paymentId") OR
  ("chaveIdempotencia" ~ '^nid:.{1,128}$' AND "paymentId" IS NULL) OR
  ("chaveIdempotencia" ~ '^hash:[0-9a-f]{64}$' AND "paymentId" IS NULL));
ALTER TABLE "pagamento_conciliacoes" ADD CONSTRAINT "pagamento_conciliacoes_payment_format_check" CHECK (
  ("paymentId" IS NULL OR "paymentId" ~ '^[0-9]{1,20}$') AND ("paymentIdInformado" IS NULL OR "paymentIdInformado" ~ '^[0-9]{1,20}$'));
ALTER TABLE "pagamento_conciliacoes" ADD CONSTRAINT "pagamento_conciliacoes_ocorrencias_check" CHECK ("ocorrencias" >= 1);
ALTER TABLE "pagamento_conciliacoes" ADD CONSTRAINT "pagamento_conciliacoes_observacao_check" CHECK ("observacao" IS NULL OR char_length("observacao") <= 1000);
-- A final status always carries who and when; a non-final status never does.
ALTER TABLE "pagamento_conciliacoes" ADD CONSTRAINT "pagamento_conciliacoes_resolucao_check" CHECK (
  ("status" IN ('REEMBOLSADO_MANUALMENTE', 'RESOLVIDO_SEM_REEMBOLSO', 'FALSO_POSITIVO') AND "resolvidoEm" IS NOT NULL AND "resolvidoPorId" IS NOT NULL AND "observacao" IS NOT NULL) OR
  ("status" IN ('PENDENTE', 'EM_ANALISE') AND "resolvidoEm" IS NULL AND "resolvidoPorId" IS NULL));
ALTER TABLE "pagamento_conciliacao_historico" ADD CONSTRAINT "pagamento_conciliacao_historico_acao_check" CHECK (
  "acao" IN ('REGISTRADA', 'REOCORRENCIA', 'STATUS_ALTERADO'));
ALTER TABLE "pagamento_conciliacao_historico" ADD CONSTRAINT "pagamento_conciliacao_historico_observacao_check" CHECK (
  "observacao" IS NULL OR char_length("observacao") <= 1000);

-- History is append-only.
CREATE FUNCTION jfq_conciliacao_historico_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'JFQ_CONCILIACAO_HISTORY_IMMUTABLE';
END $$;
CREATE TRIGGER jfq_conciliacao_historico_immutable BEFORE UPDATE OR DELETE ON "pagamento_conciliacao_historico"
  FOR EACH ROW EXECUTE FUNCTION jfq_conciliacao_historico_immutable();

-- Queue rows cannot be deleted, their identity is fixed, and a resolved row is terminal
-- (only the occurrence counters may still move, so a repeated notification is counted, never lost).
CREATE FUNCTION jfq_conciliacao_protect() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'JFQ_CONCILIACAO_DELETE_FORBIDDEN';
  END IF;
  IF NEW."provider" IS DISTINCT FROM OLD."provider" OR NEW."chaveIdempotencia" IS DISTINCT FROM OLD."chaveIdempotencia" OR
     NEW."tipo" IS DISTINCT FROM OLD."tipo" OR NEW."verificacao" IS DISTINCT FROM OLD."verificacao" OR
     NEW."pedidoId" IS DISTINCT FROM OLD."pedidoId" OR NEW."paymentId" IS DISTINCT FROM OLD."paymentId" OR
     NEW."rawPayloadHash" IS DISTINCT FROM OLD."rawPayloadHash" OR NEW."primeiraVezEm" IS DISTINCT FROM OLD."primeiraVezEm" THEN
    RAISE EXCEPTION 'JFQ_CONCILIACAO_IDENTITY_IMMUTABLE';
  END IF;
  IF OLD."status" IN ('REEMBOLSADO_MANUALMENTE', 'RESOLVIDO_SEM_REEMBOLSO', 'FALSO_POSITIVO') AND (
     NEW."status" IS DISTINCT FROM OLD."status" OR NEW."resolvidoEm" IS DISTINCT FROM OLD."resolvidoEm" OR
     NEW."resolvidoPorId" IS DISTINCT FROM OLD."resolvidoPorId" OR NEW."observacao" IS DISTINCT FROM OLD."observacao") THEN
    RAISE EXCEPTION 'JFQ_CONCILIACAO_FINAL_STATUS';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER jfq_conciliacao_protect BEFORE UPDATE OR DELETE ON "pagamento_conciliacoes"
  FOR EACH ROW EXECUTE FUNCTION jfq_conciliacao_protect();

-- Every status change must be accompanied, in the same transaction, by a history row naming who did it.
-- The schema comes from the trigger itself, so the function does not depend on search_path.
CREATE FUNCTION jfq_conciliacao_audit_check() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE audited boolean;
BEGIN
  IF NEW."status" IS DISTINCT FROM OLD."status" THEN
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I."pagamento_conciliacao_historico" WHERE "conciliacaoId" = $1 AND "acao" = ''STATUS_ALTERADO'' AND "statusAnterior" = $2 AND "statusNovo" = $3 AND "usuarioId" IS NOT NULL)', TG_TABLE_SCHEMA)
      INTO audited USING NEW."id", OLD."status", NEW."status";
    IF NOT audited THEN
      RAISE EXCEPTION 'JFQ_CONCILIACAO_AUDIT_MISSING';
    END IF;
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER jfq_conciliacao_audit_check AFTER UPDATE ON "pagamento_conciliacoes"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION jfq_conciliacao_audit_check();

COMMIT;
