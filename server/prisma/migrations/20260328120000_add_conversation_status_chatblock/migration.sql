-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('active', 'closed');

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "offer_id" TEXT,
ADD COLUMN     "status" "ConversationStatus" NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "chat_blocks" (
    "id" TEXT NOT NULL,
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_blocks_blocker_id_blocked_id_key" ON "chat_blocks"("blocker_id", "blocked_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_offer_id_key" ON "conversations"("offer_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_blocks" ADD CONSTRAINT "chat_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_blocks" ADD CONSTRAINT "chat_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
