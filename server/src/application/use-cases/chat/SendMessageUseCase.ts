import type { IChatRepository } from '../../repositories/IChatRepository';

export class SendMessageUseCase {
  constructor(private readonly chatRepo: IChatRepository) {}

  async execute(conversationId: string, userId: string, content: string, replyToId?: string) {
    const message = await this.chatRepo.createMessage(conversationId, userId, content, replyToId);
    await this.chatRepo.updateLastMessage(conversationId, content);
    return message;
  }
}
