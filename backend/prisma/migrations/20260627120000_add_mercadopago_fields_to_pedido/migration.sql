-- AlterTable
ALTER TABLE "pedidos"
ADD COLUMN "paymentStatus" TEXT,
ADD COLUMN "paymentMethod" TEXT,
ADD COLUMN "paymentId" TEXT,
ADD COLUMN "preferenceId" TEXT,
ADD COLUMN "externalReference" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3);
