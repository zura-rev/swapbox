import type { IChatRepository } from '../../repositories/IChatRepository';

export class GetConversationsUseCase {
  constructor(private readonly chatRepo: IChatRepository) {}

  async execute(userId: string) {
    const conversations = await this.chatRepo.findConversations(userId);
    return conversations.map(conv => ({
      ...conv,
      otherUser: conv.participant1Id === userId ? conv.participant2 : conv.participant1,
      unreadCount: conv._count.messages,
    }));
  }
}
