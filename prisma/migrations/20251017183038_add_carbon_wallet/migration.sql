-- CreateTable
CREATE TABLE "CarbonWallet" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarbonWallet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CarbonWallet" ADD CONSTRAINT "CarbonWallet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
