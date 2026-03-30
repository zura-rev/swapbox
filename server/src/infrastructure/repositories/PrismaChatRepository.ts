import type { PrismaClient } from '@prisma/client';
import type { IChatRepository } from '../../application/repositories/IChatRepository';

const participantSelect = { id: true, displayName: true, avatarUrl: true, isOnline: true } as const;
const senderSelect = { id: true, displayName: true, avatarUrl: true } as const;
const replyToSelect = {
  id: true, content: true, deletedAt: true,
  sender: { select: { displayName: true } },
} as const;

export class PrismaChatRepository implements IChatRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { OR: [{ participant1Id: userId }, { participant2Id: userId }] },
      include: {
        participant1: { select: participantSelect },
        participant2: { select: participantSelect },
        item: {
          select: {
            id: true,
            title: true,
            type: true,
            condition: true,
            description: true,
            city: true,
            wantsDescription: true,
            images: { select: { url: true, id: true }, orderBy: { sortOrder: 'asc' as const } },
            category: { select: { nameKa: true, nameEn: true, nameRu: true, icon: true } },
            user: { select: { id: true, displayName: true, avatarUrl: true, rating: true, totalReviews: true, isVerified: true } },
          },
        },
        offer: {
          select: {
            id: true,
            message: true,
            images: { select: { url: true, sortOrder: true }, orderBy: { sortOrder: 'asc' as const } },
          },
        },
        _count: {
          select: {
            messages: { where: { isRead: false, senderId: { not: userId } } },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.conversation.findUnique({ where: { id } });
  }

  findExisting(userId: string, otherUserId: string, itemId?: string) {
    return this.prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: userId, participant2Id: otherUserId },
          { participant1Id: otherUserId, participant2Id: userId },
        ],
        ...(itemId ? { itemId } : {}),
      },
    });
  }

  create(participant1Id: string, participant2Id: string, itemId?: string) {
    return this.prisma.conversation.create({
      data: { participant1Id, participant2Id, itemId: itemId || null },
    });
  }

  findMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: senderSelect },
        reactions: {
          select: { id: true, emoji: true, userId: true, user: { select: { displayName: true } } },
        },
        replyTo: { select: replyToSelect },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async toggleReaction(messageId: string, userId: string, emoji: string) {
    const existing = await this.prisma.messageReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });
    if (existing) {
      await this.prisma.messageReaction.delete({ where: { id: existing.id } });
      return { added: false, emoji, userId, messageId };
    }
    await this.prisma.messageReaction.create({ data: { messageId, userId, emoji } });
    return { added: true, emoji, userId, messageId };
  }

  createMessage(conversationId: string, senderId: string, content: string, replyToId?: string) {
    return this.prisma.message.create({
      data: { conversationId, senderId, content, replyToId: replyToId || null },
      include: {
        sender: { select: senderSelect },
        replyTo: { select: replyToSelect },
      },
    });
  }

  async deleteMessage(id: string, senderId: string) {
    return this.prisma.message.updateMany({
      where: { id, senderId },
      data: { deletedAt: new Date() },
    });
  }

  async editMessage(id: string, senderId: string, content: string) {
    return this.prisma.message.updateMany({
      where: { id, senderId, deletedAt: null },
      data: { content, isEdited: true },
    });
  }

  markMessagesRead(conversationId: string, excludeSenderId: string) {
    return this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: excludeSenderId }, isRead: false },
      data: { isRead: true },
    });
  }

  updateLastMessage(id: string, content: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { lastMessageText: content, lastMessageAt: new Date() },
    });
  }

  findConversationsByItemId(itemId: string) {
    return this.prisma.conversation.findMany({ where: { itemId } });
  }

  closeConversationsByItemId(itemId: string) {
    return this.prisma.conversation.updateMany({
      where: { itemId, status: 'active' },
      data: { status: 'closed' },
    });
  }

  async findOrCreateConversation(participant1Id: string, participant2Id: string, itemId: string, offerId: string) {
    const [p1, p2] = [participant1Id, participant2Id].sort();
    const existing = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: participant1Id, participant2Id: participant2Id },
          { participant1Id: participant2Id, participant2Id: participant1Id },
        ],
        itemId,
      },
    });
    if (existing) {
      return this.prisma.conversation.update({
        where: { id: existing.id },
        data: { status: 'active', offerId },
      });
    }
    return this.prisma.conversation.create({
      data: { participant1Id: p1, participant2Id: p2, itemId, offerId, status: 'active' },
    });
  }

  reopenConversation(id: string, offerId: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { status: 'active', offerId },
    });
  }

  async blockUser(blockerId: string, blockedId: string) {
    await this.prisma.chatBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
    return { blocked: true };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.prisma.chatBlock.deleteMany({ where: { blockerId, blockedId } });
    return { blocked: false };
  }

  listBlocked(blockerId: string) {
    return this.prisma.chatBlock.findMany({
      where: { blockerId },
      include: { blocked: { select: { id: true, displayName: true, avatarUrl: true } } },
    }).then(blocks => blocks.map(b => b.blocked));
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.prisma.chatBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    return !!block;
  }

  closeConversationsBetween(userId1: string, userId2: string) {
    return this.prisma.conversation.updateMany({
      where: {
        OR: [
          { participant1Id: userId1, participant2Id: userId2 },
          { participant1Id: userId2, participant2Id: userId1 },
        ],
        status: 'active',
      },
      data: { status: 'closed' },
    });
  }
}
