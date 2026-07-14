-- AlterTable
ALTER TABLE "pedidos"
ADD COLUMN "nomeDestinatario" TEXT,
ADD COLUMN "telefoneEntrega" TEXT,
ADD COLUMN "cep" TEXT,
ADD COLUMN "rua" TEXT,
ADD COLUMN "numero" TEXT,
ADD COLUMN "complemento" TEXT,
ADD COLUMN "bairro" TEXT,
ADD COLUMN "cidade" TEXT,
ADD COLUMN "estado" TEXT;
