-- CreateTable
CREATE TABLE "CarbonMarketListing" (
    "id" SERIAL NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "pricePerCredit" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarbonMarketListing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CarbonMarketListing" ADD CONSTRAINT "CarbonMarketListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
