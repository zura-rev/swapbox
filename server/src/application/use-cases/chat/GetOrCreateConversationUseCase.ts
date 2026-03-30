import type { IChatRepository } from '../../repositories/IChatRepository';

export class GetOrCreateConversationUseCase {
  constructor(private readonly chatRepo: IChatRepository) {}

  async execute(userId: string, otherUserId: string, itemId?: string) {
    const existing = await this.chatRepo.findExisting(userId, otherUserId, itemId);
    if (existing) return existing;
    return this.chatRepo.create(userId, otherUserId, itemId);
  }
}
