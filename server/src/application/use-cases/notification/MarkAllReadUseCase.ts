import type { INotificationRepository } from '../../repositories/INotificationRepository';

export class MarkAllReadUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(userId: string) {
    return this.notificationRepo.markAllRead(userId);
  }
}
