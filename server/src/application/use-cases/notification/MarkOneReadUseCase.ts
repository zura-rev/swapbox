import type { INotificationRepository } from '../../repositories/INotificationRepository';

export class MarkOneReadUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(id: string, userId: string) {
    return this.notificationRepo.markOneRead(id, userId);
  }
}
