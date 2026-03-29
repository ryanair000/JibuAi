-- CreateTable
CREATE TABLE "MerchantFaq" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantFaq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantFaq_merchantId_question_key" ON "MerchantFaq"("merchantId", "question");

-- AddForeignKey
ALTER TABLE "MerchantFaq" ADD CONSTRAINT "MerchantFaq_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
