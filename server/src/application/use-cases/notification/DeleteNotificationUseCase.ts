import type { INotificationRepository } from '../../repositories/INotificationRepository';

export class DeleteNotificationUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async deleteOne(id: string, userId: string) {
    return this.notificationRepo.deleteOne(id, userId);
  }

  async deleteAll(userId: string) {
    return this.notificationRepo.deleteAll(userId);
  }
}
