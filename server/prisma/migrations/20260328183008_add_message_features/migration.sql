-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_edited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reply_to_id" TEXT;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
