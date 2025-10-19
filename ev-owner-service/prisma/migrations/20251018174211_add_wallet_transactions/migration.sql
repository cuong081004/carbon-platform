-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'BUY_CARBON', 'SELL_CARBON', 'TRANSFER');

-- AlterTable
ALTER TABLE "CarbonWallet" ADD COLUMN     "balanceCarbon" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "balanceFiat" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CarbonWalletTransaction" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amountFiat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountCarbon" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarbonWalletTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CarbonWalletTransaction" ADD CONSTRAINT "CarbonWalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CarbonWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
