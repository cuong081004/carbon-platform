-- CreateTable
CREATE TABLE "CarbonCredit" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "tripId" INTEGER NOT NULL,
    "creditsEarned" DOUBLE PRECISION NOT NULL,
    "co2SavedKg" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarbonCredit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CarbonCredit" ADD CONSTRAINT "CarbonCredit_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarbonCredit" ADD CONSTRAINT "CarbonCredit_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "VehicleTrip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
