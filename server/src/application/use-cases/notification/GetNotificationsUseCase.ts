import type { INotificationRepository } from '../../repositories/INotificationRepository';

export class GetNotificationsUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(userId: string) {
    return this.notificationRepo.list(userId);
  }
}
