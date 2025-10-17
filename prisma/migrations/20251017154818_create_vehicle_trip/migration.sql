-- CreateTable
CREATE TABLE "VehicleTrip" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "startLocation" TEXT NOT NULL,
    "endLocation" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "energyUsedKWh" DOUBLE PRECISION NOT NULL,
    "co2SavedKg" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleTrip_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VehicleTrip" ADD CONSTRAINT "VehicleTrip_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
