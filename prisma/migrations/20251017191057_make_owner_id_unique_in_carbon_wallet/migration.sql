/*
  Warnings:

  - A unique constraint covering the columns `[ownerId]` on the table `CarbonWallet` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CarbonWallet_ownerId_key" ON "CarbonWallet"("ownerId");
