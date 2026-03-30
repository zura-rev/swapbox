export interface IChatRepository {
  findConversations(userId: string): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  findExisting(userId: string, otherUserId: string, itemId?: string): Promise<any | null>;
  create(participant1Id: string, participant2Id: string, itemId?: string): Promise<any>;
  findMessages(conversationId: string): Promise<any[]>;
  toggleReaction(messageId: string, userId: string, emoji: string): Promise<any>;
  createMessage(conversationId: string, senderId: string, content: string, replyToId?: string): Promise<any>;
  deleteMessage(id: string, senderId: string): Promise<{ count: number }>;
  editMessage(id: string, senderId: string, content: string): Promise<{ count: number }>;
  markMessagesRead(conversationId: string, excludeSenderId: string): Promise<any>;
  updateLastMessage(id: string, content: string): Promise<any>;
  // Conversation management
  findConversationsByItemId(itemId: string): Promise<any[]>;
  closeConversationsByItemId(itemId: string): Promise<any>;
  findOrCreateConversation(participant1Id: string, participant2Id: string, itemId: string, offerId: string): Promise<any>;
  reopenConversation(id: string, offerId: string): Promise<any>;
  // Block management
  blockUser(blockerId: string, blockedId: string): Promise<any>;
  unblockUser(blockerId: string, blockedId: string): Promise<any>;
  listBlocked(blockerId: string): Promise<any[]>;
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
  closeConversationsBetween(userId1: string, userId2: string): Promise<any>;
}
