-- CreateTable
CREATE TABLE "offer_images" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "offer_images" ADD CONSTRAINT "offer_images_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
