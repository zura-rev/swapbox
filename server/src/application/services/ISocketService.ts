export interface ISocketService {
  emitToUser(userId: string, event: string, data: unknown): void;
  emitToConversation(conversationId: string, event: string, data: unknown): void;
}
