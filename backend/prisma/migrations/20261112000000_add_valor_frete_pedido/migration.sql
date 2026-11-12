-- AlterTable
-- Frete da entrega própria JFQ. Pedidos antigos ficam com 0 (sem frete cobrado).
ALTER TABLE "pedidos" ADD COLUMN     "valorFrete" DECIMAL(10,2) NOT NULL DEFAULT 0;
