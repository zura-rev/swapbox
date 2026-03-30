import type { IChatRepository } from '../../repositories/IChatRepository';
import { AppError } from '../../../shared/errors/AppError';

export class EditMessageUseCase {
  constructor(private readonly chatRepo: IChatRepository) {}

  async execute(messageId: string, userId: string, content: string) {
    const result = await this.chatRepo.editMessage(messageId, userId, content);
    if (result.count === 0) throw new AppError('შეტყობინება ვერ მოიძებნა ან წვდომა აკრძალულია', 403);
  }
}
