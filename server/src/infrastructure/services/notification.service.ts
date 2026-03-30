import type { INotificationRepository } from '../../application/repositories/INotificationRepository';
import type { INotificationService } from '../../application/services/INotificationService';
import { getIo } from './socket.service';

export class NotificationService implements INotificationService {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async create(userId: string, type: string, title: string, body?: string, data?: object) {
    const notif = await this.notificationRepo.create(userId, type, title, body, data);
    const ioServer = getIo();
    if (ioServer) {
      ioServer.to(`user:${userId}`).emit('notification:new', notif);
    }
    return notif;
  }

  list(userId: string) {
    return this.notificationRepo.list(userId);
  }

  deleteOne(id: string, userId: string) {
    return this.notificationRepo.deleteOne(id, userId);
  }

  deleteAll(userId: string) {
    return this.notificationRepo.deleteAll(userId);
  }

  markAllRead(userId: string) {
    return this.notificationRepo.markAllRead(userId);
  }

  markOneRead(id: string, userId: string) {
    return this.notificationRepo.markOneRead(id, userId);
  }

  unreadCount(userId: string) {
    return this.notificationRepo.unreadCount(userId);
  }
}
