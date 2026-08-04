CREATE TABLE "mercado_pago_webhook_events" (
  "id" SERIAL NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'mercadopago',
  "notificationId" TEXT,
  "paymentId" TEXT,
  "signatureHash" TEXT,
  "signatureTimestamp" BIGINT,
  "rawPayloadHash" TEXT NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "processedAt" TIMESTAMP(3),
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "mercado_pago_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mercado_pago_webhook_events_provider_notificationId_key"
ON "mercado_pago_webhook_events"("provider", "notificationId");

CREATE INDEX "mercado_pago_webhook_events_provider_processed_idx"
ON "mercado_pago_webhook_events"("provider", "processed");

CREATE INDEX "mercado_pago_webhook_events_paymentId_idx"
ON "mercado_pago_webhook_events"("paymentId");
