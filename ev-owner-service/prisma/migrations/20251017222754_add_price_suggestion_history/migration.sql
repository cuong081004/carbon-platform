-- CreateTable
CREATE TABLE "PriceSuggestionHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "suggestedPrice" DOUBLE PRECISION NOT NULL,
    "trend" TEXT NOT NULL,
    "avgMarket" DOUBLE PRECISION NOT NULL,
    "avgUserCo2" DOUBLE PRECISION NOT NULL,
    "slope" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceSuggestionHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PriceSuggestionHistory" ADD CONSTRAINT "PriceSuggestionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
