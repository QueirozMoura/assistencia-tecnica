-- CreateTable
CREATE TABLE "checkout_access_tokens" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkout_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checkout_access_tokens_tokenHash_key" ON "checkout_access_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "checkout_access_tokens_pedidoId_idx" ON "checkout_access_tokens"("pedidoId");

-- CreateIndex
CREATE INDEX "checkout_access_tokens_expiresAt_idx" ON "checkout_access_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "checkout_access_tokens" ADD CONSTRAINT "checkout_access_tokens_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
