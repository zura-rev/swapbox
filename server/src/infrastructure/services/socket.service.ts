import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { PrismaClient } from '@prisma/client';
import type { IChatRepository } from '../../application/repositories/IChatRepository';
import type { INotificationRepository } from '../../application/repositories/INotificationRepository';
import type { ISocketService } from '../../application/services/ISocketService';
import { NotificationService } from './notification.service';

const onlineUsers = new Map<string, string>(); // userId -> socketId

let _io: Server | null = null;
export function getIo() { return _io; }

/**
 * Concrete implementation of ISocketService that wraps Socket.io Server.
 * Allows use-cases to emit real-time events without depending on socket.io directly.
 */
export class SocketService implements ISocketService {
  constructor(private readonly io: Server) {}

  emitToUser(userId: string, event: string, data: unknown): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: unknown): void {
    this.io.to(`conv:${conversationId}`).emit(event, data);
  }
}

export function setupSocket(
  io: Server,
  prisma: PrismaClient,
  chatRepo: IChatRepository,
  notificationRepo: INotificationRepository,
) {
  _io = io;
  const notificationService = new NotificationService(notificationRepo);

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('ავტორიზაცია საჭიროა'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error('არასწორი ტოკენი'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);
    prisma.user.update({ where: { id: userId }, data: { isOnline: true } }).catch(() => {});
    io.emit('user:online', userId);

    socket.on('chat:join', (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('chat:leave', (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on('chat:message', async (data: { conversationId: string; content: string; replyToId?: string }) => {
      try {
        const conv = await prisma.conversation.findUnique({ where: { id: data.conversationId } });
        if (!conv) return socket.emit('chat:error', 'საუბარი ვერ მოიძებნა');
        if (conv.status === 'closed') return socket.emit('chat:error', 'საუბარი დახურულია');

        const recipientId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
        const block = await prisma.chatBlock.findUnique({
          where: { blockerId_blockedId: { blockerId: recipientId, blockedId: userId } },
        });
        if (block) return socket.emit('chat:error', 'გაგზავნა შეუძლებელია');

        const message = await chatRepo.createMessage(
          data.conversationId, userId, data.content, data.replyToId
        );

        await prisma.conversation.update({
          where: { id: data.conversationId },
          data: { lastMessageText: data.content, lastMessageAt: new Date() },
        });

        io.to(`conv:${data.conversationId}`).emit('chat:message', { ...message, reactions: [] });
        io.to(`user:${recipientId}`).emit('chat:notify', message);
        notificationService.create(
          recipientId,
          'new_message',
          `${(message as any).sender?.displayName || 'ვინმე'}`,
          (message as any).content.length > 60 ? (message as any).content.slice(0, 60) + '…' : (message as any).content,
          { conversationId: data.conversationId, messageId: (message as any).id }
        ).catch(() => {});
      } catch {
        socket.emit('chat:error', 'შეტყობინების გაგზავნის შეცდომა');
      }
    });

    socket.on('chat:delete', async (data: { messageId: string; conversationId: string }) => {
      try {
        await chatRepo.deleteMessage(data.messageId, userId);
        io.to(`conv:${data.conversationId}`).emit('chat:delete', { messageId: data.messageId });
      } catch {
        socket.emit('chat:error', 'წაშლის შეცდომა');
      }
    });

    socket.on('chat:edit', async (data: { messageId: string; conversationId: string; content: string }) => {
      try {
        if (!data.content?.trim()) return;
        await chatRepo.editMessage(data.messageId, userId, data.content.trim());
        io.to(`conv:${data.conversationId}`).emit('chat:edit', {
          messageId: data.messageId,
          content: data.content.trim(),
        });
      } catch {
        socket.emit('chat:error', 'შეცვლის შეცდომა');
      }
    });

    socket.on('chat:reaction', async (data: { messageId: string; emoji: string; conversationId: string }) => {
      try {
        const existing = await prisma.messageReaction.findUnique({
          where: { messageId_userId_emoji: { messageId: data.messageId, userId, emoji: data.emoji } },
        });
        if (existing) {
          await prisma.messageReaction.delete({ where: { id: existing.id } });
          io.to(`conv:${data.conversationId}`).emit('chat:reaction', { messageId: data.messageId, emoji: data.emoji, userId, added: false });
        } else {
          await prisma.messageReaction.create({ data: { messageId: data.messageId, userId, emoji: data.emoji } });
          io.to(`conv:${data.conversationId}`).emit('chat:reaction', { messageId: data.messageId, emoji: data.emoji, userId, added: true });
        }
      } catch {
        socket.emit('chat:error', 'რეაქციის შეცდომა');
      }
    });

    socket.on('chat:typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conv:${data.conversationId}`).emit('chat:typing', { userId, isTyping: data.isTyping });
    });

    socket.on('chat:read', async (data: { conversationId: string }) => {
      try {
        await chatRepo.markMessagesRead(data.conversationId, userId);
        socket.to(`conv:${data.conversationId}`).emit('chat:read', { conversationId: data.conversationId, readBy: userId });
      } catch { /* ignore */ }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      prisma.user.update({ where: { id: userId }, data: { isOnline: false, lastSeenAt: new Date() } }).catch(() => {});
      io.emit('user:offline', userId);
    });
  });
}
