import type { PrismaClient } from '@prisma/client';
import type { INotificationRepository } from '../../application/repositories/INotificationRepository';

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(userId: string, type: string, title: string, body?: string, data?: object) {
    return this.prisma.notification.create({
      data: { userId, type, title, body: body || null, data: data ? (data as any) : {}, isRead: false },
    });
  }

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, type: { in: ['offer_received', 'offer_accepted', 'offer_rejected'] } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  deleteOne(id: string, userId: string) {
    return this.prisma.notification.deleteMany({ where: { id, userId } });
  }

  deleteAll(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId, type: { in: ['offer_received', 'offer_accepted', 'offer_rejected'] } },
    });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  markOneRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }
}
