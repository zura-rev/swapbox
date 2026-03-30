import type { IChatRepository } from '../../repositories/IChatRepository';
import { AppError } from '../../../shared/errors/AppError';

export class GetMessagesUseCase {
  constructor(private readonly chatRepo: IChatRepository) {}

  async execute(conversationId: string, userId: string) {
    const conv = await this.chatRepo.findById(conversationId);
    if (!conv || (conv.participant1Id !== userId && conv.participant2Id !== userId)) {
      throw new AppError('არ გაქვს წვდომა', 403);
    }

    const messages = await this.chatRepo.findMessages(conversationId);
    await this.chatRepo.markMessagesRead(conversationId, userId);
    return messages;
  }
}
