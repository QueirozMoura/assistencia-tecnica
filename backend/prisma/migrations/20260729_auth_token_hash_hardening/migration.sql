-- Sprint 1 auth hardening: replace plaintext reset/verify tokens with hashes + verify expiry
ALTER TABLE "clientes"
  ADD COLUMN "resetTokenHash" TEXT,
  ADD COLUMN "verifyTokenHash" TEXT,
  ADD COLUMN "verifyTokenExpiry" TIMESTAMP(3);

ALTER TABLE "clientes"
  DROP COLUMN "resetToken",
  DROP COLUMN "verifyToken";