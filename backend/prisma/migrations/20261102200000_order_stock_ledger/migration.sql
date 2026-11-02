BEGIN;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "checkoutInitPoint" TEXT,
ADD COLUMN     "creationHash" TEXT,
ADD COLUMN     "creationKey" TEXT,
ADD COLUMN     "stockLedgerVersion" INTEGER;

-- CreateTable
CREATE TABLE "estoque_movimentos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pedidoId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "origem" TEXT NOT NULL,
    "debitoOrigemId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estoque_movimentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "estoque_movimentos_debitoOrigemId_key" ON "estoque_movimentos"("debitoOrigemId");

-- CreateIndex
CREATE INDEX "estoque_movimentos_pedidoId_idx" ON "estoque_movimentos"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "estoque_movimentos_itemId_tipo_key" ON "estoque_movimentos"("itemId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_clienteId_creationKey_key" ON "pedidos"("clienteId", "creationKey");

-- AddForeignKey
ALTER TABLE "estoque_movimentos" ADD CONSTRAINT "estoque_movimentos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_movimentos" ADD CONSTRAINT "estoque_movimentos_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "itens_pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_movimentos" ADD CONSTRAINT "estoque_movimentos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_movimentos" ADD CONSTRAINT "estoque_movimentos_debitoOrigemId_fkey" FOREIGN KEY ("debitoOrigemId") REFERENCES "estoque_movimentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- No backfill: NULL means that historical debit cannot be established.
ALTER TABLE "public"."pedidos" ADD CONSTRAINT "pedidos_ledger_version_check"
  CHECK ("stockLedgerVersion" IS NULL OR "stockLedgerVersion" = 1);
ALTER TABLE "public"."estoque_movimentos" ADD CONSTRAINT "estoque_movimentos_shape_check" CHECK (
  "quantidade" > 0 AND "origem" IN ('CRIACAO_LEGADO', 'CRIACAO_MERCADO_PAGO', 'ADMIN_CANCELAMENTO', 'WEBHOOK_CANCELAMENTO') AND
  (("tipo" = 'DEBITO' AND "debitoOrigemId" IS NULL AND "origem" IN ('CRIACAO_LEGADO', 'CRIACAO_MERCADO_PAGO')) OR
   ("tipo" = 'DEVOLUCAO' AND "debitoOrigemId" IS NOT NULL AND "origem" IN ('ADMIN_CANCELAMENTO', 'WEBHOOK_CANCELAMENTO')))
);

-- AFTER INSERT is intentional: ON CONFLICT DO NOTHING must NOT move stock.
CREATE FUNCTION "public".jfq_apply_stock_movement() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE item_record record; order_record record; debit_record record;
BEGIN
  SELECT * INTO order_record FROM "public"."pedidos" WHERE id = NEW."pedidoId" FOR UPDATE;
  SELECT * INTO item_record FROM "public"."itens_pedido" WHERE id = NEW."itemId";
  IF item_record.id IS NULL OR item_record."pedidoId" <> NEW."pedidoId" OR
     item_record."produtoId" <> NEW."produtoId" OR item_record.quantidade <> NEW.quantidade THEN
    RAISE EXCEPTION 'JFQ_STOCK_ITEM_MISMATCH';
  END IF;
  IF NEW.tipo = 'DEBITO' THEN
    IF order_record."stockLedgerVersion" IS DISTINCT FROM 1 OR order_record.status <> 'PENDENTE' THEN
      RAISE EXCEPTION 'JFQ_STOCK_DEBIT_NOT_ALLOWED';
    END IF;
    UPDATE "public"."produtos" SET estoque = estoque - NEW.quantidade, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = NEW."produtoId" AND ativo AND estoque >= NEW.quantidade;
    IF NOT FOUND THEN RAISE EXCEPTION 'JFQ_STOCK_INSUFFICIENT'; END IF;
  ELSE
    SELECT * INTO debit_record FROM "public"."estoque_movimentos" WHERE id = NEW."debitoOrigemId";
    IF order_record.status <> 'CANCELADO' OR debit_record.tipo IS DISTINCT FROM 'DEBITO' OR
       debit_record."pedidoId" <> NEW."pedidoId" OR debit_record."itemId" <> NEW."itemId" OR
       debit_record."produtoId" <> NEW."produtoId" OR debit_record.quantidade <> NEW.quantidade THEN
      RAISE EXCEPTION 'JFQ_STOCK_RETURN_WITHOUT_MATCHING_DEBIT';
    END IF;
    UPDATE "public"."produtos" SET estoque = estoque + NEW.quantidade, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = NEW."produtoId";
    IF NOT FOUND THEN RAISE EXCEPTION 'JFQ_STOCK_PRODUCT_MISSING'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER jfq_apply_stock_movement AFTER INSERT ON "public"."estoque_movimentos"
  FOR EACH ROW EXECUTE FUNCTION "public".jfq_apply_stock_movement();

CREATE FUNCTION "public".jfq_stock_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'JFQ_STOCK_HISTORY_IMMUTABLE'; END $$;
CREATE TRIGGER jfq_stock_immutable BEFORE UPDATE OR DELETE ON "public"."estoque_movimentos"
  FOR EACH ROW EXECUTE FUNCTION "public".jfq_stock_immutable();

CREATE FUNCTION "public".jfq_protect_stock_item() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "public"."estoque_movimentos" WHERE "itemId" = OLD.id) THEN
    RAISE EXCEPTION 'JFQ_STOCK_ITEM_IMMUTABLE';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER jfq_protect_stock_item BEFORE UPDATE OR DELETE ON "public"."itens_pedido"
  FOR EACH ROW EXECUTE FUNCTION "public".jfq_protect_stock_item();

-- Deferred invariant: even a forgotten helper or a partial item insert rolls back.
CREATE FUNCTION "public".jfq_check_order_stock() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE order_id integer; order_record record;
BEGIN
  IF TG_TABLE_NAME = 'pedidos' THEN order_id := NEW.id; ELSE order_id := NEW."pedidoId"; END IF;
  SELECT * INTO order_record FROM "public"."pedidos" WHERE id = order_id;
  IF order_record."stockLedgerVersion" IS DISTINCT FROM 1 THEN RETURN NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM "public"."itens_pedido" WHERE "pedidoId" = order_id) OR EXISTS (
    SELECT 1 FROM "public"."itens_pedido" i LEFT JOIN "public"."estoque_movimentos" d
      ON d."itemId" = i.id AND d.tipo = 'DEBITO'
    WHERE i."pedidoId" = order_id AND (d.id IS NULL OR d.quantidade <> i.quantidade OR
      d."produtoId" <> i."produtoId" OR d."pedidoId" <> order_id)
  ) THEN RAISE EXCEPTION 'JFQ_STOCK_INCOMPLETE_DEBIT'; END IF;
  IF order_record.status = 'CANCELADO' AND EXISTS (
    SELECT 1 FROM "public"."estoque_movimentos" d LEFT JOIN "public"."estoque_movimentos" r
      ON r."debitoOrigemId" = d.id WHERE d."pedidoId" = order_id AND d.tipo = 'DEBITO' AND r.id IS NULL
  ) THEN RAISE EXCEPTION 'JFQ_STOCK_INCOMPLETE_RETURN'; END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER jfq_check_order_stock AFTER INSERT OR UPDATE ON "public"."pedidos"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "public".jfq_check_order_stock();
CREATE CONSTRAINT TRIGGER jfq_check_item_stock AFTER INSERT OR UPDATE ON "public"."itens_pedido"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "public".jfq_check_order_stock();

CREATE FUNCTION "public".jfq_protect_stock_order() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."stockLedgerVersion" = 1 AND NEW."stockLedgerVersion" IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'JFQ_STOCK_VERSION_IMMUTABLE';
  END IF;
  IF OLD.status = 'CANCELADO' AND NEW.status <> 'CANCELADO' THEN
    RAISE EXCEPTION 'JFQ_STOCK_CANCELLED_ORDER_FINAL';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER jfq_protect_stock_order BEFORE UPDATE ON "public"."pedidos"
  FOR EACH ROW EXECUTE FUNCTION "public".jfq_protect_stock_order();

-- Functions run with caller privileges; fixed qualified names avoid search_path injection.
-- Parent lock serializes same-order operations; product order avoids cross-order deadlocks.
CREATE FUNCTION "public".jfq_reserve_order_stock(order_id integer, source text) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE item_record record; affected integer := 0; inserted integer;
BEGIN
  PERFORM 1 FROM "public"."pedidos" WHERE id = order_id AND status = 'PENDENTE' AND "stockLedgerVersion" = 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JFQ_STOCK_DEBIT_NOT_ALLOWED'; END IF;
  FOR item_record IN SELECT * FROM "public"."itens_pedido" WHERE "pedidoId" = order_id ORDER BY "produtoId", id LOOP
    INSERT INTO "public"."estoque_movimentos" (id,"pedidoId","itemId","produtoId",tipo,quantidade,origem)
    VALUES (gen_random_uuid(), order_id, item_record.id, item_record."produtoId", 'DEBITO', item_record.quantidade, source)
    ON CONFLICT ("itemId",tipo) DO NOTHING;
    GET DIAGNOSTICS inserted = ROW_COUNT; affected := affected + inserted;
  END LOOP;
  RETURN affected;
END $$;
CREATE FUNCTION "public".jfq_release_order_stock(order_id integer, source text) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE debit_record record; affected integer := 0; inserted integer;
BEGIN
  PERFORM 1 FROM "public"."pedidos" WHERE id = order_id AND status = 'CANCELADO' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'JFQ_STOCK_RETURN_NOT_ALLOWED'; END IF;
  FOR debit_record IN SELECT * FROM "public"."estoque_movimentos"
    WHERE "pedidoId" = order_id AND tipo = 'DEBITO' ORDER BY "produtoId", "itemId" LOOP
    INSERT INTO "public"."estoque_movimentos" (id,"pedidoId","itemId","produtoId",tipo,quantidade,origem,"debitoOrigemId")
    VALUES (gen_random_uuid(), order_id, debit_record."itemId", debit_record."produtoId", 'DEVOLUCAO', debit_record.quantidade, source, debit_record.id)
    ON CONFLICT ("itemId",tipo) DO NOTHING;
    GET DIAGNOSTICS inserted = ROW_COUNT; affected := affected + inserted;
  END LOOP;
  RETURN affected;
END $$;

COMMIT;
