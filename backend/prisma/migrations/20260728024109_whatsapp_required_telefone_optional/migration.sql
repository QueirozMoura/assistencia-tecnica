/*
  Warnings:

  - Made the column `whatsapp` on table `agendamentos` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "agendamentos" ALTER COLUMN "telefoneContato" DROP NOT NULL,
ALTER COLUMN "whatsapp" SET NOT NULL;
