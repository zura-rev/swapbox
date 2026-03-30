import type { IChatRepository } from '../../repositories/IChatRepository';
import { AppError } from '../../../shared/errors/AppError';

export class DeleteMessageUseCase {
  constructor(private readonly chatRepo: IChatRepository) {}

  async execute(messageId: string, userId: string) {
    const result = await this.chatRepo.deleteMessage(messageId, userId);
    if (result.count === 0) throw new AppError('შეტყობინება ვერ მოიძებნა ან წვდომა აკრძალულია', 403);
  }
}
